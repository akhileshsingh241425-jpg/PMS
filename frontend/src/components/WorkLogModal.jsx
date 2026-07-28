import { useState, useEffect } from 'react'
import api from '../services/api'

export default function WorkLogModal({ dates, onComplete, onSkip }) {
  const [logs, setLogs] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!dates || dates.length === 0) return
    const init = {}
    dates.forEach(d => { init[d] = '' })
    setLogs(init)
    dates.forEach(async (d) => {
      try {
        const res = await api.get(`/api/work-log?date=${d}`)
        if (res.data.log) {
          setLogs(prev => ({ ...prev, [d]: res.data.log.description }))
        }
      } catch (_) {}
    })
  }, [dates])

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (dt.toDateString() === today.toDateString()) return 'Today'
    if (dt.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleSubmit = async () => {
    setSaving(true); setError('')
    try {
      for (const [d, desc] of Object.entries(logs)) {
        if (!desc.trim()) {
          setError(`Please fill description for ${formatDate(d)}`)
          setSaving(false); return
        }
        await api.post('/api/work-log', { date: d, description: desc })
      }
      onComplete()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  if (!dates || dates.length === 0) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480,
        padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#1e293b' }}>
          Daily Work Log
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
          Please describe what you worked on
        </p>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {dates.map(d => (
          <div key={d} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              {formatDate(d)}
            </label>
            <textarea
              value={logs[d] || ''}
              onChange={e => setLogs(prev => ({ ...prev, [d]: e.target.value }))}
              placeholder="What did you work on? (e.g., Completed API integration, Client meeting, Bug fixes)"
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box'
              }}
              autoFocus={dates.indexOf(d) === 0}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {dates.length > 0 && (
            <button onClick={onSkip}
              style={{
                padding: '8px 20px', border: '1px solid #d1d5db', background: '#fff',
                borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#64748b'
              }}>
              Skip for now
            </button>
          )}
          <button onClick={handleSubmit} disabled={saving}
            style={{
              padding: '8px 20px', border: 'none', background: '#5B21B6',
              borderRadius: 8, fontSize: 13, color: '#fff', cursor: 'pointer',
              fontWeight: 600, opacity: saving ? 0.6 : 1
            }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
