import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, Bell, X, Edit3, Trash2, User, Clock, CheckCircle, RotateCcw } from 'lucide-react'

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editReminder, setEditReminder] = useState(null)
  const [formData, setFormData] = useState({
    title: '', description: '', remind_at: '', remind_to: ''
  })
  const [saving, setSaving] = useState(false)
  const { hasRole } = useAuth()

  useEffect(() => { fetchReminders(); fetchUsers() }, [])

  const fetchUsers = async () => {
    try { const res = await api.get('/api/auth/users'); setUsers(res.data.users) } catch (e) { console.error(e) }
  }

  const fetchReminders = async () => {
    try {
      const params = { search }
      const res = await api.get('/api/activities/reminders', { params })
      setReminders(res.data.reminders || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSearch = () => fetchReminders()

  const openCreate = () => {
    setEditReminder(null)
    setFormData({ title: '', description: '', remind_at: '', remind_to: '' })
    setShowForm(true)
  }

  const openEdit = (r) => {
    setEditReminder(r)
    setFormData({ title: r.title, description: r.description || '', remind_at: r.remind_at || '', remind_to: r.remind_to || '' })
    setShowForm(true)
  }

  const saveReminder = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...formData, module_type: 'general' }
      if (editReminder) {
        await api.put(`/api/activities/reminders/${editReminder.id}`, payload)
      } else {
        await api.post('/api/activities/reminders', payload)
      }
      setShowForm(false); setEditReminder(null); fetchReminders()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const deleteReminder = async (id) => {
    if (!confirm('Delete this reminder?')) return
    try { await api.delete(`/api/activities/reminders/${id}`); fetchReminders() } catch (e) { console.error(e) }
  }

  const toggleComplete = async (id, completed) => {
    try { await api.patch(`/api/activities/reminders/${id}`, { is_completed: !completed }); fetchReminders() } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-500 mt-1">Stay on top of important tasks</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editReminder ? 'Edit Reminder' : 'New Reminder'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveReminder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remind At *</label>
                <input type="datetime-local" value={formData.remind_at} onChange={e => setFormData({...formData, remind_at: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remind To</label>
                <select value={formData.remind_to} onChange={e => setFormData({...formData, remind_to: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="">Myself</option>
                  {users.filter(u => u.is_active).map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editReminder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">No reminders set</div>
        ) : reminders.map(r => (
          <div key={r.id} className={`bg-white rounded-xl shadow-sm border p-5 flex items-start gap-4 transition-all ${r.is_completed ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
            <button onClick={() => toggleComplete(r.id, r.is_completed)} className={`mt-0.5 ${r.is_completed ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
              <CheckCircle className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`font-medium ${r.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{r.title}</h3>
                  {r.description && <p className="text-sm text-gray-500 mt-0.5">{r.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteReminder(r.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.remind_at?.slice(0, 16).replace('T', ' ')}</span>
                {r.remind_to_name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {r.remind_to_name}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
