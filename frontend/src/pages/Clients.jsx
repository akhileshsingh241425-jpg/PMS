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
  const debounceRef = useRef(null)

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

  const totalProjects = clients.reduce((s, c) => s + (c.project_count || 0), 0)

  const columnHeader = {
    fontSize: 11,
    fontWeight: 600,
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased', background: C.bg }}>
      <div style={{ padding: 0 }}>
        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.2 }}>Clients</h1>
            <p style={{ fontSize: 13, color: C.secondary, margin: '4px 0 0' }}>
              {summary.total} clients &middot; {totalProjects} projects
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: C.blue,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: C.font,
              boxShadow: '0 1px 3px rgba(0,82,204,0.3)',
            }}
          >
            <Plus className="w-4 h-4" /> New Client
          </button>
        </div>

        {/* ── Filter Tabs ── */}
        <ClientFilterTabs summary={summary} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* ── Search + Filter Bar ── */}
        <div style={{ padding: '4px 24px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 0' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.secondary, pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => handleSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                fontFamily: C.font,
                background: '#fff',
                boxSizing: 'border-box',
                color: C.text,
              }}
              placeholder="Search by company, ID, GST..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              fontFamily: C.font,
              background: '#fff',
              cursor: 'pointer',
              color: C.text,
              minWidth: 120,
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
          <button
            onClick={handleSearchClick}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: '#fff',
              fontSize: 13,
              cursor: 'pointer',
              color: C.text,
              fontFamily: C.font,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* ── Table ── */}
        <div style={{ padding: '0 24px 24px' }}>
          {loading ? (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 20 }}>
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : clients.length === 0 ? (
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
                padding: '10px 20px',
                borderBottom: `1px solid ${C.border}`,
                background: '#F8FAFC',
              }}>
                <div style={{ flex: '1 1 0', ...columnHeader }}>Client</div>
                <div style={{ width: 140, textAlign: 'center', ...columnHeader }}>Contact</div>
                <div style={{ width: 120, textAlign: 'center', ...columnHeader }}>Industry</div>
                <div style={{ width: 80, textAlign: 'center', ...columnHeader }}>Projects</div>
                <div style={{ width: 80, textAlign: 'center', ...columnHeader }} />
              </div>

              {/* Rows */}
              {clients.map(client => (
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
