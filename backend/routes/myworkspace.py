from flask import Blueprint, jsonify
from models import db, Project, ProjectTeam, Task, Meeting
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
    tasks = Task.query.filter_by(assigned_to=current_user.id).order_by(Task.updated_at.desc()).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@me_bp.route('/meetings', methods=['GET'])
@login_required
def my_meetings(current_user):
    project_ids = {t.project_id for t in ProjectTeam.query.filter_by(user_id=current_user.id).all()}
    if current_user.role == 'admin':
        project_ids.update(p.id for p in Project.query.all())
    meetings = Meeting.query.filter(Meeting.project_id.in_(project_ids)).order_by(Meeting.meeting_date.desc()).all()
    return jsonify({'meetings': [m.to_dict() for m in meetings]})
