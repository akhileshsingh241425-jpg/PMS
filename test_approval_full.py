import requests
import json
import urllib3
import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, LoginOtp, User

urllib3.disable_warnings()

base = "https://localhost:9444"

# Login as employee
login = {"email": "neha@gmail.com", "password": "pass1234"}
r = requests.post(f"{base}/api/auth/login", json=login, verify=False)
print("Employee login:", r.status_code, r.json())

data = r.json()
if data.get("requires_otp"):
    temp = data.get("temp_token")
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email="neha@gmail.com").first()
        if user:
            otps = LoginOtp.query.filter_by(user_id=user.id, is_used=False).order_by(LoginOtp.created_at.desc()).all()
            for o in otps:
                otp_code = o.otp_code
                print(f"Using OTP: {otp_code}")
                otp_data = {"temp_token": temp, "otp_code": otp_code}
                r2 = requests.post(f"{base}/api/auth/verify-otp", json=otp_data, verify=False)
                print("Employee verify:", r2.status_code, r2.json())
                
                if r2.status_code == 200:
                    token = r2.json().get("token")
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    # Test creating leave approval
                    print("\n--- Create leave approval ---")
                    import datetime
                    leave_data = {
                        "leave_type": "Casual",
                        "from_date": (datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
                        "to_date": (datetime.date.today() + datetime.timedelta(days=3)).isoformat(),
                        "reason": "Personal work"
                    }
                    r3 = requests.post(f"{base}/api/leave", json=leave_data, headers=headers, verify=False)
                    print("Create leave:", r3.status_code, r3.json())
                    
                    if r3.status_code == 200:
                        leave_id = r3.json().get("leave", {}).get("id")
                        if leave_id:
                            approval_data = {"leave_request_id": leave_id, "leave_type": "full_day"}
                            r4 = requests.post(f"{base}/api/approvals/leave", json=approval_data, headers=headers, verify=False)
                            print("Create approval:", r4.status_code, r4.json())
                    break