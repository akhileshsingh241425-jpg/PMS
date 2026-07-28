import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'

export default function DailyWorkLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formDate, setFormDate] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/work-log')
      setLogs(res.data.logs || [])
    } catch (_) {}
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const openAdd = () => {
    setEditId(null)
    setFormDate(today)
    setFormDesc('')
    setShowAdd(true)
  }

  const openEdit = (log) => {
    setEditId(log.id)
    setFormDate(log.date)
    setFormDesc(log.description)
    setShowAdd(true)
  }

  const handleSave = async () => {
    if (!formDesc.trim()) { toast('Please enter description', 'error'); return }
    setSaving(true)
    try {
      await api.post('/api/work-log', { date: formDate, description: formDesc })
      toast('Saved')
      setShowAdd(false)
      load()
    } catch (e) {
      toast(e.response?.data?.error || 'Failed to save', 'error')
    } finally { setSaving(false) }
  }

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Daily Work Log</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>Record what you worked on each day</p>
        </div>
        <button onClick={openAdd}
          style={{ padding: '8px 20px', background: '#5B21B6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Today
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>
              {editId ? 'Edit Work Log' : 'Add Work Log'}
            </h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} max={today}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>What did you work on?</label>
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4}
                placeholder="Describe your work (meetings, tasks completed, etc.)"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)}
                style={{ padding: '8px 20px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '8px 20px', border: 'none', background: '#5B21B6', borderRadius: 8, fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40, fontSize: 13 }}>Loading...</p>
      ) : logs.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40, fontSize: 13, fontStyle: 'italic' }}>
          No work logs yet. Click "Add Today" to start.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map(log => (
            <div key={log.id} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#5B21B6', margin: '0 0 4px' }}>
                    {formatDate(log.date)}
                  </p>
                  <p style={{ fontSize: 13, color: '#334155', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {log.description}
                  </p>
                </div>
                <button onClick={() => openEdit(log)}
                  style={{ padding: '4px 10px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: '#64748b', marginLeft: 12, whiteSpace: 'nowrap' }}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
