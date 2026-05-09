import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_header(title):
    print(f"\n{'='*50}")
    print(f" {title}")
    print(f"{'='*50}")

def make_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
        
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"❌ Error {e.code}: {e.read().decode()}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"❌ Connection failed. Is uvicorn running on 8000?\nError: {e.reason}")
        sys.exit(1)

def run_tests():
    test_phone = "+919999999999"
    test_otp = "123456"

    # Test 1: Send OTP
    print_header("Test 1: POST /auth/send-otp")
    response = make_request('POST', '/auth/send-otp', data={"phone": test_phone})
    print(f"✅ Success! Response: {response}")

    # Test 2: Verify OTP
    print_header("Test 2: POST /auth/verify-otp")
    response = make_request('POST', '/auth/verify-otp', data={"phone": test_phone, "otp": test_otp})
    token = response.get("access_token")
    print(f"✅ Success! Got Access Token: {token[:20]}...")

    # Test 3: Get My Profile (Requires Token)
    print_header("Test 3: GET /auth/me (Protected)")
    response = make_request('GET', '/auth/me', token=token)
    print(f"✅ Success! My Profile Data: \n{json.dumps(response, indent=2)}")

    # Test 4: Get Presigned S3 URL
    print_header("Test 4: POST /media/presigned-url (Protected)")
    response = make_request('POST', '/media/presigned-url', 
                            data={"filename": "test_video.mp4", "content_type": "video/mp4"},
                            token=token)
    print(f"✅ Success! Vault ID Created: {response.get('vault_id')}")
    print(f"✅ Success! S3 Key: {response.get('s3_key')}")
    print(f"✅ Success! Temporary S3 Upload URL generated.")

if __name__ == "__main__":
    print("🚀 Starting Automatic API Tests...")
    run_tests()
    print("\n🎉 All endpoints are working perfectly!")
