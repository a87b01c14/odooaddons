odoo.define('popup_beauty', function (require) {
    "use strict";

    var core = require('web.core');
    var AbstractAction = require('web.AbstractAction');

    var qweb = core.qweb;

    var BeautyPopup = AbstractAction.extend({
        events: {
            'click button.btn': 'close',
        },

        init: function (parent, action, options) {
            this._super.apply(this, arguments);
            this.action = action;
            this.action_manager = parent;
        },

        start: function () {
            this.$el.append(qweb.render('BeautyPopup', {
                body: this.action.context.body,
                button: this.action.context.button,
                type: this.action.context.type,
            }));
            //TODO fix. need load view or other tric
            this.$el.append(this.getParent().$el[0].innerHTML);
            this.close_link = this.getParent().$el[0].baseURI;
        },

        close: function () {
            document.location.href = this.close_link;
        },
    });

    core.action_registry.add('popup_beauty.new', BeautyPopup);
    return BeautyPopup;
});