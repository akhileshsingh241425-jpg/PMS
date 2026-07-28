"""HR module — company-wide attendance, leave and headcount views.

Everything here is read-mostly aggregation over data that already exists
(Attendance, LeaveRequest, DailyWorkLog, User) plus a small Holiday calendar,
so HR can see the whole organisation rather than only their own records.
"""
import json
from datetime import datetime, date, timedelta

from flask import Blueprint, request, jsonify
from sqlalchemy import func

from models import (
    db, User, Attendance, LeaveRequest, DailyWorkLog, Holiday,
    AppSetting, DEFAULT_SETTINGS, HOLIDAY_TYPES,
)
from middleware.auth import login_required

hr_bp = Blueprint('hr', __name__, url_prefix='/api/hr')

HR_ROLES = ('hr', 'admin', 'super_admin')

# Roles that are company staff — clients are external and never counted.
STAFF_EXCLUDED_ROLES = ('client',)


def _require_hr(user):
    return user.role in HR_ROLES


def _forbidden():
    return jsonify({'error': 'Access denied. HR role required.'}), 403


# ─── settings helpers ──────────────────────────────────────────────

def _setting(key):
    row = AppSetting.query.filter_by(key=key).first()
    if row and (row.value or '').strip():
        return row.value
    return DEFAULT_SETTINGS.get(key, {}).get('value', '')


def _weekly_offs():
    """Weekday numbers that are non-working (Mon=0 ... Sun=6)."""
    try:
        vals = json.loads(_setting('hr_weekly_offs') or '[6]')
        return {int(v) for v in vals if 0 <= int(v) <= 6}
    except (ValueError, TypeError):
        return {6}


def _full_day_hours():
    try:
        return float(_setting('hr_full_day_hours') or 8)
    except (ValueError, TypeError):
        return 8.0


# ─── date helpers ──────────────────────────────────────────────────

def _parse_date(value, fallback=None):
    if not value:
        return fallback
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return fallback


def _holiday_map(start, end):
    rows = Holiday.query.filter(Holiday.date >= start, Holiday.date <= end).all()
    return {h.date: h for h in rows}


def _day_type(d, holidays, offs):
    """Classify a calendar date. Holidays win over weekly offs."""
    if d in holidays:
        return 'Holiday'
    if d.weekday() in offs:
        return 'Weekend'
    return 'Working'


def _working_days(start, end, holidays, offs):
    days, cur = [], start
    while cur <= end:
        if _day_type(cur, holidays, offs) == 'Working':
            days.append(cur)
        cur += timedelta(days=1)
    return days


# ─── data helpers ──────────────────────────────────────────────────

def _staff_query(include_inactive=False):
    q = User.query.filter(~User.role.in_(STAFF_EXCLUDED_ROLES))
    if not include_inactive:
        q = q.filter(User.is_active.is_(True))
    return q


def _leave_map(start, end):
    """user_id -> list of approved LeaveRequest overlapping the window."""
    rows = LeaveRequest.query.filter(
        LeaveRequest.status == 'Approved',
        LeaveRequest.from_date <= end,
        LeaveRequest.to_date >= start,
    ).all()
    out = {}
    for lv in rows:
        out.setdefault(lv.user_id, []).append(lv)
    return out


def _leave_on(leaves_for_user, d):
    for lv in leaves_for_user or []:
        if lv.from_date <= d <= lv.to_date:
            return lv
    return None


def _hours(rec):
    if rec and rec.clock_in and rec.clock_out:
        return round((rec.clock_out - rec.clock_in).total_seconds() / 3600, 2)
    return 0.0


