const C = {
  primary: '#5B21B6', primaryLight: '#F5F3FF', primaryDark: '#4C1D95',
  border: '#E5E7EB', muted: '#9CA3AF', secondary: '#6B7280', text: '#1F2937',
  success: '#059669', warning: '#D97706'
}
import TaskRow from './TaskRow'

export default function PhaseCard({ phase, index, team, addTaskPhase, setAddTaskPhase, phaseTaskForm, setPhaseTaskForm, addSubtaskOf, setAddSubtaskOf, subtaskForm, setSubtaskForm, onAddTaskToPhase, onAddSubtaskSubmit, onTaskStatusToggle, onUpdateTask, onTaskClick }) {
  const total = phase.tasks?.length || 0
  const completed = phase.tasks?.filter(t => t.status === 'Completed').length || 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const statusColors = {
    'Completed': { bg: '#D1FAE5', color: '#065F46', dot: '#059669' },
    'In Progress': { bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
    'Pending': { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
    'Open': { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
    'Not Started': { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  }
  const sc = statusColors[phase.status] || statusColors['Pending']

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden', background: C.card,
      border: '1px solid #E8E4F4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative'
    }}>
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: phase.status === 'Completed'
          ? 'linear-gradient(180deg, #059669, #34D399)'
          : phase.status === 'In Progress'
            ? 'linear-gradient(180deg, #D97706, #F59E0B)'
            : 'linear-gradient(180deg, #9CA3AF, #D1D5DB)'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '20px 24px 16px 28px', background: '#F8FAFC',
        borderBottom: '1px solid #F0F0F5'
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
          boxShadow: '0 2px 6px rgba(91,33,182,0.2)'
        }}>{index + 1}</div>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text, flex: 1, letterSpacing: '-0.01em' }}>{phase.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 80, height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 4,
                background: pct === 100 ? 'linear-gradient(90deg, #059669, #34D399)' : 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(91,33,182,0.15)'
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.secondary, minWidth: 36, textAlign: 'right' }}>
              {completed}/{total}
            </span>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
            background: sc.bg, color: sc.color, whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
            {phase.status}
          </span>
        </div>
      </div>

      {/* Task list */}
      <div style={{ padding: '8px 24px 12px 28px' }}>
        {phase.tasks?.map(task => (
          <TaskRow key={task.id} task={task} team={team} onStatusToggle={onTaskStatusToggle} onUpdateTask={onUpdateTask}
            onAddSubtask={setAddSubtaskOf} addSubtaskOf={addSubtaskOf} setAddSubtaskOf={setAddSubtaskOf}
            subtaskForm={subtaskForm} setSubtaskForm={setSubtaskForm} onAddSubtaskSubmit={onAddSubtaskSubmit}
            onTaskClick={onTaskClick} />
        ))}
        {(!phase.tasks || phase.tasks.length === 0) && (
          <div style={{ fontSize: 14, color: C.muted, padding: '20px 0', textAlign: 'center', fontStyle: 'italic' }}>
            No tasks in this phase
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 24px 14px 28px', borderTop: '1px solid #F0F0F5',
        background: '#FAFAFE'
      }}>
        {addTaskPhase === phase.id ? (
          <form onSubmit={onAddTaskToPhase} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input value={phaseTaskForm.title} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, title: e.target.value })} placeholder="Task title" required
              style={{ flex: '1 1 200px', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            <select value={phaseTaskForm.assigned_to} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, assigned_to: e.target.value })}
              style={{ padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Owner</option>
              {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
            </select>
            <input type="date" value={phaseTaskForm.due_date} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, due_date: e.target.value })}
              style={{ padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            <select value={phaseTaskForm.status} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, status: e.target.value })}
              style={{ padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
              <option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
            </select>
            <button type="submit" style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(91,33,182,0.2)', transition: 'all 0.15s'
            }}>Add</button>
            <button type="button" onClick={() => setAddTaskPhase(null)} style={{
              padding: '10px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB',
              background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s'
            }}>Cancel</button>
          </form>
        ) : (
          <button onClick={() => { setAddTaskPhase(phase.id); setPhaseTaskForm({ title: '', assigned_to: '', due_date: '', status: 'Open' }) }}
            style={{
              padding: '10px 20px', borderRadius: 10,
              border: '1.5px dashed #D1D5DB', background: 'none',
              color: '#7C3AED', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Task
          </button>
        )}
      </div>
    </div>
  )
}
