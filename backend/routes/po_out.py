import os
from flask import Blueprint, request, jsonify, send_file
from datetime import datetime
from models import db, Project, Client, POLineItem, TDSRecord, POVersion, PoPayment
from middleware.auth import login_required
from utils import generate_id
from pdf_utils import generate_po_pdf
from email_utils import send_email_async

PO_PDF_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'po_pdfs')
os.makedirs(PO_PDF_DIR, exist_ok=True)

po_out_bp = Blueprint('po_out', __name__, url_prefix='/api/po-out')

PO_STATUS_MASTER = [
    'DRAFT', 'PO ISSUED', 'WORK IN PROGRESS', 'WORK COMPLETED',
    'PARTIALLY PAID', 'PAID & CLOSED', 'CANCELLED',
]

TDS_SECTIONS = {
    '194J': 10.0, '194C': 2.0, '194H': 5.0, '194I': 10.0, '194IA': 1.0, '195': 10.0,
}


def gen_po_number(vendor_id=None):
    now = datetime.utcnow()
    fy = f'{now.year}-{str(now.year+1)[2:]}' if now.month >= 4 else f'{now.year-1}-{str(now.year)[2:]}'
    code = 'XX'
    if vendor_id:
        from models.client import Client
        c = Client.query.get(vendor_id)
        if c and c.client_code:
            code = c.client_code
    prefix = f'INFOCUS-IT/PO/{fy}/{code}/'
    last = db.session.query(db.func.max(Project.po_number)).filter(Project.po_number.like(f'{prefix}%')).scalar()
    last_serial = 0
    if last and prefix in last:
        try:
            last_serial = int(last.replace(prefix, ''))
        except ValueError:
            pass
    return f'{prefix}{str(last_serial + 1).zfill(3)}'


def amount_to_words(n):
    if n is None:
        return 'Zero'
    n = int(round(n))
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    if n == 0:
        return 'Zero'
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


@po_out_bp.route('/next-po-number', methods=['GET'])
@login_required
def next_po_number(current_user):
    vid = request.args.get('vendor_id', type=int)
    return jsonify({'po_number': gen_po_number(vid)})


@po_out_bp.route('', methods=['GET'])
@login_required
def list_po_out(current_user):
    query = Project.query.filter_by(direction='OUT')
    if s := request.args.get('status'):
        query = query.filter(Project.po_out_status == s.upper())
    if q := request.args.get('search'):
        query = query.filter(db.or_(
            Project.po_number.ilike(f'%{q}%'),
            Project.vendor_name.ilike(f'%{q}%'),
            Project.title.ilike(f'%{q}%'),
        ))
    query = query.order_by(Project.created_at.desc())
    projects = query.all()
    return jsonify({
        'po_list': [p.to_dict() for p in projects],
    })


