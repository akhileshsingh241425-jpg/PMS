import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { Users, Search, Plus, X } from 'lucide-react'
import Breadcrumb from '../components/Breadcrumb'

function AddMemberModal({ projects, employees, existingByProject, onClose, onAdded }) {
  const toast = useToast()
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)

  const takenIds = new Set((existingByProject[projectId] || []).map(m => m.id))
  const candidates = employees.filter(e => !takenIds.has(e.id))

  const submit = async e => {
    e.preventDefault()
    if (!projectId || !userId) return
    setSaving(true)
    try {
      await api.post(`/api/projects/${projectId}/team`, { user_id: parseInt(userId), role_in_project: role || undefined })
      toast('Member added')
      onAdded()
    } catch (err) { toast(err.response?.data?.error || 'Failed to add member', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0F172A' }}>Add team member</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Project</label>
            <select value={projectId} onChange={e => { setProjectId(e.target.value); setUserId('') }} required
              style={{ width: '100%', marginTop: 4, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13 }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Employee</label>
            <select value={userId} onChange={e => setUserId(e.target.value)} required
              style={{ width: '100%', marginTop: 4, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13 }}>
              <option value="">-- Select --</option>
              {candidates.map(u => <option key={u.id} value={u.id}>{u.full_name} {u.designation ? `(${u.designation})` : ''}</option>)}
            </select>
            {projectId && candidates.length === 0 && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>Everyone active is already on this project's team.</p>}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Role on this project (optional)</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Lead Auditor"
              style={{ width: '100%', marginTop: 4, padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <button disabled={saving || !userId} style={{ marginTop: 4, padding: '9px 14px', border: 'none', borderRadius: 8, background: '#5B3DF5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (saving || !userId) ? 0.6 : 1 }}>
            {saving ? 'Adding…' : 'Add to project'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PMTeam() {
  const toast = useToast()
  const [team, setTeam] = useState([])
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(() => {
    Promise.all([
      api.get('/api/pm/team'),
      api.get('/api/pm/projects'),
      api.get('/api/pm/employees'),
    ]).then(([t, p, e]) => {
      setTeam(t.data.team || [])
      setProjects(p.data.projects || [])
      setEmployees(e.data.employees || [])
    }).catch(() => toast('Failed to load team', 'error')).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const removeMember = async (teamId, name, projectTitle) => {
    if (!window.confirm(`Remove ${name} from "${projectTitle}"?`)) return
    try { await api.delete(`/api/projects/team/${teamId}`); toast('Removed'); load() }
    catch (e) { toast(e.response?.data?.error || 'Failed to remove', 'error') }
  }

  // Group per-project membership rows by user for display.
  const byUser = {}
  for (const m of team) {
    if (!byUser[m.id]) byUser[m.id] = { id: m.id, full_name: m.full_name, designation: m.designation, active_tasks: m.active_tasks, memberships: [] }
    byUser[m.id].memberships.push(m)
  }
  const members = Object.values(byUser)
  const filtered = search ? members.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.designation?.toLowerCase().includes(search.toLowerCase())
  ) : members

  const existingByProject = {}
  for (const m of team) {
    (existingByProject[m.project_id] ||= []).push({ id: m.id })
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
    </div>
  )

  return (
    <div>
      <Breadcrumb items={[{ label: 'PM Dashboard', to: '/pm' }, { label: 'Team' }]} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Team ({filtered.length})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
              style={{ padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', width: 200 }} />
          </div>
          {projects.length > 0 && (
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', borderRadius: 8, background: '#5B3DF5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          )}
        </div>
      </div>

      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          <Users className="w-16 h-16" style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
          <p style={{ fontSize: 15, margin: 0 }}>No team members assigned yet</p>
          {projects.length > 0 && <button onClick={() => setShowAdd(true)} style={{ marginTop: 10, color: '#5B3DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ Add your first team member</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(m => {
            const overloaded = m.active_tasks > 8
            const balanced = m.active_tasks >= 3 && m.active_tasks <= 8
            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '12px' }}>
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
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{m.designation || 'Team Member'}</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>
                  <strong>Active Tasks:</strong> {m.active_tasks}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    <span>Workload</span>
                    <span style={{ color: overloaded ? '#DC2626' : balanced ? '#D97706' : '#059669', fontWeight: 600 }}>
                      {overloaded ? 'Overloaded' : balanced ? 'Balanced' : 'Has Capacity'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                    <div style={{ width: `${Math.min((m.active_tasks / 12) * 100, 100)}%`, height: 6, borderRadius: 3, background: overloaded ? '#DC2626' : balanced ? '#D97706' : '#10B981', transition: 'width 0.3s' }} />
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>Projects</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {m.memberships.map(ms => (
                    <div key={ms.team_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', borderRadius: 6, padding: '4px 8px' }}>
                      <span style={{ fontSize: 11.5, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ms.project_title}{ms.role_in_project ? ` · ${ms.role_in_project}` : ''}
                      </span>
                      <button onClick={() => removeMember(ms.team_id, m.full_name, ms.project_title)} title="Remove from this project"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: '0 2px', flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <AddMemberModal projects={projects} employees={employees} existingByProject={existingByProject}
          onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load() }} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
