from flask import Blueprint, request, jsonify
from datetime import date, timedelta
from middleware.auth import login_required
from models import db, DailyWorkLog, Attendance

work_log_bp = Blueprint('work_log', __name__, url_prefix='/api/work-log')


@work_log_bp.route('/pending', methods=['GET'])
@login_required
def pending_logs(current_user):
    if current_user.role == 'super_admin':
        return jsonify({'dates': []})

    today = date.today()
    pending = []

    yesterday = today - timedelta(days=1)
    yest_log = DailyWorkLog.query.filter_by(user_id=current_user.id, date=yesterday).first()
    yest_att = Attendance.query.filter_by(user_id=current_user.id, date=yesterday).first()
    if not yest_log and yest_att and yest_att.clock_in:
        pending.append(yesterday.isoformat())

    today_log = DailyWorkLog.query.filter_by(user_id=current_user.id, date=today).first()
    today_att = Attendance.query.filter_by(user_id=current_user.id, date=today).first()
    if not today_log and today_att and today_att.clock_in:
        pending.append(today.isoformat())

    return jsonify({'dates': pending})


@work_log_bp.route('', methods=['POST'])
@login_required
def submit_work_log(current_user):
    if current_user.role == 'super_admin':
        return jsonify({'error': 'Not required'}), 403

    data = request.get_json() or {}
    log_date_str = data.get('date')
    description = (data.get('description') or '').strip()

    if not log_date_str or not description:
        return jsonify({'error': 'Date and description required'}), 400

    try:
        log_date = date.fromisoformat(log_date_str)
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400

    existing = DailyWorkLog.query.filter_by(user_id=current_user.id, date=log_date).first()
    if existing:
        existing.description = description
        db.session.commit()
        return jsonify({'log': existing.to_dict()})

    log = DailyWorkLog(user_id=current_user.id, date=log_date, description=description)
    db.session.add(log)
    db.session.commit()
    return jsonify({'log': log.to_dict()}), 201


@work_log_bp.route('', methods=['GET'])
@login_required
def get_work_log(current_user):
    log_date_str = request.args.get('date')
    if log_date_str:
        try:
            log_date = date.fromisoformat(log_date_str)
        except ValueError:
            return jsonify({'error': 'Invalid date'}), 400
        log = DailyWorkLog.query.filter_by(user_id=current_user.id, date=log_date).first()
        return jsonify({'log': log.to_dict() if log else None})
    logs = DailyWorkLog.query.filter_by(user_id=current_user.id).order_by(DailyWorkLog.date.desc()).limit(30).all()
    return jsonify({'logs': [l.to_dict() for l in logs]})
