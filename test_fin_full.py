import requests
import json
import urllib3
import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, LoginOtp, User

urllib3.disable_warnings()

base = "https://localhost:9444"

# Login as finance
login = {"email": "finance@infocus-it.com", "password": "pass1234"}
r = requests.post(f"{base}/api/auth/login", json=login, verify=False)
print("Finance login:", r.status_code, r.json())

data = r.json()
if data.get("requires_otp"):
    temp = data.get("temp_token")
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email="finance@infocus-it.com").first()
        if user:
            otps = LoginOtp.query.filter_by(user_id=user.id, is_used=False).order_by(LoginOtp.created_at.desc()).all()
            for o in otps:
                otp_code = o.otp_code
                print(f"Using OTP: {otp_code}")
                otp_data = {"temp_token": temp, "otp_code": otp_code}
                r2 = requests.post(f"{base}/api/auth/verify-otp", json=otp_data, verify=False)
                print("Finance verify:", r2.status_code, r2.json())
                
                if r2.status_code == 200:
                    token = r2.json().get("token")
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    print("\n--- Testing FINANCE access to financial endpoints (should be 200) ---")
                    
                    r = requests.get(f"{base}/api/po-out/report/tds-quarterly", headers=headers, verify=False)
                    print("GET /api/po-out/report/tds-quarterly:", r.status_code, "OK" if r.status_code == 200 else r.json())
                    
                    r = requests.get(f"{base}/api/po-out", headers=headers, verify=False)
                    print("GET /api/po-out:", r.status_code, "count=" + str(len(r.json().get("po_list", []))) if r.status_code == 200 else r.json())
                    
                    r = requests.get(f"{base}/api/po-in", headers=headers, verify=False)
                    print("GET /api/po-in:", r.status_code, "count=" + str(len(r.json().get("po_list", []))) if r.status_code == 200 else r.json())
                    
                    # Test payments list
                    r = requests.get(f"{base}/api/po-out/1/payments", headers=headers, verify=False)
                    print("GET /api/po-out/1/payments:", r.status_code, "OK" if r.status_code == 200 else r.json())
                    
                    # Test create payment
                    r = requests.post(f"{base}/api/po-out/1/payments", headers=headers, json={"amount": 1000, "date": "2026-07-28", "mode": "NEFT", "reference": "TEST"}, verify=False)
                    print("POST /api/po-out/1/payments:", r.status_code, r.json() if r.status_code != 200 else "OK")