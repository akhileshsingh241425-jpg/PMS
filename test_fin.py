import requests
import json
import urllib3
urllib3.disable_warnings()

base = "https://localhost:9444"

# Login as finance
login = {"email": "finance@infocus-it.com", "password": "pass1234"}
r = requests.post(f"{base}/api/auth/login", json=login, verify=False)
print("Finance login:", r.status_code, r.json())

data = r.json()
if data.get("requires_otp"):
    temp = data.get("temp_token")
    otp = {"temp_token": temp, "otp_code": "876810"}
    r2 = requests.post(f"{base}/api/auth/verify-otp", json=otp, verify=False)
    print("Finance verify:", r2.status_code, r2.json())
    tok = r2.json().get("token")
    h = {"Authorization": f"Bearer {tok}"}
    
    # Test financial endpoints
    print("\n--- FINANCE user tests ---")
    r = requests.get(f"{base}/api/po-out", headers=h, verify=False)
    print("GET /api/po-out:", r.status_code, "count=" + str(len(r.json().get("po_list", []))) if r.status_code == 200 else r.json())
    
    r = requests.get(f"{base}/api/po-out/report/tds-quarterly", headers=h, verify=False)
    print("GET /api/po-out/report/tds-quarterly:", r.status_code, r.json() if r.status_code != 200 else "OK")
    
    r = requests.get(f"{base}/api/po-out/1/payments", headers=h, verify=False)
    print("GET /api/po-out/1/payments:", r.status_code, r.json() if r.status_code != 200 else "OK")
    
    r = requests.post(f"{base}/api/po-out/1/payments", headers=h, json={"amount": 1000, "date": "2026-07-28", "mode": "NEFT", "reference": "TEST123"}, verify=False)
    print("POST /api/po-out/1/payments:", r.status_code, r.json())