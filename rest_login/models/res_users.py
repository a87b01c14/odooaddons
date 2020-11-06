# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import logging

from odoo import models
from odoo.exceptions import AccessDenied, UserError
from odoo.http import request

_logger = logging.getLogger(__name__)


class APIKeysUser(models.Model):
    _inherit = 'res.users'

    def _check_credentials(self, password, env):
        try:
            return super(APIKeysUser, self)._check_credentials(password, env)
        except AccessDenied:
            scope = request.params.get('scope',None)
            if scope:
                if self.env['res.users.apikeys']._check_credentials(scope=scope, key=password) == self.env.uid:
                    return

            raise
