import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Member
from services.qr_service import generate_pin, generate_qr_code
from services.email_service import send_email_notification, log_action

auth_bp = Blueprint('auth', __name__)

def generate_member_number():
    from datetime import datetime
    year = datetime.now().year
    max_id = db.session.query(db.func.max(Member.id)).scalar() or 0
    count = Member.query.count()
    next_num = max(max_id, count) + 1
    
    while True:
        candidate = f"CT-{year}-{next_num:04d}"
        if not Member.query.filter_by(member_number=candidate).first():
            return candidate
        next_num += 1

from datetime import datetime, timedelta

@auth_bp.route('/api/register', methods=['POST'])
def register():
    """Register a member automatically with a 24h temporary initial PIN."""
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    major = request.form.get('major')
    level = request.form.get('level')
    email = request.form.get('email')
    phone = request.form.get('phone')
    
    if not all([first_name, last_name, major, level, email, phone]):
        return jsonify({'error': 'Tous les champs sont requis.'}), 400
        
    if Member.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà enregistré.'}), 400

    photo_file = request.files.get('photo')
    photo_rel_path = None
    if photo_file:
        file_ext = os.path.splitext(photo_file.filename)[1]
        temp_filename = f"{email.replace('@', '_').replace('.', '_')}{file_ext}"
        filepath = os.path.join(current_app.config['PHOTO_FOLDER'], temp_filename)
        photo_file.save(filepath)
        photo_rel_path = f"uploads/photos/{temp_filename}"

    pin_code = generate_pin()
    member_no = generate_member_number()
    qr_rel_path = generate_qr_code(member_no)
    expires_at = datetime.utcnow() + timedelta(hours=24)

    new_member = Member(
        member_number=member_no,
        pin=generate_password_hash(pin_code),
        last_name=last_name,
        first_name=first_name,
        major=major,
        level=level,
        email=email,
        phone=phone,
        photo_path=photo_rel_path,
        qr_code_path=qr_rel_path,
        is_bureau=False,
        must_change_pin=True,
        pin_expires_at=expires_at
    )
    
    try:
        db.session.add(new_member)
        db.session.commit()
        
        send_email_notification(
            new_member,
            pin_code,
            subject_override="Bienvenue à C-TECH — Votre Code de Départ (Valable 24h)",
            greeting_override="Votre inscription à C-TECH a été validée avec succès !",
            action_label="Ce code de départ est valable 24h. Lors de votre première connexion, le système vous demandera de choisir votre code PIN personnel définitif.",
            extra_note="Veuillez utiliser ce code de départ dans les 24 heures pour vous connecter et créer votre PIN personnel."
        )
        log_action("Système", f"Inscription automatique du membre {first_name} {last_name} ({member_no})")
        
        return jsonify({
            'message': 'Inscription réussie',
            'member': new_member.to_dict(),
            'pin': pin_code
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Login via Member Number + PIN."""
    data = request.json or {}
    member_number = str(data.get('member_number') or '').strip()
    pin = str(data.get('pin') or '').strip()
    
    if not member_number:
        return jsonify({'error': 'Numéro de membre requis.'}), 400
    if not pin:
        return jsonify({'error': 'Code PIN requis.'}), 400

    member = Member.query.filter(Member.member_number.ilike(member_number)).first()
    if not member:
        return jsonify({'error': 'Membre introuvable.'}), 404

    if not check_password_hash(member.pin, pin):
        return jsonify({'error': 'Code PIN incorrect.'}), 401

    # Check 24h expiration if using a temporary code de départ
    if member.must_change_pin and member.pin_expires_at:
        if datetime.utcnow() > member.pin_expires_at:
            return jsonify({
                'error': 'Ce code de départ temporaire a expiré (valable 24h). Veuillez réinitialiser votre code PIN via la fonction "Code PIN oublié ?".'
            }), 401
        
    return jsonify({
        'message': 'Connexion réussie',
        'member': member.to_dict()
    }), 200

@auth_bp.route('/api/forgot_pin', methods=['POST'])
def forgot_pin():
    """Forgot PIN endpoint: generates a new temporary initial PIN valid 24h."""
    data = request.json or {}
    identifier = (data.get('email') or data.get('member_number') or '').strip()
    
    if not identifier:
        return jsonify({'error': 'Veuillez saisir votre adresse email ou votre numéro de membre.'}), 400

    member = Member.query.filter(
        (Member.email.ilike(identifier)) | (Member.member_number.ilike(identifier))
    ).first()

    if not member:
        return jsonify({'error': 'Aucun membre correspondant trouvé.'}), 404

    new_pin = generate_pin()
    member.pin = generate_password_hash(new_pin)
    member.must_change_pin = True
    member.pin_expires_at = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()

    send_email_notification(
        member,
        new_pin,
        subject_override="Nouveau Code de Départ — C-TECH (Valable 24h)",
        greeting_override="Vous avez demandé la réinitialisation de votre code PIN de connexion à C-TECH.",
        action_label="Un nouveau code de départ temporaire valable 24h vous a été attribué.",
        extra_note="Connectez-vous avec ce code dans les 24 heures pour définir votre nouveau code PIN personnel.",
        attach_card_pdf=False
    )

    log_action("Système / Auto-Service", f"Nouveau code de départ généré pour {member.first_name} {member.last_name} ({member.member_number})")
    
    mock_note = " (mode simulation — vérifiez logs/sent_emails.log)" if current_app.config.get('MOCK_EMAIL') else ""
    return jsonify({
        'message': f'Un nouveau code de départ (valable 24h) a été généré et envoyé à l\'adresse {member.email}{mock_note}.'
    }), 200

@auth_bp.route('/api/members/<int:member_id>/change_pin', methods=['POST'])
def change_member_pin(member_id):
    """Change PIN password and convert temporary PIN to permanent personal PIN."""
    member = Member.query.get_or_404(member_id)
    data = request.json or {}
    current_pin = str(data.get('current_pin', '')).strip()
    new_pin = str(data.get('new_pin', '')).strip()
    operator = data.get('operator', f"{member.first_name} {member.last_name}")

    if not current_pin or not new_pin:
        return jsonify({'error': 'Veuillez remplir le code PIN actuel et le nouveau code PIN.'}), 400

    if not check_password_hash(member.pin, current_pin):
        return jsonify({'error': 'Le code PIN actuel (ou code de départ) saisi est incorrect.'}), 401

    if len(new_pin) < 4:
        return jsonify({'error': 'Le nouveau code PIN doit comporter au moins 4 caractères.'}), 400

    member.pin = generate_password_hash(new_pin)
    member.must_change_pin = False
    member.pin_expires_at = None
    db.session.commit()

    log_action(operator, f"Modification du code PIN personnel pour {member.first_name} {member.last_name} ({member.member_number}).")
    return jsonify({
        'message': 'Code PIN personnel enregistré avec succès !',
        'member': member.to_dict()
    }), 200
