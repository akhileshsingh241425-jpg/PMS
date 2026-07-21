import { useState, useMemo } from 'react'

const C = {
  primary: '#5B21B6', primaryLight: '#F5F3FF', primaryDark: '#4C1D95',
  border: '#E5E7EB', card: '#fff', muted: '#9CA3AF', secondary: '#6B7280',
  text: '#1F2937', success: '#059669', warning: '#D97706', danger: '#DC2626'
}

const STATUS_BADGE = {
  'Completed': { bg: '#D1FAE5', color: '#065F46', dot: '#059669' },
  'In Progress': { bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
  'Open': { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  'Pending': { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  'Blocked': { bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
}

const PRIORITY_STYLE = {
  'Urgent': { bg: '#FEE2E2', color: '#DC2626' },
  'High': { bg: '#FEF3C7', color: '#92400E' },
  'Normal': { bg: '#F0F2F8', color: '#6B7280' },
  'Low': { bg: '#F0FDF4', color: '#059669' },
}

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
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>All Tasks</span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#fff',
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            padding: '2px 10px', borderRadius: 20, lineHeight: '20px'
          }}>{tasks.length}</span>
        </div>
        <button onClick={() => setShowTaskForm(!showTaskForm)}
          style={{
            border: showTaskForm ? '1.5px solid #E5E7EB' : 'none',
            background: showTaskForm ? '#fff' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            cursor: 'pointer',
            color: showTaskForm ? '#6B7280' : '#fff',
            fontSize: 13, fontWeight: 700, padding: '10px 20px',
            borderRadius: 10, transition: 'all 0.15s',
            boxShadow: showTaskForm ? 'none' : '0 2px 6px rgba(91,33,182,0.2)',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
          {showTaskForm ? null : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>}
          {showTaskForm ? 'Cancel' : 'Assign Task'}
        </button>
      </div>

      {/* Inline form */}
      {showTaskForm && (
        <form onSubmit={onAddTask} style={{
          display: 'flex', flexDirection: 'column', gap: 14,
          marginBottom: 24, padding: 24,
          background: 'linear-gradient(135deg, #FAFAFE, #F0F2F8)',
          borderRadius: 14, border: '1px solid #E8E4F4'
        }}>
          <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title..." required
            style={{
              padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 10,
              fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff'
            }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
              style={{
                flex: 1, padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', minWidth: 120
              }}>
              <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
            </select>
            <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
              style={{
                flex: 1, padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 120
              }} />
            <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
              style={{
                flex: 1, padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', minWidth: 140
              }}>
              <option value="">Assign to...</option>
              {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!taskForm.title.trim()}
            style={{
              background: taskForm.title.trim() ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : '#D1D5DB',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 24px', fontSize: 14, fontWeight: 700,
              cursor: taskForm.title.trim() ? 'pointer' : 'not-allowed',
              alignSelf: 'flex-start', transition: 'all 0.15s',
              boxShadow: taskForm.title.trim() ? '0 2px 6px rgba(91,33,182,0.2)' : 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Task
          </button>
        </form>
      )}

      {/* Search & filters */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap',
        padding: '14px 16px', background: '#FAFAFE',
        borderRadius: 12, border: '1px solid #F0F0F5'
      }}>
        <div style={{ flex: '1 1 200px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 12, pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              border: '1.5px solid #E5E7EB', borderRadius: 10,
              fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff'
            }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10,
            fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer'
          }}>
          <option value="">All Status</option>
          <option>Open</option><option>In Progress</option><option>Completed</option><option>Pending</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{
            padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10,
            fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer'
          }}>
          <option value="">All Priority</option>
          <option>Urgent</option><option>High</option><option>Normal</option><option>Low</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{
            padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10,
            fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer'
          }}>
          <option value="title">Sort: Title</option>
          <option value="due_date">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      {/* Task items */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px', color: C.muted
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}
          </div>
          <div style={{ fontSize: 13 }}>
            {tasks.length === 0 ? 'Assign your first task above.' : 'Try adjusting your search or filters.'}
          </div>
        </div>
      ) : (
        filtered.map(t => {
          const sb = STATUS_BADGE[t.status] || STATUS_BADGE['Pending']
          const ps = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE['Normal']
          return (
            <div key={t.id} onClick={() => onTaskClick?.(t)} style={{
              display: 'flex', gap: 16, alignItems: 'center',
              padding: '14px 18px',
              background: t.status === 'Completed' ? '#F9FAFB' : '#fff',
              borderRadius: 12, marginBottom: 8, cursor: 'pointer',
              border: '1px solid #F0F0F5',
              transition: 'all 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8E4F4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(91,33,182,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#F0F0F5'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)' }}>
              {/* Custom checkbox */}
              <label style={{
                width: 22, height: 22, flexShrink: 0, borderRadius: 6,
                border: t.status === 'Completed' ? '2px solid #059669' : '2px solid #D1D5DB',
                background: t.status === 'Completed' ? '#059669' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
                <input type="checkbox" checked={t.status === 'Completed'}
                  onChange={e => { e.stopPropagation(); onStatusToggle(t.id, t.status === 'Completed' ? 'Open' : 'Completed') }}
                  style={{ display: 'none' }} />
                {t.status === 'Completed' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 600,
                  color: t.status === 'Completed' ? C.muted : C.text,
                  textDecoration: t.status === 'Completed' ? 'line-through' : 'none'
                }}>
                  {t.title}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {t.priority && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: ps.bg, color: ps.color, lineHeight: '18px'
                    }}>{t.priority}</span>
                  )}
                  {t.assigned_name && (
                    <span style={{
                      fontSize: 12, color: C.secondary,
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {t.assigned_name}
                    </span>
                  )}
                  {t.due_date && (
                    <span style={{
                      fontSize: 12, color: C.muted,
                      display: 'inline-flex', alignItems: 'center', gap: 4
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {new Date(t.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 6,
                    background: sb.bg, color: sb.color,
                    display: 'inline-flex', alignItems: 'center', gap: 5, lineHeight: '18px'
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sb.dot }} />
                    {t.status}
                  </span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          )
        })
      )}
    </div>
  )
}
