import { useState, useMemo } from 'react'

const C = { primary: '#5B21B6', primaryLight: '#F5F3FF', border: '#E5E7EB', card: '#fff', muted: '#9CA3AF', secondary: '#6B7280' }

export default function AllTasksList({ tasks, team, showTaskForm, setShowTaskForm, taskForm, setTaskForm, onAddTask, onTaskClick, onStatusToggle }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [sortBy, setSortBy] = useState('title')

  const filtered = useMemo(() => {
    let list = [...tasks]
    if (search) list = list.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus) list = list.filter(t => t.status === filterStatus)
    if (filterPriority) list = list.filter(t => t.priority === filterPriority)
    list.sort((a, b) => {
      if (sortBy === 'due_date') return (a.due_date || '') < (b.due_date || '') ? -1 : 1
      if (sortBy === 'priority') {
        const order = { Urgent: 0, High: 1, Normal: 2, Low: 3 }
        return (order[a.priority] || 2) - (order[b.priority] || 2)
      }
      return (a.title || '').localeCompare(b.title || '')
    })
    return list
  }, [tasks, search, filterStatus, filterPriority, sortBy])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#374151' }}>All Tasks ({tasks.length})</span>
        <button onClick={() => setShowTaskForm(!showTaskForm)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.primary, fontSize: 14, fontWeight: 700 }}>
          {showTaskForm ? 'Cancel' : '+ Assign Task'}
        </button>
      </div>

      {showTaskForm && (
        <form onSubmit={onAddTask} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, padding: 20, background: '#F8F9FC', borderRadius: 12 }}>
          <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title..." required
            style={{ padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
              style={{ flex: 1, padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: C.card }}>
              <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
            </select>
            <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
              style={{ flex: 1, padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none' }} />
            <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
              style={{ flex: 1, padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: C.card }}>
              <option value="">Assign to...</option>
              {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!taskForm.title.trim()}
            style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', opacity: taskForm.title.trim() ? 1 : 0.5 }}>
            + Add Task
          </button>
        </form>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
          style={{ flex: '1 1 180px', padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.card, fontFamily: 'inherit' }}>
          <option value="">All Status</option>
          <option>Open</option><option>In Progress</option><option>Completed</option><option>Pending</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.card, fontFamily: 'inherit' }}>
          <option value="">All Priority</option>
          <option>Urgent</option><option>High</option><option>Normal</option><option>Low</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.card, fontFamily: 'inherit' }}>
          <option value="title">Sort: Title</option>
          <option value="due_date">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontSize: 15, color: C.muted, padding: '32px 0', textAlign: 'center' }}>{tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}</div>
      ) : (
        filtered.map(t => (
          <div key={t.id} onClick={() => onTaskClick?.(t)} style={{
            display: 'flex', gap: 14, alignItems: 'center', padding: '14px 18px',
            background: t.status === 'Completed' ? '#F9FAFB' : '#F8F9FC', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
            borderLeft: t.status === 'Completed' ? '4px solid #059669' : '4px solid transparent'
          }}>
            <input type="checkbox" checked={t.status === 'Completed'}
              onChange={e => { e.stopPropagation(); onStatusToggle(t.id, t.status === 'Completed' ? 'Open' : 'Completed') }}
              style={{ width: 20, height: 20, accentColor: C.primary, cursor: 'pointer', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.status === 'Completed' ? C.muted : '#374151', textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>
                {t.title}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                {t.priority && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 6,
                    background: t.priority === 'Urgent' || t.priority === 'High' ? '#FEE2E2' : '#F0F2F8',
                    color: t.priority === 'Urgent' || t.priority === 'High' ? '#DC2626' : C.secondary }}>
                    {t.priority}
                  </span>
                )}
                {t.assigned_name && <span style={{ fontSize: 12, color: C.secondary }}>{t.assigned_name}</span>}
                {t.due_date && <span style={{ fontSize: 12, color: C.muted }}>{new Date(t.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 6,
                  background: t.status === 'Completed' ? '#D1FAE5' : t.status === 'In Progress' ? '#FEF3C7' : t.status === 'Open' ? '#DBEAFE' : '#F3F4F6',
                  color: t.status === 'Completed' ? '#065F46' : t.status === 'In Progress' ? '#92400E' : t.status === 'Open' ? '#1E40AF' : '#6B7280' }}>
                  {t.status}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
