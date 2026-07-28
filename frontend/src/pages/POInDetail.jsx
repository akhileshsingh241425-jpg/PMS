import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FileText, Building2, Calendar, CheckCircle, Clock, XCircle, Ban, Send, Upload, Download, RefreshCw, Plus, ChevronDown, Briefcase, X } from 'lucide-react'
import api from '../services/api'
import { C } from '../components/styleConstants'
import Breadcrumb from '../components/Breadcrumb'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

const STATUS_COLORS = {
  'WORK ORDER RECEIVED': { bg: '#DBEAFE', text: '#1E40AF' },
  'IN PROGRESS': { bg: '#EDE9FE', text: '#5B21B6' },
  'COMPLETED': { bg: '#D1FAE5', text: '#065F46' },
  'INVOICED': { bg: '#FEF3C7', text: '#92400E' },
  'PAID': { bg: '#059669', text: '#fff' },
  'CANCELLED': { bg: '#FEE2E2', text: '#991B1B' },
}

const STATUS_TRANSITIONS = {
  'WORK ORDER RECEIVED': ['IN PROGRESS', 'CANCELLED'],
  'IN PROGRESS': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': ['INVOICED'],
  'INVOICED': ['PAID'],
  'PAID': [],
  'CANCELLED': [],
}

const fmtCurr = (v) => v != null ? '₹' + Number(v).toLocaleString('en-IN') : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function calcEditTotals(items, gstRate) {
  const taxable = (items || []).reduce((s, i) => s + ((parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0)), 0)
  const rate = parseFloat(gstRate) || 18
  const gst = taxable * rate / 100
  return { taxable, gst, net: taxable + gst }
}

