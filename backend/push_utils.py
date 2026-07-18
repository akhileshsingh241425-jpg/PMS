import os, json, logging
from models import db, DeviceToken, Notification

logger = logging.getLogger(__name__)

FCM_SERVER_KEY = os.environ.get('FCM_SERVER_KEY', '')
FCM_URL = 'https://fcm.googleapis.com/fcm/send'

def send_push(user_id, title, message, data=None):
    if not FCM_SERVER_KEY:
        logger.warning('FCM_SERVER_KEY not set, skipping push')
        return
    tokens = DeviceToken.query.filter_by(user_id=user_id).all()
    if not tokens:
        return
    for dt in tokens:
        _send_to_token(dt.token, title, message, data)

def _send_to_token(token, title, message, data=None):
    import requests
    payload = {
        'to': token,
        'notification': {'title': title, 'body': message, 'sound': 'default'},
        'data': data or {},
        'priority': 'high',
    }
    try:
        r = requests.post(FCM_URL, json=payload, headers={
            'Authorization': f'key={FCM_SERVER_KEY}',
            'Content-Type': 'application/json',
        })
        logger.info(f'FCM sent to {token[:20]}... status={r.status_code}')
    except Exception as e:
        logger.error(f'FCM error: {e}')

def notify_and_push(user_id, title, message, module_type=None, module_id=None, data=None):
    n = Notification(user_id=user_id, title=title, message=message, module_type=module_type, module_id=module_id)
    db.session.add(n)
    db.session.flush()
    send_push(user_id, title, message, data or {'module_type': module_type, 'module_id': str(module_id) if module_id else None})
