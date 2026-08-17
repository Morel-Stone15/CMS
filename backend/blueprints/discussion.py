import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from models import db, Member, InternalDiscussion
from services.email_service import send_email_notification, log_action

discussion_bp = Blueprint('discussion', __name__)

ALLOWED_EXTENSIONS = {
    'photo': {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'},
    'video': {'mp4', 'webm', 'mov', 'avi', 'mkv'},
    'document': {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar'},
    'voice': {'webm', 'ogg', 'mp3', 'wav', 'm4a'}
}

def detect_attachment_type(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    for atype, exts in ALLOWED_EXTENSIONS.items():
        if ext in exts:
            return atype
    return 'document'

@discussion_bp.route('/api/discussion', methods=['GET'])
def get_discussion():
    messages = InternalDiscussion.query.order_by(InternalDiscussion.sent_at.asc()).all()
    return jsonify([m.to_dict() for m in messages]), 200

@discussion_bp.route('/api/discussion', methods=['POST'])
def post_discussion_message():
    if request.content_type and 'multipart/form-data' in request.content_type:
        member_id = request.form.get('member_id')
        message = request.form.get('message', '').strip()
        attachment_type_hint = request.form.get('attachment_type', '')
        file = request.files.get('file')
    else:
        data = request.json or {}
        member_id = data.get('member_id')
        message = (data.get('message') or '').strip()
        file = None
        attachment_type_hint = ''

    if not member_id:
        return jsonify({'error': 'member_id requis.'}), 400
    if not message and not file:
        return jsonify({'error': 'Message ou pièce jointe requis.'}), 400

    attachment_path = None
    attachment_type = None
    attachment_name = None

    if file and file.filename:
        attachment_name = file.filename
        if attachment_type_hint == 'voice':
            attachment_type = 'voice'
        else:
            attachment_type = detect_attachment_type(file.filename)
        
        chat_media_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'chat_media')
        os.makedirs(chat_media_folder, exist_ok=True)

        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'bin'
        safe_name = f"{uuid.uuid4().hex}.{ext}"
        save_path = os.path.join(chat_media_folder, safe_name)
        file.save(save_path)
        attachment_path = f"uploads/chat_media/{safe_name}"

    try:
        new_msg = InternalDiscussion(
            member_id=int(member_id),
            message=message or None,
            attachment_path=attachment_path,
            attachment_type=attachment_type,
            attachment_name=attachment_name
        )
        db.session.add(new_msg)
        db.session.commit()
        return jsonify(new_msg.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors du post de la discussion: {str(e)}'}), 500

@discussion_bp.route('/api/discussion/<int:msg_id>', methods=['DELETE'])
def delete_discussion_message(msg_id):
    msg = InternalDiscussion.query.get_or_404(msg_id)
    if msg.attachment_path:
        abs_path = os.path.join(current_app.config['BASE_DIR'], msg.attachment_path)
        if os.path.exists(abs_path):
            os.remove(abs_path)
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'message': 'Message supprimé.'}), 200

@discussion_bp.route('/api/send_mass_email', methods=['POST'])
def send_mass_email():
    data = request.json or {}
    subject = data.get('subject')
    body = data.get('body')
    major_filter = data.get('major')
    level_filter = data.get('level')
    operator = data.get('operator', 'Bureau')
    
    if not subject or not body:
        return jsonify({'error': 'Sujet et contenu requis.'}), 400
        
    query = Member.query
    if major_filter:
        query = query.filter_by(major=major_filter)
    if level_filter:
        query = query.filter_by(level=level_filter)
        
    targets = query.all()
    count = 0
    
    for member in targets:
        if member.member_number == "CT-ADMIN" and not (major_filter or level_filter):
            continue
        success = send_email_notification(member, None, subject_override=subject, body_override=body)
        if success:
            count += 1
            
    log_action(operator, f"Envoi d'un email groupé à {count} membres. Filtres: filière={major_filter}, niveau={level_filter}")
    return jsonify({'message': f'Email groupé envoyé à {count} membres.'}), 200
