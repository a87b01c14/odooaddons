# Copyright 2015 Holger Brunn <hbrunn@therp.nl>
# Copyright 2016 Pedro M. Baeza <pedro.baeza@tecnativa.com>
# Copyright 2018 Simone Orsi <simone.orsi@camptocamp.com>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
{
    "name": "QR/Bar Code Scanner",
    "version": "14.0.0.0.1",
    "author": (
        "Yuxiaosan "
    ),
    "website": "www.antexgroup.cn",
    "license": "AGPL-3",
    "category": "web",
    "summary": "QR/Bar Code Scanner Module For Odoo",
    "depends": ["web", "barcodes"],
    "data": ["views/assets.xml"],
    "qweb": [
        'static/src/xml/webcam_qrcode_scan_template.xml',

    ],
    "installable": True,
}
