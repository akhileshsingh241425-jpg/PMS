import requests
import sys

requests.packages.urllib3.disable_warnings()
BASE = "https://93.127.194.235:9444"

# Login as employee (neha@gmail.com)
print("=== LOGIN employee ===")
r = requests.post(f"{BASE}/api/auth/login", json={"email": "neha@gmail.com", "password": "pass1234"}, verify=False)
print(r.status_code, r.json())

if r.status_code == 200 and r.json().get("requires_otp"):
    temp_token = r.json()["temp_token"]
    # Get employee OTP
    import subprocess
    result = subprocess.run(["ssh", "-i", "C:\\Users\\hp\\.ssh\\pms_vps", "root@93.127.194.235", "/var/www/pms-dev/backend/venv/bin/python3", "/tmp/otp_check.py"], capture_output=True, text=True)
    print("OTP check:", result.stdout)