import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, CheckSquare, X, Edit3, Trash2, User, Calendar, Clock, Bell, AlertCircle } from 'lucide-react'

const TASK_TYPES = ['To do', 'In Progress', 'Review', 'Completed']
const PRIORITIES = ['None', 'Low', 'Normal', 'High', 'Urgent']
const QUEUES = ['None', 'Sales', 'Support', 'Development', 'Audit']

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [formData, setFormData] = useState({
    title: '', description: '', activity_date: '', activity_time: '09:00',
    task_type: 'To do', priority: 'None', queue: 'None',
    assigned_to: '', send_reminder: false, reminder_before: '30',
    set_repeat: false, repeat_type: 'None', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const { hasRole } = useAuth()

  useEffect(() => { fetchTasks(); fetchUsers() }, [])

  const fetchUsers = async () => {
    try { const res = await api.get('/api/auth/users'); setUsers(res.data.users) } catch (e) { console.error(e) }
  }

  const fetchTasks = async () => {
    try {
      const params = { search }
      const res = await api.get('/api/activities/tasks', { params })
      setTasks(res.data.tasks || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSearch = () => fetchTasks()

  const openCreate = () => {
    setEditTask(null)
    setFormData({ title: '', description: '', activity_date: '', activity_time: '09:00', task_type: 'To do', priority: 'None', queue: 'None', assigned_to: '', send_reminder: false, reminder_before: '30', set_repeat: false, repeat_type: 'None', notes: '' })
    setShowForm(true)
  }

  const openEdit = (t) => {
    setEditTask(t)
    setFormData({
      title: t.title, description: t.description || '', activity_date: t.activity_date || '', activity_time: t.activity_time || '09:00',
      task_type: t.task_type || 'To do', priority: t.priority || 'None', queue: t.queue || 'None',
      assigned_to: t.assigned_to || '', send_reminder: t.send_reminder || false,
      reminder_before: t.reminder_before || '30', set_repeat: t.set_repeat || false,
      repeat_type: t.repeat_type || 'None', notes: t.notes || ''
    })
    setShowForm(true)
  }

  const saveTask = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...formData, module_type: 'general', module_id: 0 }
      if (editTask) {
        await api.put(`/api/activities/tasks/${editTask.id}`, payload)
      } else {
        await api.post('/api/activities/tasks', payload)
      }
      setShowForm(false); setEditTask(null); fetchTasks()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return
    try { await api.delete(`/api/activities/tasks/${id}`); fetchTasks() } catch (e) { console.error(e) }
  }

  const updateStatus = async (id, status) => {
    try { await api.patch(`/api/activities/tasks/${id}/status`, { status }); fetchTasks() } catch (e) { console.error(e) }
  }

  const priorityColors = { 'None': 'bg-gray-100 text-gray-700', 'Low': 'bg-blue-50 text-blue-700', 'Normal': 'bg-green-50 text-green-700', 'High': 'bg-orange-50 text-orange-700', 'Urgent': 'bg-red-50 text-red-700' }
  const statusColors = { 'To do': 'bg-gray-100 text-gray-700', 'In Progress': 'bg-blue-50 text-blue-700', 'Review': 'bg-purple-50 text-purple-700', 'Completed': 'bg-green-50 text-green-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage your tasks and to-dos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveTask} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task *</label>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required placeholder="Enter your task" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Date</label>
                  <input type="date" value={formData.activity_date} onChange={e => setFormData({...formData, activity_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={formData.activity_time} onChange={e => setFormData({...formData, activity_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                  <select value={formData.task_type} onChange={e => setFormData({...formData, task_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    {TASK_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    {PRIORITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Queue</label>
                  <select value={formData.queue} onChange={e => setFormData({...formData, queue: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    {QUEUES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="">Unassigned</option>
                    {users.filter(u => u.is_active).map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={formData.send_reminder} onChange={e => setFormData({...formData, send_reminder: e.target.checked})} className="rounded" />
                    Send reminder
                  </label>
                  {formData.send_reminder && (
                    <select value={formData.reminder_before} onChange={e => setFormData({...formData, reminder_before: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                      <option value="15">15 Minutes Before</option>
                      <option value="30">30 Minutes Before</option>
                      <option value="60">1 Hour Before</option>
                      <option value="1440">1 Day Before</option>
                    </select>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={formData.set_repeat} onChange={e => setFormData({...formData, set_repeat: e.target.checked})} className="rounded" />
                    Set to repeat
                  </label>
                  {formData.set_repeat && (
                    <select value={formData.repeat_type} onChange={e => setFormData({...formData, repeat_type: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Search tasks..." />
          </div>
          <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-5 py-3">Task</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Assigned To</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No tasks found</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{t.title}</p>
                        {t.notes && <p className="text-xs text-gray-500">{t.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">{t.task_type || 'To do'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[t.priority] || 'bg-gray-100 text-gray-700'}`}>{t.priority || 'None'}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{t.assigned_to_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {t.activity_date ? `${t.activity_date}${t.activity_time ? ` ${t.activity_time}` : ''}` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border-0 outline-none ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}`}>
                      {TASK_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)} className="text-xs text-blue-600 hover:text-blue-800"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteTask(t.id)} className="text-xs text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
