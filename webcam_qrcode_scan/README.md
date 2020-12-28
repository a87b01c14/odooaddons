# Webcam-QR-Bar-Code-Scanner
QR/Bar Code Scanner Module For Odoo 
# example
```
<field name="barcode"
    widget="barcode_scanner"
    options="{'dialog':False,'facing':'back','codeType':'qrcode'}"/>
```
+ dialog:
    True:Displays the selection dialog; default False
+ facing:
        back:Using the back camera  front:Using the front camera
+ codeType:barcode or qrcode      

## Note: camera permissions require HTTPS