def _build_roster(target_date, holidays, offs, include_inactive=False):
    """Per-employee attendance status for a single date."""
    staff = _staff_query(include_inactive).order_by(User.first_name).all()
    staff_ids = [u.id for u in staff]
    day_type = _day_type(target_date, holidays, offs)
    today = date.today()

    att_rows = Attendance.query.filter(
        Attendance.date == target_date,
        Attendance.user_id.in_(staff_ids) if staff_ids else False,
    ).order_by(Attendance.clock_in.asc()).all()
    # Keep the first clock-in of the day, but the last clock-out.
    att_by_user = {}
    for r in att_rows:
        prev = att_by_user.get(r.user_id)
        if prev is None:
            att_by_user[r.user_id] = r
        elif r.clock_out and (not prev.clock_out or r.clock_out > prev.clock_out):
            att_by_user[r.user_id] = r

    leaves = _leave_map(target_date, target_date)

    log_ids = set()
    if staff_ids:
        log_ids = {
            row[0] for row in db.session.query(DailyWorkLog.user_id).filter(
                DailyWorkLog.date == target_date,
                DailyWorkLog.user_id.in_(staff_ids),
            ).all()
        }

    records = []
    for u in staff:
        rec = att_by_user.get(u.id)
        leave = _leave_on(leaves.get(u.id), target_date)

        if rec and rec.clock_in:
            status = 'Working' if not rec.clock_out and target_date == today else 'Present'
        elif leave:
            status = 'On Leave'
        elif day_type != 'Working':
            status = day_type
        elif target_date > today:
            status = 'Upcoming'
        else:
            status = 'Absent'

        records.append({
            'user_id': u.id,
            'emp_id': u.emp_id,
            'name': u.full_name,
            'email': u.email,
            'department': u.department,
            'designation': u.designation,
            'role': u.role,
            'is_active': u.is_active,
            'status': status,
            'clock_in': rec.clock_in.strftime('%Y-%m-%dT%H:%M:%SZ') if rec and rec.clock_in else None,
            'clock_out': rec.clock_out.strftime('%Y-%m-%dT%H:%M:%SZ') if rec and rec.clock_out else None,
            'hours': _hours(rec),
            'work_mode': rec.work_mode if rec else None,
            'location_name': rec.location_name if rec else None,
            'face_verified': rec.face_verified if rec else False,
            'project_name': rec.project.title if rec and rec.project else None,
            'work_description': rec.work_description if rec else None,
            'work_log_submitted': u.id in log_ids,
            'leave_type': leave.leave_type if leave else None,
            'attendance_id': rec.id if rec else None,
        })
    return records, day_type


# ─── dashboard ─────────────────────────────────────────────────────

