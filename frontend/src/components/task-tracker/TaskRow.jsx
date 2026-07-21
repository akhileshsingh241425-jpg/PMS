import { useState } from 'react'

const C = {
  primary: '#5B21B6', primaryLight: '#F5F3FF', border: '#E5E7EB',
  card: '#fff', muted: '#9CA3AF', secondary: '#6B7280', text: '#1F2937',
  success: '#059669', warning: '#D97706', danger: '#DC2626'
}

const BADGE = {
  'Completed': { bg: '#D1FAE5', color: '#065F46', dot: '#059669' },
  'In Progress': { bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
  'Open': { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  'Pending': { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  'Blocked': { bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
}

export default function TaskRow({ task, onStatusToggle, onUpdateTask, onDeleteTask, onAddSubtask, team, addSubtaskOf, setAddSubtaskOf, subtaskForm, setSubtaskForm, onAddSubtaskSubmit, onTaskClick }) {
  const badge = BADGE[task.status] || BADGE['Pending']
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed'
  const [assigning, setAssigning] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: task.title, status: task.status, priority: task.priority,
    assigned_to: task.assigned_to || '', due_date: task.due_date || ''
  })

  if (editing) {
    return (
      <div style={{ borderBottom: '1px solid #F3F4F6', padding: '12px 0' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            style={{ flex: '1 1 180px', padding: '9px 14px', border: '1.5px solid #7C3AED', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            autoFocus />
          <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
            style={{ padding: '9px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
            <option>Open</option><option>In Progress</option><option>Completed</option><option>Pending</option><option>Blocked</option>
          </select>
          <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
            style={{ padding: '9px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
            <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
          </select>
          <select value={editForm.assigned_to} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })}
            style={{ padding: '9px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, background: '#fff', fontFamily: 'inherit', outline: 'none', minWidth: 90 }}>
            <option value="">Unassigned</option>
            {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
          </select>
          <input type="date" value={editForm.due_date} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
            style={{ padding: '9px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={() => { onUpdateTask?.(task.id, editForm); setEditing(false) }}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(91,33,182,0.2)' }}>
            Save
          </button>
          <button onClick={() => setEditing(false)}
            style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      borderBottom: '1px solid #F3F4F6',
      padding: '14px 0',
      transition: 'background 0.15s',
      cursor: 'default'
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFE'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Custom checkbox */}
        <label style={{
          width: 20, height: 20, flexShrink: 0, borderRadius: 6,
          border: task.status === 'Completed' ? '2px solid #059669' : '2px solid #D1D5DB',
          background: task.status === 'Completed' ? '#059669' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s'
        }}>
          <input type="checkbox" checked={task.status === 'Completed'}
            onChange={e => onStatusToggle(task.id, task.status === 'Completed' ? 'Open' : 'Completed')}
            style={{ display: 'none' }} />
          {task.status === 'Completed' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
        </label>

        {/* Task title */}
        <span onClick={() => onTaskClick?.(task)} style={{
          fontSize: 15, fontWeight: 600,
          color: task.status === 'Completed' ? C.muted : C.text,
          flex: 1, textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
          cursor: onTaskClick ? 'pointer' : 'default',
          transition: 'color 0.15s'
        }}>
          {task.title}
        </span>

        {/* Assignee dropdown */}
        {assigning ? (
          <select
            value={task.assigned_to || ''}
            onChange={e => {
              const val = e.target.value
              setAssigning(false)
              if (val !== (task.assigned_to || '')) onUpdateTask?.(task.id, { assigned_to: val || null })
            }}
            onBlur={() => setAssigning(false)}
            autoFocus
            style={{
              padding: '4px 8px', borderRadius: 8, border: '1.5px solid #7C3AED',
              fontSize: 12, fontWeight: 600, outline: 'none', fontFamily: 'inherit',
              background: '#fff', cursor: 'pointer', minWidth: 100
            }}>
            <option value="">Unassigned</option>
            {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
          </select>
        ) : (
          <div onClick={() => setAssigning(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: task.assigned_name ? C.secondary : C.muted,
            whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: 8,
            background: task.assigned_name ? '#F0F2F8' : 'transparent',
            cursor: 'pointer', transition: 'all 0.15s',
            border: '1px dashed transparent'
          }}
            onMouseEnter={e => { if (!task.assigned_name) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#FAFAFE' } }}
            onMouseLeave={e => { if (!task.assigned_name) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' } }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            {task.assigned_name || 'Assign'}
          </div>
        )}

        {/* Due date */}
        {task.due_date && (
          <span style={{
            fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
            color: isOverdue ? '#DC2626' : '#9CA3AF',
            display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )}

        {/* Status badge */}
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
          background: badge.bg, color: badge.color, whiteSpace: 'nowrap',
          display: 'inline-flex', alignItems: 'center', gap: 6
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.dot }} />
          {task.status}
        </span>

        {/* Edit button */}
        <button onClick={() => setEditing(true)}
          style={{
            padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
            color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 1
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>

        {/* Delete button */}
        <button onClick={() => { if (confirm('Delete this task?')) onDeleteTask?.(task.id) }}
          style={{
            padding: '6px 10px', borderRadius: 8, border: '1px solid #FECACA', background: '#FFF',
            color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 1
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>

        {/* Subtask button */}
        <button onClick={() => { setAddSubtaskOf(task.id); setSubtaskForm({ title: '', assigned_to: '', due_date: '', status: 'Open' }) }}
          style={{
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid #E5E7EB', background: '#fff',
            color: '#6B7280', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Subtask
        </button>
      </div>

      {/* Subtasks */}
      {task.subtasks?.map(st => (
        <div key={st.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 0 4px 34px'
        }}>
          <label style={{
            width: 16, height: 16, flexShrink: 0, borderRadius: 4,
            border: st.status === 'Completed' ? '2px solid #059669' : '2px solid #D1D5DB',
            background: st.status === 'Completed' ? '#059669' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s'
          }}>
            <input type="checkbox" checked={st.status === 'Completed'}
              onChange={e => onStatusToggle(st.id, st.status === 'Completed' ? 'Open' : 'Completed')}
              style={{ display: 'none' }} />
            {st.status === 'Completed' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </label>
          <span style={{ fontSize: 14, color: st.status === 'Completed' ? C.muted : '#6B7280', flex: 1, textDecoration: st.status === 'Completed' ? 'line-through' : 'none' }}>{st.title}</span>
          {st.assigned_name && (
            <span style={{ fontSize: 12, color: C.muted }}>{st.assigned_name}</span>
          )}
          {st.due_date && (
            <span style={{ fontSize: 12, color: C.muted }}>
              {new Date(st.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
            background: st.status === 'Completed' ? '#D1FAE5' : '#F3F4F6',
            color: st.status === 'Completed' ? '#065F46' : '#6B7280',
            display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: st.status === 'Completed' ? '#059669' : '#9CA3AF' }} />
            {st.status}
          </span>
        </div>
      ))}

      {/* Subtask form */}
      {addSubtaskOf === task.id && (
        <form onSubmit={onAddSubtaskSubmit} style={{
          display: 'flex', gap: 10, padding: '12px 0 6px 34px', flexWrap: 'wrap'
        }}>
          <input value={subtaskForm.title} onChange={e => setSubtaskForm({ ...subtaskForm, title: e.target.value })} placeholder="Subtask title" required
            style={{
              flex: '1 1 180px', padding: '10px 14px', border: '1.5px solid #E5E7EB',
              borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff'
            }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          <select value={subtaskForm.assigned_to} onChange={e => setSubtaskForm({ ...subtaskForm, assigned_to: e.target.value })}
            style={{ padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
            <option value="">Owner</option>
            {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
          </select>
          <input type="date" value={subtaskForm.due_date} onChange={e => setSubtaskForm({ ...subtaskForm, due_date: e.target.value })}
            style={{ padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <select value={subtaskForm.status} onChange={e => setSubtaskForm({ ...subtaskForm, status: e.target.value })}
            style={{ padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
            <option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
          </select>
          <button type="submit" style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(91,33,182,0.2)'
          }}>Add</button>
          <button type="button" onClick={() => setAddSubtaskOf(null)} style={{
            padding: '10px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB',
            background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>Cancel</button>
        </form>
      )}
    </div>
  )
}