@po_out_bp.route('', methods=['POST'])
@login_required
def create_po_out(current_user):
    data = request.get_json()
    vendor_id = data.get('vendor_id')
    po_number = data.get('po_number') or gen_po_number(vendor_id)

    vendor_name = data.get('vendor_name')
    if not vendor_name:
        return jsonify({'error': 'Vendor name is required'}), 400

    title = data.get('title') or f'PO — {vendor_name}'
    po_date = None
    if pd_str := data.get('po_date'):
        try:
            po_date = datetime.strptime(pd_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    po_amount = data.get('po_amount', 0) or 0
    gst_rate = data.get('gst_rate', 18) or 0
    gst = po_amount * gst_rate / 100
    net_amount = po_amount + gst

    project = Project(
        proj_id=generate_id(Project, 'PO-'),
        title=title,
        direction='OUT',
        client_id=vendor_id,
        po_number=po_number,
        po_date=po_date or datetime.utcnow().date(),
        po_amount=po_amount,
        gst=gst,
        net_amount=net_amount,
        vendor_name=vendor_name,
        vendor_email=data.get('vendor_email'),
        vendor_gstin=data.get('vendor_gstin'),
        vendor_pan=data.get('vendor_pan'),
        vendor_address=data.get('vendor_address'),
        vendor_contact_person=data.get('vendor_contact_person'),
        vendor_phone=data.get('vendor_phone'),
        vendor_bank_account_no=data.get('vendor_bank_account_no'),
        vendor_bank_ifsc=data.get('vendor_bank_ifsc'),
        po_terms=data.get('po_terms'),
        po_delivery_period=data.get('po_delivery_period'),
        po_expected_completion_date=(
            datetime.strptime(data['po_expected_completion_date'], '%Y-%m-%d').date()
            if data.get('po_expected_completion_date') else None
        ),
        po_special_terms=data.get('po_special_terms'),
        po_gst_type=data.get('po_gst_type', 'CGST+SGST'),
        po_out_status='DRAFT',
        created_by=current_user.id,
    )
    po_amount_in_words_val = amount_to_words(net_amount)
    if po_amount_in_words_val:
        project.po_amount_in_words = po_amount_in_words_val

    db.session.add(project)
    db.session.flush()

    # create line items
    for item in (data.get('line_items') or []):
        qty = item.get('qty', 1) or 1
        rate = item.get('rate', 0) or 0
        taxable = item.get('taxable_value') or (qty * rate)
        li = POLineItem(
            po_id=project.id,
            item_name=item.get('item_name', ''),
            sac_hsn=item.get('sac_hsn'),
            qty=qty,
            rate=rate,
            taxable_value=taxable,
            gst_rate=item.get('gst_rate', gst_rate),
        )
        db.session.add(li)

    db.session.commit()
    return jsonify({'message': 'PO created', 'po': project.to_dict()}), 201


@po_out_bp.route('/<int:pid>', methods=['GET'])
@login_required
def get_po_out(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    data = project.to_dict()
    data['payments'] = [p.to_dict() for p in project.po_payments]
    data['tds_records'] = [t.to_dict() for t in project.tds_records]
    data['versions'] = [v.to_dict() for v in project.po_versions]
    return jsonify({'po': data})


@po_out_bp.route('/<int:pid>', methods=['PUT'])
@login_required
def update_po_out(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    data = request.get_json()

    if project.po_out_status in ('PAID & CLOSED', 'CANCELLED'):
        return jsonify({'error': 'Cannot edit a closed or cancelled PO'}), 400

    for f in ['title', 'vendor_name', 'vendor_email', 'vendor_gstin', 'vendor_pan',
              'vendor_address', 'vendor_contact_person', 'vendor_phone',
              'vendor_bank_account_no', 'vendor_bank_ifsc', 'po_terms',
              'po_delivery_period', 'po_special_terms', 'po_gst_type']:
        if f in data:
            setattr(project, f, data[f] or None)

    if 'po_amount' in data:
        project.po_amount = data['po_amount'] or 0
        gst_rate = data.get('gst_rate', 18)
        project.gst = project.po_amount * gst_rate / 100
        project.net_amount = project.po_amount + project.gst
        project.po_amount_in_words = amount_to_words(project.net_amount)

    if 'po_date' in data and data['po_date']:
        try:
            project.po_date = datetime.strptime(data['po_date'], '%Y-%m-%d').date()
        except ValueError:
            pass

    if 'po_expected_completion_date' in data and data['po_expected_completion_date']:
        try:
            project.po_expected_completion_date = datetime.strptime(
                data['po_expected_completion_date'], '%Y-%m-%d').date()
        except ValueError:
            pass
    elif 'po_expected_completion_date' in data:
        project.po_expected_completion_date = None

    # update line items: replace all
    if 'line_items' in data:
        POLineItem.query.filter_by(po_id=pid).delete()
        for item in data['line_items']:
            qty = item.get('qty', 1) or 1
            rate = item.get('rate', 0) or 0
            li = POLineItem(
                po_id=pid,
                item_name=item.get('item_name', ''),
                sac_hsn=item.get('sac_hsn'),
                qty=qty,
                rate=rate,
                taxable_value=item.get('taxable_value') or (qty * rate),
                gst_rate=item.get('gst_rate', 18),
            )
            db.session.add(li)

    db.session.commit()
    return jsonify({'po': project.to_dict()})


@po_out_bp.route('/<int:pid>/submit', methods=['POST'])
@login_required
def submit_po(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    if project.po_out_status not in ('DRAFT',):
        return jsonify({'error': 'PO already submitted'}), 400
    if not project.po_amount or project.po_amount <= 0:
        return jsonify({'error': 'PO amount must be greater than 0'}), 400

    project.po_out_status = 'PO ISSUED'
    db.session.commit()
    return jsonify({'message': 'PO Issued', 'po': project.to_dict()})


@po_out_bp.route('/<int:pid>/start-work', methods=['POST'])
@login_required
def start_work(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    if project.po_out_status != 'PO ISSUED':
        return jsonify({'error': 'PO must be Issued before starting work'}), 400
    project.po_out_status = 'WORK IN PROGRESS'
    project.po_work_started = True
    project.po_work_started_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Work started', 'po': project.to_dict()})


@po_out_bp.route('/<int:pid>/work-complete', methods=['POST'])
@login_required
def work_complete(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    if project.po_out_status != 'WORK IN PROGRESS':
        return jsonify({'error': 'Work must be in progress to mark complete'}), 400
    data = request.get_json()
    project.po_out_status = 'WORK COMPLETED'
    project.po_work_completed = True
    project.po_work_completed_at = datetime.utcnow()
    project.completion_date = (
        datetime.strptime(data['completion_date'], '%Y-%m-%d').date()
        if data.get('completion_date') else datetime.utcnow().date()
    )
    project.deliverables_received = data.get('deliverables_received')
    project.acceptance_remarks = data.get('acceptance_remarks')
    project.vendor_invoice_no = data.get('vendor_invoice_no')
    project.vendor_invoice_date = (
        datetime.strptime(data['vendor_invoice_date'], '%Y-%m-%d').date()
        if data.get('vendor_invoice_date') else None
    )
    db.session.commit()
    return jsonify({'message': 'Work completed', 'po': project.to_dict()})


@po_out_bp.route('/<int:pid>/payments', methods=['GET'])
@login_required
def list_payments(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    payments = PoPayment.query.filter_by(po_id=pid).order_by(PoPayment.date.desc()).all()
    total_paid = sum(p.amount or 0 for p in payments)
    total_tds = sum(p.tds_amount or 0 for p in payments)
    balance = (project.net_amount or 0) - total_paid
    return jsonify({
        'payments': [p.to_dict() for p in payments],
        'summary': {
            'total_paid': total_paid,
            'total_tds': total_tds,
            'balance': max(balance, 0),
            'is_settled': balance <= 0,
        },
    })


@po_out_bp.route('/<int:pid>/payments', methods=['POST'])
@login_required
def add_payment(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    if project.po_out_status not in ('WORK COMPLETED', 'PARTIALLY PAID'):
        return jsonify({'error': 'Work must be completed before recording payments'}), 400

    data = request.get_json()
    amount = data.get('amount', 0) or 0
    tds_applicable = data.get('tds_applicable', False)
    tds_section = data.get('tds_section') if tds_applicable else None
    tds_base = data.get('tds_base_amount') or (amount if tds_applicable else 0)
    tds_percent = data.get('tds_percent', 0) if tds_applicable else 0
    if tds_applicable and not tds_percent and tds_section:
        tds_percent = TDS_SECTIONS.get(tds_section, 0)
    tds_amount = data.get('tds_amount') or (tds_base * tds_percent / 100 if tds_applicable else 0)
    net_paid = data.get('net_paid') or (amount - tds_amount)

    payment = PoPayment(
        po_id=pid,
        amount=amount,
        date=datetime.strptime(data.get('date', datetime.utcnow().strftime('%Y-%m-%d')), '%Y-%m-%d').date(),
        mode=data.get('mode'),
        payment_mode=data.get('payment_mode'),
        utr_no=data.get('utr_no'),
        tds_section=tds_section,
        tds_percent=tds_percent,
        tds_amount=tds_amount,
        net_paid=net_paid,
        vendor_invoice_no=data.get('vendor_invoice_no'),
        vendor_invoice_date=(
            datetime.strptime(data['vendor_invoice_date'], '%Y-%m-%d').date()
            if data.get('vendor_invoice_date') else None
        ),
        remarks=data.get('remarks'),
        created_by=current_user.id,
    )
    db.session.add(payment)
    db.session.flush()

    # create TDS record if applicable
    if tds_applicable and tds_amount > 0:
        now = datetime.utcnow()
        quarter_map = {1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4'}
        q = quarter_map.get((now.month - 1) // 3 + 1, 'Q1')
        fy = f'{now.year}-{str(now.year+1)[2:]}' if now.month >= 4 else f'{now.year-1}-{str(now.year)[2:]}'
        tds_record = TDSRecord(
            po_id=pid,
            payment_id=payment.id,
            section=tds_section,
            base_amount=tds_base,
            tds_percent=tds_percent,
            tds_amount=tds_amount,
            quarter=q,
            financial_year=fy,
        )
        db.session.add(tds_record)

    # update PO status
    total_paid = db.session.query(db.func.coalesce(db.func.sum(PoPayment.amount), 0)).filter(
        PoPayment.po_id == pid).scalar()
    balance = (project.net_amount or 0) - total_paid
    project.advance_paid = total_paid
    project.balance_outstanding = max(balance, 0)
    project.po_out_status = 'PAID & CLOSED' if balance <= 0 else 'PARTIALLY PAID'

    db.session.commit()
    return jsonify({'message': 'Payment recorded', 'payment': payment.to_dict()}), 201


@po_out_bp.route('/payments/<int:pay_id>', methods=['DELETE'])
@login_required
def delete_payment(current_user, pay_id):
    payment = PoPayment.query.get_or_404(pay_id)
    pid = payment.po_id
    db.session.delete(payment)
    db.session.commit()

    project = Project.query.get(pid)
    if project and project.direction == 'OUT':
        total_paid = db.session.query(db.func.coalesce(db.func.sum(PoPayment.amount), 0)).filter(
            PoPayment.po_id == pid).scalar()
        balance = (project.net_amount or 0) - total_paid
        project.advance_paid = total_paid
        project.balance_outstanding = max(balance, 0)
        if project.po_out_status in ('PARTIALLY PAID', 'PAID & CLOSED'):
            project.po_out_status = 'PARTIALLY PAID' if total_paid > 0 else 'WORK COMPLETED'
        db.session.commit()

    return jsonify({'message': 'Payment deleted'})


@po_out_bp.route('/<int:pid>/cancel', methods=['POST'])
@login_required
def cancel_po(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    if project.po_out_status in ('PAID & CLOSED', 'CANCELLED'):
        return jsonify({'error': 'Cannot cancel a closed or already cancelled PO'}), 400
    data = request.get_json()
    project.po_out_status = 'CANCELLED'
    project.po_rejected_reason = data.get('reason', 'Cancelled')
    db.session.commit()
    return jsonify({'message': 'PO cancelled', 'po': project.to_dict()})


@po_out_bp.route('/<int:pid>/create-revision', methods=['POST'])
@login_required
def create_revision(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    if project.po_out_status not in ('PO ISSUED', 'WORK IN PROGRESS', 'WORK COMPLETED', 'PARTIALLY PAID'):
        return jsonify({'error': 'Cannot revise PO in current status'}), 400

    data = request.get_json()
    reason = data.get('reason', 'Revision')

    # create a new version record
    current_rev = project.po_revision_number or 0
    version = POVersion(
        po_id=pid,
        revision_number=current_rev,
        pdf_path=data.get('pdf_path'),
        reason=reason,
        created_by=current_user.id,
    )
    db.session.add(version)

    project.po_revision_number = current_rev + 1
    project.po_out_status = 'DRAFT'
    db.session.commit()
    return jsonify({'message': f'Revision Rev-{current_rev + 1} created', 'po': project.to_dict()})


@po_out_bp.route('/<int:pid>/generate-pdf', methods=['POST'])
@login_required
def generate_pdf(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    try:
        items = [li.to_dict() for li in project.line_items]
        pdf_bytes = generate_po_pdf(project, items)
        fname = f"{project.po_number or 'PO'}_{project.id}.pdf".replace('/', '_')
        path = os.path.join(PO_PDF_DIR, fname)
        with open(path, 'wb') as f:
            f.write(pdf_bytes)
        project.po_document_id = project.id
        db.session.commit()
        return jsonify({'message': 'PDF generated', 'path': f'/api/po-out/{pid}/pdf'})
    except Exception as e:
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500


@po_out_bp.route('/<int:pid>/pdf', methods=['GET'])
@login_required
def serve_pdf(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    fname = f"{project.po_number or 'PO'}_{project.id}.pdf".replace('/', '_')
    path = os.path.join(PO_PDF_DIR, fname)
    if not os.path.exists(path):
        return jsonify({'error': 'PDF not generated yet'}), 404
    return send_file(path, mimetype='application/pdf', as_attachment=False,
                     download_name=f"{project.po_number or 'PO'}.pdf")


@po_out_bp.route('/<int:pid>/send-mail', methods=['POST'])
@login_required
def send_po_mail(current_user, pid):
    project = Project.query.filter_by(id=pid, direction='OUT').first_or_404()
    data = request.get_json() or {}
    vendor_email = data.get('vendor_email') or project.vendor_email
    if not vendor_email:
        return jsonify({'error': 'Vendor email is required'}), 400

    # generate PDF if not exists
    fname = f"{project.po_number or 'PO'}_{project.id}.pdf".replace('/', '_')
    path = os.path.join(PO_PDF_DIR, fname)
    if not os.path.exists(path):
        items = [li.to_dict() for li in project.line_items]
        pdf_bytes = generate_po_pdf(project, items)
        with open(path, 'wb') as f:
            f.write(pdf_bytes)

    net_val = (project.net_amount or 0)
    fmt_curr = '₹{:,.2f}'.format(net_val)

    subject = f'Purchase Order No. {project.po_number or ""} dated {project.po_date.strftime("%d-%b-%Y") if project.po_date else ""} — {project.title or project.vendor_name or ""}'

    html = f'''
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #1e3a8a, #0052CC); padding: 20px 30px;">
            <h1 style="color: #fff; font-size: 18px; margin: 0;">INFOCUS IT CONSULTING PVT LTD</h1>
        </div>
        <div style="padding: 24px 30px; background: #fff;">
            <p>Dear {project.vendor_contact_person or 'Sir/Madam'},</p>
            <p>Please find attached our Purchase Order No. <b>{project.po_number or ''}</b> dated <b>{project.po_date.strftime("%d-%b-%Y") if project.po_date else ''}</b> for <b>{project.title or project.vendor_name or ''}</b>, for a net value of <b>{fmt_curr}</b> (inclusive of GST).</p>
            <p>Kindly acknowledge receipt of this Purchase Order by return mail and confirm the delivery schedule. Please quote the PO number on your invoice and all correspondence, and ensure your GST-compliant invoice is raised in favour of <b>INFOCUS IT CONSULTING PVT LTD</b> (GSTIN: 07AAGCI4467G1ZF).</p>
            <p>Payment shall be released as per the payment terms stated in the PO. TDS will be deducted as applicable under the Income Tax Act.</p>
            <br>
            <p>Warm Regards,<br><b>{current_user.full_name or current_user.email}</b><br>{current_user.designation or ''}<br>INFOCUS IT CONSULTING PVT LTD</p>
        </div>
        <div style="padding: 12px 30px; background: #f3f4f6; font-size: 11px; color: #666;">
            A-19, Yadav Park, Rohtak Road, Nangloi, New Delhi – 110041 | www.infocus-it.com
        </div>
    </div>'''

    # send via email_utils
    try:
        from flask_mail import Message
        from flask import current_app
        from email_utils import mail
        app = current_app._get_current_object()
        with app.app_context():
            msg = Message(subject, recipients=[vendor_email], cc=['accounts@infocus-it.com'], html=html)
            with app.open_resource(path) as fp:
                msg.attach(f"{project.po_number or 'PO'}.pdf", 'application/pdf', fp.read())
            mail.send(msg)
        return jsonify({'message': f'Email sent to {vendor_email}'})
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500


@po_out_bp.route('/report/tds-quarterly', methods=['GET'])
@login_required
def tds_quarterly_report(current_user):
    fy = request.args.get('financial_year')
    quarter = request.args.get('quarter')
    query = TDSRecord.query
    if fy:
        query = query.filter_by(financial_year=fy)
    if quarter:
        query = query.filter_by(quarter=quarter)
    records = query.order_by(TDSRecord.created_at.desc()).all()

    result = []
    for r in records:
        d = r.to_dict()
        proj = Project.query.get(r.po_id)
        d['vendor_name'] = proj.vendor_name if proj else None
        d['po_number'] = proj.po_number if proj else None
        result.append(d)

    # aggregate
    from collections import defaultdict
    agg = defaultdict(lambda: {'count': 0, 'total_tds': 0, 'total_base': 0})
    for r in records:
        key = r.section
        agg[key]['count'] += 1
        agg[key]['total_tds'] += (r.tds_amount or 0)
        agg[key]['total_base'] += (r.base_amount or 0)

    return jsonify({
        'records': result,
        'summary': dict(agg),
        'total_tds': sum(r.tds_amount or 0 for r in records),
    })
