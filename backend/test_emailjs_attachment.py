import urllib.request
import json
import base64
import os
import sys

SERVICE_ID = 'service_vrdh2w8'
TEMPLATE_ID = 'template_pp54ted'
PUBLIC_KEY = 'swccw7PktiWD4AcAL'
PRIVATE_KEY = 'VH25MFqpt5533FBKMi1PC'

# Generate a small sample PDF base64
sample_pdf_bytes = b"%PDF-1.4 % 1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj 2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj 3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >> endobj 4 0 obj << /Length 55 >> stream\nBT /F1 18 Tf 20 80 Td (Carte C-TECH - Morel Stone) Tj ET\nendstream endobj xref 0 5 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n 0000000216 00000 n trailer << /Size 5 /Root 1 0 R >> startxref 321 %%EOF"
pdf_b64 = base64.b64encode(sample_pdf_bytes).decode('utf-8')
data_url = f"data:application/pdf;base64,{pdf_b64}"

# Test 1: passing base64 in template_params
payload1 = {
    "service_id": SERVICE_ID,
    "template_id": TEMPLATE_ID,
    "user_id": PUBLIC_KEY,
    "accessToken": PRIVATE_KEY,
    "template_params": {
        "to_name": "Morel Stone",
        "to_email": "morelstone@outlook.com",
        "member_number": "CT-2026-0014",
        "pin_code": "123456",
        "subject": "Test PDF Attachment EmailJS",
        "message": "Voici votre carte virtuelle en pièce jointe.",
        "content_pdf": data_url
    }
}

print("Testing EmailJS with PDF base64 param...")
req = urllib.request.Request(
    "https://api.emailjs.com/api/v1.0/email/send",
    data=json.dumps(payload1).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'http://localhost:3000'
    }
)

try:
    res = urllib.request.urlopen(req, timeout=10)
    print("Test 1 Status:", res.status)
    print("Test 1 Response:", res.read().decode())
except urllib.error.HTTPError as e:
    print("Test 1 HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Test 1 Error:", e)
