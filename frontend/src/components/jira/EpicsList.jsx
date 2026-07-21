import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, GripVertical } from 'lucide-react'

const C = {
  blue: '#0052CC', text: '#172B4D', muted: '#5E6C84', border: '#DFE1E6',
}

export default function EpicsList({ epics, onCreateEpic }) {
  const [expanded, setExpanded] = useState({})

  return (
    <div style={{
      width: 280, background: '#fff', borderRight: '1px solid #DFE1E6',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid #DFE1E6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Epics</span>
        <button onClick={onCreateEpic}
          style={{
            width: 24, height: 24, borderRadius: 4, border: 'none',
            background: 'transparent', color: C.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {epics.length === 0 && (
          <div style={{ padding: '20px 14px', textAlign: 'center', color: C.muted, fontSize: 12 }}>
            No epics yet
          </div>
        )}
        {epics.map(epic => (
          <EpicRow key={epic.id} epic={epic}
            expanded={!!expanded[epic.id]}
            onToggle={() => setExpanded({ ...expanded, [epic.id]: !expanded[epic.id] })}
          />
        ))}
      </div>
    </div>
  )
}

function EpicRow({ epic, expanded, onToggle }) {
  const p = epic.progress
  const total = (p?.done || 0) + (p?.in_progress || 0) + (p?.todo || 0)

  return (
    <div style={{ borderBottom: '1px solid #F0F0F0' }}>
      {/* Epic header */}
      <div onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          cursor: 'pointer', userSelect: 'none',
        }}>
        <button onClick={e => { e.stopPropagation(); onToggle() }}
          style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: epic.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{epic.name}</span>
        {total > 0 && <span style={{ fontSize: 11, color: C.muted }}>{epic.issue_count}</span>}
      </div>

      {/* Progress bar */}
      <div style={{ margin: '0 14px 6px 40px', height: 4, borderRadius: 2, background: '#EAECF0', overflow: 'hidden', display: 'flex' }}>
        {p?.done > 0 && <div style={{ width: `${p.done}%`, background: '#36B37E' }} />}
        {p?.in_progress > 0 && <div style={{ width: `${p.in_progress}%`, background: '#0052CC' }} />}
        {p?.todo > 0 && <div style={{ width: `${p.todo}%`, background: '#DFE1E6' }} />}
      </div>

      {/* Expanded status counts */}
      {expanded && (
        <div style={{ padding: '4px 14px 8px 40px', display: 'flex', gap: 12, fontSize: 11 }}>
          <span style={{ color: '#36B37E' }}>{p?.done || 0} done</span>
          <span style={{ color: C.blue }}>{p?.in_progress || 0} in progress</span>
          <span style={{ color: C.muted }}>{p?.todo || 0} todo</span>
        </div>
      )}
    </div>
  )
}
