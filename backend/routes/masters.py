from flask import Blueprint, request, jsonify
from models import db, SectorMaster, VendorCategoryMaster, AppSetting, DEFAULT_SETTINGS, CountryMaster, StateMaster, CityMaster
from middleware.auth import login_required

masters_bp = Blueprint('masters', __name__, url_prefix='/api/masters')


def _require_admin(user):
    if user.role not in ('admin', 'super_admin'):
        return False
    return True


# ─── SECTORS ───────────────────────────────────────────────

@masters_bp.route('/sectors', methods=['GET'])
@login_required
def list_sectors(current_user):
    sectors = SectorMaster.query.order_by(SectorMaster.name).all()
    return jsonify({'sectors': [s.to_dict() for s in sectors]})


@masters_bp.route('/sectors', methods=['POST'])
@login_required
def create_sector(current_user):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'name required'}), 400
    if SectorMaster.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Sector already exists'}), 400
    sector = SectorMaster(name=data['name'], is_active=data.get('is_active', True))
    db.session.add(sector)
    db.session.commit()
    return jsonify({'sector': sector.to_dict()}), 201


@masters_bp.route('/sectors/<int:sid>', methods=['PUT'])
@login_required
def update_sector(current_user, sid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    sector = SectorMaster.query.get_or_404(sid)
    data = request.get_json()
    if 'name' in data:
        sector.name = data['name']
    if 'is_active' in data:
        sector.is_active = data['is_active']
    db.session.commit()
    return jsonify({'sector': sector.to_dict()})


@masters_bp.route('/sectors/<int:sid>', methods=['DELETE'])
@login_required
def delete_sector(current_user, sid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    sector = SectorMaster.query.get_or_404(sid)
    db.session.delete(sector)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ─── VENDOR CATEGORIES ─────────────────────────────────────

@masters_bp.route('/vendor-categories', methods=['GET'])
@login_required
def list_vendor_categories(current_user):
    cats = VendorCategoryMaster.query.order_by(VendorCategoryMaster.name).all()
    return jsonify({'vendor_categories': [c.to_dict() for c in cats]})


@masters_bp.route('/vendor-categories', methods=['POST'])
@login_required
def create_vendor_category(current_user):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'name required'}), 400
    if VendorCategoryMaster.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Category already exists'}), 400
    cat = VendorCategoryMaster(name=data['name'], is_active=data.get('is_active', True))
    db.session.add(cat)
    db.session.commit()
    return jsonify({'vendor_category': cat.to_dict()}), 201


