import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, X, FileText, Building2, DollarSign, Calendar, ChevronDown, Trash2, Eye, ArrowUpRight, RefreshCw, Download, Mail, CheckCircle, Clock, AlertTriangle, Ban } from 'lucide-react'
import api from '../services/api'
import { C } from '../components/styleConstants'
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

const defaultItem = { item_name: '', sac_hsn: '', qty: 1, rate: 0, taxable_value: 0, gst_rate: 18 }

function calcRow(item) {
  const qty = parseFloat(item.qty) || 0
  const rate = parseFloat(item.rate) || 0
  const taxable = qty * rate
  const gstRate = parseFloat(item.gst_rate) || 0
  const gst = taxable * gstRate / 100
  return { ...item, taxable_value: taxable, _gst: gst }
}

const amountToWords = (n) => {
  if (!n) return 'Zero'
  n = Math.round(n)
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  if (n === 0) return 'Zero'
  const w = (num) => {
    if (num < 20) return ones[num]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + w(num % 100) : '')
    if (num < 100000) return w(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + w(num % 1000) : '')
    if (num < 10000000) return w(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + w(num % 100000) : '')
    return w(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + w(num % 10000000) : '')
  }
  return w(n) + ' Rupees Only'
}

const fmtCurr = (v) => v != null ? '₹' + Number(v).toLocaleString('en-IN') : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function POVendorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToast } = useToast()
  const [poList, setPoList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [vendors, setVendors] = useState([])
  const [previewMode, setPreviewMode] = useState(false)
  const [showTDSReport, setShowTDSReport] = useState(false)
  const [tdsReport, setTdsReport] = useState({ records: [], summary: {}, total_tds: 0 })

  const [form, setForm] = useState({
    po_number: '', title: '', po_date: new Date().toISOString().split('T')[0],
    vendor_id: '', vendor_name: '', vendor_email: '', vendor_gstin: '', vendor_pan: '',
    vendor_address: '', vendor_contact_person: '', vendor_phone: '',
    vendor_bank_account_no: '', vendor_bank_ifsc: '',
    po_terms: '', po_delivery_period: '', po_expected_completion_date: '',
    po_special_terms: '', po_gst_type: 'CGST+SGST', gst_rate: 18,
    line_items: [{ ...defaultItem }],
  })
  const [vendorMode, setVendorMode] = useState('existing')

  const load = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const r = await api.get('/api/po-out', { params })
      setPoList(r.data.po_list || [])
    } catch (e) { addToast('PO list load failed', 'error') }
    finally { setLoading(false) }
  }

  const loadVendors = async () => {
    try {
      const r = await api.get('/api/clients', { params: { filter: 'vendor', per_page: 500 } })
      setVendors(r.data.clients || [])
    } catch (e) { addToast('Vendor list load failed', 'error') }
  }

  useEffect(() => { load(); loadVendors() }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      api.get(`/api/po-out/${editId}`).then(r => {
        const p = r.data.po
        setForm({
          po_number: p.po_number || '',
          title: p.title || '',
          po_date: p.po_date ? p.po_date.slice(0, 10) : new Date().toISOString().split('T')[0],
          vendor_id: p.client_id || '',
          vendor_name: p.vendor_name || '',
          vendor_email: p.vendor_email || '',
          vendor_gstin: p.vendor_gstin || '',
          vendor_pan: p.vendor_pan || '',
          vendor_address: p.vendor_address || '',
          vendor_contact_person: p.vendor_contact_person || '',
          vendor_phone: p.vendor_phone || '',
          vendor_bank_account_no: p.vendor_bank_account_no || '',
          vendor_bank_ifsc: p.vendor_bank_ifsc || '',
          po_terms: p.po_terms || '',
          po_delivery_period: p.po_delivery_period || '',
          po_expected_completion_date: p.po_expected_completion_date ? p.po_expected_completion_date.slice(0, 10) : '',
          po_special_terms: p.po_special_terms || '',
          po_gst_type: p.po_gst_type || 'CGST+SGST',
          gst_rate: p.line_items?.[0]?.gst_rate || 18,
          line_items: (p.line_items || []).map(li => ({
            item_name: li.item_name || '',
            sac_hsn: li.sac_hsn || '',
            qty: li.qty || 1,
            rate: li.rate || 0,
            taxable_value: li.taxable_value || 0,
            gst_rate: li.gst_rate || 18,
          })),
        })
        setShowForm(true)
      }).catch(() => addToast('Failed to load PO for editing', 'error'))
    }
  }, [searchParams])

  const openTDSReport = async () => {
    try {
      const r = await api.get('/api/po-out/report/tds-quarterly')
      setTdsReport(r.data)
    } catch (e) { addToast('TDS report load failed', 'error') }
    setShowTDSReport(true)
  }

  const openCreate = async () => {
    setError(''); setPreviewMode(false); setVendorMode('existing')
    try {
      const r = await api.get('/api/po-out/next-po-number')
      setForm(f => ({ ...f, po_number: r.data.po_number, po_date: new Date().toISOString().split('T')[0], line_items: [{ ...defaultItem }] }))
    } catch (e) { addToast('PO number generation failed', 'error') }
    setShowForm(true)
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleVendorSelect = (e) => {
    const vid = e.target.value
    set('vendor_id', vid)
    if (vid) {
      const v = vendors.find(c => c.id.toString() === vid)
      if (v) {
        set('vendor_name', v.name)
        set('vendor_email', v.contact_email || '')
        set('vendor_gstin', v.gst_number || '')
        set('vendor_pan', v.pan_no || '')
        set('vendor_address', v.location || '')
        set('vendor_contact_person', v.contact_name || '')
        set('vendor_phone', v.contact_phone || '')
        set('vendor_bank_account_no', v.bank_account_no || '')
        set('vendor_bank_ifsc', v.bank_ifsc || '')
      }
    }
  }

  const addItem = () => set('line_items', [...form.line_items, { ...defaultItem }])
  const removeItem = (idx) => {
    if (form.line_items.length <= 1) return
    const items = form.line_items.filter((_, i) => i !== idx)
    set('line_items', items)
  }
  const updateItem = (idx, field, value) => {
    const items = [...form.line_items]
    items[idx] = { ...items[idx], [field]: value }
    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(items[idx].qty) || 0
      const rate = parseFloat(items[idx].rate) || 0
      items[idx].taxable_value = qty * rate
    }
    set('line_items', items)
  }

  const calcTotals = () => {
    const items = form.line_items.map(calcRow)
    const taxable = items.reduce((s, i) => s + (i.taxable_value || 0), 0)
    const gstRate = parseFloat(form.gst_rate) || 0
    const gst = taxable * gstRate / 100
    return { taxable, gst, net: taxable + gst, items }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const totals = calcTotals()
      const payload = {
        ...form,
        po_amount: totals.taxable,
        gst_rate: parseFloat(form.gst_rate) || 18,
        line_items: form.line_items.map(i => ({
          item_name: i.item_name, sac_hsn: i.sac_hsn, qty: parseFloat(i.qty) || 0,
          rate: parseFloat(i.rate) || 0, gst_rate: parseFloat(i.gst_rate) || 18,
        })),
      }
      const editId = searchParams.get('edit')
      if (editId) {
        await api.put(`/api/po-out/${editId}`, payload)
        navigate(`/po-out/${editId}`)
      } else {
        await api.post('/api/po-out', payload)
      }
      setShowForm(false); load()
    } catch (e) { setError(e.response?.data?.error || 'Failed to create PO') }
    finally { setSaving(false) }
  }

  const handleSubmitPO = async (po) => {
    try {
      await api.post(`/api/po-out/${po.id}/submit`)
      load()
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error') }
  }

  const totals = calcTotals()

  const filtered = poList.filter(p => !search || p.po_number?.toLowerCase().includes(search.toLowerCase()) || p.vendor_name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Vendor Purchase Orders</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>POs issued to vendors — track, dispatch, pay & close</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openTDSReport} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: C.text }}>
            <FileText className="w-4 h-4" /> TDS Report
          </button>
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: C.blue, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus className="w-4 h-4" /> Issue Vendor PO
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: 9, color: C.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO # or vendor..." style={{ width: '100%', padding: '7px 10px 7px 32px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* PO List */}
      {loading ? <p style={{ color: C.muted, fontSize: 13 }}>Loading POs...</p> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          <FileText className="w-12 h-12 mx-auto" style={{ opacity: 0.2, marginBottom: 8 }} />
          <p style={{ fontWeight: 600, color: C.text }}>No Purchase Orders yet</p>
          <p style={{ fontSize: 13, marginBottom: 14 }}>Click "Issue Vendor PO" to create the first one</p>
          <button onClick={openCreate} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus className="w-4 h-4" /> Issue Vendor PO
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#F9FAFB' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>PO #</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Vendor</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Amount</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>GST</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Net</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Date</th>
                <th style={{ padding: '10px 12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const sc = STATUS_COLORS[p.po_out_status] || STATUS_COLORS['DRAFT']
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid #F3F4F6`, cursor: 'pointer' }} onClick={() => navigate(`/po-out/${p.id}`)}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: C.blue }}>{p.po_number || '—'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.vendor_name || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{fmtCurr(p.po_amount)}</td>
                    <td style={{ padding: '10px 12px', color: C.muted }}>{fmtCurr(p.gst)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{fmtCurr(p.net_amount)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.text }}>{p.po_out_status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.muted }}>{fmtDate(p.po_date)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Link to={`/po-out/${p.id}`} style={{ color: C.blue, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                        View <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create PO Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 14, width: 720, maxWidth: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadowMd }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                {previewMode ? 'PO Preview' : 'Issue Vendor Purchase Order'}
              </h2>
              <button onClick={() => { setShowForm(false); setPreviewMode(false); if (searchParams.get('edit')) navigate('/po-out') }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewMode ? (
              <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
                <POPreview form={form} totals={totals} onBack={() => setPreviewMode(false)} onSave={handleSubmit} saving={saving} />
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setPreviewMode(true) }} style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
                {error && <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#B91C1C' }}>{error}</div>}

                {/* PO Number & Date */}
                <Section title="PO Details">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <Label>PO Number</Label>
                      <input value={form.po_number} readOnly style={{ ...inputS, background: '#F9FAFB' }} />
                    </div>
                    <div>
                      <Label>PO Date</Label>
                      <input type="date" value={form.po_date} onChange={e => set('po_date', e.target.value)} style={inputS} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <Label>Title / Description</Label>
                      <input value={form.title} onChange={e => set('title', e.target.value)} style={inputS} placeholder="e.g. Network PT for XYZ project" />
                    </div>
                    <div>
                      <Label>GST Type</Label>
                      <select value={form.po_gst_type} onChange={e => set('po_gst_type', e.target.value)} style={inputS}>
                        <option value="CGST+SGST">CGST + SGST (Delhi)</option>
                        <option value="IGST">IGST (Inter-State)</option>
                      </select>
                    </div>
                    <div>
                      <Label>GST Rate (%)</Label>
                      <input type="number" value={form.gst_rate} onChange={e => set('gst_rate', e.target.value)} style={inputS} />
                    </div>
                  </div>
                </Section>

                {/* Vendor Selection */}
                <Section title="Vendor Details">
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button type="button" onClick={() => setVendorMode('existing')} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, cursor: 'pointer', background: vendorMode === 'existing' ? C.blue : '#fff', color: vendorMode === 'existing' ? '#fff' : C.text }}>Existing Vendor</button>
                    <button type="button" onClick={() => setVendorMode('new')} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, cursor: 'pointer', background: vendorMode === 'new' ? C.blue : '#fff', color: vendorMode === 'new' ? '#fff' : C.text }}>New Vendor</button>
                  </div>
                  {vendorMode === 'existing' ? (
                    <select value={form.vendor_id} onChange={handleVendorSelect} style={{ ...inputS, marginBottom: 8 }}>
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name} {v.gst_number ? `(${v.gst_number})` : ''}</option>)}
                    </select>
                  ) : null}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <Label>Vendor Name *</Label>
                      <input value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} required style={inputS} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <input type="email" value={form.vendor_email} onChange={e => set('vendor_email', e.target.value)} style={inputS} />
                    </div>
                    <div>
                      <Label>GSTIN</Label>
                      <input value={form.vendor_gstin} onChange={e => set('vendor_gstin', e.target.value)} style={inputS} />
                    </div>
                    <div>
                      <Label>PAN</Label>
                      <input value={form.vendor_pan} onChange={e => set('vendor_pan', e.target.value.toUpperCase())} style={inputS} />
                    </div>
                    <div>
                      <Label>Contact Person</Label>
                      <input value={form.vendor_contact_person} onChange={e => set('vendor_contact_person', e.target.value)} style={inputS} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <input value={form.vendor_phone} onChange={e => set('vendor_phone', e.target.value)} style={inputS} />
                    </div>
                    <div>
                      <Label>Bank A/c No.</Label>
                      <input value={form.vendor_bank_account_no} onChange={e => set('vendor_bank_account_no', e.target.value)} style={inputS} />
                    </div>
                    <div>
                      <Label>IFSC</Label>
                      <input value={form.vendor_bank_ifsc} onChange={e => set('vendor_bank_ifsc', e.target.value.toUpperCase())} style={inputS} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <Label>Address</Label>
                      <textarea value={form.vendor_address} onChange={e => set('vendor_address', e.target.value)} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} />
                    </div>
                  </div>
                </Section>

                {/* Line Items */}
                <Section title="PO Items / Services">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: C.muted, width: 30 }}>#</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Item / Service</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: C.muted, width: 80 }}>SAC/HSN</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.muted, width: 60 }}>Qty</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.muted, width: 80 }}>Rate</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.muted, width: 90 }}>Taxable</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.muted, width: 60 }}>GST%</th>
                          <th style={{ padding: '6px 8px', width: 30 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.line_items.map((item, idx) => {
                          const r = calcRow(item)
                          return (
                            <tr key={idx} style={{ borderBottom: `1px solid #F3F4F6` }}>
                              <td style={{ padding: '4px 8px', color: C.muted }}>{idx + 1}</td>
                              <td style={{ padding: '4px 8px' }}>
                                <input value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12 }} placeholder="Item name" />
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <input value={item.sac_hsn} onChange={e => updateItem(idx, 'sac_hsn', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12 }} />
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <input type="number" min="0" step="0.01" value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12, textAlign: 'right', width: 60 }} />
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <input type="number" min="0" step="1" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12, textAlign: 'right', width: 80 }} />
                              </td>
                              <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, fontSize: 12 }}>{fmtCurr(r.taxable_value)}</td>
                              <td style={{ padding: '4px 8px' }}>
                                <input type="number" min="0" step="0.1" value={item.gst_rate} onChange={e => updateItem(idx, 'gst_rate', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12, textAlign: 'right', width: 50 }} />
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                {form.line_items.length > 1 && (
                                  <button type="button" onClick={() => removeItem(idx)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', padding: 2 }}>
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={addItem} style={{ marginTop: 8, padding: '4px 12px', border: `1px dashed ${C.border}`, borderRadius: 6, background: 'transparent', fontSize: 12, color: C.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </Section>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '2px 0' }}><span style={{ color: C.muted }}>Total Taxable:</span><span>{fmtCurr(totals.taxable)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '2px 0' }}><span style={{ color: C.muted }}>GST @{form.gst_rate}%:</span><span>{fmtCurr(totals.gst)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '4px 0', borderTop: `1px solid ${C.border}`, fontWeight: 700, fontSize: 15 }}><span>Net Amount:</span><span>{fmtCurr(totals.net)}</span></div>
                    <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>{amountToWords(totals.net)}</div>
                  </div>
                </div>

                {/* Terms */}
                <Section title="Terms">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <Label>Payment Terms</Label>
                      <textarea value={form.po_terms} onChange={e => set('po_terms', e.target.value)} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} placeholder="e.g. 100% within 30 days of delivery" />
                    </div>
                    <div>
                      <Label>Delivery Period</Label>
                      <input value={form.po_delivery_period} onChange={e => set('po_delivery_period', e.target.value)} style={inputS} placeholder="e.g. 2 weeks from PO date" />
                    </div>
                    <div>
                      <Label>Expected Completion</Label>
                      <input type="date" value={form.po_expected_completion_date} onChange={e => set('po_expected_completion_date', e.target.value)} style={inputS} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <Label>Special Terms (NDA, penalty, warranty)</Label>
                      <textarea value={form.po_special_terms} onChange={e => set('po_special_terms', e.target.value)} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} />
                    </div>
                  </div>
                </Section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Preview PO</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TDS Report Modal */}
      {showTDSReport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowTDSReport(false)}>
          <div style={{ background: '#fff', borderRadius: 14, width: 700, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadowMd }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>TDS Quarterly Report</h3>
              <button onClick={() => setShowTDSReport(false)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: '10px 16px', background: '#F3F4F6', borderRadius: 8, textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.muted }}>Total TDS</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>{fmtCurr(tdsReport.total_tds)}</div>
                </div>
                {Object.entries(tdsReport.summary || {}).map(([section, s]) => (
                  <div key={section} style={{ padding: '10px 16px', background: '#FEF3C7', borderRadius: 8, textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.muted }}>Section {section}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#92400E' }}>{fmtCurr(s.total_tds)}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{s.count} entries</div>
                  </div>
                ))}
              </div>
              {tdsReport.records?.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>PO #</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>Vendor</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>Section</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>Base</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', color: C.muted, fontWeight: 600 }}>TDS</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', color: C.muted, fontWeight: 600 }}>Quarter</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', color: C.muted, fontWeight: 600 }}>Form 16A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tdsReport.records.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.po_number || '—'}</td>
                        <td style={{ padding: '5px 8px' }}>{r.vendor_name || '—'}</td>
                        <td style={{ padding: '5px 8px' }}>{r.section}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{fmtCurr(r.base_amount)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: '#DC2626' }}>{fmtCurr(r.tds_amount)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>{r.quarter} {r.financial_year}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>{r.form_16a_issued ? <span style={{ color: '#059669' }}>Issued</span> : <span style={{ color: '#92400E' }}>Pending</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', color: C.muted, padding: 30 }}>No TDS records found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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

function POPreview({ form, totals, onBack, onSave, saving }) {
  return (
    <div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 16, fontFamily: C.font }}>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>INFOCUS IT CONSULTING PVT LTD</h2>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>A-19, Yadav Park, Rohtak Road, Nangloi, New Delhi – 110041</p>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>GSTIN: 07AAGCI4467G1ZF | Email: info@infocus-it.com</p>
          <div style={{ width: 60, height: 3, background: C.blue, margin: '10px auto', borderRadius: 2 }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>PURCHASE ORDER</h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 600 }}>PO No: {form.po_number}</p>
            <p style={{ margin: '0 0 2px', color: C.muted }}>Date: {form.po_date}</p>
            <p style={{ margin: 0, color: C.muted }}>GST: {form.po_gst_type}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px', fontWeight: 600 }}>{form.vendor_name}</p>
            <p style={{ margin: '0 0 2px', color: C.muted }}>{form.vendor_address}</p>
            <p style={{ margin: '0 0 2px', color: C.muted }}>GSTIN: {form.vendor_gstin || '—'}</p>
            <p style={{ margin: 0, color: C.muted }}>PAN: {form.vendor_pan || '—'}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
          <thead>
            <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `2px solid ${C.text}` }}>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Item / Service</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>SAC/HSN</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Rate</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Taxable</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>GST%</th>
              <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {totals.items.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '5px 8px' }}>{i + 1}</td>
                <td style={{ padding: '5px 8px' }}>{r.item_name}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.sac_hsn || '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.qty}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>{fmtCurr(r.rate)}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>{fmtCurr(r.taxable_value)}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.gst_rate}%</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{fmtCurr((r.taxable_value || 0) + (r._gst || 0))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.text}` }}>
              <td colSpan={5} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>Total Taxable</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{fmtCurr(totals.taxable)}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} style={{ padding: '4px 8px', textAlign: 'right', color: C.muted }}>GST @{form.gst_rate}%</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmtCurr(totals.gst)}</td>
              <td></td>
              <td></td>
            </tr>
            <tr style={{ borderTop: `2px solid ${C.text}` }}>
              <td colSpan={5} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, fontSize: 14 }}>Net Amount</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, fontSize: 14 }}>{fmtCurr(totals.net)}</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <p style={{ fontSize: 11, fontWeight: 600, fontStyle: 'italic', margin: '0 0 12px' }}>Amount in words: {amountToWords(totals.net)}</p>

        {form.po_terms && <div style={{ fontSize: 11, marginBottom: 8 }}><strong>Payment Terms:</strong> {form.po_terms}</div>}
        {form.po_delivery_period && <div style={{ fontSize: 11, marginBottom: 8 }}><strong>Delivery Period:</strong> {form.po_delivery_period}</div>}
        {form.po_special_terms && <div style={{ fontSize: 11, marginBottom: 8 }}><strong>Special Terms:</strong> {form.po_special_terms}</div>}

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, fontSize: 10, color: C.muted, marginTop: 12 }}>
          <p style={{ margin: '0 0 2px' }}>1. This PO is governed by the terms and conditions agreed between INFOCUS IT CONSULTING PVT LTD and the vendor.</p>
          <p style={{ margin: '0 0 2px' }}>2. GST will be deducted as applicable. TDS will be deducted under the Income Tax Act, 1961.</p>
          <p style={{ margin: '0 0 2px' }}>3. Payment shall be released upon acceptance of deliverables and receipt of GST-compliant invoice.</p>
          <p style={{ margin: 0 }}>4. Any amendments to this PO must be issued in writing as a revised PO.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontSize: 11 }}>
          <div>
            <p style={{ fontWeight: 600, margin: '0 0 2px' }}>For INFOCUS IT CONSULTING PVT LTD</p>
            <p style={{ margin: 0, color: C.muted }}>Authorised Signatory</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 600, margin: '0 0 2px' }}>Vendor Acceptance</p>
            <p style={{ margin: 0, color: C.muted }}>(Signature & Stamp)</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onBack} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text }}>Back to Edit</button>
        <button type="button" onClick={onSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Creating...' : 'Create PO'}
        </button>
      </div>
    </div>
  )
}
