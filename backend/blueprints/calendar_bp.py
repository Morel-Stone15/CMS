from flask import Blueprint, request, jsonify
from models import db, CalendarEvent
from services.email_service import log_action

calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.route('/api/calendar', methods=['GET'])
def get_calendar():
    events = CalendarEvent.query.order_by(CalendarEvent.start_date.asc()).all()
    return jsonify([e.to_dict() for e in events]), 200

@calendar_bp.route('/api/calendar', methods=['POST'])
def add_calendar_event():
    data = request.json or {}
    title = data.get('title')
    description = data.get('description', '')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    operator = data.get('operator', 'Bureau')
    
    if not title or not start_date or not end_date:
        return jsonify({'error': 'Champs obligatoires manquants.'}), 400
        
    event = CalendarEvent(title=title, description=description, start_date=start_date, end_date=end_date)
    db.session.add(event)
    db.session.commit()
    
    log_action(operator, f"Ajout de l'événement '{title}' au calendrier.")
    return jsonify(event.to_dict()), 201

@calendar_bp.route('/api/calendar/<int:event_id>', methods=['DELETE'])
def delete_calendar_event(event_id):
    event = CalendarEvent.query.get_or_404(event_id)
    operator = request.args.get('operator', 'Bureau')
    
    db.session.delete(event)
    db.session.commit()
    log_action(operator, f"Suppression de l'événement '{event.title}' du calendrier.")
    return jsonify({'message': 'Événement supprimé'}), 200
