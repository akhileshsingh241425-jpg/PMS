import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, Calendar, X, Edit3, Trash2, User, MapPin, Clock, Video } from 'lucide-react'

export default function Meetings() {
  const [meetings, setMeetings] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editMeeting, setEditMeeting] = useState(null)
  const [formData, setFormData] = useState({
    title: '', description: '', meeting_date: '', duration_minutes: 60,
    location: 'Online', status: 'Scheduled', attendees: [], notes: ''
  })
  const [saving, setSaving] = useState(false)
  const { hasRole } = useAuth()

  useEffect(() => { fetchMeetings(); fetchUsers() }, [])

  const fetchUsers = async () => {
    try { const res = await api.get('/api/auth/users'); setUsers(res.data.users) } catch (e) { console.error(e) }
  }

  const fetchMeetings = async () => {
    try {
      const params = { search }
      const res = await api.get('/api/activities/meetings', { params })
      setMeetings(res.data.meetings || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSearch = () => fetchMeetings()

  const openCreate = () => {
    setEditMeeting(null)
    setFormData({ title: '', description: '', meeting_date: '', duration_minutes: 60, location: 'Online', status: 'Scheduled', attendees: [], notes: '' })
    setShowForm(true)
  }

  const openEdit = (m) => {
    setEditMeeting(m)
    setFormData({
      title: m.title, description: m.description || '', meeting_date: m.meeting_date || '',
      duration_minutes: m.duration_minutes || 60, location: m.location || 'Online',
      status: m.status, attendees: m.attendees || [], notes: m.notes || ''
    })
    setShowForm(true)
  }

  const saveMeeting = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...formData, module_type: 'general', module_id: 0 }
      if (editMeeting) {
        await api.put(`/api/activities/meetings/${editMeeting.id}`, payload)
      } else {
        await api.post('/api/activities/meetings', payload)
      }
      setShowForm(false); setEditMeeting(null); fetchMeetings()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const deleteMeeting = async (id) => {
    if (!confirm('Delete this meeting?')) return
    try { await api.delete(`/api/activities/meetings/${id}`); fetchMeetings() } catch (e) { console.error(e) }
  }

  const statusColors = { 'Scheduled': 'bg-blue-50 text-blue-700', 'Completed': 'bg-green-50 text-green-700', 'Cancelled': 'bg-red-50 text-red-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-500 mt-1">Schedule and manage meetings</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editMeeting ? 'Edit Meeting' : 'New Meeting'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveMeeting} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input type="datetime-local" value={formData.meeting_date} onChange={e => setFormData({...formData, meeting_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 60})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="Online">Online</option>
                    <option value="Office">Office</option>
                    <option value="Client Site">Client Site</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes / MOM</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Meeting minutes / MOM" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editMeeting ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">No meetings found</div>
        ) : meetings.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{m.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[m.status] || 'bg-gray-100 text-gray-700'}`}>{m.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(m)} className="p-1 text-gray-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteMeeting(m.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              {m.meeting_date && <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {m.meeting_date.slice(0, 16).replace('T', ' ')}{m.duration_minutes ? ` (${m.duration_minutes} min)` : ''}</p>}
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {m.location || '—'}</p>
              {m.description && <p className="text-gray-500 text-xs mt-2">{m.description}</p>}
              {m.notes && <p className="text-gray-400 text-xs italic mt-1 border-t border-gray-100 pt-2">{m.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
