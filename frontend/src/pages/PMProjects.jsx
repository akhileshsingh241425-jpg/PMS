import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { FolderOpen, Search, Filter } from 'lucide-react'

const STAGES = ['Initiated','Planning','Information Gathering','Execution','Internal Review','Client Review','Remediation Support','Final Delivery','Invoice Raised','Payment Pending','Partial Payment Received','Full Payment Received','Closed','On Hold','Delayed','Cancelled','Escalated','Awaiting Client Response','Awaiting Documents','Awaiting Payment']

function getHealthColor(stage) {
  if (stage === 'Closed') return '#10B981'
  return '#3B82F6'
}

function getHealthBg(stage) {
  if (stage === 'Closed') return '#F0FDF4'
  return '#EFF6FF'
}

const formatDate = (ds) => {
  if (!ds) return '—'
  return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PMProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('')

  useEffect(() => {
    api.get('/api/pm/projects')
      .then(r => setProjects(r.data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = stageFilter ? projects.filter(p => p.stage === stageFilter) : projects

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Projects ({filtered.length})</h1>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          style={{ padding: '8px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF' }}>
          <FolderOpen className="w-16 h-16" style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
          <p style={{ fontSize: 15, margin: 0 }}>No projects found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
              style={{
                background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '18px 20px',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: 0 }}>{p.title}</h3>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: getHealthBg(p.stage), color: getHealthColor(p.stage),
                }}>{p.stage}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#6B7280' }}>
                <span>Deadline: {formatDate(p.target_date)}</span>
                <span>Team: {p.team_count || 0}</span>
                <span style={{ color: p.stage === 'Closed' ? '#10B981' : '#3B82F6', fontWeight: 600 }}>
                  {p.account_name || '—'}
                </span>
              </div>
              {/* Simple progress bar */}
              <div style={{ marginTop: 10, width: '100%', height: 4, background: '#E5E7EB', borderRadius: 2 }}>
                <div style={{
                  width: `${STAGES.indexOf(p.stage) >= 0 ? Math.round((STAGES.indexOf(p.stage) / (STAGES.length - 1)) * 100) : 0}%`,
                  height: 4, background: '#5B21B6', borderRadius: 2, transition: 'width 0.3s',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
