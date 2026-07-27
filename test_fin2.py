import requests
import sys

requests.packages.urllib3.disable_warnings()
BASE = "https://93.127.194.235:9444"

# Login as finance
print("=== LOGIN finance ===")
r = requests.post(f"{BASE}/api/auth/login", json={"email": "finance@infocus-it.com", "password": "pass1234"}, verify=False)
print(r.status_code, r.json())

if r.status_code == 200 and r.json().get("requires_otp"):
    temp_token = r.json()["temp_token"]
    print(f"Got temp_token, verifying OTP 365384...")
    r2 = requests.post(f"{BASE}/api/auth/verify-otp", json={"temp_token": temp_token, "otp_code": "365384"}, verify=False)
    print("VERIFY:", r2.status_code, r2.json())
    if r2.status_code == 200:
        token = r2.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Token acquired")
        
        # Test finance endpoints
        print("\n=== TDS QUARTERLY (should work) ===")
        r = requests.get(f"{BASE}/api/po-out/report/tds-quarterly", headers=headers, verify=False)
        print(r.status_code, r.json() if r.status_code == 200 else r.text[:200])
        
        print("\n=== PO OUT LIST (should work) ===")
        r = requests.get(f"{BASE}/api/po-out", headers=headers, verify=False)
        print(r.status_code, "count=" + str(len(r.json().get("po_list", []))) if r.status_code == 200 else r.text[:200])
        
        print("\n=== PO IN LIST (should work) ===")
        r = requests.get(f"{BASE}/api/po-in", headers=headers, verify=False)
        print(r.status_code, "count=" + str(len(r.json().get("po_list", []))) if r.status_code == 200 else r.text[:200])

        # Test payments endpoint
        print("\n=== PAYMENTS LIST (should work) ===")
        r = requests.get(f"{BASE}/api/po-out/1/payments", headers=headers, verify=False)
        print(r.status_code, r.json() if r.status_code == 200 else r.text[:200])
        
        # Test creating a payment (should work)
        print("\n=== CREATE PAYMENT (should work) ===")
        r = requests.post(f"{BASE}/api/po-out/1/payments", headers=headers, json={
            "amount": 1000,
            "date": "2026-07-28",
            "mode": "NEFT",
            "reference": "TEST-001"
        }, verify=False)
        print(r.status_code, r.json() if r.status_code == 200 else r.text[:200])
else:
    print("Login failed")