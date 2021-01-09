odoo.define('website_upload_video.media', function (require) {
    'use strict';


    var weContext = require("wysiwyg.widgets.media");
    var rpc = require('web.rpc');

    var FileWidget = weContext.FileWidget;
    var LocalVideoWidget = FileWidget.extend({
        template: 'wysiwyg.widgets.local.video',
        xmlDependencies: FileWidget.prototype.xmlDependencies.concat(
            ['/website_upload_video/static/src/xml/website_upload_video.xml']
        ),
        existingAttachmentsTemplate: 'wysiwyg.widgets.video.existing.attachments',
        VIDEO_MIMETYPES: ['video/mp4', 'video/webm', 'video/ogg', 'audio/wav', 'audio/ogg', 'audio/mpeg'],
        noSave: true,

        init: function (parent, media, options) {
            this.searchService = 'all';
            this.isForBgVideo = !!options.isForBgVideo;
            options = _.extend({
                accept: 'video/*, audio/*',
                mimetypeDomain: [['mimetype', 'in', this.VIDEO_MIMETYPES]],
            }, options || {});
            this._super(parent, media, options);
        },
        /**
         * @override
         */
        start: function () {
            this.$content = this.$('.o_video_dialog_iframe');
            if (this.media) {
                const $media = $(this.media);
                const src = $media.data('oe-expression') || $media.data('src') || ($media.is('iframe') ? $media.attr('src') : '') || '';
                if (/\/web\/content\?model=ir\.attachment&field=datas&id=(\d+)/.test(src)) {
                    this._updateVideo(src);
                }
            }
            return this._super.apply(this, arguments);
        },


        /**
         * Handles change of the file input: create attachments with the new files
         * and open the Preview dialog for each of them. Locks the save button until
         * all new files have been processed.
         *
         * @private
         * @returns {Promise}
         */
        _onFileInputChange: function () {
            const self = this;
            return this._super.apply(this, arguments).then(function () {
                self.noSave = true; //don't close the dialog
            });
        },
        _selectAttachement: function (attachment, save, {type = 'attachment'} = {}) {
            if (attachment.id > 0)
                this._updateVideo(_.str.sprintf('/web/content?model=ir.attachment&field=datas&id=%s', attachment.id));
        },
        /**
         * Updates the video preview according to video code and enabled options.
         *
         * @private
         */
        _updateVideo: function (src) {
            this.$content.empty();
            const $video = $('<iframe>').width(1280).height(720)
                .attr('frameborder', 0)
                .attr('src', src)
                .addClass('o_video_dialog_iframe');

            // Show / Hide preview elements
            this.$el.find('.o_video_dialog_preview_text, .media_iframe_video_size').toggleClass('d-none', !$video);

            this.$content.replaceWith($video);
            this.$content = $video;

        },
        save: function () {
            const src=this.$content.attr('src');
            if (this.isForBgVideo) {
                return Promise.resolve({bgVideoSrc: src});
            }
            if (this.$('.o_video_dialog_iframe').is('iframe')) {
                this.$media = $(
                    '<div class="media_iframe_video media_local_video" data-oe-expression="' + src + '">' +
                    '<div class="css_editable_mode_display">&nbsp;</div>' +
                    '<div class="media_iframe_video_size" contenteditable="false">&nbsp;</div>' +
                    '<iframe src="' + src + '" frameborder="0" contenteditable="false" allowfullscreen="allowfullscreen"></iframe>' +
                    '</div>'
                );
                this.media = this.$media[0];
            }
            return Promise.resolve(this.media);
        },

        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------

        /**
         * @override
         */
        _clear: function () {
            if (this.media.dataset.src) {
                try {
                    delete this.media.dataset.src;
                } catch (e) {
                    this.media.dataset.src = undefined;
                }
            }
            const allVideoClasses = /(^|\b|\s)(media_local_video)(\s|\b|$)/g;
            const isLocalVideo = this.media.className && this.media.className.match(allVideoClasses);
            if (isLocalVideo) {
                this.media.className = this.media.className.replace(allVideoClasses, ' ').replace(/(^|\b|\s)(media_iframe_video)(\s|\b|$)/g, '');
                this.media.innerHTML = '';
            }
        },
    });
    weContext.VideoWidget.include({
        /**
         * @override
         */
        _clear: function () {
            const allVideoClasses = /(^|\b|\s)(media_local_video)(\s|\b|$)/g;
            const isLocalVideo = this.media.className && this.media.className.match(allVideoClasses);
            if (!isLocalVideo)
                this._super.apply(this, arguments);
        },
    });
    return {
        LocalVideoWidget: LocalVideoWidget,
    };
});