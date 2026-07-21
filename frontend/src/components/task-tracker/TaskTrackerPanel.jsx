const C = {
  primary: '#5B21B6', primaryLight: '#F5F3FF', primaryDark: '#4C1D95',
  card: '#fff', border: '#E5E7EB', muted: '#9CA3AF', secondary: '#6B7280',
  text: '#1F2937', success: '#059669', warning: '#D97706', danger: '#DC2626'
}
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
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Summary Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16,
        padding: '24px 28px', background: 'linear-gradient(135deg, #F8F6FF 0%, #F0F2F8 100%)',
        borderRadius: 16, border: '1px solid #E8E4F4', boxShadow: '0 2px 8px rgba(91,33,182,0.06)'
      }}>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: C.primary, opacity: 0.3 }} />
          <div style={{ fontSize: 32, fontWeight: 900, color: C.primary, lineHeight: 1.1 }}>{totalPhases}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Phases</div>
          {totalPhases > 0 && (
            <div style={{ fontSize: 12, color: C.secondary, marginTop: 3, fontWeight: 500 }}>
              {completedPhases === totalPhases ? '✅ All done' : `${completedPhases}/${totalPhases} complete`}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>{totalTasks}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Tasks</div>
          <div style={{ fontSize: 12, color: C.secondary, marginTop: 3, fontWeight: 500 }}>{openTasks} open</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.warning, lineHeight: 1.1 }}>{milestones.length}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Milestones</div>
          <div style={{ fontSize: 12, color: C.secondary, marginTop: 3, fontWeight: 500 }}>
            {milestones.filter(m => m.status === 'Completed').length} done
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.success, lineHeight: 1.1 }}>{completedTasks}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 4, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: 12, color: C.secondary, marginTop: 3, fontWeight: 500 }}>{pct}% done</div>
        </div>
        {totalTasks > 0 && (
          <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 6 }}>
              <span>Overall Progress</span>
              <span style={{ fontWeight: 700, color: C.primary }}>{pct}%</span>
            </div>
            <div style={{ width: '100%', height: 10, borderRadius: 5, background: '#E5E7EB', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 5,
                background: pct === 100 ? 'linear-gradient(90deg, #059669, #34D399)' : 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(91,33,182,0.2)'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* PO Info Summary */}
      {(p.po_number || p.po_amount || p.po_date || p.tds || p.gst || p.net_amount) && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16,
          padding: '20px 24px', background: C.card, borderRadius: 14,
          border: '1px solid #E8E4F4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          {p.po_number && (
            <div>
              <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>PO Number</span>
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginTop:4}}>{p.po_number}</div>
            </div>
          )}
          {p.po_date && (
            <div>
              <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>PO Date</span>
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginTop:4}}>{formatDate(p.po_date)}</div>
            </div>
          )}
          {p.po_amount && (
            <div>
              <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>PO Amount</span>
              <div style={{fontSize:15,fontWeight:700,color:C.success,marginTop:4}}>₹{p.po_amount.toLocaleString()}</div>
            </div>
          )}
          {p.tds && (
            <div>
              <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>TDS</span>
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginTop:4}}>₹{p.tds.toLocaleString()}</div>
            </div>
          )}
          {p.gst && (
            <div>
              <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>GST @18%</span>
              <div style={{fontSize:15,fontWeight:600,color:C.text,marginTop:4}}>₹{p.gst.toLocaleString()}</div>
            </div>
          )}
          {p.net_amount && (
            <div>
              <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.5px'}}>Net Amount</span>
              <div style={{fontSize:15,fontWeight:700,color:C.success,marginTop:4}}>₹{p.net_amount.toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {/* Generate Plan */}
      {!p.plan_generated && p.project_type && (
        <div style={{
          padding: '28px 32px', background: 'linear-gradient(135deg, #F8F6FF, #F0F2F8)',
          borderRadius: 16, border: '1px solid #E8E4F4', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(91,33,182,0.06)'
        }}>
          <div style={{ fontSize: 15, color: C.secondary, marginBottom: 16, fontWeight: 500 }}>
            Plan has not been generated yet for this project.
          </div>
          <button onClick={onGeneratePlan} disabled={generatingPlan}
            style={{
              padding: '14px 32px', borderRadius: 12, border: 'none',
              background: generatingPlan ? '#9CA3AF' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              opacity: generatingPlan ? 0.7 : 1, transition: 'all 0.2s',
              boxShadow: generatingPlan ? 'none' : '0 4px 14px rgba(91,33,182,0.25)'
            }}>
            {generatingPlan ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Generating...
              </span>
            ) : `Generate Plan from ${p.project_type} Template`}
          </button>
        </div>
      )}

      {/* Phases */}
      {p.plan_generated && phases.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
        <div style={{
          padding: '40px', textAlign: 'center', color: C.muted, fontSize: 15,
          background: C.card, borderRadius: 14, border: '1px solid #E8E4F4'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
          <div style={{ fontWeight: 600, color: C.secondary }}>No phases yet</div>
          <div style={{ marginTop: 4, fontSize: 13 }}>Generate a plan above to get started.</div>
        </div>
      )}

      {/* All Tasks */}
      <div style={{
        background: C.card, borderRadius: 16, border: '1px solid #E8E4F4',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '24px 28px'
      }}>
        <AllTasksList tasks={tasks} team={team}
          showTaskForm={showTaskForm} setShowTaskForm={setShowTaskForm}
          taskForm={taskForm} setTaskForm={setTaskForm}
          onAddTask={onAddTask} onTaskClick={onTaskClick} onStatusToggle={onUpdateTaskStatus} />
      </div>

      {/* Milestones */}
      <div style={{
        background: C.card, borderRadius: 16, border: '1px solid #E8E4F4',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '24px 28px'
      }}>
        <MilestonesSection milestones={milestones} mstoneForm={mstoneForm} setMstoneForm={setMstoneForm}
          onAddMilestone={onAddMilestone} onMarkDone={onMarkMilestoneDone} />
      </div>
    </div>
  )
}
