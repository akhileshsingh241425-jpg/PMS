const C = { primary: '#5B21B6', primaryLight: '#F5F3FF', border: '#E5E7EB', muted: '#9CA3AF', secondary: '#6B7280' }
import TaskRow from './TaskRow'

export default function PhaseCard({ phase, index, team, addTaskPhase, setAddTaskPhase, phaseTaskForm, setPhaseTaskForm, addSubtaskOf, setAddSubtaskOf, subtaskForm, setSubtaskForm, onAddTaskToPhase, onAddSubtaskSubmit, onTaskStatusToggle, onTaskClick }) {
  const total = phase.tasks?.length || 0
  const completed = phase.tasks?.filter(t => t.status === 'Completed').length || 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div style={{ marginBottom: 16, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#F8FAFC', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: C.primary, flexShrink: 0 }}>{index + 1}</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1F2937', flex: 1 }}>{phase.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 60, height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: pct === 100 ? '#059669' : C.primary, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.secondary, whiteSpace: 'nowrap' }}>{completed}/{total}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: phase.status === 'Completed' ? '#D1FAE5' : phase.status === 'In Progress' ? '#FEF3C7' : '#F3F4F6',
          color: phase.status === 'Completed' ? '#065F46' : phase.status === 'In Progress' ? '#92400E' : '#6B7280' }}>
          {phase.status}
        </span>
      </div>
      <div style={{ padding: '4px 18px 10px' }}>
        {phase.tasks?.map(task => (
          <TaskRow key={task.id} task={task} team={team} onStatusToggle={onTaskStatusToggle}
            onAddSubtask={setAddSubtaskOf} addSubtaskOf={addSubtaskOf} setAddSubtaskOf={setAddSubtaskOf}
            subtaskForm={subtaskForm} setSubtaskForm={setSubtaskForm} onAddSubtaskSubmit={onAddSubtaskSubmit}
            onTaskClick={onTaskClick} />
        ))}
        {(!phase.tasks || phase.tasks.length === 0) && (
          <div style={{ fontSize: 13, color: C.muted, padding: '12px 0', textAlign: 'center' }}>No tasks in this phase</div>
        )}
      </div>
      <div style={{ padding: '10px 18px', borderTop: `1px solid ${C.border}`, background: '#FAFAFA' }}>
        {addTaskPhase === phase.id ? (
          <form onSubmit={onAddTaskToPhase} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={phaseTaskForm.title} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, title: e.target.value })} placeholder="Task title" required
              style={{ flex: '1 1 200px', padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
            <select value={phaseTaskForm.assigned_to} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, assigned_to: e.target.value })}
              style={{ padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, background: '#fff', fontFamily: 'inherit' }}>
              <option value="">Owner</option>
              {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
            </select>
            <input type="date" value={phaseTaskForm.due_date} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, due_date: e.target.value })}
              style={{ padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }} />
            <select value={phaseTaskForm.status} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, status: e.target.value })}
              style={{ padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, background: '#fff', fontFamily: 'inherit' }}>
              <option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option>
            </select>
            <button type="submit" style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            <button type="button" onClick={() => setAddTaskPhase(null)} style={{ padding: '6px 12px', borderRadius: 6, border: `1.5px solid ${C.border}`, background: '#fff', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </form>
        ) : (
          <button onClick={() => { setAddTaskPhase(phase.id); setPhaseTaskForm({ title: '', assigned_to: '', due_date: '', status: 'Open' }) }}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1.5px dashed #D1D5DB', background: 'none', color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            + Add Task
          </button>
        )}
      </div>
    </div>
  )
}
