import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash

from config import Config
from models import db, Member, OrgChart
from services.qr_service import generate_qr_code
from services.email_service import log_action

# Import Blueprints
from blueprints.auth import auth_bp
from blueprints.members import members_bp
from blueprints.attendance import attendance_bp
from blueprints.org_chart import org_chart_bp
from blueprints.commissions import commissions_bp
from blueprints.discussion import discussion_bp
from blueprints.calendar_bp import calendar_bp
from blueprints.admin_bp import admin_bp

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Ensure required directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['PHOTO_FOLDER'], exist_ok=True)
os.makedirs(app.config['QR_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'chat_media'), exist_ok=True)

db.init_app(app)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(members_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(org_chart_bp)
app.register_blueprint(commissions_bp)
app.register_blueprint(discussion_bp)
app.register_blueprint(calendar_bp)
app.register_blueprint(admin_bp)

# Root route for API status and friendly health check
@app.route('/')
def index():
    return jsonify({
        'status': 'online',
        'app': 'Club Tech API Server',
        'version': '1.0.0',
        'message': 'Le serveur Backend Flask fonctionne parfaitement. Accédez au Frontend sur http://localhost:3000'
    }), 200

# File serving route
@app.route('/uploads/<path:filename>')
@app.route('/api/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

import sqlite3

def run_migrations():
    db_path = os.path.join(app.config['BASE_DIR'], 'clubtech.db')
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Migrations for members table
        cursor.execute("PRAGMA table_info(members)")
        m_cols = [row[1] for row in cursor.fetchall()]
        if m_cols:
            if 'must_change_pin' not in m_cols:
                cursor.execute("ALTER TABLE members ADD COLUMN must_change_pin BOOLEAN DEFAULT 1")
            if 'pin_expires_at' not in m_cols:
                cursor.execute("ALTER TABLE members ADD COLUMN pin_expires_at DATETIME")
            conn.commit()

        # Migrations for internal_discussion table
        cursor.execute("PRAGMA table_info(internal_discussion)")
        cols = [row[1] for row in cursor.fetchall()]
        if cols:
            if 'attachment_path' not in cols:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN attachment_path VARCHAR(500)")
            if 'attachment_type' not in cols:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN attachment_type VARCHAR(20)")
            if 'attachment_name' not in cols:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN attachment_name VARCHAR(255)")
            if 'receiver_id' not in cols:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN receiver_id INTEGER")
            if 'group_id' not in cols:
                cursor.execute("ALTER TABLE internal_discussion ADD COLUMN group_id INTEGER")
            conn.commit()
        conn.close()

# Initialize Database & Seed Admin Account on startup
with app.app_context():
    run_migrations()
    db.create_all()
    existing_admin = Member.query.filter_by(member_number="CT-ADMIN").first()
    if existing_admin is None:
        admin_member = Member(
            member_number="CT-ADMIN",
            pin=generate_password_hash("123456"),
            last_name="Bureau",
            first_name="Admin",
            major="Informatique",
            level="Bureau",
            email="admin@clubtech.org",
            phone="0000000000",
            photo_path=None,
            is_bureau=True,
            must_change_pin=False
        )
        db.session.add(admin_member)
        db.session.commit()
        
        admin_member.qr_code_path = generate_qr_code("CT-ADMIN")
        db.session.commit()
        
        ceo_role = OrgChart(role_name="Président", member_id=admin_member.id, parent_id=None, order=1)
        db.session.add(ceo_role)
        db.session.commit()
        
        log_action("Système", "Initialisation de la base de données et création du compte Admin Bureau.")
    else:
        if not existing_admin.is_bureau or existing_admin.must_change_pin:
            existing_admin.is_bureau = True
            existing_admin.must_change_pin = False
            db.session.commit()
            log_action("Système", "Mise à jour du compte CT-ADMIN (Bureau=True, must_change_pin=False).")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
