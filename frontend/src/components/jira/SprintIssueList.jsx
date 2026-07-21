import { useState } from 'react'
import { MoreHorizontal, ChevronDown, CheckCircle2, Circle, Clock, AlertCircle, ArrowUp, ArrowDown, Minus, User } from 'lucide-react'

const C = {
  blue: '#0052CC', text: '#172B4D', muted: '#5E6C84', border: '#DFE1E6', bg: '#F4F5F7',
}

const STATUS = { todo: '#DFE1E6', in_progress: '#0052CC', review: '#FF8B00', done: '#36B37E' }
const PRIORITY_COLORS = { highest: '#CD1317', high: '#E34935', medium: '#FF8B00', low: '#36B37E', lowest: '#57D9A3' }
const LABEL_COLORS = {
  BILLING: { bg: '#E3FCEF', text: '#064B2C' },
  ACCOUNTS: { bg: '#DEEBFF', text: '#0747A6' },
  FEEDBACK: { bg: '#EAE6FF', text: '#403294' },
  VAPT: { bg: '#FFF0E0', text: '#A85A00' },
  SECURITY: { bg: '#FFEDED', text: '#BF2600' },
}
const TYPE_ICONS = {
  story: { icon: '□', color: '#36B37E' },
  bug: { icon: '●', color: '#E34935' },
  task: { icon: '◇', color: '#0052CC' },
  subtask: { icon: '○', color: '#5E6C84' },
  epic: { icon: '◆', color: '#9747FF' },
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'done']

export default function SprintIssueList({ sprints, unassignedIssues, onIssueClick, onCreateIssue, onEditIssue, onDeleteIssue, onCompleteSprint, projectId }) {
  const [menuOpen, setMenuOpen] = useState(null)
  const [quickEdit, setQuickEdit] = useState(null)
  const [localIssues, setLocalIssues] = useState({})

  const handleStatusChange = (issue, newStatus) => {
    setQuickEdit(null)
    onEditIssue(issue.id, { status: newStatus })
  }

  const renderIssueRow = (issue) => {
    const typeIcon = TYPE_ICONS[issue.type] || TYPE_ICONS.task
    const labelColor = LABEL_COLORS[issue.label] || { bg: '#EAECF0', text: '#5E6C84' }
    const priColor = PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.medium
    const PrioIcon = issue.priority === 'highest' || issue.priority === 'high' ? ArrowUp
      : issue.priority === 'low' || issue.priority === 'lowest' ? ArrowDown : Minus

    return (
      <div key={issue.id}
        onClick={() => onIssueClick(issue)}
        onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
          borderBottom: '1px solid #F0F0F0', cursor: 'pointer', transition: 'background 0.1s',
          minHeight: 36,
        }}>
        {/* Drag handle */}
        <div style={{ color: '#C1C7D0', cursor: 'grab', display: 'flex', flexShrink: 0 }}>
          <GripVerticalIcon />
        </div>

        {/* Status dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); setQuickEdit(quickEdit === issue.id ? null : issue.id) }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${STATUS[issue.status] || STATUS.todo}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {issue.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#36B37E' }} />}
          </div>
          {quickEdit === issue.id && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: '#fff', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #DFE1E6', minWidth: 140 }} onClick={e => e.stopPropagation()}>
              {STATUS_OPTIONS.map(s => (
                <button key={s} onClick={() => handleStatusChange(issue, s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', border: 'none', background: issue.status === s ? '#DEEBFF' : 'transparent', color: '#172B4D', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: STATUS[s] }} />
                  {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Issue key */}
        <span style={{ fontSize: 12, fontWeight: 500, color: '#7A869A', minWidth: 90, flexShrink: 0 }}>{issue.key}</span>

        {/* Type icon */}
        <span style={{ color: typeIcon.color, fontSize: 14, flexShrink: 0 }}>{typeIcon.icon}</span>

        {/* Title */}
        <span style={{ flex: 1, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</span>

        {/* Label */}
        {issue.label && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
            background: labelColor.bg, color: labelColor.text, whiteSpace: 'nowrap', flexShrink: 0,
          }}>{issue.label}</span>
        )}

        {/* Priority */}
        <PrioIcon className="w-3.5 h-3.5" style={{ color: priColor, flexShrink: 0 }} />

        {/* Assignee */}
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: issue.assignee ? '#0052CC' : '#DFE1E6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>
          {issue.assignee ? issue.assignee.name[0]?.toUpperCase() || '?' : '?'}
        </div>

        {/* Delete */}
        <button onClick={e => { e.stopPropagation(); if (confirm('Delete this issue?')) onDeleteIssue(issue.id) }}
          style={{ width: 20, height: 20, border: 'none', background: 'transparent', color: '#C1C7D0', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
          ×
        </button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Sprints */}
      {sprints.map(sprint => (
        <SprintSection key={sprint.id} sprint={sprint} renderIssueRow={renderIssueRow}
          onCreateIssue={() => onCreateIssue(sprint.id)}
          onComplete={() => onCompleteSprint?.(sprint.id)}
        />
      ))}

      {/* Unassigned issues */}
      {unassignedIssues.length > 0 && (
        <div>
          <div style={{
            padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #DFE1E6', background: '#F8F9FA',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#172B4D' }}>Unassigned</span>
              <span style={{ fontSize: 11, color: '#5E6C84' }}>{unassignedIssues.length}</span>
            </div>
            <button onClick={() => onCreateIssue(null)}
              style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: '#5E6C84', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusIcon />
            </button>
          </div>
          {unassignedIssues.map(renderIssueRow)}
        </div>
      )}
    </div>
  )
}

function SprintSection({ sprint, renderIssueRow, onCreateIssue, onComplete }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      {/* Sprint header */}
      <div style={{
        padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid #DFE1E6', background: '#F8F9FA', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: '#5E6C84', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#172B4D' }}>{sprint.name}</span>
        <span style={{ fontSize: 11, color: '#5E6C84' }}>{sprint.issue_count} issues</span>
        {sprint.start_date && (
          <span style={{ fontSize: 11, color: '#7A869A' }}>
            {sprint.start_date} — {sprint.end_date || 'No end date'}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <StatusBadge label="To Do" count={sprint.status_counts?.todo || 0} color="#DFE1E6" />
          <StatusBadge label="In Progress" count={sprint.status_counts?.in_progress || 0} color="#0052CC" />
          <StatusBadge label="Done" count={sprint.status_counts?.done || 0} color="#36B37E" />
        </div>
        {sprint.status === 'active' && (
          <button onClick={onComplete}
            style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #DFE1E6', background: '#fff', fontSize: 11, color: '#5E6C84', cursor: 'pointer', fontFamily: 'inherit' }}>
            Complete sprint
          </button>
        )}
        <button onClick={onCreateIssue}
          style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', color: '#5E6C84', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PlusIcon />
        </button>
      </div>

      {!collapsed && sprint.issues?.map(renderIssueRow)}
      {!collapsed && sprint.issues?.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#5E6C84', fontSize: 12 }}>
          No issues in this sprint. Click + to create one.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ label, count, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#5E6C84' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span>{count}</span>
    </div>
  )
}

function GripVerticalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="4" cy="3" r="1.2" />
      <circle cx="8" cy="3" r="1.2" />
      <circle cx="4" cy="6" r="1.2" />
      <circle cx="8" cy="6" r="1.2" />
      <circle cx="4" cy="9" r="1.2" />
      <circle cx="8" cy="9" r="1.2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  )
}
