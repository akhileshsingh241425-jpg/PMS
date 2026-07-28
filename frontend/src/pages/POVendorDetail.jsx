import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FileText, Building2, Calendar, CheckCircle, Clock, XCircle, Ban, Send, Play, Download, Mail, Plus, RefreshCw, History, Pencil, Briefcase, Trash2 } from 'lucide-react'
import api from '../services/api'
import { C } from '../components/styleConstants'
import Breadcrumb from '../components/Breadcrumb'
import { useToast } from '../contexts/ToastContext'

const STATUS_COLORS = {
  'DRAFT': { bg: '#F3F4F6', text: '#6B7280' },
  'PO ISSUED': { bg: '#DBEAFE', text: '#1E40AF' },
  'WORK IN PROGRESS': { bg: '#EDE9FE', text: '#5B21B6' },
  'WORK COMPLETED': { bg: '#D1FAE5', text: '#065F46' },
  'PARTIALLY PAID': { bg: '#FEF3C7', text: '#92400E' },
  'PAID & CLOSED': { bg: '#059669', text: '#fff' },
  'CANCELLED': { bg: '#FEE2E2', text: '#991B1B' },
}

const TDS_SECTION_OPTIONS = [
  { value: '194J', label: '194J — Professional / Technical (10%)' },
  { value: '194C', label: '194C — Contract (1% / 2%)' },
  { value: '194H', label: '194H — Commission (5%)' },
  { value: '194I', label: '194I — Rent (10% / 24%)' },
  { value: '194IA', label: '194IA — Property (1%)' },
  { value: '195', label: '195 — NRO Payment' },
]

