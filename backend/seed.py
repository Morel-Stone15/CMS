from app import app, db, generate_qr_code
from models import Member, Commission, CommissionMember, OrgChart, InternalDiscussion, ActionLog, CalendarEvent, Attendance
from datetime import datetime

def seed_database():
    with app.app_context():
        db.create_all()

        # 1. Admin Member
        admin = Member.query.filter_by(email="admin@clubtech.org").first()
        if not admin:
            admin = Member(
                member_number="CT-ADMIN",
                pin="123456",
                last_name="Bureau",
                first_name="Admin",
                major="Informatique & Réseaux",
                level="Master 2",
                email="admin@clubtech.org",
                phone="+212 600000000",
                private_notes="Administrateur principal du Bureau CLUB TECH",
                is_bureau=True,
                qr_code_path=generate_qr_code("CT-ADMIN")
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin created.")

        # 2. Regular Members
        m1 = Member.query.filter((Member.email=="youssef.alaoui@clubtech.org") | (Member.member_number=="CT-2026-0001")).first()
        if not m1:
            m1 = Member(
                member_number="CT-2026-0001",
                pin="112233",
                last_name="Alaoui",
                first_name="Youssef",
                major="Génie Logiciel",
                level="Licence 3",
                email="youssef.alaoui@clubtech.org",
                phone="+212 611223344",
                private_notes="Membre très actif, responsable pôle dev web.",
                is_bureau=False,
                qr_code_path=generate_qr_code("CT-2026-0001")
            )
            db.session.add(m1)

        m2 = Member.query.filter((Member.email=="sarah.benjelloun@clubtech.org") | (Member.member_number=="CT-2026-0002")).first()
        if not m2:
            m2 = Member(
                member_number="CT-2026-0002",
                pin="445566",
                last_name="Benjelloun",
                first_name="Sarah",
                major="Design & UI/UX",
                level="Master 1",
                email="sarah.benjelloun@clubtech.org",
                phone="+212 655443322",
                private_notes="Lead designer graphique du club.",
                is_bureau=True,
                qr_code_path=generate_qr_code("CT-2026-0002")
            )
            db.session.add(m2)

        db.session.commit()

        # 3. Commissions
        c1 = Commission.query.filter_by(name="Commission Technique").first()
        if not c1:
            c1 = Commission(name="Commission Technique", description="Développement Web, Mobile & Intelligence Artificielle")
            db.session.add(c1)

        c2 = Commission.query.filter_by(name="Commission Événementiel").first()
        if not c2:
            c2 = Commission(name="Commission Événementiel", description="Organisation des Hackathons, Ateliers et Conférences")
            db.session.add(c2)

        c3 = Commission.query.filter_by(name="Commission Media & Design").first()
        if not c3:
            c3 = Commission(name="Commission Media & Design", description="Création de contenu visuel, montage vidéo et branding")
            db.session.add(c3)

        db.session.commit()

        # Link members to commissions
        if m1 and c1:
            if not CommissionMember.query.filter_by(commission_id=c1.id, member_id=m1.id).first():
                db.session.add(CommissionMember(commission_id=c1.id, member_id=m1.id))
        if m2 and c3:
            if not CommissionMember.query.filter_by(commission_id=c3.id, member_id=m2.id).first():
                db.session.add(CommissionMember(commission_id=c3.id, member_id=m2.id))
        db.session.commit()

        # 4. OrgChart Hierarchy
        if not OrgChart.query.first():
            pres = OrgChart(member_id=admin.id, role_name="Président du Club", parent_id=None, order=1)
            db.session.add(pres)
            db.session.commit()

            if m2:
                vp = OrgChart(member_id=m2.id, role_name="Vice-Présidente / Lead Design", parent_id=pres.id, order=2)
                db.session.add(vp)
            if m1:
                tech_lead = OrgChart(member_id=m1.id, role_name="Responsable Commission Technique", parent_id=pres.id, order=3)
                db.session.add(tech_lead)
            db.session.commit()

        # 5. Internal Discussion Messages
        if not InternalDiscussion.query.first():
            msg1 = InternalDiscussion(member_id=admin.id, message="Bienvenue à tous sur la nouvelle plateforme CLUB TECH !")
            msg2 = InternalDiscussion(member_id=m1.id, message="Merci Admin ! L'espace membre et les cartes virtuelles fonctionnent parfaitement.")
            msg3 = InternalDiscussion(member_id=m2.id, message="N'oubliez pas d'importer vos photos et de vérifier vos QR codes pour le prochain Hackathon.")
            db.session.add_all([msg1, msg2, msg3])
            db.session.commit()

        # 6. Action Logs
        if not ActionLog.query.first():
            log1 = ActionLog(operator_name="Admin Bureau", action_description="Initialisation de la base de données SQLite du CLUB TECH.")
            log2 = ActionLog(operator_name="System", action_description="Génération des codes QR pour les membres du bureau.")
            db.session.add_all([log1, log2])
            db.session.commit()

        # 7. Calendar Events
        if not CalendarEvent.query.first():
            ev1 = CalendarEvent(title="Hackathon Annual 2026", description="Compétition 24h de code", start_date="2026-08-10", end_date="2026-08-11")
            ev2 = CalendarEvent(title="Atelier React & Flask", description="Formation pratique pour les nouveaux membres", start_date="2026-08-01", end_date="2026-08-01")
            db.session.add_all([ev1, ev2])
            db.session.commit()

        print("Database successfully seeded.")

if __name__ == "__main__":
    seed_database()
