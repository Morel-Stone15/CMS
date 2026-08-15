import os
from datetime import datetime
from flask import current_app
from models import db, ActionLog
from services.pdf_service import generate_card_pdf

def log_action(operator_name, description):
    """Helper to record board and system logs."""
    log = ActionLog(operator_name=operator_name, action_description=description, timestamp=datetime.utcnow())
    db.session.add(log)
    db.session.commit()


def _build_html_email(member, pin, greeting_override=None, action_label=None, extra_note=None, png_base64=None):
    """Build a clean, high-end HTML email body featuring the C-TECH Virtual ID Card."""
    greeting = greeting_override or f"Votre inscription à C-TECH a été validée avec succès !"
    action = action_label or "Votre carte virtuelle officielle a été générée et est disponible ci-dessous."
    note = extra_note or "Conservez précieusement vos identifiants pour vous connecter à votre Espace Membre."
    
    from flask import current_app
    backend_url = current_app.config.get('BACKEND_URL', 'http://localhost:5000').rstrip('/')
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

    show_pin_block = bool(pin)

    pin_html = ""
    if show_pin_block:
        pin_html = f"""
        <div style="background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.25); border-radius: 10px; padding: 14px 18px; margin-top: 16px;">
          <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Code de Départ (Valable 24h)</div>
          <div style="font-family: 'Courier New', monospace; font-size: 26px; font-weight: 900; letter-spacing: 8px; color: #00d4ff; margin-top: 4px;">{pin}</div>
        </div>
        """

    pdf_download_url = f"{backend_url}/api/members/{member.id}/card_pdf"
    
    # Use PNG image if available, otherwise just use text
    card_visual = ""
    if png_base64:
        card_visual = f'<img src="data:image/png;base64,{png_base64}" alt="Carte Virtuelle" style="width:100%; max-width:400px; height:auto; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.5); display:block; margin: 0 auto 24px auto;" />'
    else:
        card_visual = f'<div style="color:#00d4ff; font-weight:bold; font-size:18px; margin-bottom:24px;">Carte Virtuelle - {member.member_number}</div>'

    return f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>C-TECH — Carte de Membre</title></head>
