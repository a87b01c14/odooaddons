# -*- coding: utf-8 -*-
import json
import logging
import werkzeug
from werkzeug.exceptions import BadRequest
from odoo import SUPERUSER_ID, api, http, _

from odoo.addons.web.controllers.main import (login_and_redirect, ensure_db, set_cookie_and_redirect)
from odoo.exceptions import AccessDenied, AccessError
from odoo.http import request, Controller

_logger = logging.getLogger(__name__)


class RestLogin(Controller):

    @http.route('/rest/login', type='http', auth='public', methods=['POST'], csrf=False)
    def web_rest_login(self, *args, **kw):
        """
        sap
        :param args:
        :param kw:
        :return:
        """
        ensure_db()
        request.params['login_success'] = False

        if not request.uid:
            request.uid = SUPERUSER_ID

        request.session.authenticate(request.session.db, request.params['login'],
                                     request.params['password'])
        return "success"
