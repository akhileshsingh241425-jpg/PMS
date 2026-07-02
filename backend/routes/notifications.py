from flask import Blueprint, request, jsonify
from models import db, Notification
from middleware.auth import login_required

notif_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notif_bp.route('', methods=['GET'])
@login_required
def list_notifications(current_user):
    unread_only = request.args.get('unread_only', '').lower() == 'true'
    query = Notification.query.filter_by(user_id=current_user.id)
    if unread_only:
        query = query.filter_by(is_read=False)
    return jsonify({
        'notifications': [n.to_dict() for n in query.order_by(Notification.created_at.desc()).limit(50).all()]
    })


@notif_bp.route('/unread-count', methods=['GET'])
@login_required
def unread_count(current_user):
    count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return jsonify({'count': count})


@notif_bp.route('/<int:nid>/read', methods=['PUT'])
@login_required
def mark_read(current_user, nid):
    n = Notification.query.get_or_404(nid)
    if n.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    n.is_read = True
    db.session.commit()
    return jsonify({'notification': n.to_dict()})


@notif_bp.route('/read-all', methods=['PUT'])
@login_required
def mark_all_read(current_user):
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All marked read'})
