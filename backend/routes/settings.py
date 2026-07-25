from flask import Blueprint, request, jsonify
from datetime import datetime
from middleware.auth import login_required
from models import db
from models.settings import Setting, SettingVersion, SettingSuggestion, SETTING_GROUPS

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')


def log_version(setting, old_val, new_val, user_id):
    if old_val != new_val:
        db.session.add(SettingVersion(
            setting_id=setting.id,
            old_value=str(old_val or ''),
            new_value=str(new_val or ''),
            changed_by=user_id,
        ))


DEFAULT_SETTINGS = [
    ('organisation', 'company_name', 'INFOCUS IT CONSULTING PVT LTD', 'Company Name'),
    ('organisation', 'company_logo', '', 'Company Logo URL'),
    ('organisation', 'registered_address', 'A-19, Yadav Park, Rohtak Road, Nangloi, New Delhi – 110041', 'Registered Address'),
    ('organisation', 'gstin', '07AAGCI4467G1ZF', 'GSTIN', True),
    ('organisation', 'pan', '', 'PAN', True),
    ('organisation', 'tan', '', 'TAN', True),
    ('organisation', 'cin', '', 'CIN', True),
    ('organisation', 'udyam', '', 'Udyam Registration', True),
    ('organisation', 'gem_seller_id', '', 'GeM Seller ID', True),
    ('organisation', 'certifications', 'CERT-In Empanelled | ISO 9001 | ISO/IEC 27001 | CMMI L3', 'Certifications Line'),
    ('organisation', 'default_cc_email', 'accounts@infocus-it.com', 'Default CC Mailbox'),
    ('organisation', 'financial_year_start', '04', 'Financial Year Start Month'),
    ('organisation', 'date_format', 'DD.MM.YYYY', 'Date Format'),
    ('organisation', 'timezone', 'Asia/Kolkata', 'Timezone'),
    ('numbering', 'project_id_format', 'INF/PRJ/{FY}/###', 'Project ID Format', True),
    ('numbering', 'po_out_number_format', 'INFOCUS-IT/PO/{FY}/{CLIENT_CODE}/###', 'PO OUT Number Format', True),
    ('numbering', 'cid_b2b_format', 'CID-B2B-####', 'CID B2B Format', True),
    ('numbering', 'cid_b2c_format', 'CID-B2C-####', 'CID B2C Format', True),
    ('numbering', 'vendor_code_format', 'VN-####', 'Vendor Code Format', True),
    ('numbering', 'delivery_note_format', 'INF/DN/{FY}/###', 'Delivery Note Format', True),
    ('numbering', 'invoice_ref_format', 'INF/INV/{FY}/###', 'Invoice Reference Format', True),
    ('numbering', 'evidence_id_format', '{PRJ}-F-###', 'Evidence ID Format', True),
    ('financial', 'gst_rates', '0,5,12,18,28', 'GST Rates List', True),
    ('financial', 'home_state_code', '07', 'Home State Code', True),
    ('financial', 'tds_sections_rates', '194J:10,194C:2,194H:5,194I:10,194IA:1,195:30', 'TDS Sections & Default Rates', True),
    ('financial', 'payment_terms_presets', '100% within 30 days of delivery & acceptance|50-50 milestone|40-40-20 milestone', 'Payment Terms Presets'),
    ('financial', 'payment_reminder_day_1', '7', 'First Payment Reminder (days)'),
    ('financial', 'payment_reminder_day_2', '15', 'Second Payment Reminder (days)'),
    ('financial', 'payment_reminder_day_3', '30', 'Third Payment Reminder (days)'),
    ('financial', 'payment_escalation_day', '45', 'Payment Escalation (days)'),
    ('financial', 'bill_mandatory_limit', '500', 'Bill Mandatory Limit'),
    ('financial', 'credit_limit_default', '100000', 'Default Credit Limit'),
    ('financial', 'msme_45day_alert', 'true', 'MSME 45-Day Payment Alert', True),
    ('workflow', 'po_in_attachment_mandatory', 'true', 'PO IN: Attachment Mandatory Before Save'),
    ('workflow', 'plan_weights_must_total_100', 'true', 'Plan: Weights Must Total 100%'),
    ('workflow', 'checkout_hour_tolerance', '30', 'Check-Out Hour Tolerance (min)'),
    ('workflow', 'min_activity_text_chars', '15', 'Min Activity Text (chars)'),
    ('workflow', 'task_approval_by_pm', 'true', 'Task Approval by PM'),
    ('workflow', 'expense_approval_chain', 'PM→Accounts', 'Expense Approval Chain'),
    ('workflow', 'leave_approval_chain', 'PM→HR', 'Leave Approval Chain'),
    ('workflow', 'dormant_client_months', '12', 'Dormant Client Threshold (months)'),
    ('workflow', 'timeline_alert_lead_days', '3', 'Timeline Alert Lead (days)'),
    ('workflow', 'acknowledgement_discrepancy_days', '3', 'Acknowledgement Discrepancy Window (days)'),
    ('notifications', 'daily_digest_time', '19:00', 'Daily Digest Time'),
    ('notifications', 'management_weekly_summary_day', 'Monday', 'Management Weekly Summary Day'),
    ('notifications', 'management_weekly_summary_time', '09:00', 'Management Weekly Summary Time'),
    ('notifications', 'quiet_hours_start', '21:00', 'Quiet Hours Start'),
    ('notifications', 'quiet_hours_end', '08:00', 'Quiet Hours End'),
    ('security', 'password_min_length', '12', 'Minimum Password Length', True),
    ('security', 'password_expiry_days', '90', 'Password Expiry (days)', True),
    ('security', 'require_2fa', 'true', 'Require 2FA for Admin/Accounts', True),
    ('security', 'session_timeout_minutes', '30', 'Session Idle Timeout (minutes)', True),
    ('security', 'audit_log_retention_years', '7', 'Audit Log Retention (years)', True),
]


