import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'
import { Plus, X, Users, UserPlus, Trash2, Edit3 } from 'lucide-react'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editTeam, setEditTeam] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', leader_id: '', member_ids: [] })
  const toast = useToast()

  useEffect(() => { load(); loadUsers() }, [])

  const load = async () => {
    try { const r = await api.get('/api/teams'); setTeams(r.data.teams) } catch (e) { toast('Failed to load teams', 'error') }
  }
  const loadUsers = async () => {
    try { const r = await api.get('/api/auth/users'); setUsers(r.data.users) } catch (e) {}
  }

  const openCreate = () => {
    setEditTeam(null)
    setForm({ name: '', description: '', leader_id: '', member_ids: [] })
    setShowForm(true)
  }
  const openEdit = (team) => {
    setEditTeam(team)
    setForm({
      name: team.name,
      description: team.description || '',
      leader_id: team.leader_id || '',
      member_ids: team.members?.map(m => m.user_id) || [],
    })
    setShowForm(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast('Team name is required', 'error'); return }
    setSaving(true)
    try {
      if (editTeam) {
        await api.put(`/api/teams/${editTeam.id}`, { name: form.name, description: form.description, leader_id: form.leader_id || null })
        toast('Team updated')
      } else {
        await api.post('/api/teams', {
          name: form.name,
          description: form.description,
          leader_id: form.leader_id || null,
          member_ids: form.member_ids,
        })
        toast('Team created')
      }
      setShowForm(false)
      load()
    } catch (e) { toast(e.response?.data?.error || 'Error saving team', 'error') }
    finally { setSaving(false) }
  }

  const deleteTeam = async (id) => {
    if (!confirm('Delete this team?')) return
    try {
      await api.delete(`/api/teams/${id}`)
      toast('Team deleted', 'info')
      load()
    } catch (e) { toast('Failed to delete', 'error') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E' }}>Teams</h1>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          background: '#5B21B6', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}><Plus className="w-4 h-4" /> New Team</button>
      </div>

      {teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
          <Users className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <p style={{ fontWeight: 600 }}>No teams yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Create your first team to organize members</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {teams.map(team => (
            <div key={team.id} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{team.name}</div>
                  {team.description && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{team.description}</div>}
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
                    <span>Leader: <strong>{team.leader_name || 'Unassigned'}</strong></span>
                    <span>Members: <strong>{team.member_count}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(team)} style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
                    background: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: 12,
                  }}><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteTeam(team.id)} style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid #FEE2E2',
                    background: '#fff', color: '#EF4444', cursor: 'pointer', fontSize: 12,
                  }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {team.members?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                  {team.members.map(m => (
                    <span key={m.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', background: '#F5F3FF', color: '#5B21B6',
                      borderRadius: 6, fontSize: 12, fontWeight: 500,
                    }}>{m.user_name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: 480, maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{editTeam ? 'Edit Team' : 'New Team'}</h2>
              <button onClick={() => setShowForm(false)} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={save} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Team Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Team Leader</label>
                <select value={form.leader_id} onChange={e => setForm(f => ({ ...f, leader_id: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#fff' }}>
                  <option value="">-- Select Leader --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                </select>
              </div>
              {!editTeam && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Members</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {users.filter(u => u.role !== 'admin' || u.id === form.leader_id).map(u => {
                      const selected = form.member_ids.includes(u.id)
                      return (
                        <button key={u.id} type="button" onClick={() => setForm(f => ({
                          ...f, member_ids: selected ? f.member_ids.filter(i => i !== u.id) : [...f.member_ids, u.id]
                        }))} style={{
                          padding: '4px 10px', borderRadius: 6, border: selected ? '2px solid #5B21B6' : '1px solid #E5E7EB',
                          background: selected ? '#F5F3FF' : '#fff', color: selected ? '#5B21B6' : '#374151',
                          cursor: 'pointer', fontSize: 12, fontWeight: selected ? 600 : 400,
                        }}>{u.full_name || u.email}</button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
                  background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>Cancel</button>
                <button type="submit" disabled={saving} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#5B21B6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  opacity: saving ? 0.6 : 1,
                }}>{saving ? 'Saving...' : editTeam ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
