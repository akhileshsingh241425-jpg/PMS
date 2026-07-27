import requests
import json
import urllib3
import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, LoginOtp, User, LeaveRequest, ExpenseEntry

urllib3.disable_warnings()

base = "https://localhost:9444"

# Helper to login and get token
def login_user(email, password):
    login = {"email": email, "password": password}
    r = requests.post(f"{base}/api/auth/login", json=login, verify=False)
    print(f"Login {email}: {r.status_code}")
    if r.status_code == 200 and r.json().get("requires_otp"):
        temp = r.json()["temp_token"]
        # Get OTP
        app = create_app()
        with app.app_context():
            user = User.query.filter_by(email=email).first()
            if user:
                otps = LoginOtp.query.filter_by(user_id=user.id, is_used=False).order_by(LoginOtp.created_at.desc()).all()
                for o in otps:
                    otp_code = o.otp_code
                    print(f"  Using OTP: {otp_code}")
                    r2 = requests.post(f"{base}/api/auth/verify-otp", json={"temp_token": temp, "otp_code": otp_code}, verify=False)
                    if r2.status_code == 200:
                        return r2.json()["token"]
    return None

# Test as employee creating leave request
print("=== Testing Leave Approval Flow ===")

# Login as employee (neha)
token = login_user("neha@gmail.com", "pass1234")
if not token:
    print("Employee login failed")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}"}
print("Employee token acquired")

# Create a leave request first (using myday API)
leave_data = {
    "leave_type": "Casual",
    "from_date": "2026-07-30",
    "to_date": "2026-07-30",
    "reason": "Personal work"
}
r = requests.post(f"{base}/api/myday/leave", json=leave_data, headers=headers, verify=False)
print(f"Create leave: {r.status_code}", r.json())

leave_id = r.json().get("leave", {}).get("id") if r.status_code == 201 else None
print(f"Leave ID: {leave_id}")

# Now trigger approval
if leave_id:
    r = requests.post(f"{base}/api/approvals/leave", json={"leave_request_id": leave_id, "leave_type": "full_day"}, headers=headers, verify=False)
    print(f"Create approval: {r.status_code}", r.json())

# Now test as HR (who should approve)
print("\n=== Testing HR approval ===")
token_hr = login_user("hr@infocus-it.com", "pass1234")
if token_hr:
    h_hr = {"Authorization": f"Bearer {token_hr}"}
    r = requests.get(f"{base}/api/approvals", headers=h_hr, verify=False)
    print(f"HR pending approvals: {r.status_code}", r.json())

# Test as Finance
print("\n=== Testing Finance approval ===")
token_fin = login_user("finance@infocus-it.com", "pass1234")
if token_fin:
    h_fin = {"Authorization": f"Bearer {token_fin}"}
    r = requests.get(f"{base}/api/approvals", headers=h_fin, verify=False)
    print(f"Finance pending approvals: {r.status_code}", r.json())