@hr_bp.route('/dashboard', methods=['GET'])
@login_required
def dashboard(current_user):
    if not _require_hr(current_user):
        return _forbidden()

    today = date.today()
    target = _parse_date(request.args.get('date'), today)
    offs = _weekly_offs()

    trend_start = target - timedelta(days=29)
    holidays = _holiday_map(trend_start, target + timedelta(days=60))

    records, day_type = _build_roster(target, holidays, offs)
    holiday = holidays.get(target)

    counts = {'Present': 0, 'Working': 0, 'On Leave': 0, 'Absent': 0,
              'Weekend': 0, 'Holiday': 0, 'Upcoming': 0}
    for r in records:
        counts[r['status']] = counts.get(r['status'], 0) + 1

    total_staff = len(records)
    present_total = counts['Present'] + counts['Working']
    logs_submitted = sum(1 for r in records if r['work_log_submitted'])

    # Headcount breakdowns. NULL and '' are separate groups in SQL but mean the
    # same thing to a human, so fold them together after grouping.
    def _tally(rows, label, blank):
        merged = {}
        for value, count in rows:
            key = (value or '').strip() or blank
            merged[key] = merged.get(key, 0) + count
        return sorted(
            [{label: k, 'count': v} for k, v in merged.items()],
            key=lambda x: -x['count'],
        )

    staff_filter = (~User.role.in_(STAFF_EXCLUDED_ROLES), User.is_active.is_(True))
    by_dept = _tally(
        db.session.query(User.department, func.count(User.id))
        .filter(*staff_filter).group_by(User.department).all(),
        'department', 'Unassigned',
    )
    by_role = _tally(
        db.session.query(User.role, func.count(User.id))
        .filter(*staff_filter).group_by(User.role).all(),
        'role', 'unassigned',
    )

    inactive_count = _staff_query(include_inactive=True).filter(User.is_active.is_(False)).count()

    # 14-day attendance trend (working days only)
    trend = []
    trend_days = [target - timedelta(days=i) for i in range(13, -1, -1)]
    staff_ids = [u.id for u in _staff_query().all()]
    if staff_ids and trend_days:
        span_start, span_end = trend_days[0], trend_days[-1]
        present_by_date = {}
        for d, uid in db.session.query(Attendance.date, Attendance.user_id).filter(
            Attendance.date >= span_start, Attendance.date <= span_end,
            Attendance.user_id.in_(staff_ids), Attendance.clock_in.isnot(None),
        ).distinct().all():
            present_by_date.setdefault(d, set()).add(uid)

        span_leaves = _leave_map(span_start, span_end)
        for d in trend_days:
            dt = _day_type(d, holidays, offs)
            present_ids = present_by_date.get(d, set())
            # Attendance wins over leave, matching the roster — otherwise someone
            # who worked during an approved leave is counted in both buckets.
            on_leave = sum(
                1 for uid in staff_ids
                if uid not in present_ids and _leave_on(span_leaves.get(uid), d)
            )
            present = len(present_ids)
            trend.append({
                'date': d.isoformat(),
                'day_type': dt,
                'present': present,
                'on_leave': on_leave,
                'absent': max(len(staff_ids) - present - on_leave, 0) if dt == 'Working' else 0,
            })

    pending_leaves = LeaveRequest.query.filter_by(status='Pending').count()

    recent_joiners = [
        {'id': u.id, 'name': u.full_name, 'department': u.department,
         'designation': u.designation, 'joined_at': u.created_at.isoformat() if u.created_at else None}
        for u in _staff_query().filter(User.created_at >= datetime.utcnow() - timedelta(days=30))
        .order_by(User.created_at.desc()).limit(5).all()
    ]

    upcoming_holidays = [
        h.to_dict() for h in Holiday.query
        .filter(Holiday.date >= today).order_by(Holiday.date.asc()).limit(5).all()
    ]

    missing_manager = _staff_query().filter(
        User.reporting_manager_id.is_(None),
        ~User.role.in_(('admin', 'super_admin')),
    ).count()

    return jsonify({
        'date': target.isoformat(),
        'day_type': day_type,
        'holiday_name': holiday.name if holiday else None,
        'headcount': {
            'total': total_staff,
            'inactive': inactive_count,
            'by_department': by_dept,
            'by_role': by_role,
            'missing_reporting_manager': missing_manager,
        },
        'attendance': {
            'present': present_total,
            'still_working': counts['Working'],
            'on_leave': counts['On Leave'],
            'absent': counts['Absent'],
            'non_working': counts['Weekend'] + counts['Holiday'],
            'total': total_staff,
            'percent': round(present_total / total_staff * 100) if total_staff else 0,
        },
        'work_log': {
            'submitted': logs_submitted,
            'expected': present_total,
            'missing': max(present_total - logs_submitted, 0),
        },
        'pending_leave_requests': pending_leaves,
        'trend': trend,
        'recent_joiners': recent_joiners,
        'upcoming_holidays': upcoming_holidays,
        'on_leave_today': [r for r in records if r['status'] == 'On Leave'],
        'absent_today': [r for r in records if r['status'] == 'Absent'],
        'missing_work_log': [
            r for r in records
            if r['status'] in ('Present', 'Working') and not r['work_log_submitted']
        ],
    })


# ─── daily attendance roster ───────────────────────────────────────

