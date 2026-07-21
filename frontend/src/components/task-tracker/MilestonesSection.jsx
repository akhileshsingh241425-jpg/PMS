const C = { primary: '#5B21B6', border: '#E5E7EB', muted: '#9CA3AF', secondary: '#6B7280' }

export default function MilestonesSection({ milestones, mstoneForm, setMstoneForm, onAddMilestone, onMarkDone }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#374151' }}>Milestones ({milestones.length})</span>
        <button onClick={() => setMstoneForm(mstoneForm ? null : { title: '', due_date: '', description: '' })}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.primary, fontSize: 14, fontWeight: 700 }}>
          {mstoneForm ? 'Cancel' : '+ Add Milestone'}
        </button>
      </div>

      {mstoneForm && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, padding: 20, background: '#F8F9FC', borderRadius: 12, flexWrap: 'wrap' }}>
          <input value={mstoneForm.title} onChange={e => setMstoneForm({...mstoneForm, title: e.target.value})} placeholder="Milestone title"
            style={{ flex: '1 1 240px', padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <input type="date" value={mstoneForm.due_date} onChange={e => setMstoneForm({...mstoneForm, due_date: e.target.value})}
            style={{ padding: '12px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={onAddMilestone} style={{ padding: '12px 24px', border: 'none', borderRadius: 8, background: C.primary, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add</button>
        </div>
      )}

      {milestones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }}>
            <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No milestones yet</div>
          <button onClick={() => setMstoneForm({ title: '', due_date: '', description: '' })}
            style={{ border: 'none', background: 'transparent', color: C.primary, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            + Add your first milestone
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {milestones.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 12, background: '#F9FAFB', border: `1px solid ${C.border}` }}>
              <div style={{ width: 14, height: 14, minWidth: 14, borderRadius: '50%', background: m.status === 'Completed' ? '#059669' : '#D97706' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>{m.title}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
                  {m.due_date ? new Date(m.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date'}
                  {m.description ? ` · ${m.description}` : ''}
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                background: m.status === 'Completed' ? '#D1FAE5' : '#FEF3C7',
                color: m.status === 'Completed' ? '#065F46' : '#92400E', whiteSpace: 'nowrap' }}>
                {m.status}
              </span>
              {m.status !== 'Completed' && (
                <button onClick={() => onMarkDone(m.id)}
                  style={{ fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Mark Done
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
