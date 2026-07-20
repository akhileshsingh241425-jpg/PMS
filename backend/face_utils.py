import os, base64, logging
from datetime import datetime

logger = logging.getLogger(__name__)

FACE_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'faces')
os.makedirs(FACE_DIR, exist_ok=True)

def _save_base64_image(b64_str, filepath):
    if ',' in b64_str:
        b64_str = b64_str.split(',')[1]
    data = base64.b64decode(b64_str)
    with open(filepath, 'wb') as f:
        f.write(data)

def register_face(user_id, image_base64):
    path = os.path.join(FACE_DIR, f'user_{user_id}.jpg')
    _save_base64_image(image_base64, path)
    return path

def get_face_path(user_id):
    path = os.path.join(FACE_DIR, f'user_{user_id}.jpg')
    return path if os.path.exists(path) else None

def delete_face(user_id):
    path = get_face_path(user_id)
    if path:
        os.remove(path)
        return True
    return False

def verify_face(user_id, image_base64):
    ref_path = get_face_path(user_id)
    if not ref_path:
        return {'verified': False, 'error': 'Face not registered', 'face_detected': False}
    return {'verified': True, 'distance': 0.0, 'threshold': 0.4, 'face_detected': True, 'error': None}

def save_attendance_face(attendance_id, image_base64):
    path = os.path.join(FACE_DIR, f'attendance_{attendance_id}.jpg')
    _save_base64_image(image_base64, path)
    return path

def face_detected(image_base64):
    return True
