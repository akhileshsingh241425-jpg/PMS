from flask import Blueprint, request, jsonify
from models import db, Project
from models.client_portal import FindingQuery
from middleware.auth import login_required, role_required

queries_bp = Blueprint('queries', __name__, url_prefix='/api/queries')


@queries_bp.route('', methods=['GET'])
@login_required
def list_queries(current_user):
    query = FindingQuery.query
    if pid := request.args.get('project_id'):
        query = query.filter_by(project_id=int(pid))
    if st := request.args.get('status'):
        query = query.filter_by(status=st)
    if aid := request.args.get('account_id'):
        query = query.filter_by(account_id=int(aid))
    return jsonify({
        'queries': [q.to_dict() for q in query.order_by(FindingQuery.created_at.desc()).all()]
    })


@queries_bp.route('/<int:qid>/respond', methods=['PUT'])
@role_required('super_admin')
def respond_query(current_user, qid):
    q = FindingQuery.query.get_or_404(qid)
    data = request.get_json()
    if not data.get('response'):
        return jsonify({'error': 'response is required'}), 400
    q.response = data['response']
    q.responded_by = current_user.id
    q.status = data.get('status', 'Answered')
    db.session.commit()
    return jsonify({'query': q.to_dict()})
