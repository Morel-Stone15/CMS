import urllib.request
import json

SERVICE_ID = 'service_vrdh2w8'
TEMPLATE_ID = 'template_pp54ted'
PUBLIC_KEY = 'swccw7PktiWD4AcAL'
PRIVATE_KEY = 'VH25MFqpt5533FBKMi1PC'

# Test with large HTML message
from services.email_service import _build_html_email
from models import Member

m = Member(
    member_number="CT-2026-0002",
    first_name="Morel",
    last_name="Stone",
    email="theodulemorelyedidia@gmail.com",
    major="Génie Informatique",
    level="2ème année",
    status="actif"
)

html_body = _build_html_email(m, "123456")

payload_with_html = {
    "service_id": SERVICE_ID,
    "template_id": TEMPLATE_ID,
    "user_id": PUBLIC_KEY,
    "accessToken": PRIVATE_KEY,
    "template_params": {
        "to_name": f"{m.first_name} {m.last_name}",
        "to_email": m.email,
        "subject": "Test avec HTML",
        "member_number": m.member_number,
        "pin_code": "123456",
        "message": f"Bonjour {m.first_name},\nVotre code de départ : 123456\nN° Membre : {m.member_number}",
        "html_message": html_body
    }
}

print(f"Payload size with HTML: {len(json.dumps(payload_with_html))} bytes")

req = urllib.request.Request(
    "https://api.emailjs.com/api/v1.0/email/send",
    data=json.dumps(payload_with_html).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'http://localhost:3000'
    }
)

try:
    res = urllib.request.urlopen(req, timeout=10)
    print("HTML Payload Status:", res.status)
    print("Response:", res.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Error with HTML payload:", type(e), e)

# Test WITHOUT large HTML message (plain variables only)
payload_plain = {
    "service_id": SERVICE_ID,
    "template_id": TEMPLATE_ID,
    "user_id": PUBLIC_KEY,
    "accessToken": PRIVATE_KEY,
    "template_params": {
        "to_name": f"{m.first_name} {m.last_name}",
        "to_email": m.email,
        "subject": "Test Sans HTML (Variables simples)",
        "member_number": m.member_number,
        "pin_code": "123456",
        "message": f"Bonjour {m.first_name} {m.last_name},\n\nVotre inscription à C-TECH a été validée avec succès !\n\nNuméro de membre : {m.member_number}\nCode de départ (24h) : 123456\n\nConnectez-vous sur http://localhost:3000",
        "from_name": "C-TECH Club"
    }
}

print(f"\nPayload size plain: {len(json.dumps(payload_plain))} bytes")

req2 = urllib.request.Request(
    "https://api.emailjs.com/api/v1.0/email/send",
    data=json.dumps(payload_plain).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'http://localhost:3000'
    }
)

try:
    res2 = urllib.request.urlopen(req2, timeout=10)
    print("Plain Payload Status:", res2.status)
    print("Response:", res2.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Error plain payload:", type(e), e)
