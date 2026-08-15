import urllib.request
import json
import base64
import os
import sys

# Test different ways to pass attachment to EmailJS API

SERVICE_ID = 'service_vrdh2w8'
TEMPLATE_ID = 'template_pp54ted'
PUBLIC_KEY = 'swccw7PktiWD4AcAL'
PRIVATE_KEY = 'VH25MFqpt5533FBKMi1PC'

# Generate a small valid PDF using reportlab or minimal PDF bytes
pdf_minimal = (
    b"%PDF-1.4\n"
    b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
    b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
    b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 150] /Contents 4 0 R >> endobj\n"
    b"4 0 obj << /Length 50 >> stream\n"
    b"BT /Helvetica 16 Tf 20 100 Td (Carte C-TECH PDF) Tj ET\n"
    b"endstream endobj\n"
    b"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000216 00000 n\n"
    b"trailer << /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF"
)

b64_pdf = base64.b64encode(pdf_minimal).decode('utf-8')
data_uri = f"data:application/pdf;base64,{b64_pdf}"

def test_payload(name, extra_params):
    payload = {
        "service_id": SERVICE_ID,
        "template_id": TEMPLATE_ID,
        "user_id": PUBLIC_KEY,
        "accessToken": PRIVATE_KEY,
        "template_params": {
            "to_name": "Morel Stone",
            "to_email": "morelstone@outlook.com",
            "member_number": "CT-2026-0014",
            "pin_code": "123456",
            "subject": f"Test Attachment {name}",
            "message": "Voici votre carte virtuelle en PDF.",
            **extra_params
        }
    }
    
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
        res = urllib.request.urlopen(req, timeout=10)
        print(f"[{name}] Status: {res.status}, Response: {res.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"[{name}] HTTP Error {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"[{name}] Error: {e}")

print("--- Testing EmailJS Attachment Formats ---")
test_payload("base64_data_uri", {"card_pdf": data_uri})
test_payload("base64_raw", {"card_pdf_raw": b64_pdf})
