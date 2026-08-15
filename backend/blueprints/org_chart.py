from flask import Blueprint, request, jsonify
from models import db, OrgChart
from services.email_service import log_action

org_chart_bp = Blueprint('org_chart', __name__)

@org_chart_bp.route('/api/org_chart', methods=['GET'])
def get_org_chart():
    nodes = OrgChart.query.order_by(OrgChart.order.asc()).all()
    return jsonify([n.to_dict() for n in nodes]), 200

@org_chart_bp.route('/api/org_chart', methods=['POST'])
def add_org_node():
    data = request.json or {}
    role_name = data.get('role_name')
    member_id = data.get('member_id')
    parent_id = data.get('parent_id')
    order = data.get('order', 0)
    operator = data.get('operator', 'Bureau')
    
    if not role_name:
        return jsonify({'error': 'Le nom du poste est requis.'}), 400
        
    node = OrgChart(
        role_name=role_name,
        member_id=member_id if member_id else None,
        parent_id=parent_id if parent_id else None,
        order=order
    )
    db.session.add(node)
    db.session.commit()
    
    log_action(operator, f"Ajout du poste {role_name} dans l'organigramme.")
    return jsonify(node.to_dict()), 201

@org_chart_bp.route('/api/org_chart/<int:node_id>', methods=['PUT'])
def update_org_node(node_id):
    node = OrgChart.query.get_or_404(node_id)
    data = request.json or {}
    operator = data.get('operator', 'Bureau')
    
    if 'role_name' in data:
        node.role_name = data['role_name']
    if 'member_id' in data:
        node.member_id = data['member_id'] if data['member_id'] else None
    if 'parent_id' in data:
        node.parent_id = data['parent_id'] if data['parent_id'] else None
    if 'order' in data:
        node.order = data['order']
        
    db.session.commit()
    log_action(operator, f"Mise à jour du poste d'organigramme: {node.role_name}")
    return jsonify(node.to_dict()), 200

@org_chart_bp.route('/api/org_chart/<int:node_id>', methods=['DELETE'])
def delete_org_node(node_id):
    node = OrgChart.query.get_or_404(node_id)
    operator = request.args.get('operator', 'Bureau')
    
    db.session.delete(node)
    db.session.commit()
    log_action(operator, f"Suppression du poste {node.role_name} de l'organigramme.")
    return jsonify({'message': 'Poste supprimé'}), 200