const fmtCurr = (v) => v != null ? '₹' + Number(v).toLocaleString('en-IN') : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function POVendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [po, setPo] = useState(null)
  const [payments, setPayments] = useState([])
  const [paySummary, setPaySummary] = useState({ total_paid: 0, total_tds: 0, balance: 0, is_settled: false })
  const [loading, setLoading] = useState(true)
  const [showPayForm, setShowPayForm] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], payment_mode: 'NEFT', utr_no: '', tds_applicable: false, tds_section: '194J', tds_percent: '', tds_base_amount: '', tds_amount: '', net_paid: '', vendor_invoice_no: '', vendor_invoice_date: '', remarks: '' })
  const [paySaving, setPaySaving] = useState(false)
  const [completeForm, setCompleteForm] = useState({ completion_date: new Date().toISOString().split('T')[0], deliverables_received: '', acceptance_remarks: '', vendor_invoice_no: '', vendor_invoice_date: new Date().toISOString().split('T')[0] })
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [showEditVendor, setShowEditVendor] = useState(false)
  const [editVendorForm, setEditVendorForm] = useState({})

  const load = async () => {
    try {
      setLoading(true)
      const r = await api.get(`/api/po-out/${id}`)
      setPo(r.data.po)
      const pr = await api.get(`/api/po-out/${id}/payments`)
      setPayments(pr.data.payments || [])
      setPaySummary(pr.data.summary || {})
    } catch (e) { if (e.response?.status === 404) setPo({ notFound: true }) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleAction = async (action, body = {}) => {
    try {
      await api.post(`/api/po-out/${id}/${action}`, body)
      await load()
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error') }
  }

  const handleDeleteDraft = async () => {
    if (!window.confirm('Delete this draft PO permanently?')) return
    try {
      await api.delete(`/api/po-out/${id}`)
      addToast('PO deleted', 'success')
      navigate('/po-out')
    } catch (e) { addToast(e.response?.data?.error || 'Delete failed', 'error') }
  }

  const openEditVendor = () => {
    setEditVendorForm({
      vendor_name: po.vendor_name || '',
      vendor_email: po.vendor_email || '',
      vendor_gstin: po.vendor_gstin || '',
      vendor_pan: po.vendor_pan || '',
      vendor_address: po.vendor_address || '',
      vendor_contact_person: po.vendor_contact_person || '',
      vendor_phone: po.vendor_phone || '',
      vendor_bank_account_no: po.vendor_bank_account_no || '',
      vendor_bank_ifsc: po.vendor_bank_ifsc || '',
      po_terms: po.po_terms || '',
      po_delivery_period: po.po_delivery_period || '',
      po_date: po.po_date || '',
      po_expected_completion_date: po.po_expected_completion_date || '',
    })
    setShowEditVendor(true)
  }

  const handleEditVendorSave = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/api/po-out/${id}`, editVendorForm)
      setShowEditVendor(false)
      await load()
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error') }
  }

  // payment calc
  const calcPay = (field, value) => {
    const pf = { ...payForm, [field]: value }
    const amount = parseFloat(pf.amount) || 0
    const tdsPct = parseFloat(pf.tds_percent) || 0
    const tdsBase = parseFloat(pf.tds_base_amount) || amount
    const tdsAmt = pf.tds_applicable ? (tdsBase * tdsPct / 100) : 0
    pf.tds_amount = tdsAmt.toFixed(2)
    pf.net_paid = (amount - tdsAmt).toFixed(2)
    setPayForm(pf)
  }

  const handlePaySubmit = async (e) => {
    e.preventDefault(); setPaySaving(true)
    try {
      await api.post(`/api/po-out/${id}/payments`, {
        amount: parseFloat(payForm.amount) || 0,
        date: payForm.date,
        payment_mode: payForm.payment_mode,
        utr_no: payForm.utr_no,
        tds_applicable: payForm.tds_applicable,
        tds_section: payForm.tds_applicable ? payForm.tds_section : null,
        tds_percent: payForm.tds_applicable ? (parseFloat(payForm.tds_percent) || 0) : 0,
        tds_base_amount: payForm.tds_applicable ? (parseFloat(payForm.tds_base_amount) || 0) : 0,
        tds_amount: payForm.tds_applicable ? (parseFloat(payForm.tds_amount) || 0) : 0,
        net_paid: payForm.tds_applicable ? (parseFloat(payForm.net_paid) || 0) : 0,
        vendor_invoice_no: payForm.vendor_invoice_no,
        vendor_invoice_date: payForm.vendor_invoice_date,
        mode: payForm.payment_mode,
        remarks: payForm.remarks,
      })
      setShowPayForm(false)
      setPayForm({ amount: '', date: new Date().toISOString().split('T')[0], payment_mode: 'NEFT', utr_no: '', tds_applicable: false, tds_section: '194J', tds_percent: '', tds_base_amount: '', tds_amount: '', net_paid: '', vendor_invoice_no: '', vendor_invoice_date: '', remarks: '' })
      await load()
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error') }
    finally { setPaySaving(false) }
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    await handleAction('work-complete', completeForm)
    setShowCompleteForm(false)
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) return addToast('Please enter cancellation reason', 'error')
    await handleAction('cancel', { reason: cancelReason })
    setShowCancel(false); setCancelReason('')
  }

  const [pdfStatus, setPdfStatus] = useState('')
  const [mailStatus, setMailStatus] = useState('')

  const handleGeneratePDF = async () => {
    setPdfStatus('generating...')
    try {
      await api.post(`/api/po-out/${id}/generate-pdf`)
      const r = await api.get(`/api/po-out/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      setPdfStatus('PDF ready')
      setTimeout(() => setPdfStatus(''), 3000)
    } catch (e) { setPdfStatus('Failed'); setTimeout(() => setPdfStatus(''), 3000) }
  }

  const handleSendMail = async () => {
    let email = po.vendor_email
    if (!email) {
      email = prompt('Vendor email is missing. Enter email to send:')
      if (!email) return
    }
    setMailStatus('sending...')
    try {
      await api.post(`/api/po-out/${id}/send-mail`, { vendor_email: email })
      setMailStatus('Mail sent!')
      setTimeout(() => setMailStatus(''), 3000)
    } catch (e) { setMailStatus(e.response?.data?.error || 'Failed'); setTimeout(() => setMailStatus(''), 5000) }
  }

  const [showRevForm, setShowRevForm] = useState(false)
  const [revReason, setRevReason] = useState('')

  const handleCreateRevision = async () => {
    if (!revReason.trim()) return addToast('Please enter a reason for revision', 'error')
    try {
      await api.post(`/api/po-out/${id}/create-revision`, { reason: revReason })
      setShowRevForm(false); setRevReason('')
      await load()
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error') }
  }

  if (loading) return <div style={{ padding: 40, color: C.muted, fontSize: 14 }}>Loading PO...</div>
  if (!po) return null
  if (po.notFound) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#D1D5DB' }}>404</div>
        <p style={{ color: C.muted }}>PO not found</p>
        <Link to="/po-out" style={{ color: C.blue, fontSize: 13 }}>Back to POs</Link>
      </div>
    )
  }

  const sc = STATUS_COLORS[po.po_out_status] || STATUS_COLORS['DRAFT']

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Vendor POs', to: '/po-out' },
        { label: po.po_number || 'PO' },
      ]} />

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: '12px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{po.po_number || 'PO'}</h1>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.text }}>{po.po_out_status}</span>
            </div>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{po.title || po.vendor_name}</p>
          </div>
          <div style={{ fontSize: 13, textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>{fmtCurr(po.net_amount)}</div>
            <div style={{ color: C.muted }}>{po.po_amount_in_words}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {po.po_out_status === 'DRAFT' && (
            <>
              <ActionBtn icon={Pencil} label="Edit" color={C.blue} onClick={() => navigate(`/po-out?edit=${id}`)} />
              <ActionBtn icon={Send} label="Submit PO" color={C.blue} onClick={() => handleAction('submit')} />
              <ActionBtn icon={Trash2} label="Delete" color="#EF4444" onClick={handleDeleteDraft} />
            </>
          )}
          {po.po_out_status === 'PO ISSUED' && (
            <>
              <ActionBtn icon={Play} label="Start Work" color="#7C3AED" onClick={() => handleAction('start-work')} />
              <ActionBtn icon={Plus} label="Record Payment" color={C.blue} onClick={() => setShowPayForm(true)} />
            </>
          )}
          {po.po_out_status === 'WORK IN PROGRESS' && (
            <>
              <ActionBtn icon={CheckCircle} label="Complete Work" color="#059669" onClick={() => setShowCompleteForm(true)} />
              <ActionBtn icon={Plus} label="Record Payment" color={C.blue} onClick={() => setShowPayForm(true)} />
            </>
          )}
          {po.po_out_status === 'WORK COMPLETED' && (
            <ActionBtn icon={Plus} label="Record Payment" color={C.blue} onClick={() => setShowPayForm(true)} />
          )}
          {po.po_out_status === 'PARTIALLY PAID' && (
            <ActionBtn icon={Plus} label="Add Payment" color={C.blue} onClick={() => setShowPayForm(true)} />
          )}
          {!['PAID & CLOSED', 'CANCELLED', 'DRAFT'].includes(po.po_out_status) && (
            <ActionBtn icon={Ban} label="Cancel PO" color="#EF4444" onClick={() => setShowCancel(true)} />
          )}

          {/* PDF & Mail actions */}
          <div style={{ flex: 1 }}></div>
          {['DRAFT', 'PO ISSUED'].includes(po.po_out_status) && (
            <>
              <ActionBtn icon={Download} label="Save PDF" color="#059669" onClick={handleGeneratePDF} />
              <ActionBtn icon={Mail} label="Send Mail" color={C.blue} onClick={handleSendMail} />
            </>
          )}
          {['PO ISSUED', 'WORK IN PROGRESS', 'WORK COMPLETED', 'PARTIALLY PAID'].includes(po.po_out_status) && po.po_revision_number >= 0 && (
            <ActionBtn icon={RefreshCw} label="Create Revision" color="#7C3AED" onClick={() => setShowRevForm(true)} />
          )}
        </div>
      </div>

      {/* Status messages */}
      {pdfStatus && <div style={{ fontSize: 12, color: pdfStatus === 'Failed' ? '#EF4444' : '#059669', marginBottom: 8 }}>{pdfStatus}</div>}
      {mailStatus && <div style={{ fontSize: 12, color: mailStatus === 'Failed' ? '#EF4444' : '#059669', marginBottom: 8 }}>{mailStatus}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Vendor Info */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 className="w-4 h-4" style={{ color: C.muted }} /> Vendor
            {!['PAID & CLOSED', 'CANCELLED'].includes(po.po_out_status) && (
              <button onClick={openEditVendor} style={{ marginLeft: 'auto', border: 'none', background: '#F3F4F6', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600 }}>
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
          </h3>
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>{po.client_id ? (
              <Link to={`/clients/${po.client_id}`} style={{ color: C.blue, textDecoration: 'none' }}>{po.vendor_name}</Link>
            ) : (
              po.vendor_name
            )}</p>
            {po.vendor_address && <p style={{ margin: 0, color: C.muted }}>{po.vendor_address}</p>}
            {po.vendor_gstin && <p style={{ margin: 0, color: C.muted }}>GST: {po.vendor_gstin}</p>}
            {po.vendor_pan && <p style={{ margin: 0, color: C.muted }}>PAN: {po.vendor_pan}</p>}
            {po.vendor_contact_person && <p style={{ margin: 0, color: C.muted }}>Contact: {po.vendor_contact_person}</p>}
            {po.vendor_phone && <p style={{ margin: 0, color: C.muted }}>Phone: {po.vendor_phone}</p>}
            {po.vendor_email && <p style={{ margin: 0, color: C.muted }}>Email: {po.vendor_email}</p>}
            {po.vendor_bank_account_no && <p style={{ margin: 0, color: C.muted }}>Bank: {po.vendor_bank_account_no} ({po.vendor_bank_ifsc})</p>}
          </div>
        </div>

        {/* PO Summary */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText className="w-4 h-4" style={{ color: C.muted }} /> Summary
          </h3>
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>PO Amount (Taxable)</span><span>{fmtCurr(po.po_amount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>GST ({po.po_gst_type})</span><span>{fmtCurr(po.gst)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: 4, marginTop: 4 }}><span>Net Amount</span><span>{fmtCurr(po.net_amount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Total Paid</span><span style={{ color: '#059669', fontWeight: 600 }}>{fmtCurr(paySummary.total_paid)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Balance</span><span style={{ color: paySummary.balance > 0 ? '#DC2626' : '#059669', fontWeight: 600 }}>{fmtCurr(paySummary.balance)}</span></div>
            {po.po_date && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>PO Date</span><span>{fmtDate(po.po_date)}</span></div>}
            {po.po_expected_completion_date && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Expected By</span><span>{fmtDate(po.po_expected_completion_date)}</span></div>}
            {po.completion_date && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Completed On</span><span>{fmtDate(po.completion_date)}</span></div>}
          </div>
          {po.po_terms && <div style={{ fontSize: 11, color: C.muted, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}><strong>Terms:</strong> {po.po_terms}</div>}
          {po.po_delivery_period && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}><strong>Delivery:</strong> {po.po_delivery_period}</div>}
        </div>
      </div>

      {/* Linked Project */}
      {po.linked_project_id && po.linked_project && (
        <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '12px 16px', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase className="w-4 h-4" style={{ color: '#059669' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>Source Project</div>
              <div style={{ fontSize: 11, color: '#047857' }}>{po.linked_project?.proj_id} — {po.linked_project?.title}</div>
            </div>
          </div>
          <Link to={`/projects/${po.linked_project_id}`} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>Open Project →</Link>
        </div>
      )}

      {/* Line Items */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 10px' }}>Line Items</h3>
        {po.line_items?.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>#</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>Item</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>SAC/HSN</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>Qty</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>Rate</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>Taxable</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>GST%</th>
            </tr>
          </thead>
          <tbody>
            {po.line_items.map((li, i) => (
              <tr key={li.id || i} style={{ borderBottom: `1px solid #F3F4F6` }}>
                <td style={{ padding: '6px 8px' }}>{i + 1}</td>
                <td style={{ padding: '6px 8px', fontWeight: 500 }}>{li.item_name}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: C.muted }}>{li.sac_hsn || '—'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{li.qty}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{fmtCurr(li.rate)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{fmtCurr(li.taxable_value)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: C.muted }}>{li.gst_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', margin: 0 }}>No line items</p>}
      </div>

      {/* Deliverables / Completion info */}
      {po.deliverables_received && (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>Work Completion</h3>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            <p style={{ margin: 0 }}><strong>Completed:</strong> {fmtDate(po.completion_date)}</p>
            {po.vendor_invoice_no && <p style={{ margin: 0 }}><strong>Vendor Invoice:</strong> {po.vendor_invoice_no} ({fmtDate(po.vendor_invoice_date)})</p>}
            {po.deliverables_received && <p style={{ margin: 0 }}><strong>Deliverables:</strong> {po.deliverables_received}</p>}
            {po.acceptance_remarks && <p style={{ margin: 0 }}><strong>Remarks:</strong> {po.acceptance_remarks}</p>}
          </div>
        </div>
      )}

      {/* Payments Section */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Payments</h3>
          {['WORK COMPLETED', 'PARTIALLY PAID'].includes(po.po_out_status) && (
            <button onClick={() => setShowPayForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: C.blue, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <Plus className="w-3 h-3" /> Record Payment
            </button>
          )}
        </div>
        {payments.length === 0 ? (
          <p style={{ fontSize: 12, color: C.muted }}>No payments recorded yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>Date</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>Mode</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>TDS</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>Net Paid</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>UTR</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid #F3F4F6` }}>
                  <td style={{ padding: '6px 8px' }}>{fmtDate(p.date)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{fmtCurr(p.amount)}</td>
                  <td style={{ padding: '6px 8px' }}>{p.payment_mode || p.mode || '—'}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: p.tds_amount ? '#DC2626' : C.muted }}>{p.tds_amount ? fmtCurr(p.tds_amount) : '—'}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{p.net_paid ? fmtCurr(p.net_paid) : fmtCurr(p.amount)}</td>
                  <td style={{ padding: '6px 8px', color: C.muted, fontSize: 11 }}>{p.utr_no || '—'}</td>
                  <td style={{ padding: '6px 8px', color: C.muted, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {paySummary.is_settled && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#D1FAE5', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#065F46', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle className="w-4 h-4" /> PO Fully Settled — Paid & Closed
          </div>
        )}
      </div>

      {/* Revisions History */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <History className="w-4 h-4" style={{ color: C.muted }} /> Revision History
        </h3>
        {po.versions?.length > 0 ? (
        <div style={{ fontSize: 12 }}>
          {po.versions.map((v, i) => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < po.versions.length - 1 ? `1px solid #F3F4F6` : 'none' }}>
              <span><strong>Rev-{v.revision_number}</strong> — {v.reason || '—'}</span>
              <span style={{ color: C.muted }}>{v.created_by_name} | {fmtDate(v.created_at)}</span>
            </div>
          ))}
        </div>
        ) : <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', margin: 0 }}>No revisions yet</p>}
      </div>

      {/* Edit Vendor Modal */}
      {showEditVendor && (
        <Modal title="Edit PO Details" onClose={() => setShowEditVendor(false)}>
          <form onSubmit={handleEditVendorSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: 'span 2' }}><Label>Vendor Name</Label><input value={editVendorForm.vendor_name} onChange={e => setEditVendorForm(f => ({ ...f, vendor_name: e.target.value }))} style={inputS} /></div>
              <div><Label>GSTIN</Label><input value={editVendorForm.vendor_gstin} onChange={e => setEditVendorForm(f => ({ ...f, vendor_gstin: e.target.value }))} style={inputS} /></div>
              <div><Label>PAN</Label><input value={editVendorForm.vendor_pan} onChange={e => setEditVendorForm(f => ({ ...f, vendor_pan: e.target.value }))} style={inputS} /></div>
              <div style={{ gridColumn: 'span 2' }}><Label>Address</Label><textarea value={editVendorForm.vendor_address} onChange={e => setEditVendorForm(f => ({ ...f, vendor_address: e.target.value }))} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} /></div>
              <div><Label>Contact Person</Label><input value={editVendorForm.vendor_contact_person} onChange={e => setEditVendorForm(f => ({ ...f, vendor_contact_person: e.target.value }))} style={inputS} /></div>
              <div><Label>Phone</Label><input value={editVendorForm.vendor_phone} onChange={e => setEditVendorForm(f => ({ ...f, vendor_phone: e.target.value }))} style={inputS} /></div>
              <div style={{ gridColumn: 'span 2' }}><Label>Email</Label><input value={editVendorForm.vendor_email} onChange={e => setEditVendorForm(f => ({ ...f, vendor_email: e.target.value }))} style={inputS} /></div>
              <div><Label>Bank A/c No.</Label><input value={editVendorForm.vendor_bank_account_no} onChange={e => setEditVendorForm(f => ({ ...f, vendor_bank_account_no: e.target.value }))} style={inputS} /></div>
              <div><Label>IFSC</Label><input value={editVendorForm.vendor_bank_ifsc} onChange={e => setEditVendorForm(f => ({ ...f, vendor_bank_ifsc: e.target.value }))} style={inputS} /></div>
              <div style={{ gridColumn: 'span 2', borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4 }}>
                <Label>PO Terms</Label><textarea value={editVendorForm.po_terms} onChange={e => setEditVendorForm(f => ({ ...f, po_terms: e.target.value }))} style={{ ...inputS, minHeight: 40, resize: 'vertical' }} />
              </div>
              <div><Label>Delivery Period</Label><input value={editVendorForm.po_delivery_period} onChange={e => setEditVendorForm(f => ({ ...f, po_delivery_period: e.target.value }))} style={inputS} /></div>
              <div><Label>PO Date</Label><input type="date" value={editVendorForm.po_date} onChange={e => setEditVendorForm(f => ({ ...f, po_date: e.target.value }))} style={inputS} /></div>
              <div style={{ gridColumn: 'span 2' }}><Label>Expected Completion</Label><input type="date" value={editVendorForm.po_expected_completion_date} onChange={e => setEditVendorForm(f => ({ ...f, po_expected_completion_date: e.target.value }))} style={inputS} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" onClick={() => setShowEditVendor(false)} style={{ padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: '#0052CC', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Work Complete Form Modal */}
      {showCompleteForm && (
        <Modal title="Mark Work Complete" onClose={() => setShowCompleteForm(false)}>
          <form onSubmit={handleComplete}>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><Label>Completion Date</Label><input type="date" value={completeForm.completion_date} onChange={e => setCompleteForm(f => ({ ...f, completion_date: e.target.value }))} style={inputS} /></div>
              <div><Label>Vendor Invoice No.</Label><input value={completeForm.vendor_invoice_no} onChange={e => setCompleteForm(f => ({ ...f, vendor_invoice_no: e.target.value }))} style={inputS} /></div>
              <div><Label>Vendor Invoice Date</Label><input type="date" value={completeForm.vendor_invoice_date} onChange={e => setCompleteForm(f => ({ ...f, vendor_invoice_date: e.target.value }))} style={inputS} /></div>
              <div><Label>Deliverables Received</Label><textarea value={completeForm.deliverables_received} onChange={e => setCompleteForm(f => ({ ...f, deliverables_received: e.target.value }))} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} /></div>
              <div><Label>Acceptance Remarks</Label><textarea value={completeForm.acceptance_remarks} onChange={e => setCompleteForm(f => ({ ...f, acceptance_remarks: e.target.value }))} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" onClick={() => setShowCompleteForm(false)} style={{ padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: '#059669', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Confirm Complete</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Form Modal */}
      {showPayForm && (
        <Modal title="Record Payment" onClose={() => setShowPayForm(false)}>
          <form onSubmit={handlePaySubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><Label>Amount (Gross) *</Label><input type="number" min="0" step="1" required value={payForm.amount} onChange={e => calcPay('amount', e.target.value)} style={inputS} /></div>
              <div><Label>Payment Date *</Label><input type="date" required value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} style={inputS} /></div>
              <div><Label>Payment Mode</Label><select value={payForm.payment_mode} onChange={e => setPayForm(f => ({ ...f, payment_mode: e.target.value }))} style={inputS}>
                <option value="NEFT">NEFT</option><option value="RTGS">RTGS</option><option value="IMPS">IMPS</option><option value="UPI">UPI</option><option value="Cheque">Cheque</option><option value="Cash">Cash</option>
              </select></div>
              <div><Label>UTR / Ref No.</Label><input value={payForm.utr_no} onChange={e => setPayForm(f => ({ ...f, utr_no: e.target.value }))} style={inputS} /></div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={payForm.tds_applicable} onChange={e => setPayForm(f => ({ ...f, tds_applicable: e.target.checked }))} />
                  TDS Applicable
                </label>
              </div>
              {payForm.tds_applicable && (
                <>
                  <div><Label>TDS Section</Label><select value={payForm.tds_section} onChange={e => { const pct = { '194J': 10, '194C': 2, '194H': 5, '194I': 10, '194IA': 1, '195': 10 }[e.target.value] || 0; setPayForm(f => ({ ...f, tds_section: e.target.value, tds_percent: pct })); calcPay('tds_section', e.target.value) }} style={inputS}>
                    {TDS_SECTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
                  <div><Label>TDS %</Label><input type="number" min="0" step="0.1" value={payForm.tds_percent} onChange={e => calcPay('tds_percent', e.target.value)} style={inputS} /></div>
                  <div><Label>TDS Base Amount</Label><input type="number" min="0" step="1" value={payForm.tds_base_amount} onChange={e => calcPay('tds_base_amount', e.target.value)} style={inputS} /></div>
                  <div><Label>TDS Amount (Auto)</Label><input value={payForm.tds_amount} readOnly style={{ ...inputS, background: '#F9FAFB' }} /></div>
                  <div><Label>Net Paid (Auto)</Label><input value={payForm.net_paid} readOnly style={{ ...inputS, background: '#F9FAFB' }} /></div>
                </>
              )}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><Label>Vendor Invoice No.</Label><input value={payForm.vendor_invoice_no} onChange={e => setPayForm(f => ({ ...f, vendor_invoice_no: e.target.value }))} style={inputS} /></div>
                  <div><Label>Invoice Date</Label><input type="date" value={payForm.vendor_invoice_date} onChange={e => setPayForm(f => ({ ...f, vendor_invoice_date: e.target.value }))} style={inputS} /></div>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}><Label>Remarks</Label><textarea value={payForm.remarks} onChange={e => setPayForm(f => ({ ...f, remarks: e.target.value }))} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" onClick={() => setShowPayForm(false)} style={{ padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={paySaving} style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: paySaving ? 0.6 : 1 }}>{paySaving ? 'Saving...' : 'Record Payment'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Revision Form Modal */}
      {showRevForm && (
        <Modal title="Create Revision" onClose={() => setShowRevForm(false)}>
          <div>
            <Label>Reason for revision *</Label>
            <textarea value={revReason} onChange={e => setRevReason(e.target.value)} style={{ ...inputS, minHeight: 60, resize: 'vertical' }} placeholder="e.g. Change in scope, price adjustment..." />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setShowRevForm(false)} style={{ padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Close</button>
              <button onClick={handleCreateRevision} style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: '#7C3AED', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Create Revision</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <Modal title="Cancel PO" onClose={() => setShowCancel(false)}>
          <div>
            <Label>Reason for cancellation *</Label>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={{ ...inputS, minHeight: 60, resize: 'vertical' }} placeholder="Enter reason..." />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setShowCancel(false)} style={{ padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Close</button>
              <button onClick={handleCancel} style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel PO</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ActionBtn({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 20, boxShadow: C.shadowMd }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 14px' }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

function Label({ children }) {
  return <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 3, display: 'block' }}>{children}</label>
}

const inputS = { width: '100%', padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff', color: C.text, boxSizing: 'border-box' }
