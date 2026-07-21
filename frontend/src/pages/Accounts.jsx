import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'
import { Plus, Search, Building2, ChevronDown, ChevronRight, Users, Phone, MapPin, Briefcase, Filter, ArrowUpDown } from 'lucide-react'

const C = {
  bg: '#F4F5F7', card: '#fff', border: '#DFE1E6',
  blue: '#0052CC', blueLight: '#DEEBFF',
  text: '#172B4D', muted: '#5E6C84', secondary: '#7A869A',
  green: '#36B37E', orange: '#FF8B00', navy: '#0C2340',
  shadow: '0 1px 1px rgba(9,30,66,0.08), 0 0 1px rgba(9,30,66,0.12)',
  shadowMd: '0 4px 8px rgba(9,30,66,0.1), 0 0 1px rgba(9,30,66,0.12)',
  font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const INDUSTRIES = ['Finance & Banking', 'Education', 'IT & Technology', 'Government', 'PSU', 'Energy & Power', 'Healthcare', 'Defence', 'BFSI', 'Manufacturing', 'Retail', 'Other']

export default function Accounts() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
  const [expanded, setExpanded] = useState({})
  const { hasRole } = useAuth()

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1); load() }, [statusFilter])
  useEffect(() => { load() }, [page])

  const load = async () => {
    try { const r = await api.get('/api/accounts', { params: { search, status: statusFilter, page, per_page: 50 } }); setAccounts(r.data.accounts); setPagination(r.data.pagination) }
    catch (e) {} finally { setLoading(false) }
  }

  const mainClients = accounts.filter(a => !a.referred_by_account_id)
  const subClients = accounts.filter(a => a.referred_by_account_id)
  const tree = mainClients.map(main => ({
    ...main,
    children: subClients.filter(sub => sub.referred_by_account_id === main.id),
  }))
  const orphans = subClients.filter(sub => !mainClients.find(m => m.id === sub.referred_by_account_id))
  const totalProjects = accounts.reduce((s, a) => s + (a.projects_count || 0), 0)

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased', background: C.bg }}>
      <div style={{ padding: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Clients</h1>
            <p style={{ fontSize: 12, color: C.secondary, margin: '2px 0 0' }}>{accounts.length} clients · {totalProjects} projects</p>
          </div>
          {hasRole('admin', 'project_lead') && (
            <button onClick={() => { setEditAccount(null); setShowForm(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 4, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
              <Plus className="w-4 h-4" /> New Client
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ padding: '14px 24px 8px', display: 'flex', gap: 8 }}>
          {[
            { label: 'All clients', value: accounts.length, color: C.text, active: !statusFilter, onClick: () => setStatusFilter('') },
            { label: 'Active', value: accounts.filter(a => a.status === 'Active').length, color: C.green, active: statusFilter === 'Active', onClick: () => setStatusFilter('Active') },
            { label: 'Main', value: mainClients.length, color: C.blue, active: false, onClick: () => {} },
            { label: 'Sub', value: subClients.length, color: C.orange, active: false, onClick: () => {} },
          ].map(s => (
            <button key={s.label} onClick={s.onClick}
              style={{
                padding: '6px 12px', borderRadius: 4, border: s.active ? `1px solid ${C.blue}` : '1px solid transparent',
                background: s.active ? C.blueLight : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: C.font, fontSize: 12, color: s.active ? C.blue : C.secondary, fontWeight: s.active ? 600 : 400,
                transition: 'all 0.1s',
              }}>
              <span style={{ fontWeight: 700 }}>{s.value}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Search + Filter bar */}
        <div style={{ padding: '4px 24px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: C.secondary }} />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              style={{ width: '100%', padding: '6px 8px 6px 28px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#FAFBFC', boxSizing: 'border-box' }}
              placeholder="Search by company, ID, GST..." />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '6px 8px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#FAFBFC', cursor: 'pointer', color: C.text }}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button onClick={load} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#FAFBFC', fontSize: 13, cursor: 'pointer', color: C.text, fontFamily: C.font }}>
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table / List */}
        <div style={{ padding: '0 24px 24px' }}>
          {loading ? (
            <div style={{ background: C.card, borderRadius: 4, border: `1px solid ${C.border}`, padding: 20 }}><TableSkeleton rows={5} cols={5} /></div>
          ) : accounts.length === 0 ? (
            <div style={{ background: C.card, borderRadius: 4, border: `1px solid ${C.border}`, textAlign: 'center', padding: '48px 20px' }}>
              <Building2 className="w-10 h-10" style={{ margin: '0 auto 10px', color: C.secondary, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>No clients found</div>
              <div style={{ fontSize: 12, color: C.secondary, marginTop: 4 }}>Try adjusting your search or filters.</div>
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 4, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
              {/* Column headers */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFC', fontSize: 11, fontWeight: 600, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                <div style={{ width: 44 }} />
                <div style={{ flex: 1 }}>Client</div>
                <div style={{ width: 100, textAlign: 'center' }}>Contact</div>
                <div style={{ width: 100, textAlign: 'center' }}>Industry</div>
                <div style={{ width: 80, textAlign: 'center' }}>Projects</div>
                <div style={{ width: 80, textAlign: 'center' }} />
              </div>
              {tree.map(main => (
                <ClientNode key={main.id} client={main} expanded={expanded[main.id]} onToggle={() => setExpanded({ ...expanded, [main.id]: !expanded[main.id] })} navigate={navigate} />
              ))}
              {orphans.map(orphan => (
                <OrphanRow key={orphan.id} orphan={orphan} navigate={navigate} />
              ))}
              {pagination && <div style={{ padding: '8px 16px', borderTop: `1px solid ${C.border}` }}><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} /></div>}
            </div>
          )}
        </div>

        {showForm && <AccountForm editData={editAccount} onClose={() => { setShowForm(false); setEditAccount(null) }} onSaved={() => { setShowForm(false); setEditAccount(null); load() }} />}
      </div>
    </div>
  )
}

function ClientNode({ client, expanded, onToggle, navigate }) {
  const children = client.children || []
  const hasChildren = children.length > 0
  const statusColor = client.status === 'Active' ? '#36B37E' : client.status === 'Inactive' ? '#E34935' : '#FF8B00'

  return (
    <div>
      <div onClick={() => navigate(`/accounts/${client.id}`)}
        style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F7' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
        {/* Avatar */}
        <div style={{ width: 36, height: 36, borderRadius: 4, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0, marginRight: 10 }}>
          {(client.company_name || '?')[0].toUpperCase()}
        </div>
        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{client.company_name}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: C.blue, background: C.blueLight, padding: '1px 6px', borderRadius: 4 }}>{client.acc_id}</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
            {client.city && <span style={{ fontSize: 12, color: C.secondary, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin className="w-3 h-3" /> {client.city}</span>}
            {client.gst_no && <span style={{ fontSize: 11, color: C.secondary }}>GST: {client.gst_no}</span>}
          </div>
        </div>
        {/* Contact */}
        <div style={{ width: 100, textAlign: 'center' }}>
          {client.contact_name && <span style={{ fontSize: 12, color: C.text }}>{client.contact_name}</span>}
        </div>
        {/* Industry */}
        <div style={{ width: 100, textAlign: 'center' }}>
          {client.industry && <span style={{ fontSize: 11, color: C.secondary, background: '#F0F0F0', padding: '1px 8px', borderRadius: 4 }}>{client.industry}</span>}
        </div>
        {/* Projects */}
        <div style={{ width: 80, textAlign: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{client.projects_count || 0}</span>
        </div>
        {/* Expand */}
        <div style={{ width: 80, textAlign: 'center' }}>
          {hasChildren && (
            <button onClick={e => { e.stopPropagation(); onToggle() }} style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #DFE1E6', background: '#fff', cursor: 'pointer', color: C.secondary, display: 'inline-flex', alignItems: 'center', fontFamily: C.font, fontSize: 11, gap: 4 }}>
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {children.length} sub
            </button>
          )}
        </div>
      </div>

      {/* Sub-client children */}
      {hasChildren && expanded && (
        <div style={{ background: '#FAFBFC' }}>
          {children.map(child => (
            <div key={child.id} onClick={() => navigate(`/accounts/${child.id}`)}
              style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 8px 62px', borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <div style={{ width: 28, height: 28, borderRadius: 4, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.blue, flexShrink: 0, marginRight: 10 }}>
                {(child.company_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{child.company_name}</span>
                <span style={{ fontSize: 11, color: C.secondary, marginLeft: 8 }}>{child.acc_id}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.orange, background: '#FFF0E0', padding: '1px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>Sub-Client</span>
              <div style={{ width: 80, textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.text }}>{child.projects_count || 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrphanRow({ orphan, navigate }) {
  return (
    <div onClick={() => navigate(`/accounts/${orphan.id}`)}
      style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F7' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
      <div style={{ width: 36, height: 36, borderRadius: 4, background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.secondary, flexShrink: 0, marginRight: 10 }}>
        {(orphan.company_name || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{orphan.company_name}</span>
        <span style={{ fontSize: 11, color: C.secondary, marginLeft: 8 }}>{orphan.acc_id}</span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: C.orange, background: '#FFF0E0', padding: '1px 8px', borderRadius: 4 }}>Sub-Client</span>
      <div style={{ width: 80, textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.text }}>{orphan.projects_count || 0}</div>
    </div>
  )
}

// ═══════════ ACCOUNT FORM ═══════════
function AccountForm({ editData, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: editData?.company_name || '', contact_name: editData?.contact_name || '',
    contact_email: editData?.contact_email || '', contact_phone: editData?.contact_phone || '',
    website: editData?.website || '', address: editData?.address || '',
    city: editData?.city || '', state: editData?.state || '',
    country: editData?.country || 'India', pincode: editData?.pincode || '',
    gst_no: editData?.gst_no || '', pan_no: editData?.pan_no || '',
    industry: editData?.industry || '', account_type: editData?.account_type || 'B2B',
    referred_by_account_id: editData?.referred_by_account_id || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [parentClients, setParentClients] = useState([])
  const f = (k, v) => setForm({ ...form, [k]: v })

  useEffect(() => { if (form.account_type === 'B2B' && parentClients.length === 0) { api.get('/api/accounts', { params: { per_page: 500 } }).then(r => setParentClients(r.data.accounts)).catch(() => {}) } }, [form.account_type])

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (form.account_type === 'B2B' && !form.referred_by_account_id) {
        setError('Please select a Parent Client for B2B accounts'); setSaving(false); return
      }
      const payload = { ...form }
      if (!payload.referred_by_account_id) delete payload.referred_by_account_id
      else payload.referred_by_account_id = parseInt(payload.referred_by_account_id)
      if (editData) await api.put(`/api/accounts/${editData.id}`, payload)
      else await api.post('/api/accounts', payload)
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 4, width: 640, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>{editData ? 'Edit Client' : 'Create client'}</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <form onSubmit={save} style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {error && <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 4, background: '#FFEDED', border: '1px solid #FFC7C7', fontSize: 12, fontWeight: 500, color: '#BF2600' }}>{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 12, margin: '0 0 12px' }}>Company Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Company Name <span style={{ color: '#E34935' }}>*</span></label><input value={form.company_name} onChange={e => f('company_name', e.target.value)} required style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Industry</label><select value={form.industry} onChange={e => f('industry', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff' }}><option value="">-- Select --</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Type</label><select value={form.account_type} onChange={e => f('account_type', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff' }}><option value="B2B">B2B</option><option value="B2C">B2C</option></select></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Website</label><input value={form.website} onChange={e => f('website', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              {form.account_type === 'B2B' && <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Parent Client <span style={{ color: '#E34935' }}>*</span></label><select value={form.referred_by_account_id} onChange={e => f('referred_by_account_id', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff' }}><option value="">-- Select --</option>{parentClients.filter(c => c.id !== editData?.id).map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.acc_id})</option>)}</select></div>}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 12 }}>Primary Contact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Contact Person</label><input value={form.contact_name} onChange={e => f('contact_name', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Email</label><input type="email" value={form.contact_email} onChange={e => f('contact_email', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Phone</label><input value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 12 }}>Address & Tax</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Address</label><input value={form.address} onChange={e => f('address', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>City</label><input value={form.city} onChange={e => f('city', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>State</label><input value={form.state} onChange={e => f('state', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Country</label><input value={form.country} onChange={e => f('country', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>Pincode</label><input value={form.pincode} onChange={e => f('pincode', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>GST No</label><input value={form.gst_no} onChange={e => f('gst_no', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 3, display: 'block' }}>PAN No</label><input value={form.pan_no} onChange={e => f('pan_no', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <button type="button" onClick={onClose} style={{ padding: '7px 14px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: C.font, color: C.text }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '7px 16px', borderRadius: 4, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: C.font }}>{saving ? 'Saving...' : editData ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