@masters_bp.route('/vendor-categories/<int:cid>', methods=['PUT'])
@login_required
def update_vendor_category(current_user, cid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    cat = VendorCategoryMaster.query.get_or_404(cid)
    data = request.get_json()
    if 'name' in data:
        cat.name = data['name']
    if 'is_active' in data:
        cat.is_active = data['is_active']
    db.session.commit()
    return jsonify({'vendor_category': cat.to_dict()})


@masters_bp.route('/vendor-categories/<int:cid>', methods=['DELETE'])
@login_required
def delete_vendor_category(current_user, cid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    cat = VendorCategoryMaster.query.get_or_404(cid)
    db.session.delete(cat)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ─── APP SETTINGS ──────────────────────────────────────────

@masters_bp.route('/settings', methods=['GET'])
@login_required
def list_settings(current_user):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    settings = AppSetting.query.order_by(AppSetting.key).all()
    return jsonify({'settings': [s.to_dict() for s in settings]})


@masters_bp.route('/settings/<int:sid>', methods=['PUT'])
@login_required
def update_setting(current_user, sid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    setting = AppSetting.query.get_or_404(sid)
    data = request.get_json()
    if 'value' in data:
        setting.value = data['value']
    if 'description' in data:
        setting.description = data['description']
    setting.updated_by = current_user.id
    db.session.commit()
    return jsonify({'setting': setting.to_dict()})


# ─── COUNTRIES ──────────────────────────────────────────────

@masters_bp.route('/countries', methods=['GET'])
@login_required
def list_countries(current_user):
    countries = CountryMaster.query.order_by(CountryMaster.name).all()
    return jsonify({'countries': [c.to_dict() for c in countries]})


@masters_bp.route('/countries', methods=['POST'])
@login_required
def create_country(current_user):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'name required'}), 400
    if CountryMaster.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Country already exists'}), 400
    country = CountryMaster(name=data['name'], code=data.get('code'), is_active=data.get('is_active', True))
    db.session.add(country)
    db.session.commit()
    return jsonify({'country': country.to_dict()}), 201


@masters_bp.route('/countries/<int:cid>', methods=['PUT'])
@login_required
def update_country(current_user, cid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    country = CountryMaster.query.get_or_404(cid)
    data = request.get_json()
    if 'name' in data: country.name = data['name']
    if 'code' in data: country.code = data['code']
    if 'is_active' in data: country.is_active = data['is_active']
    db.session.commit()
    return jsonify({'country': country.to_dict()})


@masters_bp.route('/countries/<int:cid>', methods=['DELETE'])
@login_required
def delete_country(current_user, cid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    country = CountryMaster.query.get_or_404(cid)
    db.session.delete(country)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ─── STATES ─────────────────────────────────────────────────

@masters_bp.route('/states', methods=['GET'])
@login_required
def list_states(current_user):
    q = StateMaster.query
    country_id = request.args.get('country_id')
    if country_id:
        q = q.filter_by(country_id=int(country_id))
    states = q.order_by(StateMaster.name).all()
    return jsonify({'states': [s.to_dict() for s in states]})


@masters_bp.route('/states', methods=['POST'])
@login_required
def create_state(current_user):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    if not data or not data.get('name') or not data.get('country_id'):
        return jsonify({'error': 'name and country_id required'}), 400
    state = StateMaster(name=data['name'], code=data.get('code'), country_id=data['country_id'], is_active=data.get('is_active', True))
    db.session.add(state)
    db.session.commit()
    return jsonify({'state': state.to_dict()}), 201


@masters_bp.route('/states/<int:sid>', methods=['PUT'])
@login_required
def update_state(current_user, sid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    state = StateMaster.query.get_or_404(sid)
    data = request.get_json()
    if 'name' in data: state.name = data['name']
    if 'code' in data: state.code = data['code']
    if 'country_id' in data: state.country_id = data['country_id']
    if 'is_active' in data: state.is_active = data['is_active']
    db.session.commit()
    return jsonify({'state': state.to_dict()})


@masters_bp.route('/states/<int:sid>', methods=['DELETE'])
@login_required
def delete_state(current_user, sid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    state = StateMaster.query.get_or_404(sid)
    db.session.delete(state)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ─── CITIES ─────────────────────────────────────────────────

@masters_bp.route('/cities', methods=['GET'])
@login_required
def list_cities(current_user):
    q = CityMaster.query
    state_id = request.args.get('state_id')
    if state_id:
        q = q.filter_by(state_id=int(state_id))
    cities = q.order_by(CityMaster.name).all()
    return jsonify({'cities': [c.to_dict() for c in cities]})


@masters_bp.route('/cities', methods=['POST'])
@login_required
def create_city(current_user):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    if not data or not data.get('name') or not data.get('state_id'):
        return jsonify({'error': 'name and state_id required'}), 400
    city = CityMaster(name=data['name'], state_id=data['state_id'], is_active=data.get('is_active', True))
    db.session.add(city)
    db.session.commit()
    return jsonify({'city': city.to_dict()}), 201


@masters_bp.route('/cities/<int:cid>', methods=['PUT'])
@login_required
def update_city(current_user, cid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    city = CityMaster.query.get_or_404(cid)
    data = request.get_json()
    if 'name' in data: city.name = data['name']
    if 'state_id' in data: city.state_id = data['state_id']
    if 'is_active' in data: city.is_active = data['is_active']
    db.session.commit()
    return jsonify({'city': city.to_dict()})


@masters_bp.route('/cities/<int:cid>', methods=['DELETE'])
@login_required
def delete_city(current_user, cid):
    if not _require_admin(current_user):
        return jsonify({'error': 'Admin access required'}), 403
    city = CityMaster.query.get_or_404(cid)
    db.session.delete(city)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
