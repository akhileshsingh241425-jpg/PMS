from flask import Blueprint, request, jsonify
from models import db, Team, TeamMember, User
from middleware.auth import login_required, role_required

team_bp = Blueprint('teams', __name__, url_prefix='/api/teams')


@team_bp.route('', methods=['GET'])
@login_required
def list_teams(current_user):
    teams = Team.query.order_by(Team.created_at.desc()).all()
    return jsonify({'teams': [t.to_dict() for t in teams]})


@team_bp.route('', methods=['POST'])
@role_required('admin')
def create_team(current_user):
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Team name is required'}), 400
    team = Team(
        name=data['name'],
        description=data.get('description'),
        leader_id=int(data['leader_id']) if data.get('leader_id') else None,
        created_by=current_user.id,
    )
    db.session.add(team)
    db.session.commit()
    if data.get('member_ids'):
        for uid in data['member_ids']:
            tm = TeamMember(team_id=team.id, user_id=int(uid))
            db.session.add(tm)
        db.session.commit()
    return jsonify({'team': team.to_dict()}), 201


@team_bp.route('/<int:tid>', methods=['GET'])
@login_required
def get_team(current_user, tid):
    team = Team.query.get_or_404(tid)
    return jsonify({'team': team.to_dict()})


@team_bp.route('/<int:tid>', methods=['PUT'])
@role_required('admin')
def update_team(current_user, tid):
    team = Team.query.get_or_404(tid)
    data = request.get_json()
    if 'name' in data:
        if not data['name']:
            return jsonify({'error': 'Team name cannot be empty'}), 400
        team.name = data['name']
    if 'description' in data:
        team.description = data.get('description')
    if 'leader_id' in data:
        team.leader_id = int(data['leader_id']) if data['leader_id'] else None
    db.session.commit()
    return jsonify({'team': team.to_dict()})


@team_bp.route('/<int:tid>', methods=['DELETE'])
@role_required('admin')
def delete_team(current_user, tid):
    team = Team.query.get_or_404(tid)
    db.session.delete(team)
    db.session.commit()
    return jsonify({'message': 'Team deleted'})


@team_bp.route('/<int:tid>/members', methods=['POST'])
@role_required('admin')
def add_member(current_user, tid):
    Team.query.get_or_404(tid)
    data = request.get_json()
    if not data.get('user_id'):
        return jsonify({'error': 'user_id required'}), 400
    existing = TeamMember.query.filter_by(team_id=tid, user_id=int(data['user_id'])).first()
    if existing:
        return jsonify({'error': 'User already in team'}), 409
    tm = TeamMember(team_id=tid, user_id=int(data['user_id']))
    db.session.add(tm)
    db.session.commit()
    User.query.get(int(data['user_id']))
    return jsonify({'member': tm.to_dict()}), 201


@team_bp.route('/members/<int:tmid>', methods=['DELETE'])
@role_required('admin')
def remove_member(current_user, tmid):
    tm = TeamMember.query.get_or_404(tmid)
    db.session.delete(tm)
    db.session.commit()
    return jsonify({'message': 'Member removed'})


@team_bp.route('/members/bulk', methods=['POST'])
@role_required('admin')
def bulk_add_members(current_user):
    data = request.get_json()
    team_id = data.get('team_id')
    member_ids = data.get('member_ids', [])
    if not team_id or not member_ids:
        return jsonify({'error': 'team_id and member_ids required'}), 400
    Team.query.get_or_404(team_id)
    added = []
    for uid in member_ids:
        existing = TeamMember.query.filter_by(team_id=team_id, user_id=int(uid)).first()
        if not existing:
            tm = TeamMember(team_id=team_id, user_id=int(uid))
            db.session.add(tm)
            added.append(int(uid))
    db.session.commit()
    return jsonify({'added': added}), 201
