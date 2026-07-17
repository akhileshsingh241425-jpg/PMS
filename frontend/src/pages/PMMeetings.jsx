import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Calendar } from 'lucide-react'

const STATUS_STYLES = {
  'Scheduled': { bg: '#DBEAFE', text: '#1E40AF' },
  'Requested': { bg: '#FEF3C7', text: '#92400E' },
  'Confirmed': { bg: '#D1FAE5', text: '#065F46' },
  'Rescheduled': { bg: '#FEF3C7', text: '#92400E' },
  'Ongoing': { bg: '#DBEAFE', text: '#1E40AF' },
  'Completed': { bg: '#D1FAE5', text: '#065F46' },
  'Cancelled': { bg: '#FEE2E2', text: '#991B1B' },
}

const formatDT = (ds) => {
  if (!ds) return '—'
  const d = new Date(ds)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PMMeetings() {
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState([])
  const [meetingRequests, setMeetingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/pm/meetings')
      .then(r => {
        setMeetings(r.data.meetings || [])
        setMeetingRequests(r.data.meeting_requests || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allMeetings = [
    ...meetings.map(m => ({ ...m, _type: 'meeting' })),
    ...meetingRequests.map(mr => ({ ...mr, _type: 'request', title: mr.agenda || 'Meeting Request', meeting_date: mr.preferred_date || mr.confirmed_date })),
  ].sort((a, b) => new Date(b.meeting_date || b.created_at) - new Date(a.meeting_date || a.created_at))

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 24px' }}>Meetings ({allMeetings.length})</h1>

      {allMeetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF' }}>
          <Calendar className="w-16 h-16" style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
          <p style={{ fontSize: 15, margin: 0 }}>No meetings scheduled</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allMeetings.map(m => {
            const isReq = m._type === 'request'
            const s = STATUS_STYLES[m.status] || { bg: '#F3F4F6', text: '#6B7280' }
            return (
              <div key={`${m._type}-${m.id}`} onClick={() => navigate(`/meetings?id=${m.id}&type=${m._type}`)}
                style={{
                  background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '14px 18px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.12s',
                }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: isReq ? '#FEF3C7' : '#EEF2FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar className="w-4 h-4" style={{ color: isReq ? '#D97706' : '#4F46E5' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{m.title}</span>
                    {isReq && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', textTransform: 'uppercase' }}>Request</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{formatDT(m.meeting_date)}</div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.text }}>{m.status}</span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
