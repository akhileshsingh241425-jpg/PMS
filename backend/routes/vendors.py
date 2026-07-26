from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Client, Project
from middleware.auth import login_required

vendor_bp = Blueprint('vendors', __name__, url_prefix='/api/vendors')


@vendor_bp.route('', methods=['GET'])
@login_required
def list_vendors(current_user):
    query = Client.query.filter_by(client_type='vendor')
    if s := request.args.get('search'):
        query = query.filter(db.or_(
            Client.name.ilike(f'%{s}%'), Client.client_code.ilike(f'%{s}%'),
            Client.gst_number.ilike(f'%{s}%'), Client.vendor_category.ilike(f'%{s}%'),
        ))
    if st := request.args.get('status'):
        query = query.filter_by(status=st)
    if cat := request.args.get('category'):
        query = query.filter_by(vendor_category=cat)
    query = query.order_by(Client.created_at.desc())
    vendors = query.all()

    result = []
    for v in vendors:
        data = v.to_dict()
        po_count = Project.query.filter(Project.vendor_name == v.name, Project.direction == 'OUT').count()
        data['project_count'] = po_count
        result.append(data)

    return jsonify({'vendors': result, 'total': len(result)})


@vendor_bp.route('/<int:vid>', methods=['GET'])
@login_required
def get_vendor(current_user, vid):
    vendor = Client.query.get_or_404(vid)
    data = vendor.to_dict()
    projects = Project.query.filter(Project.vendor_name == vendor.name, Project.direction == 'OUT').order_by(Project.updated_at.desc()).all()
    data['projects'] = [p.to_dict() for p in projects]
    data['project_count'] = len(projects)
    payment_summary = {
        'total_po_amount': sum(p.po_amount or 0 for p in projects),
        'total_net_amount': sum(p.net_amount or 0 for p in projects),
        'total_advance_paid': sum(p.advance_paid or 0 for p in projects),
        'total_balance_outstanding': sum(p.balance_outstanding or 0 for p in projects),
        'total_tds': sum(p.tds or 0 for p in projects),
        'total_gst': sum(p.gst or 0 for p in projects),
    }
    data['contacts'] = [c.to_dict() for c in vendor.contacts.order_by(Client.is_primary.desc()).all()] if hasattr(vendor, 'contacts') else []
    return jsonify({'vendor': data, 'payment_summary': payment_summary})
