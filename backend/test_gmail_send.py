import urllib.request
import json

SERVICE_ID = 'service_vrdh2w8'
TEMPLATE_ID = 'template_pp54ted'
PUBLIC_KEY = 'swccw7PktiWD4AcAL'
PRIVATE_KEY = 'VH25MFqpt5533FBKMi1PC'

payload = {
    "service_id": SERVICE_ID,
    "template_id": TEMPLATE_ID,
    "user_id": PUBLIC_KEY,
    "accessToken": PRIVATE_KEY,
    "template_params": {
        "to_name": "Theodule Morel",
        "to_email": "theodulemorelyedidia@gmail.com",
        "member_number": "CT-2026-0002",
        "pin_code": "654321",
        "subject": "Test C-TECH EmailJS",
        "message": "Bonjour,\nCeci est un test d'envoi vers gmail.",
        "from_name": "C-TECH Club"
    }
}

print("Testing send to theodulemorelyedidia@gmail.com...")
req = urllib.request.Request(
    "https://api.emailjs.com/api/v1.0/email/send",
    data=json.dumps(payload).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'http://localhost:3000'
    }
)

try:
    res = urllib.request.urlopen(req, timeout=15)
    print("Status:", res.status)
    print("Response:", res.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Error:", type(e), e)
