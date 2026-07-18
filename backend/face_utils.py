import os, base64, logging
from datetime import datetime
from deepface import DeepFace
import cv2
import numpy as np

logger = logging.getLogger(__name__)

FACE_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'faces')
os.makedirs(FACE_DIR, exist_ok=True)

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

MODEL_NAME = 'Facenet'
DISTANCE_THRESHOLD = 0.4

def _warmup():
    try:
        DeepFace.build_model(MODEL_NAME)
        logger.info('FaceNet model loaded')
    except Exception as e:
        logger.warning(f'FaceNet model load failed: {e}')

def _save_base64_image(b64_str, filepath):
    if ',' in b64_str:
        b64_str = b64_str.split(',')[1]
    data = base64.b64decode(b64_str)
    with open(filepath, 'wb') as f:
        f.write(data)

def _load_image(filepath):
    img = cv2.imread(filepath)
    if img is None:
        raise ValueError('Could not read image')
    return img

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

    tmp_path = os.path.join(FACE_DIR, f'tmp_{user_id}_{int(datetime.utcnow().timestamp())}.jpg')
    try:
        _save_base64_image(image_base64, tmp_path)

        result = DeepFace.verify(
            ref_path, tmp_path,
            model_name=MODEL_NAME,
            enforce_detection=False,
            distance_metric='cosine',
        )

        return {
            'verified': result.get('verified', False),
            'distance': float(result.get('distance', 1.0)),
            'threshold': DISTANCE_THRESHOLD,
            'face_detected': True,
            'error': None,
        }
    except Exception as e:
        logger.error(f'Face verify error: {e}')
        return {'verified': False, 'error': str(e), 'face_detected': False}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def save_attendance_face(attendance_id, image_base64):
    path = os.path.join(FACE_DIR, f'attendance_{attendance_id}.jpg')
    _save_base64_image(image_base64, path)
    return path

def face_detected(image_base64):
    tmp = os.path.join(FACE_DIR, f'tmp_detect_{int(datetime.utcnow().timestamp())}.jpg')
    try:
        _save_base64_image(image_base64, tmp)
        img = _load_image(tmp)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        return len(faces) > 0
    except:
        return False
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)

_warmup()
