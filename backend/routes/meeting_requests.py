from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, User
from models.client_portal import MeetingRequest, MeetingRequestShare, MeetingRequestActivity, MeetingRequestDocument
from middleware.auth import login_required, role_required

meeting_req_bp = Blueprint('meeting_requests', __name__, url_prefix='/api/meeting-requests')


@meeting_req_bp.route('', methods=['GET'])
@login_required
def list_meeting_requests(current_user):
    query = MeetingRequest.query
    if pid := request.args.get('project_id'):
        query = query.filter_by(project_id=int(pid))
    if st := request.args.get('status'):
        query = query.filter_by(status=st)
    if aid := request.args.get('account_id'):
        query = query.filter_by(account_id=int(aid))
    return jsonify({
        'meeting_requests': [m.to_dict() for m in query.order_by(MeetingRequest.created_at.desc()).all()]
    })


@meeting_req_bp.route('/<int:mid>', methods=['GET'])
@login_required
def get_meeting_request(current_user, mid):
    m = MeetingRequest.query.get_or_404(mid)
    return jsonify({'meeting_request': m.to_dict()})


@meeting_req_bp.route('/<int:mid>/respond', methods=['PUT'])
@role_required('admin')
def respond_meeting_request(current_user, mid):
    m = MeetingRequest.query.get_or_404(mid)
    data = request.get_json()
    if not data.get('status'):
        return jsonify({'error': 'status is required (Confirmed/Rescheduled/Cancelled)'}), 400
    if data['status'] not in ('Confirmed', 'Rescheduled', 'Cancelled'):
        return jsonify({'error': 'Invalid status'}), 400
    old_status = m.status
    m.status = data['status']
    if data.get('confirmed_date'):
        m.confirmed_date = datetime.fromisoformat(data['confirmed_date'])
    if data.get('team_remarks'):
        m.team_remarks = data['team_remarks']
    if 'meeting_notes' in data:
        m.meeting_notes = data['meeting_notes']
    if 'meeting_link' in data:
        m.meeting_link = data['meeting_link'] or None
    if old_status != data['status']:
        act = MeetingRequestActivity(meeting_request_id=mid, action='status_changed', description=f'Status changed from {old_status} to {data["status"]}', user_id=current_user.id)
        db.session.add(act)
    if 'meeting_notes' in data:
        act = MeetingRequestActivity(meeting_request_id=mid, action='notes_updated', description='Meeting notes updated', user_id=current_user.id)
        db.session.add(act)
    db.session.commit()
    return jsonify({'meeting_request': m.to_dict()})


# SHARE
@meeting_req_bp.route('/<int:mid>/share', methods=['GET'])
@login_required
def get_mr_shares(current_user, mid):
    MeetingRequest.query.get_or_404(mid)
    shares = MeetingRequestShare.query.filter_by(meeting_request_id=mid).order_by(MeetingRequestShare.created_at.desc()).all()
    return jsonify({'shares': [s.to_dict() for s in shares]})


@meeting_req_bp.route('/<int:mid>/share', methods=['POST'])
@login_required
def add_mr_share(current_user, mid):
    m = MeetingRequest.query.get_or_404(mid)
    data = request.get_json()
    if not data.get('user_ids'):
        return jsonify({'error': 'user_ids required'}), 400
    user_ids = data['user_ids'] if isinstance(data['user_ids'], list) else [data['user_ids']]
    added = []
    for uid in user_ids:
        existing = MeetingRequestShare.query.filter_by(meeting_request_id=mid, user_id=int(uid)).first()
        if not existing:
            share = MeetingRequestShare(meeting_request_id=mid, user_id=int(uid), can_edit=data.get('can_edit', False))
            db.session.add(share)
            added.append(uid)
    if added:
        names = db.session.query(User.full_name).filter(User.id.in_([int(u) for u in added])).all()
        name_str = ', '.join([n[0] for n in names])
        act = MeetingRequestActivity(meeting_request_id=mid, action='shared', description=f'Shared with {name_str}', user_id=current_user.id)
        db.session.add(act)
    db.session.commit()
    shares = MeetingRequestShare.query.filter_by(meeting_request_id=mid).all()
    return jsonify({'shares': [s.to_dict() for s in shares]})


@meeting_req_bp.route('/<int:mid>/share/<int:uid>', methods=['DELETE'])
@login_required
def remove_mr_share(current_user, mid, uid):
    share = MeetingRequestShare.query.filter_by(meeting_request_id=mid, user_id=uid).first_or_404()
    db.session.delete(share)
    act = MeetingRequestActivity(meeting_request_id=mid, action='unshared', description='Removed from sharing', user_id=current_user.id)
    db.session.add(act)
    db.session.commit()
    return jsonify({'message': 'Removed'})


# ACTIVITIES
@meeting_req_bp.route('/<int:mid>/activities', methods=['GET'])
@login_required
def list_mr_activities(current_user, mid):
    MeetingRequest.query.get_or_404(mid)
    acts = MeetingRequestActivity.query.filter_by(meeting_request_id=mid).order_by(MeetingRequestActivity.created_at.desc()).all()
    return jsonify({'activities': [a.to_dict() for a in acts]})


# DOCUMENT DELETE
@meeting_req_bp.route('/<int:mid>/documents/<int:did>', methods=['DELETE'])
@login_required
def delete_mr_doc(current_user, mid, did):
    doc = MeetingRequestDocument.query.get_or_404(did)
    if doc.meeting_request_id != mid:
        return jsonify({'error': 'Document not found'}), 404
    if doc.uploaded_by != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not authorized'}), 403
    import os
    if os.path.isfile(doc.file_path):
        os.remove(doc.file_path)
    db.session.delete(doc)
    act = MeetingRequestActivity(meeting_request_id=mid, action='document_deleted', description=f'Deleted document: {doc.file_name}', user_id=current_user.id)
    db.session.add(act)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
