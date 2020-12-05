import odoo
from odoo.addons.web.controllers.main import clean_action


def _clean_action(action, env):
    action_type = action.setdefault('type', 'ir.actions.act_window_close')
    if action_type in ('ir.actions.act_window.message', 'ir.actions.act_multi', 'ir.actions.act_view_reload'):
        return action
    else:
        return clean_action(action, env)


odoo.addons.web.controllers.main.clean_action = _clean_action
