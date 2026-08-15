import urllib.request
import json
import urllib.parse

BASE_URL = "http://127.0.0.1:5000"

def post_form(endpoint, data):
    encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=encoded_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    res = urllib.request.urlopen(req)
    return json.loads(res.read().decode('utf-8')), res.status

def post_json(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read().decode('utf-8')), res.status
    except urllib.error.HTTPError as e:
        print("HTTP Error Body:", e.read().decode('utf-8'))
        raise e

def get_json(endpoint):
    res = urllib.request.urlopen(f"{BASE_URL}{endpoint}")
    return json.loads(res.read().decode('utf-8')), res.status

def run_tests():
    print("--- 1. Testing Member Registration ---")
    import time
    timestamp = int(time.time())
    reg_data = {
        "first_name": "Karim",
        "last_name": "Tazi",
        "email": f"karim.tazi.{timestamp}@clubtech.org",
        "phone": "+212 699887766",
        "major": "CyberSécurité",
        "level": "Master 2"
    }
    reg_res, code = post_form("/api/register", reg_data)
    print(f"Register Status: {code}, Member Number: {reg_res['member']['member_number']}, PIN: {reg_res['pin']}")

    member_num = reg_res['member']['member_number']
    pin = reg_res['pin']

    print("\n--- 2. Testing Member Login ---")
    login_res, code = post_json("/api/login", {"member_number": member_num, "pin": pin})
    print(f"Login Status: {code}, Logged in as: {login_res['member']['first_name']} {login_res['member']['last_name']}")

    print("\n--- 3. Testing Attendance Scan ---")
    scan_res, code = post_json("/api/attendance/scan", {
        "member_number": member_num,
        "event_name": "Hackathon 2026 Opening"
    })
    print(f"Scan Status: {code}, Message: {scan_res['message']}")

    print("\n--- 4. Testing Commissions List ---")
    comm_res, code = get_json("/api/commissions")
    print(f"Commissions Status: {code}, Total Commissions: {len(comm_res)}")

    print("\n--- 5. Testing OrgChart ---")
    org_res, code = get_json("/api/org_chart")
    print(f"OrgChart Status: {code}, Positions: {len(org_res)}")

    print("\n--- 6. Testing Internal Discussion ---")
    disc_data = {
        "member_id": login_res['member']['id'],
        "message": "Automated verification test message!"
    }
    disc_res, code = post_json("/api/discussion", disc_data)
    print(f"Discussion Status: {code}, New message ID: {disc_res['id']}")

    print("\n--- 7. Testing System Action Logs ---")
    logs_res, code = get_json("/api/logs")
    print(f"Logs Status: {code}, Total Logs: {len(logs_res)}")

    print("\n--- 8. Testing Excel Export ---")
    req = urllib.request.Request(f"{BASE_URL}/api/export_excel")
    res = urllib.request.urlopen(req)
    excel_data = res.read()
    print(f"Excel Export Status: {res.status}, File size: {len(excel_data)} bytes")

    print("\n==============================================")
    print("ALL BACKEND API TESTS PASSED SUCCESSFULLY 100%!")
    print("==============================================")

if __name__ == "__main__":
    run_tests()
