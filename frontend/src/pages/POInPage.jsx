import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Plus, Search, X, FileText, Building2, DollarSign, Calendar, RefreshCw, ArrowUpRight, CheckCircle, Clock, Ban, Send, Upload } from 'lucide-react'
import api from '../services/api'
import { C } from '../components/styleConstants'
import { useToast } from '../contexts/ToastContext'

const STATUS_COLORS = {
  'WORK ORDER RECEIVED': { bg: '#DBEAFE', text: '#1E40AF' },
  'IN PROGRESS': { bg: '#EDE9FE', text: '#5B21B6' },
  'COMPLETED': { bg: '#D1FAE5', text: '#065F46' },
  'INVOICED': { bg: '#FEF3C7', text: '#92400E' },
  'PAID': { bg: '#059669', text: '#fff' },
  'CANCELLED': { bg: '#FEE2E2', text: '#991B1B' },
}

const defaultItem = { item_name: '', sac_hsn: '', qty: 1, rate: 0, gst_rate: 18 }

const fmtCurr = (v) => v != null ? '₹' + Number(v).toLocaleString('en-IN') : '—'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function POInPage() {
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
  const [clients, setClients] = useState([])

  const [form, setForm] = useState({
    proj_id: '', client_id: '', po_number: '', title: '', po_date: new Date().toISOString().split('T')[0],
    description: '', gst_rate: 18,
    delivery_period: '', expected_completion: '', start_date: '', target_date: '',
    special_terms: '', po_terms: '',
    line_items: [{ ...defaultItem }],
  })

  const load = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const r = await api.get('/api/po-in', { params })
      setPoList(r.data.po_list || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadClients = async () => {
    try {
      const r = await api.get('/api/clients', { params: { per_page: 500 } })
      setClients(r.data.clients || [])
    } catch (e) { addToast('Client list load failed', 'error') }
  }

  useEffect(() => { load(); loadClients() }, [])
  useEffect(() => {
    const cid = searchParams.get('client_id')
    if (cid && clients.length > 0) {
      openCreate(cid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, searchParams])

  const openCreate = async (prefillClientId) => {
    setError('')
    try {
      const r = await api.get('/api/po-in/next-proj-id')
      const cid = prefillClientId || ''
      const c = cid ? clients.find(cl => cl.id.toString() === cid) : null
      setForm(f => ({
        ...f, proj_id: r.data.proj_id, po_date: new Date().toISOString().split('T')[0],
        line_items: [{ ...defaultItem }], client_id: cid, po_number: '', title: c ? `Work Order — ${c.name}` : '',
        description: '', gst_rate: 18, delivery_period: '', expected_completion: '',
        start_date: '', target_date: '', special_terms: '', po_terms: '',
      }))
    } catch (e) { addToast('Failed to generate proj ID', 'error') }
    setShowForm(true)
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleClientSelect = async (e) => {
    const cid = e.target.value
    set('client_id', cid)
    if (cid) {
      const c = clients.find(cl => cl.id.toString() === cid)
      if (c) {
        set('title', c.name ? `Work Order — ${c.name}` : '')
      }
    } else {
      set('title', '')
    }
  }

  const addItem = () => set('line_items', [...form.line_items, { ...defaultItem }])
  const removeItem = (idx) => {
    if (form.line_items.length <= 1) return
    set('line_items', form.line_items.filter((_, i) => i !== idx))
  }
  const updateItem = (idx, field, value) => {
    const items = [...form.line_items]
    items[idx] = { ...items[idx], [field]: value }
    set('line_items', items)
  }

  const calcTotals = () => {
    const taxable = form.line_items.reduce((s, i) => s + ((parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0)), 0)
    const gstRate = parseFloat(form.gst_rate) || 18
    const gst = taxable * gstRate / 100
    return { taxable, gst, net: taxable + gst }
  }

  const handleClientPOCheck = async () => {
    if (!form.client_id || !form.po_number.trim()) return
    try {
      const r = await api.get('/api/po-in/check-po', { params: { client_id: form.client_id, po_number: form.po_number.trim() } })
      if (r.data.exists) {
        setError(`PO number "${form.po_number}" already exists for this client`)
      } else {
        setError('')
      }
    } catch (e) { addToast('PO check failed', 'error') }
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
          item_name: i.item_name, sac_hsn: i.sac_hsn,
          qty: parseFloat(i.qty) || 0, rate: parseFloat(i.rate) || 0,
          gst_rate: parseFloat(i.gst_rate) || 18,
        })),
      }
      await api.post('/api/po-in', payload)
      setShowForm(false); load()
    } catch (e) { setError(e.response?.data?.error || 'Failed to create Work Order') }
    finally { setSaving(false) }
  }

  const totals = calcTotals()

  const filtered = poList.filter(p =>
    !search
    || p.proj_id?.toLowerCase().includes(search.toLowerCase())
    || p.po_number?.toLowerCase().includes(search.toLowerCase())
    || p.client_name?.toLowerCase().includes(search.toLowerCase())
    || p.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Work Orders (PO In)</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Client work orders / POs received — track & acknowledge</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: C.blue, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus className="w-4 h-4" /> Add Work Order
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: 9, color: C.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Project ID, PO #, client..." style={{ width: '100%', padding: '7px 10px 7px 32px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? <p style={{ color: C.muted, fontSize: 13 }}>Loading work orders...</p> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          <FileText className="w-12 h-12 mx-auto" style={{ opacity: 0.2, marginBottom: 8 }} />
          <p style={{ fontWeight: 600, color: C.text }}>No Work Orders yet</p>
          <p style={{ fontSize: 13, marginBottom: 14 }}>Click "Add Work Order" to register the first one</p>
          <button onClick={openCreate} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus className="w-4 h-4" /> Add Work Order
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#F9FAFB' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Project ID</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Client</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>PO #</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Amount</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Date</th>
                <th style={{ padding: '10px 12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const sc = STATUS_COLORS[p.po_in_status] || STATUS_COLORS['WORK ORDER RECEIVED']
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid #F3F4F6`, cursor: 'pointer' }} onClick={() => navigate(`/po-in/${p.id}`)}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: C.blue }}>{p.proj_id || '—'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.client_name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.muted }}>{p.po_number || '—'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{fmtCurr(p.net_amount)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.text }}>{p.po_in_status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.muted }}>{fmtDate(p.po_date)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Link to={`/po-in/${p.id}`} style={{ color: C.blue, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
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

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 14, width: 760, maxWidth: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadowMd }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Add Work Order / PO (Incoming)</h2>
              <button onClick={() => { setShowForm(false) }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {error && <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: '#B91C1C' }}>{error}</div>}

              <Section title="Project ID">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Label>Project ID (Auto-generated)</Label>
                    <input value={form.proj_id} readOnly style={{ ...inputS, background: '#F9FAFB' }} />
                  </div>
                  <div>
                    <Label>PO Date</Label>
                    <input type="date" value={form.po_date} onChange={e => set('po_date', e.target.value)} style={inputS} />
                  </div>
                </div>
              </Section>

              <Section title="Client Details">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Client *</Label>
                    <select value={form.client_id} onChange={handleClientSelect} required style={inputS}>
                      <option value="">-- Select Client --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.gst_number ? `(${c.gst_number})` : ''}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Title / Description *</Label>
                    <input value={form.title} onChange={e => set('title', e.target.value)} required style={inputS} placeholder="e.g. VAPT for ABC Corp" />
                  </div>
                  <div>
                    <Label>PO / Work Order Number</Label>
                    <input value={form.po_number} onChange={e => { set('po_number', e.target.value); setError('') }} onBlur={handleClientPOCheck} style={inputS} placeholder="Client's PO ref" />
                  </div>
                  <div>
                    <Label>GST Rate (%)</Label>
                    <input type="number" min="0" step="0.1" value={form.gst_rate} onChange={e => set('gst_rate', e.target.value)} style={inputS} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Description</Label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} placeholder="Scope of work or additional notes..." />
                  </div>
                </div>
              </Section>

              <Section title="Itemwise PO Value">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: C.muted, width: 30 }}>#</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: C.muted }}>Item / Service *</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: C.muted, width: 80 }}>SAC</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.muted, width: 60 }}>Qty</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.muted, width: 80 }}>Rate</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.muted, width: 90 }}>Taxable</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: C.muted, width: 60 }}>GST%</th>
                        <th style={{ padding: '6px 8px', width: 30 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.line_items.map((item, idx) => {
                        const qty = parseFloat(item.qty) || 0
                        const rate = parseFloat(item.rate) || 0
                        const taxable = qty * rate
                        return (
                          <tr key={idx} style={{ borderBottom: `1px solid #F3F4F6` }}>
                            <td style={{ padding: '4px 8px', color: C.muted }}>{idx + 1}</td>
                            <td style={{ padding: '4px 8px' }}>
                              <input value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12 }} placeholder="Item name" />
                            </td>
                            <td style={{ padding: '4px 8px' }}>
                              <input value={item.sac_hsn} onChange={e => updateItem(idx, 'sac_hsn', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12 }} placeholder="SAC" />
                            </td>
                            <td style={{ padding: '4px 8px' }}>
                              <input type="number" min="0" step="0.01" value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12, textAlign: 'right', width: 60 }} />
                            </td>
                            <td style={{ padding: '4px 8px' }}>
                              <input type="number" min="0" step="1" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} style={{ ...inputS, padding: '4px 8px', fontSize: 12, textAlign: 'right', width: 80 }} />
                            </td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, fontSize: 12 }}>{fmtCurr(taxable)}</td>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <div style={{ fontSize: 13, textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '2px 0' }}><span style={{ color: C.muted }}>Total Taxable:</span><span>{fmtCurr(totals.taxable)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '2px 0' }}><span style={{ color: C.muted }}>GST @{form.gst_rate}%:</span><span>{fmtCurr(totals.gst)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '4px 0', borderTop: `1px solid ${C.border}`, fontWeight: 700, fontSize: 15 }}><span>Net Amount:</span><span>{fmtCurr(totals.net)}</span></div>
                </div>
              </div>

              <Section title="Delivery Terms">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <Label>Delivery Period</Label>
                    <input value={form.delivery_period} onChange={e => set('delivery_period', e.target.value)} style={inputS} placeholder="e.g. 4 weeks from PO" />
                  </div>
                  <div>
                    <Label>Expected Completion</Label>
                    <input type="date" value={form.expected_completion} onChange={e => set('expected_completion', e.target.value)} style={inputS} />
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inputS} />
                  </div>
                  <div>
                    <Label>Target Date</Label>
                    <input type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} style={inputS} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Payment Terms</Label>
                    <textarea value={form.po_terms} onChange={e => set('po_terms', e.target.value)} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} placeholder="e.g. 50% advance, 50% on delivery" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Label>Special Terms</Label>
                    <textarea value={form.special_terms} onChange={e => set('special_terms', e.target.value)} style={{ ...inputS, minHeight: 50, resize: 'vertical' }} placeholder="NDA, SLA, penalty clauses..." />
                  </div>
                </div>
              </Section>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Create Work Order'}
                </button>
              </div>
            </form>
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