@hr_bp.route('/attendance', methods=['GET'])
@login_required
def attendance_roster(current_user):
    if not _require_hr(current_user):
        return _forbidden()

    target = _parse_date(request.args.get('date'), date.today())
    offs = _weekly_offs()
    holidays = _holiday_map(target, target)
    include_inactive = request.args.get('include_inactive') == 'true'

    records, day_type = _build_roster(target, holidays, offs, include_inactive)

    dept = (request.args.get('department') or '').strip()
    status = (request.args.get('status') or '').strip()
    q = (request.args.get('q') or '').strip().lower()

    filtered = records
    if dept:
        filtered = [r for r in filtered if (r['department'] or '') == dept]
    if status:
        filtered = [r for r in filtered if r['status'] == status]
    if q:
        filtered = [
            r for r in filtered
            if q in (r['name'] or '').lower()
            or q in (r['email'] or '').lower()
            or q in (r['emp_id'] or '').lower()
        ]

    summary = {'present': 0, 'still_working': 0, 'on_leave': 0, 'absent': 0, 'non_working': 0}
    for r in records:
        if r['status'] == 'Present':
            summary['present'] += 1
        elif r['status'] == 'Working':
            summary['present'] += 1
            summary['still_working'] += 1
        elif r['status'] == 'On Leave':
            summary['on_leave'] += 1
        elif r['status'] == 'Absent':
            summary['absent'] += 1
        elif r['status'] in ('Weekend', 'Holiday'):
            summary['non_working'] += 1
    summary['total'] = len(records)

    holiday = holidays.get(target)
    return jsonify({
        'date': target.isoformat(),
        'day_type': day_type,
        'holiday_name': holiday.name if holiday else None,
        'summary': summary,
        'records': filtered,
        'departments': sorted({r['department'] for r in records if r['department']}),
    })


# ─── range summary per employee ────────────────────────────────────

@hr_bp.route('/attendance/summary', methods=['GET'])
@login_required
def attendance_summary(current_user):
    if not _require_hr(current_user):
        return _forbidden()

    today = date.today()
    end = _parse_date(request.args.get('end_date'), today)
    start = _parse_date(request.args.get('start_date'), end - timedelta(days=29))
    if start > end:
        start, end = end, start
    # Cap the window so a huge range can't stall the request.
    if (end - start).days > 186:
        start = end - timedelta(days=186)

    offs = _weekly_offs()
    holidays = _holiday_map(start, end)
    working = _working_days(start, end, holidays, offs)
    working_set = set(working)
    full_day = _full_day_hours()

    staff = _staff_query().order_by(User.first_name).all()
    staff_ids = [u.id for u in staff]
    if not staff_ids:
        return jsonify({'start_date': start.isoformat(), 'end_date': end.isoformat(),
                        'working_days': 0, 'rows': []})

    att_rows = Attendance.query.filter(
        Attendance.date >= start, Attendance.date <= end,
        Attendance.user_id.in_(staff_ids), Attendance.clock_in.isnot(None),
    ).all()

    per_user = {}
    for r in att_rows:
        bucket = per_user.setdefault(r.user_id, {'days': set(), 'hours': 0.0})
        bucket['days'].add(r.date)
        bucket['hours'] += _hours(r)

    leaves = _leave_map(start, end)
    log_counts = dict(
        db.session.query(DailyWorkLog.user_id, func.count(DailyWorkLog.id))
        .filter(DailyWorkLog.date >= start, DailyWorkLog.date <= end,
                DailyWorkLog.user_id.in_(staff_ids))
        .group_by(DailyWorkLog.user_id).all()
    )

    dept_filter = (request.args.get('department') or '').strip()
    rows = []
    for u in staff:
        if dept_filter and (u.department or '') != dept_filter:
            continue
        bucket = per_user.get(u.id, {'days': set(), 'hours': 0.0})
        present_days = len(bucket['days'] & working_set)
        leave_days = sum(1 for d in working if _leave_on(leaves.get(u.id), d))
        absent_days = max(len(working) - present_days - leave_days, 0)
        total_hours = round(bucket['hours'], 2)
        rows.append({
            'user_id': u.id,
            'emp_id': u.emp_id,
            'name': u.full_name,
            'department': u.department,
            'designation': u.designation,
            'present_days': present_days,
            'leave_days': leave_days,
            'absent_days': absent_days,
            'total_hours': total_hours,
            'avg_hours': round(total_hours / present_days, 2) if present_days else 0,
            'expected_hours': round(len(working) * full_day, 2),
            'attendance_percent': round(present_days / len(working) * 100) if working else 0,
            'work_logs': log_counts.get(u.id, 0),
        })

    return jsonify({
        'start_date': start.isoformat(),
        'end_date': end.isoformat(),
        'working_days': len(working),
        'full_day_hours': full_day,
        'rows': rows,
        'departments': sorted({u.department for u in staff if u.department}),
    })


