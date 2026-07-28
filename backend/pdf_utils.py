import os
import base64
from datetime import datetime
from weasyprint import HTML

NAVY = '#1F3864'
LIGHT_BLUE = '#D9E2F3'
GRAY = '#595959'

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')
_LOGO_CACHE = None


def _logo_data_uri():
    global _LOGO_CACHE
    if _LOGO_CACHE is None:
        path = os.path.join(ASSETS_DIR, 'infocus_logo.png')
        try:
            with open(path, 'rb') as f:
                _LOGO_CACHE = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')
        except OSError:
            _LOGO_CACHE = ''
    return _LOGO_CACHE


_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
         'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
         'Eighteen', 'Nineteen']
_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']


def _two_digits(n):
    if n < 20:
        return _ONES[n]
    return (_TENS[n // 10] + (' ' + _ONES[n % 10] if n % 10 else '')).strip()


def _three_digits(n):
    if n >= 100:
        rest = n % 100
        return _ONES[n // 100] + ' Hundred' + (' ' + _two_digits(rest) if rest else '')
    return _two_digits(n)


def amount_in_words(value):
    """Indian-numbering (lakh/crore) currency words, e.g. 'Rupees One Lakh Twenty Thousand Only'."""
    try:
        value = float(value or 0)
    except (TypeError, ValueError):
        value = 0
    rupees = int(round(value))
    if rupees == 0:
        return 'Rupees Zero Only'

    crore, rupees = divmod(rupees, 10000000)
    lakh, rupees = divmod(rupees, 100000)
    thousand, rupees = divmod(rupees, 1000)
    hundred = rupees

    parts = []
    if crore:
        parts.append(_three_digits(crore) + ' Crore')
    if lakh:
        parts.append(_three_digits(lakh) + ' Lakh')
    if thousand:
        parts.append(_three_digits(thousand) + ' Thousand')
    if hundred:
        parts.append(_three_digits(hundred))
    return 'Rupees ' + ' '.join(parts) + ' Only'


def generate_po_pdf(project, line_items=None):
    po = project
    items = line_items or []
    if not items and hasattr(po, 'line_items'):
        items = [li.to_dict() for li in po.line_items]

    fmt_curr = lambda v: '{:,.2f}'.format(v or 0)
    fmt_date = lambda d: d.strftime('%d.%m.%Y') if d else '________'

    taxable = 0.0
    gst_total = 0.0
    gst_rates_seen = set()
    item_rows = ''
    for i, li in enumerate(items, 1):
        tval = li.get('taxable_value') or 0
        rate_pct = li.get('gst_rate')
        rate_pct = 18 if rate_pct is None else rate_pct
        gst_amt = tval * rate_pct / 100
        taxable += tval
        gst_total += gst_amt
        gst_rates_seen.add(rate_pct)
        item_rows += f'''
        <tr>
            <td class="c">{i}</td>
            <td class="desc" colspan="2">{li.get('item_name', '')}</td>
            <td class="c">{li.get('sac_hsn') or '—'}</td>
            <td class="c">{li.get('qty', 1)}</td>
            <td class="c">{li.get('unit') or 'Nos'}</td>
            <td class="r">{fmt_curr(li.get('rate', 0))}</td>
            <td class="c">{rate_pct:g}%</td>
            <td class="r">{fmt_curr(tval + gst_amt)}</td>
        </tr>'''

    grand_total = taxable + gst_total
    words = po.po_amount_in_words or amount_in_words(grand_total)
    if len(gst_rates_seen) == 1:
        gst_label = f'GST {next(iter(gst_rates_seen)):g}%'
    else:
        gst_label = 'GST'

    payment_terms = po.po_terms or '100% within 30 days of delivery &amp; acceptance of invoice'
    delivery_period = po.po_delivery_period or 'Within ____ days from PO date'

    extra_terms = ''
    if po.po_special_terms:
        extra_terms = f'<li>{po.po_special_terms}</li>'

    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>
        @page {{ size: A4; margin: 15mm 15mm 12.3mm 15mm; }}
        * {{ box-sizing: border-box; }}
        body {{ font-family: 'Calibri', 'Carlito', 'DejaVu Sans', sans-serif; font-size: 10px; color: #000; margin: 0; padding: 0; }}

        .header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }}
        .company-name {{ font-size: 16pt; font-weight: bold; color: {NAVY}; margin: 0 0 3px; }}
        .company-details {{ font-size: 8.5pt; color: {GRAY}; margin: 0 0 1px; }}
        .logo {{ height: 13.5mm; width: auto; margin-top: 2px; }}

        .title {{ text-align: center; font-size: 17pt; font-weight: bold; color: {NAVY}; margin: 6px 0 10px; }}

        table {{ width: 100%; border-collapse: collapse; margin-bottom: 10px; }}
        td, th {{ border: 1px solid #999; padding: 4px 6px; font-size: 9pt; vertical-align: top; }}

        .meta-table td {{ width: 25%; }}
        .meta-table .label {{ background: {LIGHT_BLUE}; font-weight: bold; }}

        .parties-table th {{ background: {NAVY}; color: #fff; font-size: 9pt; text-align: left; padding: 5px 6px; }}
        .parties-table td {{ line-height: 1.5; }}

        .items-table th {{ background: {NAVY}; color: #fff; font-size: 8.5pt; text-align: center; padding: 5px 4px; }}
        .items-table td {{ font-size: 8.5pt; padding: 3px 5px; }}
        .items-table td.c {{ text-align: center; }}
        .items-table td.r {{ text-align: right; }}
        .items-table td.desc {{ text-align: left; }}
        .items-table .totals-label {{ text-align: right; font-weight: bold; }}
        .items-table .grand-row td {{ font-weight: bold; border-top: 2px solid {NAVY}; }}
        .items-table .words-row td {{ font-style: italic; }}

        .terms h3 {{ font-size: 9.5pt; color: {NAVY}; margin: 4px 0 4px; }}
        .terms ol {{ margin: 0; padding-left: 16px; font-weight: bold; font-size: 8pt; color: #000; }}
        .terms li {{ margin-bottom: 3px; }}

        .sign-table td {{ border: none; padding: 0; width: 50%; vertical-align: top; font-size: 9pt; }}
        .sign-table .line {{ margin-top: 26px; border-top: 1px solid #000; width: 75%; padding-top: 3px; }}

        .footer {{ position: fixed; bottom: -8mm; left: 0; right: 0; text-align: center; font-size: 7pt; color: #999; }}
    </style>
    </head>
    <body>
        <div class="header">
            <div>
                <p class="company-name">INFOCUS IT CONSULTING PVT LTD</p>
                <p class="company-details">A-19, Yadav Park, Rohtak Road, Nangloi, New Delhi &ndash; 110041</p>
                <p class="company-details">CIN: U72900DL2021PTC391076 | GSTIN: 07AAGCI4467G1ZF | PAN: AAGCI4467G</p>
                <p class="company-details">Tel: +91-81782 10903 | Email: support@infocus-it.com | www.infocus-it.com</p>
            </div>
            <img class="logo" src="{_logo_data_uri()}">
        </div>

        <div class="title">PURCHASE ORDER</div>

        <table class="meta-table">
            <tr>
                <td class="label">PO Number</td>
                <td>{po.po_number or '—'}</td>
                <td class="label">PO Date</td>
                <td>{fmt_date(po.po_date)}</td>
            </tr>
            <tr>
                <td class="label">Your Quotation Ref.</td>
                <td>—</td>
                <td class="label">Quotation Date</td>
                <td>—</td>
            </tr>
            <tr>
                <td class="label">Payment Terms</td>
                <td>{payment_terms}</td>
                <td class="label">Delivery Period</td>
                <td>{delivery_period}</td>
            </tr>
        </table>

        <table class="parties-table">
            <tr>
                <th style="width:50%">TO (VENDOR / SUPPLIER)</th>
                <th style="width:50%">BILL TO / SHIP TO</th>
            </tr>
            <tr>
                <td>
                    <b>M/s {po.vendor_name or ''}</b><br>
                    Address: {po.vendor_address or ''}<br>
                    GSTIN: {po.vendor_gstin or '—'}<br>
                    Contact Person: {po.vendor_contact_person or '—'}<br>
                    Phone / Email: {po.vendor_phone or ''}{' / ' if po.vendor_phone and po.vendor_email else ''}{po.vendor_email or ''}
                </td>
                <td>
                    <b>INFOCUS IT CONSULTING PVT LTD</b><br>
                    A-19, Yadav Park, Rohtak Road, Nangloi, New Delhi &ndash; 110041<br>
                    GSTIN: 07AAGCI4467G1ZF<br>
                    +91-81782 10903
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width:5%">S.No.</th>
                    <th style="width:28%" colspan="2">Description of Goods / Services</th>
                    <th style="width:9%">HSN/SAC</th>
                    <th style="width:6%">Qty</th>
                    <th style="width:8%">Unit</th>
                    <th style="width:11%">Rate (&#8377;)</th>
                    <th style="width:8%">GST %</th>
                    <th style="width:13%">Amount (&#8377;)</th>
                </tr>
            </thead>
            <tbody>
                {item_rows}
                <tr>
                    <td class="totals-label" colspan="8">Sub-Total</td>
                    <td class="r">{fmt_curr(taxable)}</td>
                </tr>
                <tr>
                    <td class="totals-label" colspan="8">{gst_label}</td>
                    <td class="r">{fmt_curr(gst_total)}</td>
                </tr>
                <tr class="grand-row">
                    <td class="totals-label" colspan="8">Grand Total (&#8377;)</td>
                    <td class="r">{fmt_curr(grand_total)}</td>
                </tr>
                <tr class="words-row">
                    <td colspan="2"><b>Amount in Words</b></td>
                    <td colspan="7">{words}</td>
                </tr>
            </tbody>
        </table>

        <div class="terms">
            <h3>Terms &amp; Conditions</h3>
            <ol>
                <li>This Purchase Order number must appear on all invoices, delivery challans, packing lists and correspondence.</li>
                <li>Goods/services shall conform strictly to the specifications, quantity and rates stated above. Any deviation requires prior written approval of INFOCUS IT CONSULTING PVT LTD.</li>
                <li>Delivery shall be completed within the period specified above. Time is of the essence; delays may attract liquidated damages @ 0.5% of the PO value per week, subject to a maximum of 5%.</li>
                <li>Payment shall be released as per the payment terms above, after delivery, inspection and acceptance of goods/services and receipt of a correct invoice. TDS shall be deducted as per applicable law.</li>
                <li>Goods rejected on inspection shall be replaced by the vendor free of cost within 7 days; rejected material shall be removed at the vendor's risk and cost.</li>
                <li>Warranty/support shall be provided as per the vendor's quotation or a minimum of 12 months from acceptance, whichever is higher, unless otherwise agreed.</li>
                <li>The vendor shall maintain confidentiality of all information shared under this PO and shall not disclose it to any third party without written consent.</li>
                <li>INFOCUS IT CONSULTING PVT LTD reserves the right to cancel this PO in whole or in part for non-performance, delay or breach of terms.</li>
                <li>All disputes are subject to the exclusive jurisdiction of the courts at New Delhi.</li>
                {extra_terms}
            </ol>
        </div>

        <table class="sign-table">
            <tr>
                <td>
                    Vendor Acceptance
                    <div class="line">Signature with Seal &amp; Date</div>
                </td>
                <td>
                    For INFOCUS IT CONSULTING PVT LTD
                    <div class="line">
                        Authorised Signatory (with Company Seal)<br>
                        Name: Jagbir Singh | Designation: Business Head
                    </div>
                </td>
            </tr>
        </table>

        <div class="footer">
            This is a computer-generated document. | PO: {po.po_number or ''} | Rev: {po.po_revision_number or 0} | Generated: {datetime.utcnow().strftime('%d-%b-%Y %H:%M')} UTC
        </div>
    </body>
    </html>'''

    pdf_bytes = HTML(string=html).write_pdf()
    return pdf_bytes
