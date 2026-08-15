import os
import random
import string
import qrcode
from flask import current_app

def generate_pin():
    """Generate a random 6-digit PIN."""
    return ''.join(random.choices(string.digits, k=6))

def generate_qr_code(member_number):
    """Generate a QR code image for the member and save it."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(member_number)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    filename = f"{member_number}.png"
    filepath = os.path.join(current_app.config['QR_FOLDER'], filename)
    img.save(filepath)
    return f"uploads/qrcodes/{filename}"
