from datetime import datetime
from models import db, AppSetting, DEFAULT_SETTINGS, Project, Client

def _get_setting(key):
    setting = AppSetting.query.filter_by(key=key).first()
    if setting:
        return setting.value
    return DEFAULT_SETTINGS.get(key, {}).get('value', '')

def _resolve_template(template, **kwargs):
    now = datetime.utcnow()
    fy = f'{now.year}-{str(now.year+1)[2:]}' if now.month >= 4 else f'{now.year-1}-{str(now.year)[2:]}'
    result = template.replace('{FY}', fy)
    for k, v in kwargs.items():
        placeholder = '{' + k + '}'
        if placeholder in result:
            result = result.replace(placeholder, str(v))
    return result

def gen_po_number(vendor_id=None):
    template = _get_setting('po_out_number_format')
    vendor_code = 'XX'
    if vendor_id:
        c = Client.query.get(vendor_id)
        if c and c.client_code:
            vendor_code = c.client_code
    prefix = _resolve_template(template, VENDOR_CODE=vendor_code)
    prefix_clean = prefix.rsplit('{N', 1)[0] if '{N' in template else prefix
    last = db.session.query(db.func.max(Project.po_number)).filter(
        Project.po_number.like(f'{prefix_clean}%')).scalar()
    last_serial = 0
    if last and prefix_clean and prefix_clean in last:
        try:
            serial_str = last.replace(prefix_clean, '')
            import re
            nums = re.findall(r'\d+', serial_str)
            if nums:
                last_serial = int(nums[-1])
        except ValueError:
            pass
    serial = last_serial + 1
    if '{N' in template:
        result = _resolve_template(template, VENDOR_CODE=vendor_code, N=serial)
    else:
        result = f'{prefix_clean}{serial:03d}'
    return result

def gen_proj_id():
    template = _get_setting('po_in_proj_id_format')
    prefix = _resolve_template(template)
    prefix_clean = prefix.rsplit('{N', 1)[0] if '{N' in template else prefix
    last = db.session.query(db.func.max(Project.proj_id)).filter(
        Project.proj_id.like(f'{prefix_clean}%')).scalar()
    last_serial = 0
    if last and prefix_clean and prefix_clean in last:
        try:
            serial_str = last.replace(prefix_clean, '')
            import re
            nums = re.findall(r'\d+', serial_str)
            if nums:
                last_serial = int(nums[-1])
        except ValueError:
            pass
    serial = last_serial + 1
    if '{N' in template:
        result = _resolve_template(template, N=serial)
    else:
        result = f'{prefix_clean}{serial:03d}'
    return result

def init_default_settings():
    for key, cfg in DEFAULT_SETTINGS.items():
        existing = AppSetting.query.filter_by(key=key).first()
        if not existing:
            setting = AppSetting(key=key, value=cfg['value'], description=cfg['description'])
            db.session.add(setting)
    db.session.commit()
