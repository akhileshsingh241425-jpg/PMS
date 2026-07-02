from flask import Blueprint, jsonify
from models import db, Project, Task
from models.client_portal import FindingQuery, MeetingRequest
from middleware.auth import login_required

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
    my_tasks = Task.query.filter_by(assigned_to=current_user.id).count()

    stage_dist = db.session.query(
        Project.stage, db.func.count(Project.id)
    ).group_by(Project.stage).all()

    return jsonify({
        'total_projects': total_projects,
        'active_projects': active_projects,
        'open_queries': open_queries,
        'pending_meetings': pending_meetings,
        'my_tasks': my_tasks,
        'stage_distribution': {s: c for s, c in stage_dist},
    })
