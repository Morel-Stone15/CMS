import json, urllib.request, urllib.error

PUBLIC_KEY = 'swccw7PktiWD4AcAL'
PRIVATE_KEY = 'VH25MFqpt5533FBKMi1PC'
TEMPLATE_ID = 'template_pp54ted'

HTML_BODY = """<div style="background:#0a0f1e;padding:30px;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:0 auto;background:#0f172a;border-radius:12px;border:1px solid #1e3a5f;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:24px;text-align:center;">
      <div style="font-size:32px;font-weight:900;letter-spacing:4px;color:#00d4ff;">C-TECH</div>
      <div style="font-size:11px;color:#64748b;letter-spacing:2px;">CLUB TECHNOLOGIQUE ETUDIANT</div>
    </div>
    <div style="padding:24px;">
      <p style="color:#e2e8f0;font-size:15px;">Bonjour <strong>{{to_name}}</strong>,</p>
      <p style="color:#94a3b8;font-size:13px;">Votre inscription a C-TECH a ete validee avec succes !</p>
      <div style="background:#0a0f1e;border:1px solid #1e3a5f;border-radius:10px;margin:20px 0;">
        <div style="padding:14px 20px;border-bottom:1px solid #1e293b;">
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Numero de Membre</div>
          <div style="font-family:monospace;font-size:20px;font-weight:700;color:#00d4ff;">{{member_number}}</div>
        </div>
        <div style="padding:14px 20px;">
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Code PIN</div>
          <div style="font-family:monospace;font-size:32px;font-weight:900;letter-spacing:8px;color:#ffffff;">{{pin_code}}</div>
        </div>
      </div>
      <p style="color:#475569;font-size:12px;">Conservez ce code PIN - il vous permettra de vous connecter a votre espace membre.</p>
    </div>
    <div style="background:#070d1a;padding:14px;text-align:center;border-top:1px solid #1e293b;">
      <p style="color:#334155;font-size:11px;margin:0;">C-TECH - Email automatique, ne pas repondre.</p>
    </div>
  </div>
</div>"""

payload = {
    "template": {
        "name": "CTECH Bienvenue",
        "subject": "{{subject}}",
        "to": "{{to_email}}",
        "body": HTML_BODY,
        "from": {
            "name": "C-TECH Club",
            "email": ""
        },
        "reply_to": ""
    }
}

print("Trying to update template via EmailJS API...")

req = urllib.request.Request(
    f"https://api.emailjs.com/api/v1.0/templates/{TEMPLATE_ID}",
    data=json.dumps(payload).encode('utf-8'),
    method='PUT',
    headers={
        'Content-Type': 'application/json',
        'user_id': PUBLIC_KEY,
        'accessToken': PRIVATE_KEY,
        'User-Agent': 'Mozilla/5.0'
    }
)

try:
    res = urllib.request.urlopen(req)
    print(f"Status: {res.status}")
    print(f"Response: {res.read().decode()}")
    print("\nTemplate mis a jour avec succes!")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Response: {e.read().decode()}")
    print("\nL'API de gestion EmailJS n'est pas disponible avec ces cles.")
    print("Il faut configurer via le dashboard ou via une autre methode.")
except Exception as e:
    print(f"Erreur: {e}")
