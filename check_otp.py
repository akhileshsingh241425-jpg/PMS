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
    # Check current OTP from DB
    import subprocess
    result = subprocess.run(['/var/www/pms-dev/backend/venv/bin/python3', '-c', '''
import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, LoginOtp
app = create_app()
with app.app_context():
    otps = LoginOtp.query.filter_by(user_id=23, used=False).order_by(LoginOtp.created_at.desc()).all()
    for o in otps:
        print(f"user_id={o.user_id} otp={o.otp_code} used={o.used}")
'''], capture_output=True, text=True, cwd='/var/www/pms-dev')
    print("Current OTPs:", result.stdout)
    
    # Now we can't easily get OTP here... actually let me just try with the new OTP if I check manually