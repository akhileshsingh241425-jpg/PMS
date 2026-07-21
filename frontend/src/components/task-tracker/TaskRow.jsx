const C = { primary: '#5B21B6', primaryLight: '#F5F3FF', border: '#E5E7EB', card: '#fff', muted: '#9CA3AF', secondary: '#6B7280' }

const BADGE = {
  'Completed': { bg: '#D1FAE5', color: '#065F46' },
  'In Progress': { bg: '#FEF3C7', color: '#92400E' },
  'Open': { bg: '#DBEAFE', color: '#1E40AF' },
  'Pending': { bg: '#F3F4F6', color: '#6B7280' },
  'Blocked': { bg: '#FEE2E2', color: '#DC2626' },
}

export default function TaskRow({ task, onStatusToggle, onAddSubtask, team, addSubtaskOf, setAddSubtaskOf, subtaskForm, setSubtaskForm, onAddSubtaskSubmit, onTaskClick }) {
  const badge = BADGE[task.status] || BADGE['Pending']
  return (
    <div style={{ borderBottom: '1px solid #F3F4F6', padding: '8px 0', background: task.status === 'Completed' ? '#FAFAFA' : 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" checked={task.status === 'Completed'}
          onChange={e => onStatusToggle(task.id, task.status === 'Completed' ? 'Open' : 'Completed')}
          style={{ width: 16, height: 16, accentColor: C.primary, cursor: 'pointer', flexShrink: 0 }} />
        <span onClick={() => onTaskClick?.(task)} style={{ fontSize: 14, fontWeight: 600, color: task.status === 'Completed' ? C.muted : '#1F2937', flex: 1, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', cursor: onTaskClick ? 'pointer' : 'default' }}>
          {task.title}
        </span>
        <span style={{ fontSize: 12, color: task.assigned_name ? '#6B7280' : '#9CA3AF', whiteSpace: 'nowrap' }}>
          {task.assigned_name || 'Unassigned'}
        </span>
        <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
          {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
          {task.status}
        </span>
        <button onClick={() => { setAddSubtaskOf(task.id); setSubtaskForm({ title: '', assigned_to: '', due_date: '', status: 'Open' }) }}
          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Subtask
        </button>
      </div>
      {task.subtasks?.map(st => (
        <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 2px 28px' }}>
          <input type="checkbox" checked={st.status === 'Completed'}
            onChange={e => onStatusToggle(st.id, st.status === 'Completed' ? 'Open' : 'Completed')}
            style={{ width: 14, height: 14, accentColor: C.primary, cursor: 'pointer', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: st.status === 'Completed' ? C.muted : '#6B7280', flex: 1, textDecoration: st.status === 'Completed' ? 'line-through' : 'none' }}>{st.title}</span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{st.assigned_name || ''}</span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{st.due_date ? new Date(st.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 20, background: st.status === 'Completed' ? '#D1FAE5' : '#F3F4F6', color: st.status === 'Completed' ? '#065F46' : '#6B7280' }}>{st.status}</span>
        </div>
      ))}
      {addSubtaskOf === task.id && (
        <form onSubmit={onAddSubtaskSubmit} style={{ display: 'flex', gap: 8, padding: '8px 0 4px 28px', flexWrap: 'wrap' }}>
          <input value={subtaskForm.title} onChange={e => setSubtaskForm({ ...subtaskForm, title: e.target.value })} placeholder="Subtask title" required
            style={{ flex: '1 1 180px', padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          <select value={subtaskForm.assigned_to} onChange={e => setSubtaskForm({ ...subtaskForm, assigned_to: e.target.value })}
            style={{ padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, background: '#fff', fontFamily: 'inherit' }}>
            <option value="">Owner</option>
            {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
          </select>
          <input type="date" value={subtaskForm.due_date} onChange={e => setSubtaskForm({ ...subtaskForm, due_date: e.target.value })}
            style={{ padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }} />
          <select value={subtaskForm.status} onChange={e => setSubtaskForm({ ...subtaskForm, status: e.target.value })}
            style={{ padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, background: '#fff', fontFamily: 'inherit' }}>
            <option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
          </select>
          <button type="submit" style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
          <button type="button" onClick={() => setAddSubtaskOf(null)} style={{ padding: '6px 12px', borderRadius: 6, border: `1.5px solid ${C.border}`, background: '#fff', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        </form>
      )}
    </div>
  )
}
