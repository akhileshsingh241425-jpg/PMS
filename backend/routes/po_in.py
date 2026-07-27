import os
from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Project, Client, POLineItem
from middleware.auth import login_required
from numbering_utils import gen_proj_id as configurable_gen_proj_id

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'po_in_docs')
os.makedirs(UPLOAD_DIR, exist_ok=True)

po_in_bp = Blueprint('po_in', __name__, url_prefix='/api/po-in')

PO_IN_STATUSES = [
    'WORK ORDER RECEIVED', 'IN PROGRESS', 'COMPLETED',
    'INVOICED', 'PAID', 'CANCELLED',
]

def gen_proj_id():
    return configurable_gen_proj_id()

def amount_to_words(n):
    if n is None:
        return 'Zero Rupees Only'
    n = int(round(n))
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    if n == 0:
        return 'Zero Rupees Only'
    def _words(num):
        if num < 20:
            return ones[num]
        if num < 100:
            return tens[num // 10] + (' ' + ones[num % 10] if num % 10 else '')
        if num < 1000:
            return ones[num // 100] + ' Hundred' + (' ' + _words(num % 100) if num % 100 else '')
        if num < 100000:
            return _words(num // 1000) + ' Thousand' + (' ' + _words(num % 1000) if num % 1000 else '')
        if num < 10000000:
            return _words(num // 100000) + ' Lakh' + (' ' + _words(num % 100000) if num % 100000 else '')
        return _words(num // 10000000) + ' Crore' + (' ' + _words(num % 10000000) if num % 10000000 else '')
    return _words(n) + ' Rupees Only'

def calc_gst(amount, gst_rate, client_state_code):
    company_state_code = '07'
    if client_state_code == company_state_code:
        gst = amount * gst_rate / 100
        cgst = sgst = gst / 2
        return {'gst_type': 'CGST+SGST', 'gst': gst, 'cgst': cgst, 'sgst': sgst}
    igst = amount * gst_rate / 100
    return {'gst_type': 'IGST', 'gst': igst, 'igst': igst, 'cgst': 0, 'sgst': 0}

@po_in_bp.route('/next-proj-id', methods=['GET'])
@login_required
def next_proj_id(current_user):
    return jsonify({'proj_id': gen_proj_id()})

@po_in_bp.route('/check-po', methods=['GET'])
@login_required
def check_duplicate_po(current_user):
    client_id = request.args.get('client_id', type=int)
    po_number = request.args.get('po_number', '').strip()
    if not client_id or not po_number:
        return jsonify({'exists': False})
    exists = Project.query.filter_by(client_id=client_id, po_number=po_number, direction='IN').first()
    return jsonify({'exists': exists is not None})

@po_in_bp.route('', methods=['GET'])
@login_required
def list_po_in(current_user):
    query = Project.query.filter_by(direction='IN')
    if s := request.args.get('status'):
        query = query.filter(Project.po_in_status == s.upper())
    if q := request.args.get('search'):
        query = query.filter(db.or_(
            Project.proj_id.ilike(f'%{q}%'),
            Project.po_number.ilike(f'%{q}%'),
            Project.title.ilike(f'%{q}%'),
        ))
    if cid := request.args.get('client_id', type=int):
        query = query.filter(Project.client_id == cid)
    query = query.order_by(Project.created_at.desc())
    projects = query.all()
    return jsonify({'po_list': [p.to_dict() for p in projects]})

@po_in_bp.route('', methods=['POST'])
@login_required
def create_po_in(current_user):
    data = request.get_json()
    client_id = data.get('client_id')
    if not client_id:
        return jsonify({'error': 'Client is required'}), 400
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404

    po_number = data.get('po_number', '').strip()
    if po_number:
        existing = Project.query.filter_by(client_id=client_id, po_number=po_number, direction='IN').first()
        if existing:
            return jsonify({'error': f'PO number "{po_number}" already exists for this client'}), 400

    proj_id = data.get('proj_id') or gen_proj_id()
    title = data.get('title') or f'Work Order — {client.name}'
    po_date = None
    if pd_str := data.get('po_date'):
        try:
            po_date = datetime.strptime(pd_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    line_items_data = data.get('line_items') or []
    taxable_total = 0
    for item in line_items_data:
        qty = float(item.get('qty', 1) or 1)
        rate = float(item.get('rate', 0) or 0)
        taxable_total += qty * rate

    gst_rate = float(data.get('gst_rate', 18) or 18)
    client_state_code = client.state_code or ''
    gst_info = calc_gst(taxable_total, gst_rate, client_state_code)
    net_amount = taxable_total + gst_info['gst']

    project = Project(
        proj_id=proj_id,
        title=title,
        description=data.get('description'),
        direction='IN',
        client_id=client_id,
        po_number=po_number,
        po_date=po_date or datetime.utcnow().date(),
        total_value=taxable_total,
        po_amount=taxable_total,
        gst=gst_info['gst'],
        net_amount=net_amount,
        po_gst_type=gst_info['gst_type'],
        po_terms=data.get('po_terms'),
        po_in_status='WORK ORDER RECEIVED',
        po_delivery_period=data.get('delivery_period'),
        po_expected_completion_date=(
            datetime.strptime(data['expected_completion'], '%Y-%m-%d').date()
            if data.get('expected_completion') else None
        ),
        start_date=(
            datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            if data.get('start_date') else None
        ),
        target_date=(
            datetime.strptime(data['target_date'], '%Y-%m-%d').date()
            if data.get('target_date') else None
        ),
        po_special_terms=data.get('special_terms'),
        created_by=current_user.id,
    )
    po_amount_in_words_val = amount_to_words(net_amount)
    if po_amount_in_words_val:
        project.po_amount_in_words = po_amount_in_words_val

    db.session.add(project)
    db.session.flush()

    for item in line_items_data:
        qty = float(item.get('qty', 1) or 1)
        rate = float(item.get('rate', 0) or 0)
        li = POLineItem(
            po_id=project.id,
            item_name=item.get('item_name', ''),
            sac_hsn=item.get('sac_hsn'),
            qty=qty,
            rate=rate,
            taxable_value=qty * rate,
            gst_rate=float(item.get('gst_rate', gst_rate) or gst_rate),
        )
        db.session.add(li)

    # Auto-transition client: PROSPECT → ACTIVE on first PO
    if client and client.status == 'PROSPECT':
        client.status = 'ACTIVE'
        client.status_changed_at = datetime.utcnow()
        client.last_business_date = datetime.utcnow().date()

    db.session.commit()
    return jsonify({'message': 'Work Order created', 'po': project.to_dict()}), 201

@po_in_bp.route('/<int:pid>', methods=['GET'])
@login_required
def get_po_in(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='IN').first_or_404()
    data = project.to_dict()
    data['client'] = project.client.to_dict() if project.client else None
    data['po_document_url'] = None
    if project.po_document_id:
        from models.project import ProjectDocument
        doc = ProjectDocument.query.get(project.po_document_id)
        if doc:
            data['po_document_url'] = f'/api/projects/documents/{doc.id}'
            data['po_document_name'] = doc.file_name
    return jsonify({'po': data})

@po_in_bp.route('/<int:pid>', methods=['PUT'])
@login_required
def update_po_in(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='IN').first_or_404()
    data = request.get_json()

    if project.po_in_status in ('PAID', 'CANCELLED'):
        return jsonify({'error': 'Cannot edit a paid or cancelled work order'}), 400

    for f in ['title', 'description', 'po_terms', 'po_special_terms',
              'po_delivery_period']:
        if f in data:
            setattr(project, f, data[f] or None)

    if 'po_number' in data:
        po_number = data['po_number'].strip()
        if po_number:
            existing = Project.query.filter(
                Project.client_id == project.client_id,
                Project.po_number == po_number,
                Project.direction == 'IN',
                Project.id != pid,
            ).first()
            if existing:
                return jsonify({'error': f'PO number "{po_number}" already exists for this client'}), 400
        project.po_number = po_number

    if 'po_date' in data and data['po_date']:
        try:
            project.po_date = datetime.strptime(data['po_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    if 'expected_completion' in data and data['expected_completion']:
        try:
            project.po_expected_completion_date = datetime.strptime(data['expected_completion'], '%Y-%m-%d').date()
        except ValueError:
            pass
    elif 'expected_completion' in data:
        project.po_expected_completion_date = None

    for f in ['start_date', 'target_date']:
        if f in data and data[f]:
            try:
                setattr(project, f, datetime.strptime(data[f], '%Y-%m-%d').date())
            except ValueError:
                pass
        elif f in data:
            setattr(project, f, None)

    if 'line_items' in data:
        POLineItem.query.filter_by(po_id=pid).delete()
        taxable_total = 0
        for item in data['line_items']:
            qty = float(item.get('qty', 1) or 1)
            rate = float(item.get('rate', 0) or 0)
            taxable_total += qty * rate
            li = POLineItem(
                po_id=pid,
                item_name=item.get('item_name', ''),
                sac_hsn=item.get('sac_hsn'),
                qty=qty,
                rate=rate,
                taxable_value=qty * rate,
                gst_rate=float(item.get('gst_rate', 18) or 18),
            )
            db.session.add(li)
        gst_rate = float(data.get('gst_rate', 18) or 18)
        client = Client.query.get(project.client_id)
        client_state_code = client.state_code if client else ''
        gst_info = calc_gst(taxable_total, gst_rate, client_state_code)
        project.total_value = taxable_total
        project.po_amount = taxable_total
        project.gst = gst_info['gst']
        project.net_amount = taxable_total + gst_info['gst']
        project.po_gst_type = gst_info['gst_type']
        project.po_amount_in_words = amount_to_words(project.net_amount)

    db.session.commit()
    return jsonify({'po': project.to_dict()})

@po_in_bp.route('/<int:pid>/status', methods=['POST'])
@login_required
def update_po_in_status(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='IN').first_or_404()
    data = request.get_json()
    new_status = data.get('status', '').upper().replace(' ', '_')
    status_map = {
        'WORK ORDER RECEIVED': 'WORK ORDER RECEIVED',
        'IN PROGRESS': 'IN PROGRESS',
        'COMPLETED': 'COMPLETED',
        'INVOICED': 'INVOICED',
        'PAID': 'PAID',
        'CANCELLED': 'CANCELLED',
    }
    if new_status not in status_map and new_status not in [s.replace(' ', '_') for s in status_map]:
        return jsonify({'error': f'Invalid status: {new_status}. Valid: {", ".join(PO_IN_STATUSES)}'}), 400
    normalized = new_status
    for k, v in status_map.items():
        if new_status == k.replace(' ', '_') or new_status == k:
            normalized = v
            break
    if normalized == 'CANCELLED' and project.po_in_status in ('PAID', 'CANCELLED'):
        return jsonify({'error': 'Cannot cancel a paid or already cancelled work order'}), 400
    project.po_in_status = normalized
    if normalized == 'COMPLETED':
        project.po_work_completed = True
        project.po_work_completed_at = datetime.utcnow()
    elif normalized == 'IN PROGRESS':
        project.po_work_started = True
        project.po_work_started_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': f'Status updated to {normalized}', 'po': project.to_dict()})

@po_in_bp.route('/<int:pid>/attachment', methods=['POST'])
@login_required
def upload_attachment(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='IN').first_or_404()
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    from werkzeug.utils import secure_filename
    from models.project import ProjectDocument

    fname = secure_filename(f'po_in_{pid}_{file.filename}')
    path = os.path.join(UPLOAD_DIR, fname)
    file.save(path)

    doc = ProjectDocument(
        project_id=pid,
        file_name=file.filename,
        file_path=path,
        file_type=file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else '',
        category='PO Copy',
        uploaded_by=current_user.id,
    )
    db.session.add(doc)
    db.session.flush()
    project.po_document_id = doc.id
    db.session.commit()
    return jsonify({'message': 'File uploaded', 'document': doc.to_dict()})

@po_in_bp.route('/<int:pid>/acknowledge', methods=['POST'])
@login_required
def send_acknowledgement(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='IN').first_or_404()
    data = request.get_json() or {}
    client = project.client
    if not client:
        return jsonify({'error': 'Client not found'}), 404

    to_email = data.get('client_email') or client.contact_email
    if not to_email:
        return jsonify({'error': 'Client email is required. Add email to client profile.'}), 400

    company = {
        'name': 'INFOCUS IT CONSULTING PVT LTD',
        'gstin': '07AAGCI4467G1ZF',
        'address': 'A-19, Yadav Park, Rohtak Road, Nangloi, New Delhi – 110041',
        'website': 'www.infocus-it.com',
    }
    client_name = client.contact_name or client.name
    net_val = project.net_amount or 0
    fmt_curr = '₹{:,.2f}'.format(net_val)

    subject = f'Acknowledgement of Work Order — {project.po_number or project.proj_id}'

    items_html = ''
    for li in project.line_items:
        items_html += f'<tr><td style="padding:6px 8px;border-bottom:1px solid #E5E7EB">{li.item_name}</td><td style="padding:6px 8px;border-bottom:1px solid #E5E7EB;text-align:center">{li.qty}</td><td style="padding:6px 8px;border-bottom:1px solid #E5E7EB;text-align:right">{li.rate:,.2f}</td><td style="padding:6px 8px;border-bottom:1px solid #E5E7EB;text-align:right">{li.taxable_value:,.2f}</td></tr>'

    html = f'''
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; font-size: 20px; margin: 0; font-weight: 700;">{company['name']}</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px;">{company['address']}</p>
        </div>
        <div style="padding: 32px; background: #fff; border: 1px solid #E5E7EB; border-top: none;">
            <h2 style="font-size: 18px; color: #1e3a8a; margin: 0 0 16px; font-weight: 700;">ACKNOWLEDGEMENT OF WORK ORDER</h2>
            <p style="font-size: 14px; color: #374151; line-height: 1.6;">Dear <strong>{client_name}</strong>,</p>
            <p style="font-size: 14px; color: #374151; line-height: 1.6;">We thank you for entrusting us with the following work order. This is to acknowledge receipt of your Work Order / Purchase Order.</p>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 16px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr><td style="padding: 4px 0; color: #64748B; width: 140px;">Project ID</td><td style="padding: 4px 0; font-weight: 600;">{project.proj_id}</td></tr>
                    <tr><td style="padding: 4px 0; color: #64748B;">PO / WO Number</td><td style="padding: 4px 0; font-weight: 600;">{project.po_number or '—'}</td></tr>
                    <tr><td style="padding: 4px 0; color: #64748B;">PO Date</td><td style="padding: 4px 0; font-weight: 600;">{project.po_date.strftime("%d-%b-%Y") if project.po_date else '—'}</td></tr>
                    <tr><td style="padding: 4px 0; color: #64748B;">Description</td><td style="padding: 4px 0; font-weight: 600;">{project.title or '—'}</td></tr>
                    <tr><td style="padding: 4px 0; color: #64748B;">Total Order Value</td><td style="padding: 4px 0; font-weight: 700; color: #059669; font-size: 15px;">{fmt_curr}</td></tr>
                    <tr><td style="padding: 4px 0; color: #64748B;">Amount in Words</td><td style="padding: 4px 0; font-weight: 600;">{project.po_amount_in_words or amount_to_words(net_val)}</td></tr>
                    <tr><td style="padding: 4px 0; color: #64748B;">GST</td><td style="padding: 4px 0; font-weight: 600;">{project.po_gst_type or 'CGST+SGST'} — {fmt_curr.replace('₹', '₹')}</td></tr>
                </table>
            </div>

            {f'''
            <h3 style="font-size: 13px; color: #1e3a8a; margin: 16px 0 8px; font-weight: 700;">SCOPE OF WORK / LINE ITEMS</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead><tr style="background: #F1F5F9;"><th style="padding:8px;text-align:left;font-weight:600;">Item</th><th style="padding:8px;text-align:center;font-weight:600;">Qty</th><th style="padding:8px;text-align:right;font-weight:600;">Rate</th><th style="padding:8px;text-align:right;font-weight:600;">Amount</th></tr></thead>
                <tbody>{items_html}</tbody>
            </table>
            ''' if project.line_items else ''}

            {f'''
            <h3 style="font-size: 13px; color: #1e3a8a; margin: 16px 0 8px; font-weight: 700;">DELIVERY TERMS</h3>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #374151;">
                {f'<p style="margin:0 0 4px;"><strong>Period:</strong> {project.po_delivery_period}</p>' if project.po_delivery_period else ''}
                {f'<p style="margin:0 0 4px;"><strong>Expected Completion:</strong> {project.po_expected_completion_date.strftime("%d-%b-%Y") if project.po_expected_completion_date else ""}</p>'}
                {f'<p style="margin:0;"><strong>Other Terms:</strong> {project.po_special_terms}</p>' if project.po_special_terms else ''}
            </div>
            ''' if project.po_delivery_period or project.po_expected_completion_date or project.po_special_terms else ''}

            <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-top: 16px;">We confirm that the above work order has been registered in our system and the project has been initiated. We shall deliver the services as per the agreed scope and timeline. Any changes to the scope will be communicated and mutually agreed upon.</p>

            <p style="font-size: 14px; color: #374151; line-height: 1.6;">For any queries or clarifications, please feel free to contact us at <strong>info@infocus-it.com</strong> or call us at <strong>+91-8800006696</strong>.</p>

            <div style="border-top: 1px solid #E5E7EB; margin: 20px 0 12px; padding-top: 16px;">
                <p style="font-size: 14px; color: #374151; margin: 0 0 2px;">Warm Regards,</p>
                <p style="font-size: 14px; color: #1e3a8a; font-weight: 700; margin: 0 0 2px;">{current_user.full_name or current_user.email}</p>
                <p style="font-size: 13px; color: #64748B; margin: 0;">{current_user.designation or ''}<br>{company['name']}</p>
                <p style="font-size: 12px; color: #94A3B8; margin: 4px 0 0;">{company['website']} | {company['gstin']}</p>
            </div>

            <p style="font-size: 11px; color: #94A3B8; border-top: 1px solid #E5E7EB; padding-top: 12px; margin-top: 12px;">This is an auto-generated acknowledgement from PMS360. No signature is required.</p>
        </div>
    </div>'''

    try:
        from routes.email_integration import send_via_graph
        from models.email_integration import EmailAccount
        acct = EmailAccount.query.filter_by(is_active=True).first()
        if not acct:
            return jsonify({'error': 'No connected email account. Connect Microsoft email first.'}), 500
        cc_email = data.get('cc', 'accounts@infocus-it.com')
        ok, msg = send_via_graph(acct, to_email, cc_email, subject, html)
        if ok:
            project.po_acknowledged = True
            project.po_acknowledged_at = datetime.utcnow()
            project.po_acknowledgement_sent_to = to_email
            db.session.commit()
            return jsonify({'message': f'Acknowledgement sent to {to_email}'})
        return jsonify({'error': msg}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500
