import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Read .env file if it exists
env_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

class Config:
    BASE_DIR = BASE_DIR
    SECRET_KEY = os.environ.get('SECRET_KEY', 'clubtech-super-secret-key-123456')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "clubtech.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload Directories
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    PHOTO_FOLDER = os.path.join(UPLOAD_FOLDER, 'photos')
    QR_FOLDER = os.path.join(UPLOAD_FOLDER, 'qrcodes')
    
    # SMTP Configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp-mail.outlook.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USER = os.environ.get('SMTP_USER', '')
    SMTP_PASS = os.environ.get('SMTP_PASS', '')
    SMTP_FROM = os.environ.get('SMTP_FROM', os.environ.get('SMTP_USER', 'noreply@clubtech.org'))

    # EmailJS Configuration
    EMAILJS_SERVICE_ID = os.environ.get('EMAILJS_SERVICE_ID', '')
    EMAILJS_TEMPLATE_ID = os.environ.get('EMAILJS_TEMPLATE_ID', '')
    EMAILJS_PUBLIC_KEY = os.environ.get('EMAILJS_PUBLIC_KEY', os.environ.get('EMAILJS_USER_ID', ''))
    EMAILJS_PRIVATE_KEY = os.environ.get('EMAILJS_PRIVATE_KEY', '')

    # MOCK_EMAIL is False if SMTP_USER or EMAILJS_SERVICE_ID is set and MOCK_EMAIL is not explicitly true
    MOCK_EMAIL = (os.environ.get('MOCK_EMAIL', 'false').lower() == 'true') if (os.environ.get('SMTP_USER') or os.environ.get('EMAILJS_SERVICE_ID')) else (os.environ.get('MOCK_EMAIL', 'true').lower() == 'true')

