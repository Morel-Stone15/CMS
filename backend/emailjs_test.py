import sys
sys.path.insert(0, '.')

import json, urllib.request

SERVICE_ID = 'service_vrdh2w8'
TEMPLATE_ID = 'template_pp54ted'
PUBLIC_KEY = 'swccw7PktiWD4AcAL'
PRIVATE_KEY = 'VH25MFqpt5533FBKMi1PC'

# Simulate the new payload sent by email_service.py
message_block = (
    f"Bonjour Morel Stone,\n\n"
    f"Votre inscription à C-TECH a été validée avec succès !\n\n"
    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    f"  NUMÉRO DE MEMBRE : CT-2026-0014\n"
    f"  CODE PIN          : 123456\n"
    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    f"Connectez-vous sur http://localhost:3000\n\n"
    f"Cordialement,\nLe Bureau de C-TECH"
)

payload_simple = {
    "service_id": SERVICE_ID,
    "template_id": TEMPLATE_ID,
    "user_id": PUBLIC_KEY,
    "accessToken": PRIVATE_KEY,
    "template_params": {
        "to_name": "Morel Stone",
        "to_email": "morelstone@outlook.com",
        "member_number": "CT-2026-0014",
        "pin_code": "123456",
        "subject": "Test C-TECH Plain Text",
        "message": message_block,
        "from_name": "C-TECH Club"
    }
}

print("Sending test email via EmailJS (new payload)...")
print("Payload:", json.dumps(payload_simple, indent=2, ensure_ascii=False))

req = urllib.request.Request(
    "https://api.emailjs.com/api/v1.0/email/send",
    data=json.dumps(payload_simple).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'http://localhost:3000'
    }
)

try:
    res = urllib.request.urlopen(req)
    print(f"\nHTTP Status: {res.status}")
    print(f"Response: {res.read().decode()}")
    print("\nSUCCES - Email envoyé!")
except urllib.error.HTTPError as e:
    print(f"\nHTTP Error: {e.code}")
    body = e.read().decode()
    print(f"Error Body: {body}")
except Exception as e:
    print(f"\nException: {e}")
