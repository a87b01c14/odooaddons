/* Copyright 2018 Simone Orsi <simone.orsi@camptocamp.com>
 * Copyright 2018 Brainbean Apps
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */

odoo.define("web_widget_x2many_2d_matrix.X2Many2dMatrixRenderer", function (require) {
    "use strict";

    var BasicRenderer = require("web.BasicRenderer");
    var config = require("web.config");
    var core = require("web.core");
    var field_utils = require("web.field_utils");
    var utils = require("web.utils");
    var _t = core._t;

    var FIELD_CLASSES = {
        float: "o_list_number",
        integer: "o_list_number",
        monetary: "o_list_number",
        text: "o_list_text",
    };

    // X2Many2dMatrixRenderer is heavily inspired by Odoo's ListRenderer
    // and is reusing portions of code from list_renderer.js
    var X2Many2dMatrixRenderer = BasicRenderer.extend({
        /**
         * @override
         */
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.editable = params.editable;
            this._saveMatrixData(params.matrix_data);
        },

        /**
         * Update matrix data in current renderer instance.
         *
         * @param {Object} matrixData Contains the matrix data
         */
        _saveMatrixData: function (matrixData) {
            this.columns = matrixData.columns;
            this.rows = matrixData.rows;
            this.matrix_data = matrixData;
        },

        /**
         * Main render function for the matrix widget.
         *
         * It is rendered as a table. For now,
         * this method does not wait for the field widgets to be ready.
         *
         * @override
         * @private
         * @returns {Deferred} this deferred is resolved immediately
         */
        _renderView: function () {
            var self = this;

            this.$el.removeClass("table-responsive").empty();

            // Display a nice message if there's no data to display
            if (!self.rows.length) {
                var $alert = $("<div>", {class: "alert alert-info"});
                $alert.text(_t("Sorry no matrix data to display."));
                this.$el.append($alert);
                return this._super();
            }

            var $table = $("<table>").addClass(
                "o_list_view table table-condensed table-striped " +
                "o_x2many_2d_matrix "
            );
            this.$el.addClass("table-responsive").append($table);

            this._computeColumnAggregates();
            this._computeRowAggregates();

            // We need to initialize the deferred list object for inherited functions that use this.defs even if it
            // is empty at the moment.
            var defs = [];
            this.defs = defs;

            $table.append(this._renderHeader()).append(this._renderBody());
            if (this.checkShowRowTotals(self.matrix_data.show_column_totals)) {
                $table.append(this._renderFooter());
            }
            delete this.defs;
            return this._super();
        },

        /**
         * Render the table body.
         *
         * Looks for the table body and renders the rows in it.
         * Also it sets the tabindex on every input element.
         *
         * @private
         * @returns {jQueryElement} The table body element just filled.
         */
        _renderBody: function () {
            var $body = $("<tbody>").append(this._renderRows());
            _.each($body.find("input"), function (td, i) {
                $(td).attr("tabindex", i);
            });
            return $body;
        },

        /**
         * Render the table head of our matrix. Looks for the first table head
         * and inserts the header into it.
         *
         * @private
         * @returns {jQueryElement} The thead element that was inserted into.
         */
        _renderHeader: function () {
            var $thead = $("<thead>");
            $thead.append(this._renderMainHeader()).append(this._renderSubHeader());
            return $thead;
        },
        /**
         * Render the first row of header.
         *
         * Creates a th.
         *
         * @private
         * @param {Object} node Contains the cell data
         * @param {int} colspan Number of columns to be merged
         * @returns {jQueryElement} the created <tr> node.
         */
        _renderHeaderCell: function (node, colspan) {
            var self = this;
            var name = node.attrs.name;
            var field = self.state.fields[name];
            var $th = $("<th>");
            if (!field) {
                return $th;
            }
            if (colspan)
                $th.attr("colspan", colspan);
            var description = null;
            if (node.attrs.widget) {
                description = self.state.fieldsInfo.list[name].Widget.prototype
                    .description;
            }
            if (_.isNull(description)) {
                description = node.attrs.string || field.string;
            }
            $th.text(description).attr("name", name);
            $th.addClass("text-center");
            if (config.isDebug()) {
                var fieldDescr = {
                    field: field,
                    name: name,
                    string: description || name,
                    record: self.state,
                    attrs: node.attrs,
                };
                self._addFieldTooltip(fieldDescr, $th);
            }
            return $th;
        },

        /**
         * Render the first row of header.
         *
         * Creates a th.
         *
         * @private
         * @returns {jQueryElement} the created <tr> node.
         */
        _renderMainHeader: function () {
            var self = this;
            var $tr = $("<tr>").append("<th/>");
            _.each(this.columns, function (node) {
                $tr.append(self._renderHeaderCell(node, self.matrix_data.field_values.length));
            });
            var len = 0;
            for (var key in this.matrix_data.show_row_totals) {
                if (this.matrix_data.show_row_totals[key])
                    len++;
            }
            if (len > 0) {
                var $th = $(_t("<th>Total</th>")).addClass("total text-center");
                $tr.append($th);
                if (len > 1)
                    $th.attr("colspan", len);
            }
            return $tr;
        },

        /**
         * Render the second row of header.
         *
         * Creates a tr.
         *
         * @private
         * @returns {jQueryElement} the created <tr> node.
         */
        _renderSubHeader: function () {
            var self = this;
            var $tr = $("<tr>").append("<th/>");
            _.each(this.columns, function (node) {
                _.each(self.matrix_data.sub_columns, function (sub_node) {
                    $tr.append(self._renderHeaderCell(sub_node));

                });
            });
            _.each(self.matrix_data.sub_columns, function (sub_node) {
                if (self.matrix_data.show_row_totals[sub_node.attrs.name]) {
                    $tr.append(self._renderHeaderCell(sub_node).addClass("total"));
                }
            });
            return $tr;
        },

        /**
         * Proxy call to function rendering single row.
         *
         * @private
         * @returns {String} a string with the generated html.
         */
        _renderRows: function () {
            return _.map(
                this.rows,
                function (row) {
                    row.attrs.name = this.matrix_data.field_values;
                    return this._renderRow(row);
                }.bind(this)
            );
        },

        /**
         * Render a single row with all its columns.
         * Renders all the cells and then wraps them with a <tr>.
         * If aggregate is set on the row it also will generate
         * the aggregate cell.
         *
         * @private
         * @param {Object} row The row that will be rendered.
         * @returns {jQueryElement} the <tr> element that has been rendered.
         */
        _renderRow: function (row) {
            var self = this;
            var $tr = $("<tr/>", {class: "o_data_row"}),
                _data = _.without(row.data, undefined);
            $tr = $tr.append(this._renderLabelCell(_data[0]));
            this.columns.map(
                function (column, index) {
                    var record = row.data[index];
                    // Make the widget use our field value for each cell
                    // column.attrs.name = this.matrix_data.field_values;
                    this._renderBodyCell($tr, record, index, {mode: ""});
                }.bind(this)
            );
            _.each(this.matrix_data.sub_columns, function (sub_node) {
                var fname = sub_node.attrs.name;
                if (row.aggregate[fname]) {
                    $tr.append(self._renderAggregateRowCell(row, fname));
                }
            });

            return $tr;
        },

        /**
         * Renders the label for a specific row.
         *
         * @private
         * @param {Object} record Contains the information about the record.
         * @returns {jQueryElement} the cell that was rendered.
         */
        _renderLabelCell: function (record) {
            var $td = $("<td>");
            var value = record.data[this.matrix_data.field_y_axis];
            if (value.type === "record") {
                // We have a related record
                value = value.data.display_name;
            }
            // Get 1st column filled w/ Y label
            $td.text(value);
            return $td;
        },

        /**
         * Create a cell and fill it with the aggregate value.
         *
         * @private
         * @param {Object} row the row object to aggregate.
         * @param {String} fname: The field name.
         * @returns {jQueryElement} The rendered cell.
         */
        _renderAggregateRowCell: function (row, fname) {
            var $cell = $("<td/>", {class: "row-total"});
            $cell.attr("name", fname);
            this.applyAggregateValue($cell, row.aggregate[fname], fname);
            return $cell;
        },

        /**
         * Render a single body Cell.
         * Gets the field and renders the widget. We force the edit mode, since
         * we always want the widget to be editable.
         *
         * @private
         * @param {jQueryElement} $tr The rendered row
         * @param {Object} record Contains the data for this cell
         * @param {int} colIndex The index of the current column.
         * @param {Object} options The obtions used for the widget
         * @returns {jQueryElement} the rendered cell.
         */
        _renderBodyCell: function ($tr, record, colIndex, options) {
            var self = this;
            this.matrix_data.sub_columns.map(
                function (sub_node, index) {
                    var fname = sub_node.attrs.name;
                    var field=self.state.fields[fname];
                    var tdClassName = "o_data_cell";
                    if (sub_node.tag === "field") {
                        var typeClass = FIELD_CLASSES[field.type];
                        if (typeClass) {
                            tdClassName += " " + typeClass;
                        }
                        if (sub_node.attrs.widget) {
                            tdClassName += " o_" + sub_node.attrs.widget + "_cell";
                        }
                    }

                    // TODO roadmap: here we should collect possible extra params
                    // the user might want to attach to each single cell.

                    var $td = $("<td>", {
                        class: tdClassName,
                    });

                    if (_.isUndefined(record)) {
                        // Without record, nothing elese to do
                        return $td;
                    }
                    $td.attr({
                        "data-form-id": record.id,
                        "data-id": record.data.id,
                    });

                    // We register modifiers on the <td> element so that it gets
                    // the correct modifiers classes (for styling)
                    var modifiers = self._registerModifiers(
                        sub_node,
                        record,
                        $td,
                        _.pick(options, "mode")
                    );
                    // If the invisible modifiers is true, the <td> element is
                    // left empty. Indeed, if the modifiers was to change the
                    // whole cell would be rerendered anyway.
                    if (modifiers.invisible && !(options && options.renderInvisible)) {
                        return $td;
                    }


                    if(field.readonly)
                        options.mode='readonly';//readonly
                    else
                        options.mode = self.getParent().mode;// Enforce mode of the parent
                    if (sub_node.tag === "widget") {
                        return $td.append(self._renderWidget(record, sub_node));
                    }
                    var $el = self._renderFieldWidget(sub_node, record, _.pick(options, "mode"));
                    $tr.append($td.append($el));

                }.bind(this)
            );
        },

        /**
         * Wraps the column aggregate with a tfoot element
         *
         * @private
         * @returns {jQueryElement} The footer element with the cells in it.
         */
        _renderFooter: function () {
            var self = this;
            var $tr = $("<tr>").append("<td/>")
            this._renderAggregateColCells($tr);
            this.matrix_data.sub_columns.map(
                function (sub_node, index) {
                    var $total_cell = self._renderTotalCell(sub_node.attrs.name);
                    if ($total_cell) {
                        $tr.append($total_cell);
                    }
                });
            return $("<tfoot>").append($tr);

        },

        /**
         * Renders the total cell (of all rows / columns)
         *
         * @private
         * @param {String} fname: The field name.
         * @returns {jQueryElement} The td element with the total in it.
         */
        _renderTotalCell: function (fname) {
            if (
                !this.matrix_data.show_column_totals[fname] ||
                !this.matrix_data.show_row_totals[fname]
            ) {
                return;
            }

            var $cell = $("<td>", {class: "col-total"});
            this.applyAggregateValue($cell, this.total[fname].aggregate, fname);
            return $cell;
        },

        /**
         * Render the Aggregate cells for the column.
         *
         * @private
         * @param {jQueryElement} $tr The rendered row
         * @returns {List} the rendered cells
         */
        _renderAggregateColCells: function ($tr) {
            var self = this;
            return _.map(this.columns, function (column) {
                _.map(self.matrix_data.sub_columns, function (sub_node, index) {
                    var fname = sub_node.attrs.name;
                    var $cell = $("<td>");
                    if (config.isDebug()) {
                        $cell.addClass(fname);
                    }
                    if (column.aggregate[fname]) {
                        self.applyAggregateValue($cell, column.aggregate[fname], fname);
                    }
                    $tr.append($cell);
                });
            });
        },

        /**
         * Compute the column aggregates.
         * This function is called everytime the value is changed.
         *
         * @private
         */
        _computeColumnAggregates: function () {
            var self = this;
            this.total = [];
            _.each(this.matrix_data.field_values, function (fname) {

                if (!self.matrix_data.show_column_totals[fname]) {
                    return true;
                }
                var field = self.state.fields[fname];
                if (!field) {
                    return true;
                }
                var type = field.type;
                if (!~["integer", "float", "monetary"].indexOf(type)) {
                    return true;
                }
                self.total[fname] = {
                    attrs: {
                        name: fname,
                    },
                    aggregate: {
                        help: _t("Sum Total"),
                        value: 0,
                    },
                };
                _.each(
                    self.columns,
                    function (column, index) {
                        column.aggregate[fname] = {
                            help: _t("Sum"),
                            value: 0,
                        };
                        _.each(self.rows, function (row) {
                            // TODO Use only one _.propertyOf in underscore 1.9.0+
                            try {
                                column.aggregate[fname].value += row.data[index].data[fname];
                            } catch (error) {
                                // Nothing to do
                            }
                        });
                        self.total[fname].aggregate.value += column.aggregate[fname].value;
                    }.bind(self)
                );
            });
        },

        _getRecord: function (recordId) {
            var record = null;
            utils.traverse_records(this.state, function (r) {
                if (r.id === recordId) {
                    record = r;
                }
            });
            return record;
        },

        /**
         * @override
         */
        updateState: function (state, params) {
            if (params.matrix_data) {
                this._saveMatrixData(params.matrix_data);
            }
            return this._super.apply(this, arguments);
        },

        /**
         * Traverse the fields matrix with the keyboard
         *
         * @override
         * @private
         * @param {OdooEvent} event "navigation_move" event
         */
        _onNavigationMove: function (event) {
            var widgets = this.__parentedChildren,
                index = widgets.indexOf(event.target),
                first = index === 0,
                last = index === widgets.length - 1,
                move = 0;
            // Guess if we have to move the focus
            if (event.data.direction === "next" && !last) {
                move = 1;
            } else if (event.data.direction === "previous" && !first) {
                move = -1;
            }
            // Move focus
            if (move) {
                var target = widgets[index + move];
                index = this.allFieldWidgets[target.record.id].indexOf(target);
                this._activateFieldWidget(target.record, index, {inc: 0});
                event.stopPropagation();
            }
        },

        /**
         * Compute the row aggregates.
         *
         * This function is called everytime the value is changed.
         *
         * @private
         */
        _computeRowAggregates: function () {
            var self = this;
            _.each(this.matrix_data.field_values, function (fname) {

                if (!self.matrix_data.show_row_totals[fname]) {
                    return true;
                }
                var field = self.state.fields[fname];
                if (!field) {
                    return true;
                }
                var type = field.type;
                if (!~["integer", "float", "monetary"].indexOf(type)) {
                    return true;
                }
                _.each(self.rows, function (row) {
                    row.aggregate[fname] = {
                        help: _t("Sum"),
                        value: 0,
                    };
                    _.each(row.data, function (col) {
                        // TODO Use _.property in underscore 1.9+
                        try {
                            row.aggregate[fname].value += col.data[fname];
                        } catch (error) {
                            // Nothing to do
                        }
                    });
                });
            });
        },

        /**
         * Takes the given Value, formats it and adds it to the given cell.
         *
         * @private
         *
         * @param {jQueryElement} $cell
         * The Cell where the aggregate should be added.
         *
         * @param {Object} aggregate
         * The object which contains the information about the aggregate value axis
         * @param {String} fname: The field name with change.
         */
        applyAggregateValue: function ($cell, aggregate, fname) {
            var field = this.state.fields[fname];
            var value = aggregate.value;
            var help = aggregate.help;
            var fieldInfo = this.state.fieldsInfo.list[fname];
            var formatFunc =
                field_utils.format[fieldInfo.widget ? fieldInfo.widget : field.type];
            var formattedValue = formatFunc(value, field, {escape: true});
            $cell
                .addClass("o_list_number")
                .attr("title", help)
                .html(formattedValue);
        },

        /**
         * Check if the change was successful and then update the grid.
         * This function is required on relational fields.
         *
         * @param {Object} state
         * Contains the current state of the field & all the data
         *
         * @param {String} id
         * the id of the updated object.
         *
         * @param {Array} fields
         * The fields we have in the view.
         *
         * @param {Object} ev
         * The event object.
         *
         * @returns {Deferred}
         * The deferred object thats gonna be resolved when the change is made.
         */
        confirmUpdate: function (state, id, fields, ev) {
            var self = this;
            this.state = state;
            return this.confirmChange(state, id, fields, ev).then(function () {
                self._refresh(id, ev.target.attrs.name);
            });
        },

        /**
         * Refresh our grid.
         *
         * @private
         * @param {String} id Datapoint ID
         * @param {String} fname: The field name with change.
         */
        _refresh: function (id, fname) {
            this._updateRow(id);
            this._refreshColTotals();
            this._refreshRowTotals(fname);
        },

        /**
         *Update row data in our internal rows.
         *
         * @param {String} id: The id of the row that needs to be updated.
         */
        _updateRow: function (id) {
            var record = _.findWhere(this.state.data, {id: id}),
                _id = _.property("id");
            _.each(this.rows, function (row) {
                _.each(row.data, function (col, i) {
                    if (_id(col) === id) {
                        row.data[i] = record;
                    }
                });
            });
        },

        /**
         * Update the row total.
         */
        _refreshColTotals: function () {
            this._computeColumnAggregates();
            this.$("tfoot").replaceWith(this._renderFooter());
        },

        /**
         * Update the column total.
         * @param {String} fname: The field name with change.
         */
        _refreshRowTotals: function (fname) {
            var self = this;
            this._computeRowAggregates();
            var $rows = self.$el.find("tr.o_data_row");
            var selector = _.str.sprintf("[name='%s'].row-total", fname);
            _.each(self.rows, function (row, i) {
                if (row.aggregate[fname]) {
                    $($rows[i])
                        .find(selector)
                        .replaceWith(self._renderAggregateRowCell(row, fname));
                }
            });
        },

        /**
         * X2many fields expect this
         *
         * @returns {null}
         */
        getEditableRecordID: function () {
            return null;
        },

        /**
         * Check if the total needs to be displayed
         * @param {Array} dicArray: The id of the row that needs to be updated.
         * @returns {boolean}
         */
        checkShowRowTotals: function (dicArray) {
            for (var key in dicArray) {
                if (dicArray[key])
                    return true;
            }
            return false;
        }
    });

    return X2Many2dMatrixRenderer;
});