@settings_bp.route('/seed', methods=['POST'])
@login_required
def seed_settings(current_user):
    count = 0
    for group, key, value, label, *rest in DEFAULT_SETTINGS:
        is_sensitive = rest[0] if rest else False
        existing = Setting.query.filter_by(key=key).first()
        if not existing:
            db.session.add(Setting(
                group=group, key=key, value=str(value),
                label=label, data_type='boolean' if value in ('true', 'false') else 'string',
                is_sensitive=is_sensitive,
            ))
            count += 1
    db.session.commit()
    return jsonify({'message': f'Seeded {count} settings'})


@settings_bp.route('', methods=['GET'])
@login_required
def list_settings(current_user):
    group = request.args.get('group')
    q = Setting.query
    if group:
        q = q.filter_by(group=group)
    settings = q.order_by(Setting.group, Setting.key).all()
    return jsonify({'settings': [s.to_dict() for s in settings], 'groups': SETTING_GROUPS})


@settings_bp.route('/<int:sid>', methods=['PUT'])
@login_required
def update_setting(current_user, sid):
    setting = Setting.query.get_or_404(sid)
    data = request.get_json()
    old_val = setting.value
    if 'value' in data:
        setting.value = str(data['value'])
    if 'is_active' in data:
        setting.is_active = bool(data['is_active'])
    if 'effective_from' in data and data['effective_from']:
        setting.effective_from = datetime.strptime(data['effective_from'], '%Y-%m-%d').date()
    setting.updated_at = datetime.utcnow()
    if setting.is_sensitive:
        setting.maker_id = current_user.id
        setting.checker_id = None
        setting.checked_at = None
    log_version(setting, old_val, setting.value, current_user.id)
    db.session.commit()
    return jsonify({'setting': setting.to_dict()})


@settings_bp.route('/<int:sid>/approve', methods=['POST'])
@login_required
def approve_setting(current_user, sid):
    setting = Setting.query.get_or_404(sid)
    if not setting.is_sensitive:
        return jsonify({'error': 'Only sensitive settings need approval'}), 400
    setting.checker_id = current_user.id
    setting.checked_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'setting': setting.to_dict()})


@settings_bp.route('/<int:sid>/reject', methods=['POST'])
@login_required
def reject_setting(current_user, sid):
    setting = Setting.query.get_or_404(sid)
    if not setting.is_sensitive:
        return jsonify({'error': 'Only sensitive settings need approval'}), 400
    old_version = SettingVersion.query.filter_by(setting_id=sid).order_by(SettingVersion.id.desc()).first()
    if old_version:
        setting.value = old_version.old_value
    setting.checker_id = current_user.id
    setting.checked_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'setting': setting.to_dict()})


@settings_bp.route('/<int:sid>/history', methods=['GET'])
@login_required
def setting_history(current_user, sid):
    versions = SettingVersion.query.filter_by(setting_id=sid).order_by(SettingVersion.id.desc()).limit(50).all()
    return jsonify({'versions': [v.to_dict() for v in versions]})


@settings_bp.route('/suggestions', methods=['GET', 'POST'])
@login_required
def suggestions(current_user):
    if request.method == 'POST':
        data = request.get_json()
        if not data.get('parameter_name') or not data.get('reason'):
            return jsonify({'error': 'Parameter name and reason are required'}), 400
        if len(data['reason']) < 20:
            return jsonify({'error': 'Reason must be at least 20 characters'}), 400
        sug = SettingSuggestion(
            parameter_name=data['parameter_name'],
            module=data.get('module', ''),
            reason=data['reason'],
            example_values=data.get('example_values', ''),
            suggested_by=current_user.id,
        )
        db.session.add(sug)
        db.session.commit()
        return jsonify({'suggestion': sug.to_dict()}), 201
    suggestions = SettingSuggestion.query.order_by(SettingSuggestion.created_at.desc()).all()
    return jsonify({'suggestions': [s.to_dict() for s in suggestions]})


@settings_bp.route('/suggestions/<int:sid>', methods=['PUT'])
@login_required
def review_suggestion(current_user, sid):
    sug = SettingSuggestion.query.get_or_404(sid)
    data = request.get_json()
    status = data.get('status')
    if status not in ('accepted', 'rejected'):
        return jsonify({'error': 'Status must be accepted or rejected'}), 400
    if status == 'rejected' and not data.get('admin_remark'):
        return jsonify({'error': 'Remark required when rejecting'}), 400
    sug.status = status
    sug.admin_remark = data.get('admin_remark', '')
    db.session.commit()
    if status == 'accepted':
        key = sug.parameter_name.lower().replace(' ', '_').replace('-', '_')
        existing = Setting.query.filter_by(key=key).first()
        if not existing:
            db.session.add(Setting(
                group='masters', key=key, value=sug.example_values or '',
                label=sug.parameter_name, description=sug.reason, data_type='string',
            ))
            db.session.commit()
    return jsonify({'suggestion': sug.to_dict()})
