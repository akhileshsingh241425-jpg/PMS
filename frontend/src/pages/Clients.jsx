import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Building2 } from 'lucide-react'
import { C } from '../components/styleConstants'
import ClientFilterTabs from '../components/ClientFilterTabs'
import ClientRow from '../components/ClientRow'
import CreateClientModal from '../components/CreateClientModal'
import { fetchClients } from '../api/clientsApi'
import { TableSkeleton } from '../components/LoadingSkeleton'

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, main: 0, sub: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [industryFilter, setIndustryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const debounceRef = useRef(null)

  const filteredClients = clients.filter(c => {
    if (industryFilter && c.industry !== industryFilter) return false
    if (locationFilter && c.location !== locationFilter) return false
    return true
  })

  const industries = [...new Set(clients.map(c => c.industry).filter(Boolean))].sort()
  const locations = [...new Set(clients.map(c => c.location).filter(Boolean))].sort()

  const load = useCallback(async (f, s, st) => {
    setLoading(true)
    try {
      const params = {}
      if (f) params.filter = f
      if (s) params.search = s
      if (st) params.status = st
      const res = await fetchClients(params)
      setClients(res.clients || [])
      setSummary(res.summary || { total: 0, active: 0, main: 0, sub: 0 })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(activeFilter, search, statusFilter)
  }, [activeFilter, statusFilter, load])

  const handleSearchInput = (val) => {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      load(activeFilter, val, statusFilter)
    }, 350)
  }

  const handleSearchClick = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    load(activeFilter, search, statusFilter)
  }

  const totalProjects = filteredClients.reduce((s, c) => s + (c.project_count || 0), 0)

  const columnHeader = {
    fontSize: 10,
    fontWeight: 700,
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased', background: C.bg }}>
      <div style={{ padding: 0 }}>
        {/* ── Header ── */}
          <div style={{ padding: '10px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.2 }}>Clients</h1>
              <p style={{ fontSize: 11, color: C.secondary, margin: '1px 0 0' }}>
                {summary.total} clients &middot; {totalProjects} projects
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                background: C.blue,
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: C.font,
                boxShadow: '0 1px 3px rgba(0,82,204,0.3)',
              }}
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>

        {/* ── Filter Tabs ── */}
        <ClientFilterTabs summary={summary} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* ── Search + Filter Bar ── */}
        <div style={{ padding: '3px 24px 8px', display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 140px', minWidth: 140 }}>
            <Search className="w-3 h-3" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', color: C.secondary, pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => handleSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px 4px 24px',
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 11,
                outline: 'none',
                fontFamily: C.font,
                background: '#fff',
                boxSizing: 'border-box',
                color: C.text,
              }}
              placeholder="Search company, ID, GST..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '4px 8px',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 11,
              outline: 'none',
              fontFamily: C.font,
              background: '#fff',
              cursor: 'pointer',
              color: C.text,
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
          <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, outline: 'none', fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
            <option value="">All Industries</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, outline: 'none', fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
            <option value="">All Locations</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button
            onClick={handleSearchClick}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: '#fff',
              fontSize: 11,
              cursor: 'pointer',
              color: C.text,
              fontFamily: C.font,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search className="w-3 h-3" />
          </button>
        </div>

        {/* ── Table ── */}
        <div style={{ padding: '0 24px 8px' }}>
          {loading ? (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 20 }}>
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, textAlign: 'center', padding: '56px 20px' }}>
              <Building2 className="w-12 h-12" style={{ margin: '0 auto 12px', color: C.secondary, opacity: 0.25 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>No clients found</div>
              <div style={{ fontSize: 13, color: C.secondary, marginTop: 4 }}>Try adjusting your search or filters.</div>
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
              {/* Column headers */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '3px 12px',
                borderBottom: `1px solid ${C.border}`,
                background: '#F8FAFC',
              }}>
                <div style={{ flex: '1 1 0', ...columnHeader }}>Client</div>
                <div style={{ width: 110, textAlign: 'center', ...columnHeader }}>Contact</div>
                <div style={{ width: 80, textAlign: 'center', ...columnHeader }}>Industry</div>
                <div style={{ width: 40, textAlign: 'center', ...columnHeader }}>Proj</div>
                <div style={{ width: 50, textAlign: 'center', ...columnHeader }} />
              </div>

              {/* Rows */}
              {filteredClients.map(client => (
                <ClientRow key={client.id} client={client} onNavigate={id => navigate(`/accounts/${id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Create Modal ── */}
        {showModal && (
          <CreateClientModal
            onClose={() => setShowModal(false)}
            onSaved={() => { setShowModal(false); load(activeFilter, search, statusFilter) }}
          />
        )}
      </div>
    </div>
  )
}
