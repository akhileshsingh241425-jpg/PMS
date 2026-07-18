from datetime import datetime, date
from flask import Blueprint, request, jsonify
from models import db, Attendance, User, Project, ProjectTeam
from middleware.auth import login_required
from face_utils import register_face, verify_face, save_attendance_face, face_detected, get_face_path, delete_face

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')


@attendance_bp.route('/today', methods=['GET'])
@login_required
def today(current_user):
    record = Attendance.query.filter_by(user_id=current_user.id, date=date.today()).order_by(Attendance.clock_in.desc()).first()
    return jsonify({'attendance': record.to_dict() if record else None})


@attendance_bp.route('/clock-in', methods=['POST'])
@login_required
def clock_in(current_user):
    existing = Attendance.query.filter_by(user_id=current_user.id, date=date.today(), clock_out=None).first()
    if existing:
        return jsonify({'error': 'Already clocked in. Please clock out first.'}), 400
    data = request.get_json() or {}
    rec = Attendance(
        user_id=current_user.id,
        date=date.today(),
        clock_in=datetime.utcnow(),
        location_lat=data.get('lat'),
        location_lon=data.get('lon'),
        location_name=data.get('location_name'),
        project_id=data.get('project_id'),
        work_description=data.get('work_description', ''),
        status='Present',
    )
    db.session.add(rec)
    db.session.flush()

    face_img = data.get('face_image')
    if face_img:
        if face_detected(face_img):
            path = save_attendance_face(rec.id, face_img)
            rec.face_image_path = path
            ref_path = get_face_path(current_user.id)
            if ref_path:
                vr = verify_face(current_user.id, face_img)
                rec.face_verified = vr.get('verified', False)

    db.session.commit()
    return jsonify({'attendance': rec.to_dict()}), 201


@attendance_bp.route('/clock-out', methods=['POST'])
@login_required
def clock_out(current_user):
    record = Attendance.query.filter_by(user_id=current_user.id, date=date.today(), clock_out=None).order_by(Attendance.clock_in.desc()).first()
    if not record:
        return jsonify({'error': 'No active session found. Please clock in first.'}), 400
    data = request.get_json() or {}
    record.clock_out = datetime.utcnow()
    if data.get('work_description'):
        record.work_description = data['work_description']

    face_img = data.get('face_image')
    if face_img:
        if face_detected(face_img):
            path = save_attendance_face(record.id, face_img)
            record.face_image_path = path
            ref_path = get_face_path(current_user.id)
            if ref_path:
                vr = verify_face(current_user.id, face_img)
                record.face_verified = vr.get('verified', False)

    db.session.commit()
    return jsonify({'attendance': record.to_dict()})


@attendance_bp.route('/history', methods=['GET'])
@login_required
def history(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 30, type=int)
    q = Attendance.query.filter_by(user_id=current_user.id).order_by(Attendance.date.desc(), Attendance.clock_in.desc())
    total = q.count()
    records = q.offset((page - 1) * per_page).limit(per_page).all()
    return jsonify({'attendance': [r.to_dict() for r in records], 'total': total, 'page': page, 'per_page': per_page})


@attendance_bp.route('/active', methods=['GET'])
@login_required
def active_sessions(current_user):
    records = Attendance.query.filter_by(clock_out=None).filter(Attendance.date == date.today()).order_by(Attendance.clock_in.asc()).all()
    return jsonify({'active': [r.to_dict() for r in records]})


@attendance_bp.route('/report', methods=['GET'])
@login_required
def report(current_user):
    if current_user.role not in ('admin', 'pm'):
        return jsonify({'error': 'Access denied'}), 403
    user_id = request.args.get('user_id', type=int)
    start = request.args.get('start_date')
    end = request.args.get('end_date')
    q = Attendance.query
    if user_id:
        q = q.filter_by(user_id=user_id)
    u = request.args.get('user_id', type=int)
    if u:
        user = User.query.get(u)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        q = q.filter_by(user_id=u)
    if start:
        try:
            sd = datetime.strptime(start, '%Y-%m-%d').date()
            q = q.filter(Attendance.date >= sd)
        except ValueError:
            pass
    if end:
        try:
            ed = datetime.strptime(end, '%Y-%m-%d').date()
            q = q.filter(Attendance.date <= ed)
        except ValueError:
            pass
    records = q.order_by(Attendance.date.desc(), Attendance.clock_in.desc()).all()
    summary = {}
    for r in records:
        uid = r.user_id
        if uid not in summary:
            summary[uid] = {'user_id': uid, 'user_name': r.user.full_name if r.user else '', 'total_hours': 0, 'days': 0}
        dur = (r.clock_out - r.clock_in).total_seconds() / 3600 if r.clock_in and r.clock_out else 0
        if dur > 0:
            summary[uid]['total_hours'] += dur
            summary[uid]['days'] += 1
    return jsonify({
        'records': [r.to_dict() for r in records],
        'summary': list(summary.values()),
    })


@attendance_bp.route('/register-face', methods=['POST'])
@login_required
def register_face_route(current_user):
    data = request.get_json() or {}
    image = data.get('image')
    if not image:
        return jsonify({'error': 'face_image required'}), 400
    if not face_detected(image):
        return jsonify({'error': 'No face detected in image. Please try again with better lighting.'}), 400
    path = register_face(current_user.id, image)
    current_user.face_registration_path = path
    current_user.face_registered_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Face registered successfully', 'face_registered': True})


@attendance_bp.route('/face-status', methods=['GET'])
@login_required
def face_status(current_user):
    return jsonify({
        'face_registered': current_user.face_registration_path is not None,
        'face_registered_at': current_user.face_registered_at.isoformat() if current_user.face_registered_at else None,
    })


@attendance_bp.route('/delete-face', methods=['POST'])
@login_required
def delete_face_route(current_user):
    delete_face(current_user.id)
    current_user.face_registration_path = None
    current_user.face_registered_at = None
    db.session.commit()
    return jsonify({'message': 'Face deleted', 'face_registered': False})