export default function POInDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [po, setPo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ackStatus, setAckStatus] = useState('')
  const [fileStatus, setFileStatus] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()
  const { user } = useAuth()

  const load = async () => {
    try {
      setLoading(true)
      const r = await api.get(`/api/po-in/${id}`)
      setPo(r.data.po)
    } catch (e) { if (e.response?.status === 404) setPo({ notFound: true }) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleStatusUpdate = async (status) => {
    try {
      await api.post(`/api/po-in/${id}/status`, { status })
      await load()
    } catch (e) { addToast(e.response?.data?.error || 'Failed to update status', 'error') }
  }

  const handleSendAck = async () => {
    const email = po.client?.contact_email
    if (!email) {
      const typed = prompt('Client email is missing. Enter email to send:')
      if (!typed) return
      setAckStatus('sending...')
      try {
        await api.post(`/api/po-in/${id}/acknowledge`, { client_email: typed })
        setAckStatus('Ack sent!')
        setTimeout(() => setAckStatus(''), 3000)
        await load()
      } catch (e) { setAckStatus(e.response?.data?.error || 'Failed'); setTimeout(() => setAckStatus(''), 5000) }
    } else {
      setAckStatus('sending...')
      try {
        await api.post(`/api/po-in/${id}/acknowledge`)
        setAckStatus('Ack sent!')
        setTimeout(() => setAckStatus(''), 3000)
        await load()
      } catch (e) { setAckStatus(e.response?.data?.error || 'Failed'); setTimeout(() => setAckStatus(''), 5000) }
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileStatus('uploading...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/api/po-in/${id}/attachment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setFileStatus('Uploaded!')
      setTimeout(() => setFileStatus(''), 3000)
      await load()
    } catch (e) { setFileStatus('Upload failed'); setTimeout(() => setFileStatus(''), 3000) }
  }

  const openEdit = () => {
    setEditForm({
      title: po.title || '',
      description: po.description || '',
      po_number: po.po_number || '',
      po_date: po.po_date || '',
      gst_rate: po.gst_rate || 18,
      delivery_period: po.po_delivery_period || '',
      expected_completion: po.po_expected_completion_date || '',
      start_date: po.start_date || '',
      target_date: po.target_date || '',
      po_terms: po.po_terms || '',
      special_terms: po.po_special_terms || '',
      line_items: (po.line_items || []).map(li => ({
        item_name: li.item_name || '', sac_hsn: li.sac_hsn || '',
        qty: li.qty || 1, rate: li.rate || 0, gst_rate: li.gst_rate || 18,
      })),
    })
    setShowEditForm(true)
  }

  const handleEditSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.put(`/api/po-in/${id}`, editForm)
      setShowEditForm(false)
      await load()
    } catch (err) { addToast(err.response?.data?.error || 'Failed to update', 'error') }
    finally { setSaving(false) }
  }

  const handleStartProject = async () => {
    if (!confirm('Create a project from this Work Order?')) return
    try {
      const payload = {
        title: po.title || `Project — ${po.client?.name || ''}`,
        client_id: po.client_id,
        pm_id: user?.id,
        po_number: po.po_number,
        po_date: po.po_date,
        po_amount: po.po_amount,
        gst: po.gst,
        net_amount: po.net_amount,
        po_terms: po.po_terms,
        start_date: po.start_date,
        target_date: po.target_date,
        description: po.description,
        source_po_id: po.id,
      }
      const res = await api.post('/api/projects', payload)
      load() // reload to show project link
      navigate(`/projects/${res.data.project.id}`)
    } catch (e) { addToast(e.response?.data?.error || 'Failed to create project', 'error') }
  }

  if (loading) return <div style={{ padding: 40, color: C.muted, fontSize: 14 }}>Loading work order...</div>
  if (!po) return null
  if (po.notFound) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#D1D5DB' }}>404</div>
        <p style={{ color: C.muted }}>Work Order not found</p>
        <Link to="/po-in" style={{ color: C.blue, fontSize: 13 }}>Back to Work Orders</Link>
      </div>
    )
  }

  const sc = STATUS_COLORS[po.po_in_status] || STATUS_COLORS['WORK ORDER RECEIVED']
  const nextStatuses = STATUS_TRANSITIONS[po.po_in_status] || []

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Work Orders', to: '/po-in' },
        { label: po.proj_id || 'WO' },
      ]} />

      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: '12px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{po.proj_id || 'WO'}</h1>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.text }}>{po.po_in_status}</span>
              {po.po_acknowledged && (
                <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle className="w-3 h-3" /> Ack Sent
                </span>
              )}
            </div>
            {po.title && <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{po.title}</p>}
            {po.client_name && (
              <Link to={`/clients/${po.client_id}`} style={{ fontSize: 13, color: C.blue, margin: 0, textDecoration: 'none' }}>{po.client_name}</Link>
            )}
          </div>
          <div style={{ fontSize: 13, textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>{fmtCurr(po.net_amount)}</div>
            <div style={{ color: C.muted, fontSize: 11 }}>{po.po_amount_in_words}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {po.po_in_status === 'WORK ORDER RECEIVED' && !po.linked_project && (
            <button onClick={handleStartProject} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Briefcase className="w-3.5 h-3.5" /> Start Project
            </button>
          )}
          {nextStatuses.map(s => (
            <button key={s} onClick={() => handleStatusUpdate(s)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: s === 'CANCELLED' ? '#EF4444' : C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {s === 'IN PROGRESS' ? <PlayIcon /> : s === 'COMPLETED' ? <CheckCircle className="w-3.5 h-3.5" /> : s === 'CANCELLED' ? <Ban className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {s === 'IN PROGRESS' ? 'Mark In Progress' : s === 'COMPLETED' ? 'Mark Completed' : s === 'INVOICED' ? 'Mark Invoiced' : s === 'PAID' ? 'Mark Paid' : s}
            </button>
          ))}
          <div style={{ flex: 1 }}></div>
          {!po.po_acknowledged && (
            <button onClick={handleSendAck} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Send className="w-3.5 h-3.5" /> Send Acknowledgement
            </button>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Upload className="w-3.5 h-3.5" /> Upload PO Copy
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
          </label>
          {!['PAID', 'CANCELLED'].includes(po.po_in_status) && (
            <button onClick={openEdit} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Plus className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>
      </div>

      {ackStatus && <div style={{ fontSize: 12, color: ackStatus.includes('sent') ? '#059669' : '#EF4444', marginBottom: 8 }}>{ackStatus}</div>}
      {fileStatus && <div style={{ fontSize: 12, color: fileStatus.includes('Uploaded') ? '#059669' : '#EF4444', marginBottom: 8 }}>{fileStatus}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 className="w-4 h-4" style={{ color: C.muted }} /> Client
          </h3>
          {po.client ? (
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <Link to={`/clients/${po.client.id}`} style={{ margin: 0, fontWeight: 600, color: C.blue, textDecoration: 'none' }}>{po.client.name}</Link>
              {po.client.location && <p style={{ margin: 0, color: C.muted }}>{po.client.location}</p>}
              {po.client.gst_number && <p style={{ margin: 0, color: C.muted }}>GST: {po.client.gst_number}</p>}
              {po.client.pan_no && <p style={{ margin: 0, color: C.muted }}>PAN: {po.client.pan_no}</p>}
              {po.client.contact_name && <p style={{ margin: 0, color: C.muted }}>Contact: {po.client.contact_name}</p>}
              {po.client.contact_email && <p style={{ margin: 0, color: C.muted }}>Email: {po.client.contact_email}</p>}
              {po.client.contact_phone && <p style={{ margin: 0, color: C.muted }}>Phone: {po.client.contact_phone}</p>}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: C.muted }}>Client info not available</p>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText className="w-4 h-4" style={{ color: C.muted }} /> Summary
          </h3>
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>PO / Work Order</span><span style={{ fontWeight: 600 }}>{po.po_number || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Taxable Value</span><span>{fmtCurr(po.po_amount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>GST ({po.po_gst_type})</span><span>{fmtCurr(po.gst)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: 4, marginTop: 4 }}><span>Net Amount</span><span>{fmtCurr(po.net_amount)}</span></div>
            {po.po_date && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>PO Date</span><span>{fmtDate(po.po_date)}</span></div>}
            {po.start_date && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Start Date</span><span>{fmtDate(po.start_date)}</span></div>}
            {po.target_date && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Target Date</span><span>{fmtDate(po.target_date)}</span></div>}
            {po.po_expected_completion_date && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Expected By</span><span>{fmtDate(po.po_expected_completion_date)}</span></div>}
            {po.po_acknowledged_at && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Ack Sent On</span><span>{fmtDate(po.po_acknowledged_at)}</span></div>}
            {po.po_acknowledgement_sent_to && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Sent To</span><span style={{ fontSize: 11 }}>{po.po_acknowledgement_sent_to}</span></div>}
          </div>
          {po.po_document_url && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <a href={po.po_document_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.blue, fontWeight: 600, textDecoration: 'none' }}>
                <Download className="w-3.5 h-3.5" /> {po.po_document_name || 'View PO Copy'}
              </a>
            </div>
          )}
          {po.description && <div style={{ fontSize: 11, color: C.muted, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}><strong>Description:</strong> {po.description}</div>}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 10px' }}>Line Items / Scope of Work</h3>
        {po.line_items?.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>#</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>Item / Service</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>SAC</th>
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
        ) : <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', margin: 0 }}>No line items defined</p>}
      </div>

      {po.po_terms && (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>Delivery & Payment Terms</h3>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            {po.po_delivery_period && <p style={{ margin: 0 }}><strong>Delivery Period:</strong> {po.po_delivery_period}</p>}
            {po.po_terms && <p style={{ margin: 0 }}><strong>Payment Terms:</strong> {po.po_terms}</p>}
            {po.po_special_terms && <p style={{ margin: 0 }}><strong>Special Terms:</strong> {po.po_special_terms}</p>}
          </div>
        </div>
      )}

      {showEditForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowEditForm(false)}>
          <div style={{ background: '#fff', borderRadius: 14, width: 760, maxWidth: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadowMd, overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Edit Work Order</h2>
              <button onClick={() => setShowEditForm(false)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSave} style={{ padding: 20, flex: 1 }}>
              <Section title="PO Details">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Label>PO Number</Label>
                    <input value={editForm.po_number} onChange={e => setEditForm(f => ({ ...f, po_number: e.target.value }))} style={inputS} />
                  </div>
                  <div>
                    <Label>PO Date</Label>
                    <input type="date" value={editForm.po_date} onChange={e => setEditForm(f => ({ ...f, po_date: e.target.value }))} style={inputS} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Title</Label>
                    <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={inputS} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Description</Label>
                    <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} />
                  </div>
                </div>
              </Section>

<Section title="Line Items">
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Label>GST Rate (%)</Label>
                    <select value={editForm.gst_rate || 18} onChange={e => setEditForm(f => ({ ...f, gst_rate: parseFloat(e.target.value) || 18 }))} style={inputS}>
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>
                {editForm.line_items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <input value={item.item_name} onChange={e => { const items = [...editForm.line_items]; items[idx] = { ...items[idx], item_name: e.target.value }; setEditForm(f => ({ ...f, line_items: items })) }} style={{ ...inputS, flex: 2, fontSize: 12 }} placeholder="Item" />
                    <input value={item.sac_hsn} onChange={e => { const items = [...editForm.line_items]; items[idx] = { ...items[idx], sac_hsn: e.target.value }; setEditForm(f => ({ ...f, line_items: items })) }} style={{ ...inputS, width: 80, fontSize: 12 }} placeholder="SAC" />
                    <input type="number" value={item.qty} onChange={e => { const items = [...editForm.line_items]; items[idx] = { ...items[idx], qty: parseFloat(e.target.value) || 0 }; setEditForm(f => ({ ...f, line_items: items })) }} style={{ ...inputS, width: 60, fontSize: 12 }} placeholder="Qty" />
                    <input type="number" value={item.rate} onChange={e => { const items = [...editForm.line_items]; items[idx] = { ...items[idx], rate: parseFloat(e.target.value) || 0 }; setEditForm(f => ({ ...f, line_items: items })) }} style={{ ...inputS, width: 80, fontSize: 12 }} placeholder="Rate" />
                    <input type="number" value={item.gst_rate} onChange={e => { const items = [...editForm.line_items]; items[idx] = { ...items[idx], gst_rate: parseFloat(e.target.value) || 0 }; setEditForm(f => ({ ...f, line_items: items })) }} style={{ ...inputS, width: 50, fontSize: 12 }} placeholder="GST%" />
                    {editForm.line_items.length > 1 && (
                      <button type="button" onClick={() => setEditForm(f => ({ ...f, line_items: f.line_items.filter((_, i) => i !== idx) }))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', padding: 2 }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setEditForm(f => ({ ...f, line_items: [...f.line_items, { item_name: '', sac_hsn: '', qty: 1, rate: 0, gst_rate: 18 }] }))} style={{ marginTop: 6, padding: '4px 10px', border: `1px dashed ${C.border}`, borderRadius: 6, background: 'transparent', fontSize: 11, color: C.blue, cursor: 'pointer' }}>
                  + Add Item
                </button>
                {(() => { const t = calcEditTotals(editForm.line_items, editForm.gst_rate); return (
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 20, fontSize: 12, padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, border: `1px solid ${C.border}` }}>
                    <span>Taxable: <strong>₹{t.taxable.toLocaleString('en-IN')}</strong></span>
                    <span>GST ({editForm.gst_rate || 18}%): <strong>₹{t.gst.toLocaleString('en-IN')}</strong></span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>Total: ₹{t.net.toLocaleString('en-IN')}</span>
                  </div>
                )})()}
              </Section>

              <Section title="Delivery & Terms">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <Label>Delivery Period</Label>
                    <input value={editForm.delivery_period} onChange={e => setEditForm(f => ({ ...f, delivery_period: e.target.value }))} style={inputS} />
                  </div>
                  <div>
                    <Label>Expected Completion</Label>
                    <input type="date" value={editForm.expected_completion} onChange={e => setEditForm(f => ({ ...f, expected_completion: e.target.value }))} style={inputS} />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <input type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} style={inputS} />
                  </div>
                  <div>
                    <Label>Target Date</Label>
                    <input type="date" value={editForm.target_date} onChange={e => setEditForm(f => ({ ...f, target_date: e.target.value }))} style={inputS} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Payment Terms</Label>
                    <textarea value={editForm.po_terms} onChange={e => setEditForm(f => ({ ...f, po_terms: e.target.value }))} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Special Terms</Label>
                    <textarea value={editForm.special_terms} onChange={e => setEditForm(f => ({ ...f, special_terms: e.target.value }))} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} />
                  </div>
                </div>
              </Section>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <button type="button" onClick={() => setShowEditForm(false)} style={{ padding: '7px 16px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>{title}</h3>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 3, display: 'block' }}>{children}</label>
}

const inputS = { width: '100%', padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff', color: C.text, boxSizing: 'border-box' }
