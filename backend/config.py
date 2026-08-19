import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def _load_env_file():
    env_path = os.path.join(BASE_DIR, '.env')
    if not os.path.exists(env_path):
        return

    with open(env_path, 'r', encoding='utf-8') as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, val = line.split('=', 1)
            os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


_load_env_file()


class Config:
    BASE_DIR = BASE_DIR
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    SECRET_KEY = os.environ.get('SECRET_KEY', 'clubtech-super-secret-key-123456')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "clubtech.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

    # Upload directories
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    PHOTO_FOLDER = os.path.join(UPLOAD_FOLDER, 'photos')
    QR_FOLDER = os.path.join(UPLOAD_FOLDER, 'qrcodes')

    # Public URLs used by email templates
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

    # SMTP configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp-mail.outlook.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USER = os.environ.get('SMTP_USER', '')
    SMTP_PASS = os.environ.get('SMTP_PASS', '')
    SMTP_FROM = os.environ.get('SMTP_FROM', os.environ.get('SMTP_USER', 'noreply@clubtech.org'))

    # EmailJS configuration
    EMAILJS_SERVICE_ID = os.environ.get('EMAILJS_SERVICE_ID', '')
    EMAILJS_TEMPLATE_ID = os.environ.get('EMAILJS_TEMPLATE_ID', '')
    EMAILJS_PUBLIC_KEY = os.environ.get('EMAILJS_PUBLIC_KEY', os.environ.get('EMAILJS_USER_ID', ''))
    EMAILJS_PRIVATE_KEY = os.environ.get('EMAILJS_PRIVATE_KEY', '')

    # MOCK_EMAIL is disabled when SMTP_USER or EMAILJS_SERVICE_ID is set unless explicitly forced on.
    has_email_config = bool(os.environ.get('SMTP_USER') or os.environ.get('EMAILJS_SERVICE_ID'))
    env_mock_email = os.environ.get('MOCK_EMAIL', 'true' if not has_email_config else 'false')
    MOCK_EMAIL = env_mock_email.lower() == 'true'
