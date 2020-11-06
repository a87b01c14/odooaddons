# from bs4 import BeautifulSoup

import requests, json

loginURL = "http://127.0.0.1:8069/rest/login"
URL = "http://127.0.0.1:8069/base_rest_demo_api/private/partner/1"
username = "antex_yxs@antexgroup.cn"
password = "8565e8c15b49dad43f3295b4804781304f939ced"

client = requests.Session()
# response = client.get(loginURL)
# soup = BeautifulSoup(response.content)
# csrf_token = soup.find('input', {'name': 'csrf_token'})['value']
login_response = client.post(loginURL, data={"login": username, "password": password, "scope": "rest"})
form_response = client.get(URL)
data = json.loads(form_response.content.decode())
print(data)
