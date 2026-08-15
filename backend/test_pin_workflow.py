import sys
sys.path.insert(0, '.')

from app import app, db
from models import Member

def test_temporary_pin_flow():
    import time
    ts = int(time.time())
    client = app.test_client()
    
    print("--- 1. Testing Registration (Temporary 24h PIN) ---")
    reg_res = client.post('/api/register', data={
        "first_name": "TestInitial",
        "last_name": "User",
        "email": f"testinitial_{ts}@clubtech.org",
        "phone": "0600000000",
        "major": "Génie Informatique",
        "level": "3ème année"
    })
    assert reg_res.status_code == 201, f"Reg status: {reg_res.status_code}"
    data = reg_res.get_json()
    member_num = data['member']['member_number']
    temp_pin = data['pin']
    member_id = data['member']['id']
    assert data['member']['must_change_pin'] is True, "must_change_pin should be True"
    print(f"✓ Registered member {member_num} with temporary PIN {temp_pin} (must_change_pin=True)")

    print("\n--- 2. Testing Login with Temporary PIN ---")
    login_res = client.post('/api/login', json={
        "member_number": member_num,
        "pin": temp_pin
    })
    assert login_res.status_code == 200, f"Login status: {login_res.status_code}"
    login_data = login_res.get_json()
    assert login_data['member']['must_change_pin'] is True
    print("✓ Login successful with temporary PIN (must_change_pin=True returned)")

    print("\n--- 3. Testing Mandatory PIN Change ---")
    change_res = client.post(f'/api/members/{member_id}/change_pin', json={
        "current_pin": temp_pin,
        "new_pin": "999988"
    })
    assert change_res.status_code == 200, f"Change status: {change_res.status_code}"
    change_data = change_res.get_json()
    assert change_data['member']['must_change_pin'] is False
    print("✓ PIN changed successfully! must_change_pin is now False")

    print("\n--- 4. Testing Login with New Personal PIN ---")
    login_new = client.post('/api/login', json={
        "member_number": member_num,
        "pin": "999988"
    })
    assert login_new.status_code == 200
    assert login_new.get_json()['member']['must_change_pin'] is False
    print("✓ Login with new personal PIN successful (must_change_pin=False)")

    print("\n--- 5. Testing Card Resend (Generates new 24h temporary PIN) ---")
    resend_res = client.post(f'/api/members/{member_id}/send_card_email', json={"operator": "Bureau"})
    assert resend_res.status_code == 200
    m_updated = Member.query.get(member_id)
    assert m_updated.must_change_pin is True
    print("✓ Card resent: Generated new temporary initial code (must_change_pin=True)")

    print("\n==============================================")
    print("ALL 24H TEMPORARY INITIAL PIN TESTS PASSED 100%!")
    print("==============================================")

if __name__ == '__main__':
    with app.app_context():
        test_temporary_pin_flow()
