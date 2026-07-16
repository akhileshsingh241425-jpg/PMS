from flask import Blueprint, jsonify
from models import db, Project, ProjectTeam, Task, Meeting, MeetingRequest, MeetingRequestShare, MeetingShare
from middleware.auth import login_required

me_bp = Blueprint('me', __name__, url_prefix='/api/me')


@me_bp.route('/projects', methods=['GET'])
@login_required
def my_projects(current_user):
    project_ids = {t.project_id for t in ProjectTeam.query.filter_by(user_id=current_user.id).all()}
    if current_user.role == 'admin':
        projects = Project.query.order_by(Project.updated_at.desc()).all()
    else:
        projects = Project.query.filter(db.or_(
            Project.pm_id == current_user.id,
            Project.created_by == current_user.id,
            Project.id.in_(project_ids),
        )).order_by(Project.updated_at.desc()).all()
    return jsonify({'projects': [p.to_dict() for p in projects]})


@me_bp.route('/tasks', methods=['GET'])
@login_required
def my_tasks(current_user):
    tasks = Task.query.filter_by(assigned_to=current_user.id).order_by(Task.created_at.desc()).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@me_bp.route('/meetings', methods=['GET'])
@login_required
def my_meetings(current_user):
    project_ids = {t.project_id for t in ProjectTeam.query.filter_by(user_id=current_user.id).all()}
    if current_user.role == 'admin':
        project_ids.update(p.id for p in Project.query.all())
    # Include projects from meeting shares
    shared_mids = [s.meeting_id for s in MeetingShare.query.filter_by(user_id=current_user.id).all()]
    if shared_mids:
        shared_meetings = Meeting.query.filter(Meeting.id.in_(shared_mids)).all()
        project_ids.update(m.project_id for m in shared_meetings if m.project_id)
    shared_mr_ids = [s.meeting_request_id for s in MeetingRequestShare.query.filter_by(user_id=current_user.id).all()]
    if shared_mr_ids:
        shared_mrs = MeetingRequest.query.filter(MeetingRequest.id.in_(shared_mr_ids)).all()
        project_ids.update(m.project_id for m in shared_mrs if m.project_id)
    meetings = Meeting.query.filter(Meeting.project_id.in_(project_ids)).order_by(Meeting.meeting_date.desc()).all() if project_ids else []
    meeting_requests = MeetingRequest.query.filter(MeetingRequest.project_id.in_(project_ids)).order_by(MeetingRequest.created_at.desc()).all() if project_ids else []
    return jsonify({
        'meetings': [m.to_dict() for m in meetings],
        'meeting_requests': [m.to_dict() for m in meeting_requests],
    })
