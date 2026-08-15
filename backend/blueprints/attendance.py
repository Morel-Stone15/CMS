from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Member, Attendance
from services.email_service import log_action

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/api/attendance', methods=['GET'])
def get_attendance():
    member_id = request.args.get('member_id')
    if member_id:
        records = Attendance.query.filter_by(member_id=member_id).order_by(Attendance.scanned_at.desc()).all()
    else:
        records = Attendance.query.order_by(Attendance.scanned_at.desc()).all()
        
    return jsonify([r.to_dict() for r in records]), 200

@attendance_bp.route('/api/attendance/scan', methods=['POST'])
def scan_attendance():
    data = request.json or {}
    member_number = data.get('member_number')
    event_id = data.get('event_id')
    event_name = data.get('event_name', 'Réunion Club')
    operator = data.get('operator', 'Scanner Bureau')
    
    if not member_number:
        return jsonify({'error': 'Code QR vide ou incorrect.'}), 400
        
    member = Member.query.filter_by(member_number=member_number).first()
    if not member:
        return jsonify({'error': f"Membre avec le numéro {member_number} introuvable."}), 404
        
    recent = Attendance.query.filter_by(member_id=member.id, event_name=event_name).order_by(Attendance.scanned_at.desc()).first()
    if recent:
        delta = (datetime.utcnow() - recent.scanned_at).total_seconds()
        if delta < 600:
            return jsonify({
                'message': f'Présence déjà enregistrée pour {member.first_name} {member.last_name}',
                'member': member.to_dict(),
                'duplicate': True
            }), 200

    new_att = Attendance(
        member_id=member.id,
        event_id=event_id,
        event_name=event_name,
        scanned_at=datetime.utcnow()
    )
    db.session.add(new_att)
    db.session.commit()
    
    log_action(operator, f"Présence enregistrée pour {member.first_name} {member.last_name} ({member.member_number}) à l'événement: {event_name}")
    
    return jsonify({
        'message': f'Présence enregistrée avec succès pour {member.first_name} {member.last_name}',
        'member': member.to_dict()
    }), 200
