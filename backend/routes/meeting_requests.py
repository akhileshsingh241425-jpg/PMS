from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db
from models.client_portal import MeetingRequest
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


@meeting_req_bp.route('/<int:mid>/respond', methods=['PUT'])
@role_required('super_admin')
def respond_meeting_request(current_user, mid):
    m = MeetingRequest.query.get_or_404(mid)
    data = request.get_json()
    if not data.get('status'):
        return jsonify({'error': 'status is required (Confirmed/Rescheduled/Cancelled)'}), 400
    if data['status'] not in ('Confirmed', 'Rescheduled', 'Cancelled'):
        return jsonify({'error': 'Invalid status. Must be Confirmed, Rescheduled, or Cancelled'}), 400
    m.status = data['status']
    if data.get('confirmed_date'):
        m.confirmed_date = datetime.fromisoformat(data['confirmed_date'])
    if data.get('team_remarks'):
        m.team_remarks = data['team_remarks']
    db.session.commit()
    return jsonify({'meeting_request': m.to_dict()})
