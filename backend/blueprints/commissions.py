from flask import Blueprint, request, jsonify
from models import db, Member, Commission, CommissionMember
from services.email_service import log_action

commissions_bp = Blueprint('commissions', __name__)

@commissions_bp.route('/api/commissions', methods=['GET'])
def get_commissions():
    comms = Commission.query.all()
    return jsonify([c.to_dict() for c in comms]), 200

@commissions_bp.route('/api/commissions', methods=['POST'])
def create_commission():
    data = request.json or {}
    name = data.get('name')
    description = data.get('description', '')
    operator = data.get('operator', 'Bureau')
    
    if not name:
        return jsonify({'error': 'Nom de la commission requis'}), 400
        
    if Commission.query.filter_by(name=name).first():
        return jsonify({'error': 'Ce nom de commission existe déjà.'}), 400
        
    comm = Commission(name=name, description=description)
    db.session.add(comm)
    db.session.commit()
    
    log_action(operator, f"Création de la commission: {name}")
    return jsonify(comm.to_dict()), 201

@commissions_bp.route('/api/commissions/<int:comm_id>', methods=['DELETE'])
def delete_commission(comm_id):
    comm = Commission.query.get_or_404(comm_id)
    operator = request.args.get('operator', 'Bureau')
    
    db.session.delete(comm)
    db.session.commit()
    log_action(operator, f"Suppression de la commission: {comm.name}")
    return jsonify({'message': 'Commission supprimée'}), 200

@commissions_bp.route('/api/commissions/<int:comm_id>/members', methods=['GET'])
def get_commission_members(comm_id):
    links = CommissionMember.query.filter_by(commission_id=comm_id).all()
    members = [Member.query.get(lnk.member_id) for lnk in links if Member.query.get(lnk.member_id)]
    return jsonify([m.to_dict() for m in members]), 200

@commissions_bp.route('/api/commissions/<int:comm_id>/members', methods=['POST'])
def add_member_to_commission(comm_id):
    data = request.json or {}
    member_id = data.get('member_id')
    operator = data.get('operator', 'Bureau')
    
    if not member_id:
        return jsonify({'error': 'ID membre requis'}), 400
        
    existing = CommissionMember.query.filter_by(commission_id=comm_id, member_id=member_id).first()
    if existing:
        return jsonify({'error': 'Ce membre fait déjà partie de la commission.'}), 400
        
    link = CommissionMember(commission_id=comm_id, member_id=member_id)
    db.session.add(link)
    db.session.commit()
    
    member = Member.query.get(member_id)
    comm = Commission.query.get(comm_id)
    log_action(operator, f"Ajout de {member.first_name} {member.last_name} à la commission {comm.name}")
    return jsonify({'message': 'Membre ajouté'}), 201

@commissions_bp.route('/api/commissions/<int:comm_id>/members/<int:member_id>', methods=['DELETE'])
def remove_member_from_commission(comm_id, member_id):
    operator = request.args.get('operator', 'Bureau')
    
    link = CommissionMember.query.filter_by(commission_id=comm_id, member_id=member_id).first_or_404()
    db.session.delete(link)
    db.session.commit()
    
    member = Member.query.get(member_id)
    comm = Commission.query.get(comm_id)
    log_action(operator, f"Retrait de {member.first_name} {member.last_name} de la commission {comm.name}")
    return jsonify({'message': 'Membre retiré'}), 200
