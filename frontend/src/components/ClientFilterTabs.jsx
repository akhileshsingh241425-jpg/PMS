import { C } from './styleConstants'

const btnBase = {
  padding: '4px 12px',
  borderRadius: 20,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: C.font,
  fontSize: 12,
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
}

export default function ClientFilterTabs({ summary, activeFilter, onFilterChange }) {
  const items = [
    { key: '', label: 'All clients', count: summary.total },
    { key: 'active', label: 'Active', count: summary.active },
    { key: 'main', label: 'Main', count: summary.main },
    { key: 'sub', label: 'Sub', count: summary.sub },
  ]

  return (
    <div style={{ padding: '10px 24px 4px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map(item => {
        const isActive = activeFilter === item.key
        return (
          <button
            key={item.key}
            onClick={() => onFilterChange(item.key)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: isActive ? `1.5px solid ${C.blue}` : '1.5px solid transparent',
              background: isActive ? '#EFF6FF' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: C.font,
              fontSize: 12,
              color: isActive ? C.blue : C.secondary,
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 12 }}>{item.count}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
