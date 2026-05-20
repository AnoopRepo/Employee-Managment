import urllib.request
import json
import time

API_URL = "http://localhost:8000"

def make_request(path, data=None, headers=None):
    url = f"{API_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    req_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method="POST" if data is not None else "GET")
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def test_flow():
    print("Testing signup...")
    # 1. Signup a test user
    signup_data = {
        "name": "Anoop Developer",
        "email": "anoop@example.com",
        "password": "securepassword123",
        "role": "admin"
    }
    status, signup_res = make_request("/api/auth/signup", data=signup_data)
    print(f"Signup Status: {status}")
    print(f"Signup Response: {json.dumps(signup_res, indent=2)}")
    
    # 2. Login the test user
    print("\nTesting login...")
    login_data = {
        "email": "anoop@example.com",
        "password": "securepassword123"
    }
    status, login_res = make_request("/api/auth/login", data=login_data)
    print(f"Login Status: {status}")
    print(f"Login Response: {json.dumps(login_res, indent=2)}")
    
    if status == 200:
        token = login_res["access_token"]
        print(f"\nObtained Access Token: {token[:20]}...")
        
        # 3. Fetch /me details
        print("\nTesting /me authentication...")
        status, me_res = make_request("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        print(f"/me Status: {status}")
        print(f"/me Response: {json.dumps(me_res, indent=2)}")

if __name__ == "__main__":
    time.sleep(2)  # Wait for server to fully initialize
    test_flow()
