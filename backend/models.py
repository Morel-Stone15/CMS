from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    member_number = db.Column(db.String(20), unique=True, nullable=False)
    pin = db.Column(db.String(255), nullable=False)  # Hashed password
    last_name = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    major = db.Column(db.String(100), nullable=False)  # Filière
    level = db.Column(db.String(50), nullable=False)   # Niveau
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    photo_path = db.Column(db.String(255), nullable=True)
    qr_code_path = db.Column(db.String(255), nullable=True)
    private_notes = db.Column(db.Text, default='')
    is_bureau = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='actif')  # actif, inactif, suspendu, alumni
    must_change_pin = db.Column(db.Boolean, default=True)  # True = using temporary initial PIN (24h)
    pin_expires_at = db.Column(db.DateTime, nullable=True)  # Expiration timestamp for temporary PIN
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attendances = db.relationship('Attendance', backref='member', cascade='all, delete-orphan')
    commission_links = db.relationship('CommissionMember', backref='member', cascade='all, delete-orphan')
    org_positions = db.relationship('OrgChart', backref='member')

    def to_dict(self):
        return {
            'id': self.id,
            'member_number': self.member_number,
            'last_name': self.last_name,
            'first_name': self.first_name,
            'major': self.major,
            'level': self.level,
            'email': self.email,
            'phone': self.phone,
            'photo_path': self.photo_path,
            'qr_code_path': self.qr_code_path,
            'private_notes': self.private_notes,
            'is_bureau': self.is_bureau,
            'status': self.status,
            'must_change_pin': bool(self.must_change_pin),
            'pin_expires_at': self.pin_expires_at.isoformat() if self.pin_expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Attendance(db.Model):
    __tablename__ = 'attendances'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('calendar_events.id', ondelete='CASCADE'), nullable=True)
    event_name = db.Column(db.String(150), nullable=True)
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'member_id': self.member_id,
            'event_id': self.event_id,
            'event_name': self.event_name,
            'scanned_at': self.scanned_at.isoformat() if self.scanned_at else None
        }

class OrgChart(db.Model):
    __tablename__ = 'org_chart'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='SET NULL'), nullable=True)
    role_name = db.Column(db.String(100), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('org_chart.id', ondelete='CASCADE'), nullable=True)
    order = db.Column(db.Integer, default=0)

    # Relationship to parent/children for hierarchy
    children = db.relationship('OrgChart', backref=db.backref('parent', remote_side=[id]), cascade='all, delete-orphan')

    def to_dict(self):
        member_info = None
        if self.member:
            member_info = {
                'id': self.member.id,
                'first_name': self.member.first_name,
                'last_name': self.member.last_name,
                'email': self.member.email,
                'photo_path': self.member.photo_path
            }
        return {
            'id': self.id,
            'member_id': self.member_id,
            'member': member_info,
            'role_name': self.role_name,
            'parent_id': self.parent_id,
            'order': self.order
        }

class Commission(db.Model):
    __tablename__ = 'commissions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Relationships
    member_links = db.relationship('CommissionMember', backref='commission', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'member_count': len(self.member_links)
        }

class CommissionMember(db.Model):
    __tablename__ = 'commission_members'
    id = db.Column(db.Integer, primary_key=True)
    commission_id = db.Column(db.Integer, db.ForeignKey('commissions.id', ondelete='CASCADE'), nullable=False)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'commission_id': self.commission_id,
            'member_id': self.member_id
        }

class InternalDiscussion(db.Model):
    __tablename__ = 'internal_discussion'
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('members.id', ondelete='CASCADE'), nullable=False)
    message = db.Column(db.Text, nullable=True)  # nullable: can be attachment-only
    attachment_path = db.Column(db.String(500), nullable=True)    # relative path to uploaded file
    attachment_type = db.Column(db.String(20), nullable=True)     # photo, video, document, voice
    attachment_name = db.Column(db.String(255), nullable=True)    # original filename
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to get sender name easily
    member = db.relationship('Member')

    def to_dict(self):
        m = Member.query.get(self.member_id) if self.member_id else None
        return {
            'id': self.id,
            'member_id': self.member_id,
            'sender_name': f"{m.first_name} {m.last_name}" if m else "Unknown Member",
            'sender_photo': m.photo_path if m else None,
            'message': self.message,
            'attachment_path': self.attachment_path,
            'attachment_type': self.attachment_type,
            'attachment_name': self.attachment_name,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None
        }

class ActionLog(db.Model):
    __tablename__ = 'action_logs'
    id = db.Column(db.Integer, primary_key=True)
    operator_name = db.Column(db.String(150), nullable=False)
    action_description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'operator_name': self.operator_name,
            'action_description': self.action_description,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.String(50), nullable=False)  # Store ISO YYYY-MM-DD or full datetime
    end_date = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'start_date': self.start_date,
            'end_date': self.end_date
        }

