from flask import Blueprint, request, jsonify
from models import db, DeviceToken
from middleware.auth import login_required

push_bp = Blueprint('push', __name__, url_prefix='/api/push')


@push_bp.route('/register-token', methods=['POST'])
@login_required
def register_token(current_user):
    data = request.get_json() or {}
    token = data.get('token')
    platform = data.get('platform', 'android')
    if not token:
        return jsonify({'error': 'token required'}), 400

    existing = DeviceToken.query.filter_by(token=token).first()
    if existing:
        if existing.user_id != current_user.id:
            existing.user_id = current_user.id
        existing.platform = platform
    else:
        dt = DeviceToken(user_id=current_user.id, token=token, platform=platform)
        db.session.add(dt)
    db.session.commit()
    return jsonify({'message': 'Token registered'})


@push_bp.route('/unregister-token', methods=['POST'])
@login_required
def unregister_token(current_user):
    data = request.get_json() or {}
    token = data.get('token')
    if not token:
        return jsonify({'error': 'token required'}), 400
    DeviceToken.query.filter_by(token=token, user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'message': 'Token unregistered'})
