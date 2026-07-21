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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>All Tasks ({tasks.length})</span>
        <button onClick={() => setShowTaskForm(!showTaskForm)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.primary, fontSize: 12, fontWeight: 700 }}>
          {showTaskForm ? 'Cancel' : '+ Assign Task'}
        </button>
      </div>

      {showTaskForm && (
        <form onSubmit={onAddTask} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, padding: 16, background: '#F8F9FC', borderRadius: 10 }}>
          <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title..." required
            style={{ padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
              style={{ flex: 1, padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: C.card }}>
              <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
            </select>
            <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
              style={{ flex: 1, padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none' }} />
            <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
              style={{ flex: 1, padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: C.card }}>
              <option value="">Assign to...</option>
              {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!taskForm.title.trim()}
            style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', opacity: taskForm.title.trim() ? 1 : 0.5 }}>
            + Add Task
          </button>
        </form>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
          style={{ flex: '1 1 180px', padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', background: C.card, fontFamily: 'inherit' }}>
          <option value="">All Status</option>
          <option>Open</option><option>In Progress</option><option>Completed</option><option>Pending</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', background: C.card, fontFamily: 'inherit' }}>
          <option value="">All Priority</option>
          <option>Urgent</option><option>High</option><option>Normal</option><option>Low</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', background: C.card, fontFamily: 'inherit' }}>
          <option value="title">Sort: Title</option>
          <option value="due_date">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontSize: 14, color: C.muted, padding: '24px 0', textAlign: 'center' }}>{tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}</div>
      ) : (
        filtered.map(t => (
          <div key={t.id} onClick={() => onTaskClick?.(t)} style={{
            display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px',
            background: t.status === 'Completed' ? '#F9FAFB' : '#F8F9FC', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
            borderLeft: t.status === 'Completed' ? '3px solid #059669' : '3px solid transparent'
          }}>
            <input type="checkbox" checked={t.status === 'Completed'}
              onChange={e => { e.stopPropagation(); onStatusToggle(t.id, t.status === 'Completed' ? 'Open' : 'Completed') }}
              style={{ width: 18, height: 18, accentColor: C.primary, cursor: 'pointer', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: t.status === 'Completed' ? C.muted : '#374151', textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>
                {t.title}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                {t.priority && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 4,
                    background: t.priority === 'Urgent' || t.priority === 'High' ? '#FEE2E2' : '#F0F2F8',
                    color: t.priority === 'Urgent' || t.priority === 'High' ? '#DC2626' : C.secondary }}>
                    {t.priority}
                  </span>
                )}
                {t.assigned_name && <span style={{ fontSize: 11, color: C.secondary }}>{t.assigned_name}</span>}
                {t.due_date && <span style={{ fontSize: 11, color: C.muted }}>{new Date(t.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 4,
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
