from flask import Blueprint, request, jsonify
from models import db, Contact, Account
from middleware.auth import login_required
from datetime import datetime

contact_bp = Blueprint('contacts', __name__, url_prefix='/api/accounts')

@contact_bp.route('/<int:aid>/contacts', methods=['GET'])
@login_required
def list_contacts(current_user, aid):
    Account.query.get_or_404(aid)
    contacts = Contact.query.filter_by(account_id=aid).order_by(Contact.is_primary.desc(), Contact.created_at.desc()).all()
    return jsonify({'contacts': [c.to_dict() for c in contacts]})


@contact_bp.route('/<int:aid>/contacts', methods=['POST'])
@login_required
def create_contact(current_user, aid):
    Account.query.get_or_404(aid)
    data = request.get_json()
    if not data.get('first_name'):
        return jsonify({'error': 'first_name is required'}), 400

    if data.get('is_primary'):
        Contact.query.filter_by(account_id=aid, is_primary=True).update({'is_primary': False})
        db.session.flush()

    contact = Contact(
        account_id=aid,
        salutation=data.get('salutation'),
        first_name=data['first_name'],
        last_name=data.get('last_name'),
        email=data.get('email'),
        phone=data.get('phone'),
        mobile=data.get('mobile'),
        designation=data.get('designation'),
        department=data.get('department'),
        is_primary=data.get('is_primary', False),
        notes=data.get('notes'),
        created_by=current_user.id,
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify({'contact': contact.to_dict()}), 201


@contact_bp.route('/<int:aid>/contacts/<int:cid>', methods=['PUT'])
@login_required
def update_contact(current_user, aid, cid):
    Account.query.get_or_404(aid)
    contact = Contact.query.get_or_404(cid)
    data = request.get_json()

    if data.get('is_primary'):
        Contact.query.filter_by(account_id=aid, is_primary=True).update({'is_primary': False})
        db.session.flush()

    for f in ['salutation', 'first_name', 'last_name', 'email', 'phone', 'mobile',
              'designation', 'department', 'is_primary', 'notes']:
        if f in data:
            setattr(contact, f, data[f] if data[f] is not None else getattr(contact, f))
    db.session.commit()
    return jsonify({'contact': contact.to_dict()})


@contact_bp.route('/<int:aid>/contacts/<int:cid>', methods=['DELETE'])
@login_required
def delete_contact(current_user, aid, cid):
    Account.query.get_or_404(aid)
    contact = Contact.query.get_or_404(cid)
    db.session.delete(contact)
    db.session.commit()
    return jsonify({'message': 'Contact deleted'})
