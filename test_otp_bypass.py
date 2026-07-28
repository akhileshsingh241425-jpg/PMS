import requests, urllib3
urllib3.disable_warnings()
base = "https://localhost:9444"
for e in ["superadmin@test.com","admin@test.com","hr@test.com","finance@test.com","pm@test.com","emp@test.com"]:
    r = requests.post(f"{base}/api/auth/login", json={"email": e, "password": "pass123"}, verify=False, timeout=5)
    d = r.json()
    has_token = "token" in d and d["token"][:20]
    has_otp = d.get("requires_otp")
    print(f"{e:30s} -> status={r.status_code} token={has_token} otp_req={has_otp}")