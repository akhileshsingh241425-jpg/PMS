import os
from datetime import datetime
from weasyprint import HTML


def generate_po_pdf(project, line_items=None):
    po = project
    items = line_items or []
    if not items and hasattr(po, 'line_items'):
        items = [li.to_dict() for li in po.line_items]

    fmt_curr = lambda v: '₹{:,.2f}'.format(v or 0)
    fmt_date = lambda d: d.strftime('%d-%b-%Y') if d else '________'

    taxable = sum((i.get('taxable_value') or 0) for i in items)
    gst_rate = po.gst or 0
    if taxable > 0 and po.po_amount and po.po_amount > 0:
        gst_rate = round((po.gst or 0) / po.po_amount * 100, 1) if po.po_amount else 18
    gst = taxable * gst_rate / 100
    net = taxable + gst

    item_rows = ''
    for i, li in enumerate(items, 1):
        tval = li.get('taxable_value') or 0
        gst_amt = tval * (li.get('gst_rate') or 18) / 100
        item_rows += f'''
        <tr>
            <td style="text-align:center">{i}</td>
            <td>{li.get('item_name', '')}</td>
            <td style="text-align:center">{li.get('sac_hsn', '—')}</td>
            <td style="text-align:right">{li.get('qty', 1)}</td>
            <td style="text-align:right">{fmt_curr(li.get('rate', 0))}</td>
            <td style="text-align:right">{fmt_curr(tval)}</td>
            <td style="text-align:center">{li.get('gst_rate', 18)}%</td>
            <td style="text-align:right">{fmt_curr(tval + gst_amt)}</td>
        </tr>'''

    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>
        @page {{ size: A4; margin: 20mm 15mm; }}
        body {{ font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #1a1a2e; margin: 0; padding: 0; }}
        .header {{ text-align: center; margin-bottom: 20px; }}
        .header h1 {{ font-size: 16px; font-weight: 800; margin: 0 0 2px; color: #1e3a8a; }}
        .header p {{ margin: 0; font-size: 9px; color: #666; }}
        .header .divider {{ width: 80px; height: 3px; background: #0052CC; margin: 8px auto; border-radius: 2px; }}
        .header h2 {{ font-size: 14px; font-weight: 700; margin: 0; }}
        .meta {{ display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 10px; }}
        .meta div {{ width: 48%; }}
        .meta .right {{ text-align: right; }}
        table {{ width: 100%; border-collapse: collapse; font-size: 9.5px; margin-bottom: 12px; }}
        th {{ border-top: 2px solid #1a1a2e; border-bottom: 2px solid #1a1a2e; padding: 5px 6px; text-align: left; font-size: 9px; }}
        td {{ padding: 4px 6px; border-bottom: 1px solid #ddd; }}
        .totals {{ text-align: right; font-size: 10px; margin-left: auto; width: 280px; }}
        .totals div {{ padding: 2px 0; }}
        .totals .grand {{ border-top: 2px solid #1a1a2e; font-weight: 800; font-size: 12px; padding-top: 4px; }}
        .words {{ font-size: 10px; font-style: italic; font-weight: 600; margin: 10px 0; }}
        .terms {{ font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 10px; }}
        .terms p {{ margin: 0 0 2px; }}
        .sign {{ display: flex; justify-content: space-between; margin-top: 24px; font-size: 10px; }}
        .footer {{ position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 4px; }}
    </style>
    </head>
    <body>
        <div class="header">
            <h1>INFOCUS IT CONSULTING PVT LTD</h1>
            <p>A-19, Yadav Park, Rohtak Road, Nangloi, New Delhi – 110041</p>
            <p>GSTIN: 07AAGCI4467G1ZF | Email: info@infocus-it.com | www.infocus-it.com</p>
            <div class="divider"></div>
            <h2>PURCHASE ORDER</h2>
        </div>

        <div class="meta">
            <div>
                <b>PO No:</b> {po.po_number or '—'}<br>
                <b>Date:</b> {fmt_date(po.po_date)}<br>
                <b>GST Type:</b> {po.po_gst_type or 'CGST+SGST'}<br>
                <b>PO Value:</b> {fmt_curr(net)}
            </div>
            <div class="right">
                <b>{po.vendor_name or ''}</b><br>
                {po.vendor_address or ''}<br>
                GSTIN: {po.vendor_gstin or '—'}<br>
                PAN: {po.vendor_pan or '—'}
            </div>
        </div>

        <p style="font-size:10px;margin-bottom:8px"><b>Subject:</b> {po.title or po.vendor_name or ''}</p>

        <table>
            <thead>
                <tr>
                    <th style="width:30px">#</th>
                    <th>Item / Service</th>
                    <th style="width:60px">SAC/HSN</th>
                    <th style="width:40px">Qty</th>
                    <th style="width:70px">Rate</th>
                    <th style="width:75px">Taxable</th>
                    <th style="width:45px">GST%</th>
                    <th style="width:80px">Amount</th>
                </tr>
            </thead>
            <tbody>
                {item_rows}
            </tbody>
        </table>

        <div class="totals">
            <div><span>Total Taxable:</span> <b>{fmt_curr(taxable)}</b></div>
            <div><span>GST @ {gst_rate}%:</span> <b>{fmt_curr(gst)}</b></div>
            <div class="grand"><span>Net Amount:</span> <b>{fmt_curr(net)}</b></div>
        </div>

        <div class="words">Amount in words: {po.po_amount_in_words or ''}</div>

        <div class="terms">
            <p><b>Payment Terms:</b> {po.po_terms or 'As per agreement'}</p>
            {('<p><b>Delivery Period:</b> ' + po.po_delivery_period + '</p>') if po.po_delivery_period else ''}
            {('<p><b>Special Terms:</b> ' + po.po_special_terms + '</p>') if po.po_special_terms else ''}
            <p style="margin-top:4px">1. This PO is governed by the terms and conditions agreed between INFOCUS IT CONSULTING PVT LTD and the vendor.</p>
            <p>2. GST will be charged as applicable. TDS will be deducted under the Income Tax Act, 1961.</p>
            <p>3. Payment shall be released upon acceptance of deliverables and receipt of GST-compliant invoice.</p>
            <p>4. Any amendments to this PO must be issued in writing as a revised PO.</p>
        </div>

        <div class="sign">
            <div>
                <b>For INFOCUS IT CONSULTING PVT LTD</b><br>
                <br>
                Authorised Signatory
            </div>
            <div style="text-align:right">
                <b>Vendor Acceptance</b><br>
                <br>
                (Signature &amp; Stamp)
            </div>
        </div>

        <div class="footer">
            This is a computer-generated document. No signature is required. | PO: {po.po_number or ''} | Rev: {po.po_revision_number or 0} | Generated: {datetime.utcnow().strftime('%d-%b-%Y %H:%M')} UTC
        </div>
    </body>
    </html>'''

    pdf_bytes = HTML(string=html).write_pdf()
    return pdf_bytes
