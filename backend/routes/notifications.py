from flask import Blueprint, request, jsonify
from middleware.auth import login_required
from models import db, Notification

notif_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notif_bp.route('/unread-count', methods=['GET'])
@login_required
def unread_count(current_user):
    count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return jsonify({'count': count})


@notif_bp.route('', methods=['GET'])
@login_required
def list_notifications(current_user):
    unread_only = request.args.get('unread_only', '').lower() == 'true'
    q = Notification.query.filter_by(user_id=current_user.id)
    if unread_only:
        q = q.filter_by(is_read=False)
    notifs = q.order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify({'notifications': [n.to_dict() for n in notifs]})


@notif_bp.route('/<int:nid>/read', methods=['PUT'])
@login_required
def mark_read(current_user, nid):
    n = Notification.query.filter_by(id=nid, user_id=current_user.id).first_or_404()
    n.is_read = True
    db.session.commit()
    return jsonify({'message': 'ok'})


@notif_bp.route('/read-all', methods=['PUT'])
@login_required
def mark_all_read(current_user):
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'ok'})
