import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'
import { Plus, Search, Building2, DollarSign, ChevronDown, ChevronRight, Users, Phone, MapPin, Briefcase } from 'lucide-react'

const C = {
  bg: '#F1F5F9', card: '#fff', border: '#E2E8F0',
  primary: '#0052CC', primaryLight: '#DEEBFF',
  text: '#0F172A', muted: '#94A3B8', secondary: '#64748B',
  success: '#10B981', danger: '#EF4444', warning: '#F59E0B',
  shadow: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); load() }, [statusFilter])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  const load = async () => {
    try { const r = await api.get('/api/accounts', { params: { search, status: statusFilter, page, per_page: 50 } }); setAccounts(r.data.accounts); setPagination(r.data.pagination) }
    catch (e) {} finally { setLoading(false) }
  }

  // Group accounts: main clients first with sub-clients nested
  const mainClients = accounts.filter(a => !a.referred_by_account_id)
  const subClients = accounts.filter(a => a.referred_by_account_id)
  const tree = mainClients.map(main => ({
    ...main,
    children: subClients.filter(sub => sub.referred_by_account_id === main.id),
  }))
  // Also include orphans (sub-clients whose parent isn't in this page)
  const orphans = subClients.filter(sub => !mainClients.find(m => m.id === sub.referred_by_account_id))

  const totalProjects = accounts.reduce((s, a) => s + (a.projects_count || 0), 0)

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ padding: '4px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Clients</h1>
            <p style={{ fontSize: 14, color: '#64748B', marginTop: 2 }}>Client master records — all projects, leads, and history linked here</p>
          </div>
          {hasRole('admin', 'project_lead') && (
            <button onClick={() => { setEditAccount(null); setShowForm(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, border: 'none', background: '#0052CC', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 8px rgba(0,82,204,0.25)', transition: 'all 0.15s' }}>
              <Plus className="w-4 h-4" /> New Client
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Clients', value: accounts.length, color: C.primary },
            { label: 'Active', value: accounts.filter(a => a.status === 'Active').length, color: C.success },
            { label: 'Main Clients', value: mainClients.length, color: '#4F46E5' },
            { label: 'Sub-Clients', value: subClients.length, color: '#D97706' },
            { label: 'Total Projects', value: totalProjects, color: '#0284C7' },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px', boxShadow: C.shadow }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: '1 1 280px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search className="w-4 h-4" style={{ position: 'absolute', left: 12, color: '#94A3B8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
                style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff' }}
                placeholder="Search by company, ID, GST..." />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff', cursor: 'pointer' }}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button onClick={load} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: C.font }}>Search</button>
          </div>

          {/* Tree content */}
          {loading ? (
            <div style={{ padding: 20 }}><TableSkeleton rows={5} cols={5} /></div>
          ) : accounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
              <Building2 className="w-10 h-10" style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#64748B' }}>No clients found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters.</div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px' }}>
              {/* Main clients with children */}
              {tree.map(main => (
                <ClientNode key={main.id} client={main} isMain expanded={expanded[main.id]} onToggle={() => setExpanded({ ...expanded, [main.id]: !expanded[main.id] })} navigate={navigate} />
              ))}
              {/* Orphan sub-clients */}
              {orphans.map(orphan => (
                <div key={orphan.id} onClick={() => navigate(`/accounts/${orphan.id}`)} style={{ padding: '12px 16px', marginBottom: 6, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: C.shadow, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B5FD'; e.currentTarget.style.boxShadow = C.shadowMd }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = C.shadow }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#475569', flex: 1 }}>{orphan.company_name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FFFBEB', padding: '2px 10px', borderRadius: 6 }}>Sub-Client</span>
                </div>
              ))}
            </div>
          )}
          {pagination && <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}` }}><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} /></div>}
        </div>

        {showForm && <AccountForm editData={editAccount} onClose={() => { setShowForm(false); setEditAccount(null) }} onSaved={() => { setShowForm(false); setEditAccount(null); load() }} />}
      </div>
    </div>
  )
}

function ClientNode({ client, isMain, expanded, onToggle, navigate }) {
  const children = client.children || []
  const hasChildren = children.length > 0

  return (
    <div style={{ marginBottom: 10, borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden', transition: 'all 0.15s' }}>
      {/* Main client header */}
      <div onClick={() => navigate(`/accounts/${client.id}`)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#FAFAFE'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        {/* Avatar */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0052CC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,82,204,0.2)' }}>
          {(client.company_name || '?')[0].toUpperCase()}
        </div>
        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.2px' }}>{client.company_name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#0052CC', background: '#DEEBFF', padding: '2px 10px', borderRadius: 6 }}>{client.acc_id}</span>
            {client.status !== 'Active' && <span style={{ fontSize: 10, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', padding: '1px 8px', borderRadius: 6 }}>{client.status}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
            {client.contact_name && <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><Phone className="w-3 h-3" /> {client.contact_name}</span>}
            {client.industry && <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase className="w-3 h-3" /> {client.industry}</span>}
            {client.city && <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin className="w-3 h-3" /> {client.city}</span>}
          </div>
        </div>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>{client.projects_count || 0}</div>
            <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8' }}>Projects</div>
          </div>
          {hasChildren && (
            <button onClick={e => { e.stopPropagation(); onToggle() }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Sub-client children */}
      {hasChildren && expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, background: '#F8FAFC' }}>
          {children.map(child => (
            <div key={child.id} onClick={() => navigate(`/accounts/${child.id}`)} style={{ padding: '12px 20px 12px 78px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid #F0F0F5`, transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DEEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0052CC', flexShrink: 0 }}>
                {(child.company_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{child.company_name}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8', marginLeft: 8 }}>{child.acc_id}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FFFBEB', padding: '2px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>Sub-Client</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>{child.projects_count || 0}</div>
                <div style={{ fontSize: 9, fontWeight: 500, color: '#94A3B8' }}>proj</div>
              </div>
            </div>
          ))}
        </div>
      )}
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: 640, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{editData ? 'Edit Client' : 'Create New Client'}</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F1F5F9', cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <form onSubmit={save} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, fontWeight: 500, color: '#991B1B' }}>{error}</div>}

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 14 }}>Company Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Company Name <span style={{ color: '#DC2626' }}>*</span></label><input value={form.company_name} onChange={e => f('company_name', e.target.value)} required style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Industry / Sector</label><select value={form.industry} onChange={e => f('industry', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff' }}><option value="">-- Select --</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Account Type</label><select value={form.account_type} onChange={e => f('account_type', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff' }}><option value="B2B">B2B (Business)</option><option value="B2C">B2C (Individual)</option></select></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Website</label><input value={form.website} onChange={e => f('website', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              {form.account_type === 'B2B' && <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Parent Client <span style={{ color: '#DC2626' }}>*</span></label><select value={form.referred_by_account_id} onChange={e => f('referred_by_account_id', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff' }}><option value="">-- Select Parent Client --</option>{parentClients.filter(c => c.id !== editData?.id).map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.acc_id})</option>)}</select></div>}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 14 }}>Primary Contact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Contact Person</label><input value={form.contact_name} onChange={e => f('contact_name', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Email</label><input type="email" value={form.contact_email} onChange={e => f('contact_email', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Phone</label><input value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 14 }}>Address & Tax</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Address</label><input value={form.address} onChange={e => f('address', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>City</label><input value={form.city} onChange={e => f('city', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>State</label><input value={form.state} onChange={e => f('state', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Country</label><input value={form.country} onChange={e => f('country', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>Pincode</label><input value={form.pincode} onChange={e => f('pincode', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>GST No</label><input value={form.gst_no} onChange={e => f('gst_no', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4, display: 'block' }}>PAN No</label><input value={form.pan_no} onChange={e => f('pan_no', e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: `1.5px solid ${C.border}`, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#0052CC', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: C.font, boxShadow: '0 2px 6px rgba(0,82,204,0.2)' }}>{saving ? 'Saving...' : editData ? 'Update Client' : 'Create Client'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
