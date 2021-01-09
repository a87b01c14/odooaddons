odoo.define('website_upload_video.MediaDialog', function (require) {
    'use strict';

    var core = require('web.core');
    var MediaModules = require('website_upload_video.media');
    var MediaDialog = require('wysiwyg.widgets.MediaDialog');

    var _t = core._t;

    /**
     * Lets the user select a media. The media can be existing or newly uploaded.
     *
     * The media can be one of the following types: image, document, video or
     * font awesome icon (only existing icons).
     *
     * The user may change a media into another one depending on the given options.
     */
    MediaDialog.include({
        xmlDependencies: MediaDialog.prototype.xmlDependencies.concat(
            ['/website_upload_video/static/src/xml/website_upload_video.xml']
        ),
        events: _.extend({}, MediaDialog.prototype.events, {
            'click #editor-media-local-tab': '_onClickLocalTab',
        }),


        /**
         * @constructor
         * @param {Element} media
         */
        init: function (parent, options, media) {
            this._super.apply(this, arguments);
            if (!options.noVideos) {
                this.localvideoWidget = new MediaModules.LocalVideoWidget(this, media, options);
                if ($(media).is('.media_local_video'))
                    this.activeWidget = this.localvideoWidget;

            }
        },
        /**
         * Adds the appropriate class to the current modal and appends the media
         * widgets to their respective tabs.
         *
         * @override
         */
        start: function () {
            if (this.localvideoWidget)
                return Promise.all([Promise.resolve(this.localvideoWidget.appendTo(this.$("#editor-media-local"))), this._super.apply(this, arguments)]);
            else
                return this._super.apply(this, arguments);
        },

        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------


        /**
         * Returns whether the video widget is currently active.
         *
         * @returns {boolean}
         */
        isLocalActive: function () {
            return this.activeWidget === this.localvideoWidget;
        },

        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------

        /**
         * Call clear on all the widgets except the activeWidget.
         * We clear because every widgets are modifying the "media" element.
         * All widget have the responsibility to clear a previous element that
         * was created from them.
         */
        _clearWidgets: function () {
            this._super.apply(this, arguments);

            if (this.localvideoWidget && this.localvideoWidget !== this.activeWidget)
                this.localvideoWidget.clear();

        },

        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------


        /**
         * Sets the video widget as the active widget.
         *
         * @private
         */
        _onClickLocalTab: function () {
            this.activeWidget = this.localvideoWidget;
        },
    });
});
