import { useState, useMemo } from 'react'
import PhaseCard from './PhaseCard'
import TaskRow from './TaskRow'

const C = {
  primary: '#5B21B6', primaryLight: '#F5F3FF', primaryDark: '#4C1D95',
  card: '#fff', border: '#E5E7EB', muted: '#9CA3AF', secondary: '#6B7280',
  text: '#1F2937', success: '#059669', warning: '#D97706', danger: '#DC2626'
}

const STATUS_BADGE = {
  'Completed': { bg: '#D1FAE5', color: '#065F46', dot: '#059669' },
  'In Progress': { bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
  'Open': { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  'Pending': { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
  'Blocked': { bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' },
}

export default function TaskTrackerPanel({
  projectId, project, phases, tasks, milestones, team,
  addTaskPhase, setAddTaskPhase, phaseTaskForm, setPhaseTaskForm,
  addSubtaskOf, setAddSubtaskOf, subtaskForm, setSubtaskForm,
  showTaskForm, setShowTaskForm, taskForm, setTaskForm, mstoneForm, setMstoneForm,
  onAddTaskToPhase, onAddSubtaskSubmit, onAddTask, onUpdateTaskStatus, onUpdateTask, onAddMilestone, onMarkMilestoneDone,
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
  const doneMilestones = milestones.filter(m => m.status === 'Completed').length
  const hasMilestones = milestones.length > 0

  const [view, setView] = useState('grouped')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [sortBy, setSortBy] = useState('title')
  const [showPO, setShowPO] = useState(false)
  const [assigningFlat, setAssigningFlat] = useState(null)

  const filteredTasks = useMemo(() => {
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

  const poFields = [
    { key: 'po_number', label: 'PO Number' },
    { key: 'po_date', label: 'PO Date', fmt: (v) => formatDate(v) },
    { key: 'po_amount', label: 'PO Amount', fmt: (v) => `₹${v.toLocaleString()}`, green: true },
    { key: 'tds', label: 'TDS', fmt: (v) => `₹${v.toLocaleString()}` },
    { key: 'gst', label: 'GST @18%', fmt: (v) => `₹${v.toLocaleString()}` },
    { key: 'net_amount', label: 'Net Amount', fmt: (v) => `₹${v.toLocaleString()}`, green: true },
  ].filter(f => p[f.key])

  if (!p.plan_generated && p.project_type) {
    return (
      <div style={{
        padding: '32px 40px', background: 'linear-gradient(135deg, #F8F6FF, #F0F2F8)',
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
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: C.card, borderRadius: 16, border: '1px solid #E8E4F4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

      {/* ═══ Slim summary header ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'linear-gradient(135deg, #F8F6FF 0%, #F0F2F8 100%)',
        borderBottom: '1px solid #E8E4F4', padding: '14px 24px', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: '1 1 auto', flexWrap: 'wrap' }}>
          <StatItem value={totalPhases} label="Phases" color={C.primary} sub={totalPhases > 0 ? `${completedPhases}/${totalPhases}` : null} />
          <div style={{ width: 1, height: 24, background: '#E0DCF0' }} />
          <StatItem value={totalTasks} label="Tasks" color={C.text} sub={openTasks > 0 ? `${openTasks} open` : null} />
          <div style={{ width: 1, height: 24, background: '#E0DCF0' }} />
          <StatItem value={milestones.length} label="Milestones" color={C.warning} sub={doneMilestones > 0 ? `${doneMilestones} done` : null} />
          <div style={{ width: 1, height: 24, background: '#E0DCF0' }} />
          <StatItem value={completedTasks} label="Done" color={C.success} sub={pct > 0 ? `${pct}%` : null} />
          {totalTasks > 0 && (
            <div style={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 3 }}>
                <span>Progress</span>
                <span style={{ fontWeight: 700, color: C.primary }}>{pct}%</span>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 3,
                  background: pct === 100 ? 'linear-gradient(90deg, #059669, #34D399)' : 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* PO toggle */}
        {poFields.length > 0 && (
          <div onClick={() => setShowPO(!showPO)} style={{
            display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            fontSize: 11, fontWeight: 600, color: C.muted, padding: '4px 8px',
            borderRadius: 6, transition: 'background 0.15s', whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#F0EBFF'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            PO Details
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: showPO ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        )}
      </div>

      {/* ═══ Collapsible PO strip ═══ */}
      {showPO && poFields.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12,
          padding: '14px 24px', background: '#FAFAFE', borderBottom: '1px solid #E8E4F4', fontSize: 12
        }}>
          {poFields.map(f => (
            <div key={f.key}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: f.green ? C.success : C.text, marginTop: 2 }}>
                {f.fmt ? f.fmt(p[f.key]) : p[f.key]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ View tabs + Add Task button ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 24px', borderBottom: '1px solid #F0F0F5',
        background: '#fff', flexWrap: 'wrap'
      }}>
        {/* View tabs */}
        <div style={{ display: 'flex', gap: 2, background: '#F0F2F8', borderRadius: 10, padding: 2 }}>
          {[
            { id: 'grouped', label: 'Group by Phase', icon: 'M4 6h16M4 12h16M4 18h16' },
            { id: 'flat', label: 'Flat List', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
            { id: 'milestones', label: `Milestones${hasMilestones ? ` (${milestones.length})` : ''}`, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: view === tab.id ? C.card : 'transparent',
                color: view === tab.id ? C.primary : '#6B7280',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                boxShadow: view === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon}/>
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Add Task button (for grouped/flat) */}
        {view !== 'milestones' && (
          <button onClick={() => setShowTaskForm(!showTaskForm)}
            style={{
              border: showTaskForm ? '1.5px solid #E5E7EB' : 'none',
              background: showTaskForm ? '#fff' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              cursor: 'pointer',
              color: showTaskForm ? '#6B7280' : '#fff',
              fontSize: 12, fontWeight: 700, padding: '8px 16px',
              borderRadius: 8, transition: 'all 0.15s',
              boxShadow: showTaskForm ? 'none' : '0 2px 6px rgba(91,33,182,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: 5
            }}>
            {!showTaskForm && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>}
            {showTaskForm ? 'Cancel' : '+ Task'}
          </button>
        )}

        {/* Add Milestone button (for milestones view) */}
        {view === 'milestones' && (
          <button onClick={() => setMstoneForm(mstoneForm ? null : { title: '', due_date: '', description: '' })}
            style={{
              border: mstoneForm ? '1.5px solid #E5E7EB' : 'none',
              background: mstoneForm ? '#fff' : 'linear-gradient(135deg, #D97706, #B45309)',
              cursor: 'pointer',
              color: mstoneForm ? '#6B7280' : '#fff',
              fontSize: 12, fontWeight: 700, padding: '8px 16px',
              borderRadius: 8, transition: 'all 0.15s',
              boxShadow: mstoneForm ? 'none' : '0 2px 6px rgba(217,119,6,0.25)',
              display: 'inline-flex', alignItems: 'center', gap: 5
            }}>
            {!mstoneForm && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>}
            {mstoneForm ? 'Cancel' : '+ Milestone'}
          </button>
        )}
      </div>

      {/* ═══ Add Task form (for grouped/flat views) ═══ */}
      {showTaskForm && view !== 'milestones' && (
        <form onSubmit={onAddTask} style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: '18px 24px', background: '#FAFAFE',
          borderBottom: '1px solid #F0F0F5'
        }}>
          <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title..." required
            style={{ padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', minWidth: 100 }}>
              <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
            </select>
            <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 120 }} />
            <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', minWidth: 120 }}>
              <option value="">Assign to...</option>
              {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!taskForm.title.trim()}
            style={{
              background: taskForm.title.trim() ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : '#D1D5DB',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 22px', fontSize: 13, fontWeight: 700,
              cursor: taskForm.title.trim() ? 'pointer' : 'not-allowed',
              alignSelf: 'flex-start', transition: 'all 0.15s',
              boxShadow: taskForm.title.trim() ? '0 2px 6px rgba(91,33,182,0.2)' : 'none',
              display: 'inline-flex', alignItems: 'center', gap: 5
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add Task
          </button>
        </form>
      )}

      {/* ═══ Add Milestone form ═══ */}
      {mstoneForm && view === 'milestones' && (
        <div style={{
          display: 'flex', gap: 10, padding: '18px 24px',
          background: '#FFFBEB', borderBottom: '1px solid #FDE68A', flexWrap: 'wrap', alignItems: 'center'
        }}>
          <input value={mstoneForm.title} onChange={e => setMstoneForm({...mstoneForm, title: e.target.value})} placeholder="Milestone title"
            style={{ flex: '1 1 220px', padding: '10px 14px', border: '1.5px solid #FDE68A', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
            onFocus={e => e.target.style.borderColor = '#D97706'}
            onBlur={e => e.target.style.borderColor = '#FDE68A'} />
          <input type="date" value={mstoneForm.due_date} onChange={e => setMstoneForm({...mstoneForm, due_date: e.target.value})}
            style={{ padding: '10px 14px', border: '1.5px solid #FDE68A', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
          <button onClick={onAddMilestone} style={{
            padding: '10px 22px', border: 'none', borderRadius: 10,
            background: 'linear-gradient(135deg, #D97706, #B45309)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(217,119,6,0.25)'
          }}>Add</button>
        </div>
      )}

      {/* ═══ Search & Filters (for grouped/flat views) ═══ */}
      {view !== 'milestones' && (
        <div style={{
          display: 'flex', gap: 8, padding: '12px 24px',
          borderBottom: '1px solid #F0F0F5', flexWrap: 'wrap', alignItems: 'center',
          background: '#FAFAFE'
        }}>
          <div style={{ flex: '1 1 160px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{
                width: '100%', padding: '7px 10px 7px 30px',
                border: '1.5px solid #E5E7EB', borderRadius: 8,
                fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff'
              }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="">Status</option>
            <option>Open</option><option>In Progress</option><option>Completed</option><option>Pending</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="">Priority</option>
            <option>Urgent</option><option>High</option><option>Normal</option><option>Low</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '7px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="title">Sort: Title</option>
            <option value="due_date">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
          </select>
          {search || filterStatus || filterPriority ? (
            <span style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>
              {filteredTasks.length} / {tasks.length}
            </span>
          ) : null}
        </div>
      )}

      {/* ═══ Content area ═══ */}
      <div style={{ padding: view === 'milestones' ? '20px 24px' : '8px 24px 20px' }}>

        {/* --- Group by Phase view --- */}
        {view === 'grouped' && (
          phases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 600, color: C.secondary, fontSize: 14 }}>No phases yet</div>
              <div style={{ marginTop: 4, fontSize: 13 }}>Generate a plan to get started.</div>
            </div>
          ) : (
            phases.map((phase, pi) => (
              <PhaseCard key={phase.id} phase={phase} index={pi} team={team}
                addTaskPhase={addTaskPhase} setAddTaskPhase={setAddTaskPhase}
                phaseTaskForm={phaseTaskForm} setPhaseTaskForm={setPhaseTaskForm}
                addSubtaskOf={addSubtaskOf} setAddSubtaskOf={setAddSubtaskOf}
                subtaskForm={subtaskForm} setSubtaskForm={setSubtaskForm}
                onAddTaskToPhase={onAddTaskToPhase} onAddSubtaskSubmit={onAddSubtaskSubmit}
                onTaskStatusToggle={onUpdateTaskStatus} onUpdateTask={onUpdateTask} onTaskClick={onTaskClick} />
            ))
          )
        )}

        {/* --- Flat List view --- */}
        {view === 'flat' && (
          filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 10px', display: 'block' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/>
              </svg>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>
                {tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}
              </div>
              <div style={{ fontSize: 13 }}>
                {tasks.length === 0 ? 'Add a task using the button above.' : 'Try adjusting your search or filters.'}
              </div>
            </div>
          ) : (
            filteredTasks.map(t => {
              const badge = STATUS_BADGE[t.status] || STATUS_BADGE['Pending']
              const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed'
              return (
                <TaskRow key={t.id} task={t} team={team} onStatusToggle={onUpdateTaskStatus} onUpdateTask={onUpdateTask}
                  onAddSubtask={setAddSubtaskOf} addSubtaskOf={addSubtaskOf} setAddSubtaskOf={setAddSubtaskOf}
                  subtaskForm={subtaskForm} setSubtaskForm={setSubtaskForm} onAddSubtaskSubmit={onAddSubtaskSubmit}
                  onTaskClick={onTaskClick} />
              )
            })
          )
        )}

        {/* --- Milestones view --- */}
        {view === 'milestones' && (
          milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.secondary, marginBottom: 6 }}>No milestones yet</div>
              <div style={{ fontSize: 13 }}>Add a milestone using the button above.</div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 19, top: 8, bottom: 8,
                width: 2, background: 'linear-gradient(180deg, #D97706, #FDE68A)', borderRadius: 1
              }} />
              <div style={{ display: 'grid', gap: 8 }}>
                {[...milestones].sort((a, b) => {
                  if (a.status === 'Completed' && b.status !== 'Completed') return 1
                  if (a.status !== 'Completed' && b.status === 'Completed') return -1
                  return (a.due_date || '') < (b.due_date || '') ? -1 : 1
                }).map(m => {
                  const isDone = m.status === 'Completed'
                  return (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', borderRadius: 12,
                      background: isDone ? '#F0FDF4' : '#fff',
                      border: isDone ? '1px solid #BBF7D0' : '1px solid #F0F0F5',
                      boxShadow: isDone ? '0 1px 4px rgba(5,150,105,0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s', marginLeft: 8
                    }}>
                      <div style={{
                        width: 16, height: 16, minWidth: 16, borderRadius: '50%',
                        background: isDone ? '#059669' : '#D97706',
                        border: `3px solid ${isDone ? '#BBF7D0' : '#FDE68A'}`,
                        boxShadow: isDone ? '0 0 0 2px #D1FAE5' : '0 0 0 2px #FEF3C7',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: isDone ? '#065F46' : C.text, textDecoration: isDone ? 'line-through' : 'none' }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: isDone ? '#6B7280' : C.muted, marginTop: 3 }}>
                          {m.due_date ? new Date(m.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date'}
                          {m.description ? ` · ${m.description}` : ''}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                        background: isDone ? '#D1FAE5' : '#FEF3C7',
                        color: isDone ? '#065F46' : '#92400E', whiteSpace: 'nowrap',
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: isDone ? '#059669' : '#D97706' }} />
                        {m.status}
                      </span>
                      {!isDone && (
                        <button onClick={() => onMarkMilestoneDone(m.id)}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: '7px 18px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff',
                            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                            boxShadow: '0 2px 6px rgba(5,150,105,0.2)'
                          }}>
                          ✓ Mark Done
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

/* ═══ Stat item inline ═══ */
function StatItem({ value, label, color, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, lineHeight: 1.2, letterSpacing: '0.2px' }}>{label}</div>
        {sub && <div style={{ fontSize: 9, color: C.secondary, lineHeight: 1.2, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}
