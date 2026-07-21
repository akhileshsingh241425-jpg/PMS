const C = {
  primary: '#5B21B6', primaryLight: '#F5F3FF', primaryDark: '#4C1D95',
  border: '#E5E7EB', muted: '#9CA3AF', secondary: '#6B7280', text: '#1F2937',
  success: '#059669', warning: '#D97706'
}

export default function MilestonesSection({ milestones, mstoneForm, setMstoneForm, onAddMilestone, onMarkDone }) {
  const sorted = [...milestones].sort((a, b) => {
    if (a.status === 'Completed' && b.status !== 'Completed') return 1
    if (a.status !== 'Completed' && b.status === 'Completed') return -1
    return (a.due_date || '') < (b.due_date || '') ? -1 : 1
  })

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Milestones</span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#fff',
            background: '#D97706', padding: '2px 10px', borderRadius: 20, lineHeight: '20px'
          }}>{milestones.length}</span>
        </div>
        <button onClick={() => setMstoneForm(mstoneForm ? null : { title: '', due_date: '', description: '' })}
          style={{
            border: mstoneForm ? '1.5px solid #E5E7EB' : 'none',
            background: mstoneForm ? '#fff' : 'linear-gradient(135deg, #D97706, #B45309)',
            cursor: 'pointer',
            color: mstoneForm ? '#6B7280' : '#fff',
            fontSize: 13, fontWeight: 700, padding: '10px 20px',
            borderRadius: 10, transition: 'all 0.15s',
            boxShadow: mstoneForm ? 'none' : '0 2px 6px rgba(217,119,6,0.25)',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
          {mstoneForm ? null : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>}
          {mstoneForm ? 'Cancel' : 'Add Milestone'}
        </button>
      </div>

      {/* Add form */}
      {mstoneForm && (
        <div style={{
          display: 'flex', gap: 12, marginBottom: 24, padding: 24,
          background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
          borderRadius: 14, border: '1px solid #FDE68A', flexWrap: 'wrap', alignItems: 'center'
        }}>
          <input value={mstoneForm.title} onChange={e => setMstoneForm({...mstoneForm, title: e.target.value})} placeholder="Milestone title"
            style={{
              flex: '1 1 240px', padding: '12px 16px', border: '1.5px solid #FDE68A',
              borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff'
            }}
            onFocus={e => e.target.style.borderColor = '#D97706'}
            onBlur={e => e.target.style.borderColor = '#FDE68A'} />
          <input type="date" value={mstoneForm.due_date} onChange={e => setMstoneForm({...mstoneForm, due_date: e.target.value})}
            style={{
              padding: '12px 16px', border: '1.5px solid #FDE68A', borderRadius: 10,
              fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff'
            }} />
          <button onClick={onAddMilestone} style={{
            padding: '12px 24px', border: 'none', borderRadius: 10,
            background: 'linear-gradient(135deg, #D97706, #B45309)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(217,119,6,0.25)', transition: 'all 0.15s'
          }}>Add Milestone</button>
        </div>
      )}

      {/* List or empty */}
      {milestones.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '56px 20px', color: C.muted
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 14px', display: 'block' }}>
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.secondary, marginBottom: 6 }}>No milestones yet</div>
          <div style={{ fontSize: 13, marginBottom: 14 }}>Add your first milestone to track key project dates.</div>
          <button onClick={() => setMstoneForm({ title: '', due_date: '', description: '' })}
            style={{
              border: '1.5px dashed #D1D5DB', background: 'none',
              color: '#D97706', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', padding: '10px 24px', borderRadius: 10,
              transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add your first milestone
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: 19, top: 8, bottom: 8,
            width: 2, background: 'linear-gradient(180deg, #D97706, #FDE68A)',
            borderRadius: 1
          }} />
          <div style={{ display: 'grid', gap: 8 }}>
            {sorted.map(m => {
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
                  {/* Timeline dot */}
                  <div style={{
                    width: 16, height: 16, minWidth: 16, borderRadius: '50%',
                    background: isDone ? '#059669' : '#D97706',
                    border: `3px solid ${isDone ? '#BBF7D0' : '#FDE68A'}`,
                    boxShadow: isDone ? '0 0 0 2px #D1FAE5' : '0 0 0 2px #FEF3C7',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 16, fontWeight: 600,
                      color: isDone ? '#065F46' : C.text,
                      textDecoration: isDone ? 'line-through' : 'none'
                    }}>{m.title}</div>
                    <div style={{
                      fontSize: 13, color: isDone ? '#6B7280' : C.muted, marginTop: 4,
                      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap'
                    }}>
                      {m.due_date && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {new Date(m.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {m.description && (
                        <span style={{ color: '#9CA3AF' }}>· {m.description}</span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                    background: isDone ? '#D1FAE5' : '#FEF3C7',
                    color: isDone ? '#065F46' : '#92400E',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: isDone ? '#059669' : '#D97706'
                    }} />
                    {m.status}
                  </span>
                  {!isDone && (
                    <button onClick={() => onMarkDone(m.id)}
                      style={{
                        fontSize: 13, fontWeight: 700,
                        padding: '8px 20px', borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg, #059669, #10B981)',
                        color: '#fff', cursor: 'pointer',
                        whiteSpace: 'nowrap', transition: 'all 0.15s',
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
      )}
    </div>
  )
}
