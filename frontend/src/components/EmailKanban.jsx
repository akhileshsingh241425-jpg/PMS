import { useState, useEffect, useCallback } from 'react'
import { C } from './styleConstants'
import { getKanban } from '../api/emailApi'
import { TableSkeleton } from './LoadingSkeleton'

const STATUSES = ['New', 'Assigned', 'Working', 'Waiting Customer', 'Completed', 'Closed']
const STATUS_COLORS = { New: '#6D28D9', Assigned: '#3B82F6', Working: '#F59E0B', 'Waiting Customer': '#EC4899', Completed: '#10B981', Closed: '#94A3B8' }

export default function EmailKanban({ onSelect, selectedId }) {
  const [columns, setColumns] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await getKanban(); setColumns(r.columns || {}) } catch (e) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <TableSkeleton rows={6} cols={6} />

  const keys = Object.keys(columns)
  if (keys.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: C.secondary, fontSize: 14 }}>No emails to show</div>

  return (
    <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12, overflow: 'auto', minHeight: 'calc(100vh - 300px)' }}>
      {keys.map(key => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const items = columns[key] || []
        return (
          <div key={key} style={{ minWidth: 240, maxWidth: 280, flex: 1, background: '#F8FAFC', borderRadius: 12, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 300px)' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[label] || '#94A3B8' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.secondary, background: '#E2E8F0', padding: '0 8px', borderRadius: 8 }}>{items.length}</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
              {items.map(msg => (
                <div key={msg.id} onClick={() => onSelect(msg)}
                  style={{
                    padding: '10px 12px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                    background: selectedId === msg.id ? '#EEF2FF' : '#fff',
                    border: `1px solid ${selectedId === msg.id ? C.blue : C.border}`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.1s',
                  }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.subject || '(no subject)'}
                  </div>
                  <div style={{ fontSize: 11, color: C.secondary, marginBottom: 3 }}>
                    {msg.sender_name || msg.sender_email}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {msg.priority && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 6, background: msg.priority === 'Urgent' ? '#FEE2E2' : msg.priority === 'High' ? '#FEF3C7' : msg.priority === 'Low' ? '#F1F5F9' : '#DBEAFE', color: msg.priority === 'Urgent' ? '#DC2626' : msg.priority === 'High' ? '#D97706' : msg.priority === 'Low' ? '#64748B' : '#2563EB' }}>
                        {msg.priority}
                      </span>
                    )}
                    {msg.category && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 6, background: '#F3E8FF', color: '#6D28D9' }}>
                        {msg.category}
                      </span>
                    )}
                    {msg.assigned_to_name && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 6, background: '#DEEBFF', color: '#2563EB' }}>
                        {msg.assigned_to_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
