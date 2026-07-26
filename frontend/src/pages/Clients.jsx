import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Download, Building2, Users, UserCheck, UserX, Ban, Clock, ChevronRight } from 'lucide-react'
import { C } from '../components/styleConstants'
import Pagination from '../components/Pagination'
import { fetchClients, fetchClientSummary, exportClients } from '../api/clientsApi'
import { TableSkeleton } from '../components/LoadingSkeleton'

const STATUSES = ['', 'ACTIVE', 'PROSPECT', 'DORMANT', 'HOLD', 'BLACKLISTED', 'ARCHIVED']
const CLIENT_TYPES = ['', 'main', 'sub', 'vendor']
const STATUS_COLORS = {
  ACTIVE: { bg: '#DCFCE7', text: '#166534' },
  PROSPECT: { bg: '#DBEAFE', text: '#1E40AF' },
  DORMANT: { bg: '#FEF3C7', text: '#92400E' },
  HOLD: { bg: '#F3E8FF', text: '#7C3AED' },
  BLACKLISTED: { bg: '#FEE2E2', text: '#991B1B' },
  ARCHIVED: { bg: '#F1F5F9', text: '#475569' },
}

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, prospect: 0, dormant: 0, blacklisted: 0, vendors: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [sectors, setSectors] = useState([])
  const [states, setStates] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [exporting, setExporting] = useState(false)
  const debounceRef = useRef(null)

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetchClientSummary()
      setSummary(res || { total: 0, active: 0, prospect: 0, dormant: 0, blacklisted: 0, vendors: 0 })
    } catch {}
  }, [])

  const load = useCallback(async (s, st, t, sec, state, p) => {
    setLoading(true)
    try {
      const params = { page: p || 1, per_page: 20 }
      if (s) params.search = s
      if (st) params.status = st
      if (t) params.client_type = t
      if (sec) params.client_category = sec
      if (state) params.state = state
      const res = await fetchClients(params)
      setClients(res.clients || [])
      setTotal(res.total || 0)
      setPages(res.pages || 1)

      const secList = [...new Set((res.clients || []).map(c => c.client_category).filter(Boolean))].sort()
      setSectors(prev => {
        const merged = new Set([...prev, ...secList])
        return [...merged].sort()
      })
      const stList = [...new Set((res.clients || []).map(c => c.state).filter(Boolean))].sort()
      setStates(prev => {
        const merged = new Set([...prev, ...stList])
        return [...merged].sort()
      })
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSummary() }, [loadSummary])

  useEffect(() => {
    load(search, statusFilter, typeFilter, sectorFilter, stateFilter, page)
  }, [statusFilter, typeFilter, sectorFilter, stateFilter, page])

  const handleSearchInput = (val) => {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      load(val, statusFilter, typeFilter, sectorFilter, stateFilter, 1)
    }, 350)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportClients({ status: statusFilter, client_type: typeFilter, client_category: sectorFilter, state: stateFilter })
      const url = window.URL.createObjectURL(new Blob([blob]))
      const a = document.createElement('a')
      a.href = url
      a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {} finally { setExporting(false) }
  }

  const cardBase = { background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: '12px 16px', boxShadow: C.shadow }

  const statCards = [
    { label: 'Total Clients', value: summary.total, icon: Building2, color: C.blue, bg: '#EFF6FF' },
    { label: 'Active', value: summary.active, icon: UserCheck, color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Prospect', value: summary.prospect, icon: Users, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Dormant', value: summary.dormant, icon: Clock, color: '#D97706', bg: '#FFFBEB' },
    { label: 'Blacklisted', value: summary.blacklisted, icon: Ban, color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Vendors', value: summary.vendors, icon: UserX, color: '#7C3AED', bg: '#F5F3FF' },
  ]

  const colH = { fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.3px' }

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased', background: C.bg, padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>Clients</h1>
          <p style={{ fontSize: 12, color: C.secondary, margin: '2px 0 0' }}>{total} records</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} disabled={exporting} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, color: C.text, display: 'flex', alignItems: 'center', gap: 6, opacity: exporting ? 0.6 : 1 }}>
            <Download className="w-3.5 h-3.5" /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={() => navigate('/clients/new')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 3px rgba(0,82,204,0.3)' }}>
            <Plus className="w-3.5 h-3.5" /> Add Client
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
        {statCards.map(card => (
          <div key={card.label} style={cardBase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{card.value}</div>
            <div style={{ fontSize: 10, color: C.secondary, fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.secondary, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => handleSearchInput(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: C.font, background: '#fff', boxSizing: 'border-box', color: C.text }}
            placeholder="Search by name, code, GST, phone..."
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          <option value="">All Status</option>
          {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          <option value="">All Types</option>
          <option value="main">Main Client</option>
          <option value="sub">Sub-Client</option>
          <option value="vendor">Vendor</option>
        </select>
        <select value={sectorFilter} onChange={e => { setSectorFilter(e.target.value); setPage(1) }} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, maxWidth: 160 }}>
          <option value="">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(1) }} style={{ padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, maxWidth: 140 }}>
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 20 }}>
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : clients.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, textAlign: 'center', padding: '64px 20px' }}>
          <Building2 className="w-14 h-14" style={{ margin: '0 auto 12px', color: C.secondary, opacity: 0.2 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>No clients found</div>
          <div style={{ fontSize: 13, color: C.secondary, marginTop: 4 }}>Try adjusting your search or filters.</div>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: `1px solid ${C.border}`, background: '#F8FAFC' }}>
            <div style={{ width: 120, ...colH }}>Code</div>
            <div style={{ flex: '1 1 0', ...colH }}>Name</div>
            <div style={{ width: 80, textAlign: 'center', ...colH }}>Type</div>
            <div style={{ width: 90, textAlign: 'center', ...colH }}>Status</div>
            <div style={{ width: 100, textAlign: 'center', ...colH }}>Category</div>
            <div style={{ width: 90, textAlign: 'center', ...colH }}>State</div>
            <div style={{ width: 130, textAlign: 'center', ...colH }}>Contact</div>
            <div style={{ width: 80, textAlign: 'center', ...colH }}>GST</div>
            <div style={{ width: 36 }} />
          </div>
          {clients.map(client => {
            const sc = STATUS_COLORS[client.status] || { bg: '#F1F5F9', text: '#475569' }
            return (
              <div
                key={client.id}
                onClick={() => navigate(client.client_type === 'vendor' ? `/vendors/${client.id}` : `/clients/${client.id}`)}
                style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.1s', fontSize: 12 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 120, fontWeight: 600, color: C.blue, fontSize: 11 }}>{client.client_code}</div>
                <div style={{ flex: '1 1 0', fontWeight: 500 }}>
                  {client.name}
                  {client.client_type === 'sub' && <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>(sub)</span>}
                </div>
                <div style={{ width: 80, textAlign: 'center', fontSize: 11, color: C.secondary }}>{client.client_type === 'vendor' ? 'Vendor' : client.business_type || '—'}</div>
                <div style={{ width: 90, textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.text }}>
                    {client.status}
                  </span>
                </div>
                <div style={{ width: 100, textAlign: 'center', color: C.secondary, fontSize: 11 }}>{client.client_category || '—'}</div>
                <div style={{ width: 90, textAlign: 'center', color: C.secondary, fontSize: 11 }}>{client.state || '—'}</div>
                <div style={{ width: 130, textAlign: 'center', fontSize: 11, color: C.secondary }}>
                  {client.contact_phone || client.contact_email || '—'}
                </div>
                <div style={{ width: 80, textAlign: 'center', fontSize: 10, color: C.muted }}>{client.gst_number || (client.gst_unregistered ? 'Unreg' : '—')}</div>
                <div style={{ width: 36, textAlign: 'right' }}>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: C.border }} />
                </div>
              </div>
            )
          })}
          <div style={{ padding: '4px 16px' }}>
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