<body style="margin:0;padding:0;background:#060b17;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060b17;padding:30px 15px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;border-radius:20px;overflow:hidden;border:1px solid #1e3a5f;box-shadow:0 20px 50px rgba(0,212,255,0.15);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:24px;text-align:center;">
            <img src="{backend_url}/uploads/logo.png" alt="C-TECH Logo" style="height:60px;width:auto;margin-bottom:8px;display:inline-block;" />
            <div style="font-size:32px;font-weight:900;letter-spacing:4px;color:#00d4ff;font-family:'Segoe UI',sans-serif;">C-TECH</div>
            <div style="font-size:11px;letter-spacing:3px;color:#94a3b8;text-transform:uppercase;margin-top:4px;">CLUB TECHNOLOGIQUE ÉTUDIANT</div>
          </td>
        </tr>

        <!-- MAIN BODY -->
        <tr>
          <td style="background:#0f172a;padding:28px 24px;">
            <p style="color:#f8fafc;font-size:16px;margin:0 0 6px;">Bonjour <strong style="color:#fff;">{member.first_name} {member.last_name}</strong>,</p>
            <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6;">{greeting}</p>

            <!-- 🎴 VIRTUAL CARD CONTAINER -->
            {card_visual}
            
            <!-- PIN CODE BLOCK -->
            {pin_html}

            <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:24px 0 24px;">
              {action}<br/>
              <em style="color:#64748b;font-size:12px;">{note}</em>
            </p>

            <!-- ACTION BUTTONS -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:12px;">
                  <a href="{pdf_download_url}" style="display:inline-block;background:linear-gradient(135deg,#0284c7,#00d4ff);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:13px;letter-spacing:0.5px;">
                    📥 Télécharger la Carte PDF Officielle
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:12px;">
                  <a href="{backend_url}/api/members/{member.id}/card_png" style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid #1e3a5f;color:#00d4ff;text-decoration:none;padding:10px 24px;border-radius:10px;font-weight:600;font-size:13px;">
                    🖼️ Voir la Carte en format Image (PNG)
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <a href="{frontend_url}" style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid #1e3a5f;color:#e2e8f0;text-decoration:none;padding:10px 24px;border-radius:10px;font-weight:600;font-size:13px;">
                    💻 Se connecter à l'Espace Membre →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#070d1a;padding:18px 24px;text-align:center;border-top:1px solid #1e293b;">
            <p style="color:#475569;font-size:12px;margin:0;">
              © {datetime.now().year} C-TECH — Club Technologique Étudiant.<br/>
              Cet email inclut votre carte officielle et vos identifiants d'accès.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_email_notification(member, pin, subject_override=None, body_override=None,
                             attach_card_pdf=True, greeting_override=None,
                             action_label=None, extra_note=None):
    """Send real email via EmailJS or SMTP. Falls back to local log if unconfigured."""
    subject = subject_override or "Bienvenue à C-TECH — Votre Carte Virtuelle"

    log_folder = os.path.join(current_app.config['BASE_DIR'], 'logs')
    os.makedirs(log_folder, exist_ok=True)
    email_log_file = os.path.join(log_folder, 'sent_emails.log')

    pdf_buf = None
    pdf_base64 = ""
    pdf_data_uri = ""
    png_base64 = ""
    pdf_filename = f"Carte_C-TECH_{member.member_number}.pdf"
    try:
        pdf_buf = generate_card_pdf(member)
        pdf_local_path = os.path.join(log_folder, pdf_filename)
        pdf_bytes = pdf_buf.read()
        with open(pdf_local_path, 'wb') as pf:
            pf.write(pdf_bytes)
        pdf_buf.seek(0)
        import base64
        import fitz # PyMuPDF
        
        # Convert PDF to PNG
        doc = fitz.open("pdf", pdf_bytes)
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        png_bytes = pix.tobytes("png")
        png_base64 = base64.b64encode(png_bytes).decode('utf-8')

        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        pdf_data_uri = f"data:application/pdf;base64,{pdf_base64}"
    except Exception as pdf_err:
        print(f"PDF/PNG generation warning: {pdf_err}")
        pdf_buf = None

    # Build HTML body (or use the plain text override for log fallback)
    html_body = _build_html_email(member, pin, greeting_override, action_label, extra_note, png_base64)

    # Plain-text fallback for SMTP / logs
    plain_body = body_override or (
        f"Bonjour {member.first_name} {member.last_name},\n\n"
        f"Votre inscription à C-TECH a été validée avec succès !\n\n"
        f"Numéro de Membre : {member.member_number}\n"
        + (f"Code PIN : {pin}\n" if pin else "")
        + "\nCordialement,\nLe Bureau de C-TECH"
    )

    # ── EmailJS API (preferred) ──────────────────────────────────────────────
    emailjs_service = current_app.config.get('EMAILJS_SERVICE_ID')
    emailjs_template = current_app.config.get('EMAILJS_TEMPLATE_ID')
    emailjs_user = current_app.config.get('EMAILJS_PUBLIC_KEY')
    emailjs_secret = current_app.config.get('EMAILJS_PRIVATE_KEY')

    if emailjs_service and emailjs_template and emailjs_user:
        import urllib.request
        import json

        # Build a clean, pre-formatted message block that will display correctly
        # regardless of how the EmailJS template body is configured
        message_block = (
            f"Bonjour {member.first_name} {member.last_name},\n\n"
            f"Votre inscription à C-TECH a été validée avec succès !\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"  NUMÉRO DE MEMBRE       : {member.member_number}\n"
            + (f"  CODE DE DÉPART (24H)   : {pin}\n" if pin else "")
            + f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"Ce code de départ est valable pendant 24 heures.\n"
            f"Lors de votre première connexion, il vous sera demandé de définir votre code PIN personnel.\n\n"
            f"Connectez-vous sur http://localhost:3000\n\n"
            f"Cordialement,\nLe Bureau de C-TECH"
        )

        payload = {
            "service_id": emailjs_service,
            "template_id": emailjs_template,
            "user_id": emailjs_user,
            "template_params": {
                "to_name":       f"{member.first_name} {member.last_name}",
                "to_email":      member.email,
                "subject":       subject,
                "member_number": member.member_number,
                "pin_code":      pin or "",
                "message":       message_block,    # plain-text body, always visible
                "html_message":  html_body,        # HTML body with virtual card
                "pdf_url":       f"http://localhost:5000/api/members/{member.id}/card_pdf", # Direct PDF download link
                "png_url":       f"http://localhost:5000/api/members/{member.id}/card_png", # Direct PNG download link
                "from_name":     "C-TECH Club",
            }
        }
        if emailjs_secret:
            payload["accessToken"] = emailjs_secret

        try:
            req = urllib.request.Request(
                "https://api.emailjs.com/api/v1.0/email/send",
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Origin': 'http://localhost:3000'
                }
            )
            res = urllib.request.urlopen(req, timeout=10)
            if res.status == 200:
                print(f"[EmailJS] ✓ Email envoyé avec succès à {member.email}")
                return True
        except Exception as e:
            print(f"[EmailJS FIRST TRY FAIL] {e}. Re-tentative...")
            try:
                import time
                time.sleep(1)
                res = urllib.request.urlopen(req, timeout=10)
                if res.status == 200:
                    print(f"[EmailJS] ✓ Email envoyé avec succès à {member.email} (ré-essai)")
                    return True
            except Exception as retry_err:
                print(f"[EmailJS RETRY ERROR] {retry_err}")
                with open(email_log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[EmailJS FAIL] To: {member.email} | Erreur: {retry_err}\n")

    # ── SMTP direct ──────────────────────────────────────────────────────────
    if current_app.config.get('SMTP_USER') and not current_app.config.get('MOCK_EMAIL', True):
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.application import MIMEApplication

        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = current_app.config['SMTP_FROM']
            msg['To'] = member.email
            msg['Subject'] = subject
            msg.attach(MIMEText(plain_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))

            if pdf_buf and attach_card_pdf:
                pdf_data = pdf_buf.read()
                attachment = MIMEApplication(pdf_data, _subtype='pdf')
                attachment.add_header('Content-Disposition', 'attachment', filename=pdf_filename)
                msg.attach(attachment)

            server = smtplib.SMTP(current_app.config['SMTP_SERVER'], current_app.config['SMTP_PORT'])
            server.starttls()
            server.login(current_app.config['SMTP_USER'], current_app.config['SMTP_PASS'])
            server.sendmail(current_app.config['SMTP_FROM'], member.email, msg.as_string())
            server.quit()
            print(f"[SMTP] ✓ Email envoyé à {member.email}")
            return True
        except Exception as e:
            print(f"[SMTP ERROR] {e}")
            with open(email_log_file, 'a', encoding='utf-8') as f:
                f.write(f"[SMTP FAIL] To: {member.email} | Erreur: {e}\n")

    # ── Local log fallback (simulation / journal de secours) ─────────────────
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(email_log_file, 'a', encoding='utf-8') as f:
        f.write(f"=== EMAIL LE {timestamp} ===\n")
        f.write(f"À: {member.email}\n")
        f.write(f"Objet: {subject}\n")
        f.write(plain_body + "\n")
        pdf_note = f"logs/{pdf_filename}" if pdf_buf else "(PDF non disponible)"
        f.write(f"Pièce jointe PDF: {pdf_note}\n")
        f.write("=" * 40 + "\n\n")
    print(f"[MOCK/LOG] Email journalisé pour {member.email}")
    return True
