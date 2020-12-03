# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models,_


class BaseLanguageImport(models.TransientModel):
    _inherit = "base.language.import"

    lang_id = fields.Many2one('res.lang', string='Language Name', required=True,
                              default=lambda self: self.env['res.lang']._lang_get_id(self.env.lang))
    name = fields.Char(related="lang_id.name")
    code = fields.Char(related="lang_id.code")

    def import_lang(self):
        try:
            super(BaseLanguageImport, self).import_lang()
        except Exception as e:
            raise e
        else:
            return {
                "type": "ir.actions.client",
                "tag": "popup_beauty.new",
                "context": {
                    'body': _("translation file loaded successfully"),
                    'button': _('OK'),
                    'type': 'success',
                },
                "target": "current"
            }
