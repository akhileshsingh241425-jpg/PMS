import { useState, useEffect } from 'react'
import api from '../services/api'
import { Users, Search } from 'lucide-react'

export default function PMTeam() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/api/pm/team')
      .then(r => setTeam(r.data.team || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = search ? team.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.designation?.toLowerCase().includes(search.toLowerCase())
  ) : team

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
    </div>
  )

  if (team.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF' }}>
      <Users className="w-16 h-16" style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
      <p style={{ fontSize: 15, margin: 0 }}>No team members assigned yet</p>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Team ({filtered.length})</h1>
        <div style={{ position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
            style={{ padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', width: 200 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(m => {
          const overloaded = m.active_tasks > 8
          const balanced = m.active_tasks >= 3 && m.active_tasks <= 8
          const hasCapacity = m.active_tasks < 3
          return (
            <div key={m.id} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: overloaded ? '#FEE2E2' : balanced ? '#FEF3C7' : '#F0FDF4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: overloaded ? '#DC2626' : balanced ? '#D97706' : '#059669',
                }}>
                  {m.full_name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{m.full_name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{m.designation || m.role_in_project || m.role || 'Team Member'}</div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>
                <strong>Active Tasks:</strong> {m.active_tasks}
              </div>

              {/* Workload indicator */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                  <span>Workload</span>
                  <span style={{
                    color: overloaded ? '#DC2626' : balanced ? '#D97706' : '#059669',
                    fontWeight: 600,
                  }}>
                    {overloaded ? 'Overloaded' : balanced ? 'Balanced' : 'Has Capacity'}
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                  <div style={{
                    width: `${Math.min((m.active_tasks / 12) * 100, 100)}%`,
                    height: 6, borderRadius: 3,
                    background: overloaded ? '#DC2626' : balanced ? '#D97706' : '#10B981',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Role: {m.role_in_project || 'Member'}</div>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
