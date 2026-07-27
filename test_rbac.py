import requests
import json

# Login as finance
resp = requests.post(
    'https://93.127.194.235:9444/api/auth/login',
    json={'email': 'finance@infocus-it.com', 'password': 'pass1234'},
    verify=False
)
print("Finance login:", resp.status_code, resp.json())

# Test TDS quarterly
token = resp.json().get('token')
headers = {'Authorization': f'Bearer {token}'}
resp2 = requests.get(
    'https://93.127.194.235:9444/api/po-out/report/tds-quarterly',
    headers=headers,
    verify=False
)
print("TDS quarterly:", resp2.status_code, resp2.json())

# Login as employee
resp3 = requests.post(
    'https://93.127.194.235:9444/api/auth/login',
    json={'email': 'neha@gmail.com', 'password': 'pass1234'},
    verify=False
)
print("Employee login:", resp3.status_code, resp3.json())

token2 = resp3.json().get('token')
headers2 = {'Authorization': f'Bearer {token2}'}
resp4 = requests.get(
    'https://93.127.194.235:9444/api/po-out/report/tds-quarterly',
    headers=headers2,
    verify=False
)
print("Employee TDS quarterly:", resp4.status_code, resp4.json())

# Login as PM
resp5 = requests.post(
    'https://93.127.194.235:9444/api/auth/login',
    json={'email': 'amit@gmail.com', 'password': 'pass1234'},
    verify=False
)
print("PM login:", resp5.status_code, resp5.json())

token3 = resp5.json().get('token')
headers3 = {'Authorization': f'Bearer {token3}'}
resp6 = requests.get(
    'https://93.127.194.235:9444/api/po-out/report/tds-quarterly',
    headers=headers3,
    verify=False
)
print("PM TDS quarterly:", resp6.status_code, resp6.json())

# Test payments endpoint as finance
resp7 = requests.get(
    'https://93.127.194.235:9444/api/po-out/1/payments',
    headers=headers,
    verify=False
)
print("Finance payments list:", resp7.status_code, resp7.json())

# Test payments as employee
resp8 = requests.get(
    'https://93.127.194.235:9444/api/po-out/1/payments',
    headers=headers2,
    verify=False
)
print("Employee payments list:", resp8.status_code, resp8.json())