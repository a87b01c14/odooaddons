odoo.define('web_widget_x2many_multi_selection.multiple_tags', function (require) {
    "use strict";

    var rel_fields = require('web.relational_fields');
    var dialogs = require('web.view_dialogs');
    var core = require('web.core');
    var _t = core._t;

    rel_fields.FieldMany2One.include({

        /**
         * @private
         * @returns {Array}
         */
        _getSearchBlacklist: function () {
            return _.pluck(_.pluck(_.pluck(this.getParent().state.data, 'data'), this.name), 'res_id').filter(_.isNumber);
        },
        _searchCreatePopup: function (view, ids, context) {
            var self = this;

            // Don't include already selected instances in the search domain
            var domain = self.record.getDomain({fieldName: self.name});
            if (self.field.type === 'many2many' || self.field.type === 'many2one') {
                var selected_ids = self._getSearchBlacklist();
                if (selected_ids.length > 0) {
                    domain.push(['id', 'not in', selected_ids]);
                }
            }
            var m2mRecords = [];
            var parentList = self.getParent();
            var unselectRow = (parentList.unselectRow || function () {
            }).bind(parentList); // form view on mobile
            return new dialogs.SelectCreateDialog(self, _.extend({}, self.nodeOptions, {
                res_model: self.field.relation,
                domain: domain,
                context: _.extend({}, self.record.getContext(self.recordParams), context || {}),
                title: (view === 'search' ? _t("Search: ") : _t("Create: ")) + self.string,
                initial_ids: ids ? _.map(ids, function (x) {
                    return x[0];
                }) : undefined,
                initial_view: view,
                disable_multiple_selection: self.field.type !== 'many2many' && self.field.type !== 'many2one' || (self.field.type === 'many2one' && parentList.viewType !== "list"),
                on_selected: function (records) {
                    m2mRecords.push(...records);
                },
                on_closed: function () {
                    if (self.field.type === 'many2many')
                        self.reinitialize(m2mRecords);
                    else {
                        self.reinitialize(m2mRecords.pop());
                        if (!m2mRecords.length)
                            return;
                        var contexts = [];
                        var key = "default_" + self.name;
                        _.each(m2mRecords, function (record) {
                            var obj = {};
                            obj[key] = record["id"];
                            contexts.push(obj);
                        });
                        parentList.trigger_up('add_record', {
                            context: contexts,
                            forceEditable: 'bottom',
                            allowWarning: true,
                            onSuccess: function () {
                                // Leave edit mode of one2many list.
                                unselectRow();
                            },

                        });
                    }
                },
            })).open();
        },
    });
});