# ─── leave register ────────────────────────────────────────────────

@hr_bp.route('/leaves', methods=['GET'])
@login_required
def leaves(current_user):
    if not _require_hr(current_user):
        return _forbidden()

    q = LeaveRequest.query
    status = (request.args.get('status') or '').strip()
    if status:
        q = q.filter(LeaveRequest.status == status)
    uid = request.args.get('user_id', type=int)
    if uid:
        q = q.filter(LeaveRequest.user_id == uid)
    start = _parse_date(request.args.get('from_date'))
    end = _parse_date(request.args.get('to_date'))
    if start:
        q = q.filter(LeaveRequest.to_date >= start)
    if end:
        q = q.filter(LeaveRequest.from_date <= end)

    rows = q.order_by(LeaveRequest.created_at.desc()).limit(500).all()
    counts = dict(
        db.session.query(LeaveRequest.status, func.count(LeaveRequest.id))
        .group_by(LeaveRequest.status).all()
    )

    out = []
    for lv in rows:
        d = lv.to_dict()
        d['days'] = (lv.to_date - lv.from_date).days + 1 if lv.from_date and lv.to_date else 0
        d['department'] = lv.user.department if lv.user else None
        out.append(d)

    return jsonify({
        'leaves': out,
        'counts': {
            'Pending': counts.get('Pending', 0),
            'Approved': counts.get('Approved', 0),
            'Rejected': counts.get('Rejected', 0),
        },
    })


# ─── holiday calendar ──────────────────────────────────────────────

@hr_bp.route('/holidays', methods=['GET'])
@login_required
def list_holidays(current_user):
    year = request.args.get('year', type=int) or date.today().year
    rows = Holiday.query.filter(
        Holiday.date >= date(year, 1, 1),
        Holiday.date <= date(year, 12, 31),
    ).order_by(Holiday.date.asc()).all()
    return jsonify({
        'year': year,
        'holidays': [h.to_dict() for h in rows],
        'weekly_offs': sorted(_weekly_offs()),
    })


@hr_bp.route('/holidays', methods=['POST'])
@login_required
def create_holiday(current_user):
    if not _require_hr(current_user):
        return _forbidden()
    data = request.get_json() or {}
    d = _parse_date(data.get('date'))
    name = (data.get('name') or '').strip()
    if not d or not name:
        return jsonify({'error': 'date and name are required'}), 400
    htype = data.get('holiday_type') or 'Public'
    if htype not in HOLIDAY_TYPES:
        return jsonify({'error': f'holiday_type must be one of: {", ".join(HOLIDAY_TYPES)}'}), 400
    if Holiday.query.filter_by(date=d).first():
        return jsonify({'error': 'A holiday already exists on this date'}), 409

    h = Holiday(date=d, name=name, holiday_type=htype, created_by=current_user.id)
    db.session.add(h)
    db.session.commit()
    return jsonify({'holiday': h.to_dict()}), 201


@hr_bp.route('/holidays/<int:hid>', methods=['DELETE'])
@login_required
def delete_holiday(current_user, hid):
    if not _require_hr(current_user):
        return _forbidden()
    h = Holiday.query.get_or_404(hid)
    db.session.delete(h)
    db.session.commit()
    return jsonify({'message': 'Holiday removed'})
