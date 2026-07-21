const C = { primary: '#5B21B6', card: '#fff', border: '#E5E7EB', muted: '#9CA3AF', secondary: '#6B7280' }
import PhaseCard from './PhaseCard'
import AllTasksList from './AllTasksList'
import MilestonesSection from './MilestonesSection'

export default function TaskTrackerPanel({
  projectId, project, phases, tasks, milestones, team,
  addTaskPhase, setAddTaskPhase, phaseTaskForm, setPhaseTaskForm,
  addSubtaskOf, setAddSubtaskOf, subtaskForm, setSubtaskForm,
  showTaskForm, setShowTaskForm, taskForm, setTaskForm, mstoneForm, setMstoneForm,
  onAddTaskToPhase, onAddSubtaskSubmit, onAddTask, onUpdateTaskStatus, onAddMilestone, onMarkMilestoneDone,
  onGeneratePlan, generatingPlan, onTaskClick
}) {
  const formatDate = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  const p = project || {}
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'Completed').length
  const openTasks = totalTasks - completedTasks
  const totalPhases = phases.length
  const completedPhases = phases.filter(ph => ph.status === 'Completed').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, padding: 16, background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.primary }}>{totalPhases}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Phases</div>
          {totalPhases > 0 && <div style={{ fontSize: 10, color: C.secondary, marginTop: 1 }}>{completedPhases} done</div>}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#374151' }}>{totalTasks}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Tasks</div>
          {totalTasks > 0 && <div style={{ fontSize: 10, color: C.secondary, marginTop: 1 }}>{openTasks} open</div>}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706' }}>{milestones.length}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Milestones</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>{completedTasks}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Completed</div>
          {totalTasks > 0 && <div style={{ fontSize: 10, color: C.secondary, marginTop: 1 }}>{Math.round((completedTasks / totalTasks) * 100)}%</div>}
        </div>
        {totalTasks > 0 && (
          <div style={{ gridColumn: '1 / -1', marginTop: -4 }}>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((completedTasks / totalTasks) * 100)}%`, height: '100%', borderRadius: 3, background: C.primary, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* PO Info summary */}
      {(p.po_number || p.po_amount || p.po_date || p.tds || p.gst || p.net_amount) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, padding: 14, background: '#F9FAFB', borderRadius: 10, border: `1px solid ${C.border}` }}>
          {p.po_number && <div><span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>PO Number</span><div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{p.po_number}</div></div>}
          {p.po_date && <div><span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>PO Date</span><div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{formatDate(p.po_date)}</div></div>}
          {p.po_amount && <div><span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>PO Amount</span><div style={{fontSize:14,fontWeight:600,color:'#059669'}}>₹{p.po_amount.toLocaleString()}</div></div>}
          {p.tds ? <div><span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>TDS</span><div style={{fontSize:14,fontWeight:600,color:'#111827'}}>₹{p.tds.toLocaleString()}</div></div> : null}
          {p.gst ? <div><span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>GST @18%</span><div style={{fontSize:14,fontWeight:600,color:'#111827'}}>₹{p.gst.toLocaleString()}</div></div> : null}
          {p.net_amount ? <div><span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase'}}>Net Amount</span><div style={{fontSize:14,fontWeight:600,color:'#059669'}}>₹{p.net_amount.toLocaleString()}</div></div> : null}
        </div>
      )}

      {/* Generate Plan */}
      {!p.plan_generated && p.project_type && (
        <div style={{ padding: '16px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>Plan has not been generated yet.</p>
          <button onClick={onGeneratePlan} disabled={generatingPlan}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: generatingPlan ? 0.6 : 1 }}>
            {generatingPlan ? 'Generating...' : `Generate Plan from ${p.project_type} Template`}
          </button>
        </div>
      )}

      {/* Phases */}
      {p.plan_generated && phases.length > 0 && (
        <div>
          {phases.map((phase, pi) => (
            <PhaseCard key={phase.id} phase={phase} index={pi} team={team}
              addTaskPhase={addTaskPhase} setAddTaskPhase={setAddTaskPhase}
              phaseTaskForm={phaseTaskForm} setPhaseTaskForm={setPhaseTaskForm}
              addSubtaskOf={addSubtaskOf} setAddSubtaskOf={setAddSubtaskOf}
              subtaskForm={subtaskForm} setSubtaskForm={setSubtaskForm}
              onAddTaskToPhase={onAddTaskToPhase} onAddSubtaskSubmit={onAddSubtaskSubmit}
              onTaskStatusToggle={onUpdateTaskStatus} onTaskClick={onTaskClick} />
          ))}
        </div>
      )}

      {p.plan_generated && phases.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: C.muted, fontSize: 14, background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          No phases yet. Generate a plan above.
        </div>
      )}

      {/* All Tasks */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px' }}>
        <AllTasksList tasks={tasks} team={team}
          showTaskForm={showTaskForm} setShowTaskForm={setShowTaskForm}
          taskForm={taskForm} setTaskForm={setTaskForm}
          onAddTask={onAddTask} onTaskClick={onTaskClick} onStatusToggle={onUpdateTaskStatus} />
      </div>

      {/* Milestones */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px' }}>
        <MilestonesSection milestones={milestones} mstoneForm={mstoneForm} setMstoneForm={setMstoneForm}
          onAddMilestone={onAddMilestone} onMarkDone={onMarkMilestoneDone} />
      </div>
    </div>
  )
}
