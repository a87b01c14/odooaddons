# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'import language extension',
    'version': '14.0.0.0.0',
    'category': 'Hidden',
    'summary': 'import language extension',
    'sequence': '8',
    'website': 'https://www.antexgroup.cn',
    'author': 'Yuxiaosan',
    'license': 'LGPL-3',
    'support': 'antex_yxs@antexgroup.cn',
    'website': '',
    'depends': ['base'],
    'demo': [],
    'data': [
        'wizard/base_import_language_views.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'images': [],
    'qweb': [],
    'external_dependencies': {
        'python': [''],
    },
}
