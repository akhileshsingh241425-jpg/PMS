from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Project, Task, Meeting, Note
from models.client_portal import FindingQuery, MeetingRequest, DocumentRevisionRequest, ClientUpload
from middleware.auth import login_required, role_required

dash_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dash_bp.route('/overview', methods=['GET'])
@login_required
def overview(current_user):
    total_projects = Project.query.count()
    active_projects = Project.query.filter(
        ~Project.stage.in_(['Closed', 'Cancelled'])
    ).count()
    open_queries = FindingQuery.query.filter_by(status='Open').count()
    pending_meetings = MeetingRequest.query.filter_by(status='Requested').count()
    pending_revisions = DocumentRevisionRequest.query.filter_by(status='Submitted').count()

    stage_dist = db.session.query(
        Project.stage, db.func.count(Project.id)
    ).group_by(Project.stage).all()

    recent_queries = FindingQuery.query.order_by(
        FindingQuery.created_at.desc()
    ).limit(10).all()

    return jsonify({
        'total_projects': total_projects,
        'active_projects': active_projects,
        'open_queries': open_queries,
        'pending_meetings': pending_meetings,
        'pending_revisions': pending_revisions,
        'stage_distribution': {s: c for s, c in stage_dist},
        'recent_queries': [q.to_dict() for q in recent_queries],
    })
