import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import {
  Calendar, FileText, Clock, User, ExternalLink,
  Edit3, MessageSquare, Paperclip, Activity, Users,
  Upload, Download, Trash2, X, ChevronLeft,
  CheckCircle, RefreshCw, XCircle, Send, Plus,
  File, Image, Archive, AlertCircle
} from 'lucide-react'

const STATUS_STYLES = {
  'Scheduled': { bg: '#DBEAFE', text: '#1E40AF' },
  'Requested': { bg: '#FEF3C7', text: '#92400E' },
  'Confirmed': { bg: '#D1FAE5', text: '#065F46' },
  'Rescheduled': { bg: '#FEF3C7', text: '#92400E' },
  'Ongoing': { bg: '#DBEAFE', text: '#1E40AF' },
  'Completed': { bg: '#D1FAE5', text: '#065F46' },
  'Cancelled': { bg: '#FEE2E2', text: '#991B1B' },
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: FileText },
  { key: 'notes', label: 'Notes', icon: Edit3 },
  { key: 'documents', label: 'Documents', icon: Paperclip },
  { key: 'timeline', label: 'Timeline', icon: Activity },
  { key: 'team', label: 'Team', icon: Users },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const formatDT = (ds) => {
  if (!ds) return '—'
  const d = new Date(ds)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function MeetingDetailView({ meetingId, meetingType = 'meeting', onBack, onRefresh }) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState(null)

  // Notes
  const [meetingNotes, setMeetingNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)

  // Documents
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  // Timeline
  const [activities, setActivities] = useState([])

  // Team
  const [shares, setShares] = useState([])
  const [showShareForm, setShowShareForm] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])

  // Meeting Request specific
  const [responding, setResponding] = useState(false)
  const [respondForm, setRespondForm] = useState({ status: 'Confirmed', confirmed_date: '', meeting_link: '', team_remarks: '' })

  const isMR = meetingType === 'request'
  const baseAPI = isMR ? '/api/meeting-requests' : '/api/meetings'
  const baseDocs = `${baseAPI}/${meetingId}/documents`

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get(`${baseAPI}/${meetingId}`)
      const data = r.data.meeting_request || r.data.meeting || r.data
      setItem(data)
      setMeetingNotes(data.meeting_notes || '')
      setEditingNotes(false)
      if (isMR) {
        setRespondForm({
          status: data.status === 'Confirmed' ? 'Confirmed' : 'Confirmed',
          confirmed_date: data.confirmed_date ? data.confirmed_date.slice(0, 16) : '',
          meeting_link: data.meeting_link || '',
          team_remarks: data.team_remarks || '',
        })
      }
    } catch(e) { setError('Failed to load meeting') }
    finally { setLoading(false) }
  }

  const loadDocs = async () => {
    try { const r = await api.get(baseDocs); setDocs(r.data.documents) }
    catch(e) {}
  }

  const loadActivities = async () => {
    try { const r = await api.get(`${baseAPI}/${meetingId}/activities`); setActivities(r.data.activities) }
    catch(e) {}
  }

  const loadShares = async () => {
    try { const r = await api.get(`${baseAPI}/${meetingId}/share`); setShares(r.data.shares) }
    catch(e) {}
  }

  const loadUsers = async () => {
    try { const r = await api.get('/api/users?role=user,admin'); setAllUsers(r.data.users || []) }
    catch(e) {}
  }

  useEffect(() => { load(); loadDocs(); loadActivities(); loadShares(); loadUsers() }, [meetingId])

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const body = isMR ? { status: item.status, meeting_notes: meetingNotes } : { meeting_notes: meetingNotes }
      const url = isMR ? `${baseAPI}/${meetingId}/respond` : `${baseAPI}/${meetingId}`
      const r = await api.put(url, body)
      setItem(r.data.meeting_request || r.data.meeting)
      setEditingNotes(false)
      loadActivities()
    } catch(e) { alert('Failed to save notes') }
    finally { setSavingNotes(false) }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      await api.post(baseDocs, fd)
      loadDocs(); loadActivities()
    } catch(e) { alert(e.response?.data?.error || 'Upload failed') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const deleteDoc = async (doc) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return
    try {
      const docId = isMR ? doc.meeting_request_id : doc.meeting_id
      await api.delete(`${baseAPI}/${meetingId}/documents/${doc.id}`)
      loadDocs(); loadActivities()
    } catch(e) { alert('Delete failed') }
  }

  const updateStatus = async (status) => {
    try {
      if (isMR) {
        const r = await api.put(`${baseAPI}/${meetingId}/respond`, { status, confirmed_date: item.confirmed_date, meeting_link: item.meeting_link })
        setItem(r.data.meeting_request)
      } else {
        const r = await api.put(`${baseAPI}/${meetingId}`, { status })
        setItem(r.data.meeting)
      }
      loadActivities()
    } catch(e) { alert('Failed to update status') }
  }

  const respondToRequest = async () => {
    if (respondForm.status === 'Rescheduled' && !respondForm.confirmed_date) return alert('New date is required for reschedule')
    setResponding(true)
    try {
      const r = await api.put(`${baseAPI}/${meetingId}/respond`, {
        status: respondForm.status,
        confirmed_date: respondForm.status === 'Confirmed' ? (respondForm.confirmed_date || item.preferred_date) : (respondForm.confirmed_date || null),
        meeting_link: respondForm.meeting_link || null,
        team_remarks: respondForm.team_remarks || null,
      })
      setItem(r.data.meeting_request)
      setRespondForm({ status: 'Confirmed', confirmed_date: '', meeting_link: '', team_remarks: '' })
      loadActivities()
    } catch(e) { alert(e.response?.data?.error || 'Failed to respond') }
    finally { setResponding(false) }
  }

  const rescheduleRequest = async () => {
    if (!respondForm.confirmed_date) return alert('New date is required')
    setResponding(true)
    try {
      const r = await api.put(`${baseAPI}/${meetingId}/respond`, {
        status: 'Rescheduled',
        confirmed_date: respondForm.confirmed_date,
        meeting_link: respondForm.meeting_link || null,
        team_remarks: respondForm.team_remarks || null,
      })
      setItem(r.data.meeting_request)
      setRespondForm({ status: 'Confirmed', confirmed_date: '', meeting_link: '', team_remarks: '' })
      loadActivities()
    } catch(e) { alert(e.response?.data?.error || 'Failed to reschedule') }
    finally { setResponding(false) }
  }

  const shareWithUsers = async () => {
    if (!selectedUsers.length) return
    try {
      await api.post(`${baseAPI}/${meetingId}/share`, { user_ids: selectedUsers })
      setSelectedUsers([]); setShowShareForm(false)
      loadShares(); loadActivities()
    } catch(e) { alert('Share failed') }
  }

  const removeShare = async (uid) => {
    try { await api.delete(`${baseAPI}/${meetingId}/share/${uid}`); loadShares(); loadActivities() }
    catch(e) { alert('Failed to remove') }
  }

  const getFileIcon = (type) => {
    if (['jpg','jpeg','png','gif','webp'].includes(type)) return Image
    if (['zip','rar','7z'].includes(type)) return Archive
    return File
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <p style={{ fontSize: 14, color: '#94A3B8' }}>Loading meeting...</p>
    </div>
  )
  if (error) return <p style={{ textAlign: 'center', padding: 40, color: '#DC2626' }}>{error}</p>
  if (!item) return <p style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Meeting not found</p>

  const sStyle = STATUS_STYLES[item.status] || { bg: '#F3F4F6', text: '#6B7280' }
  const title = isMR ? item.agenda : item.title
  const dateField = isMR ? item.preferred_date : item.meeting_date
  const createdByName = isMR ? item.requested_by_name : item.created_by_name
  const desc = isMR ? null : item.description

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{isMR ? 'Preferred Date' : 'Date & Time'}</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{formatDT(dateField)}</p>
        </div>
        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Status</p>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: 12, fontWeight: 600, background: sStyle.bg, color: sStyle.text }}>{item.status}</span>
        </div>
        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{isMR ? 'Requested By' : 'Created By'}</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{createdByName || '—'}</p>
        </div>
        {isMR && item.confirmed_date && (
          <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
            <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Confirmed Date</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{formatDT(item.confirmed_date)}</p>
          </div>
        )}
        {!isMR && (
          <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
            <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Location</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{item.location || '—'}</p>
          </div>
        )}
      </div>

      {isMR && item.team_remarks && (
        <div style={{ padding: '14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px' }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Team Remarks</p>
          <p style={{ fontSize: 13, color: '#9A3412', margin: 0 }}>{item.team_remarks}</p>
        </div>
      )}

      {/* Meeting Link */}
      {item.meeting_link ? (
        <div style={{ padding: '14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ExternalLink className="w-4 h-4" style={{ color: '#4F46E5', flexShrink: 0 }} />
          <a href={item.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4338CA', fontWeight: 500, textDecoration: 'none', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.meeting_link}</a>
        </div>
      ) : (
        <div style={{ padding: '14px', background: '#F8FAFC', border: '1px dashed #D1D5DB', borderRadius: '10px', color: '#9CA3AF', fontSize: 13 }}>
          {isMR && item.status === 'Requested' ? 'Client did not provide a meeting link' : 'No meeting link added'}
        </div>
      )}

      {/* Description (admin meetings only) */}
      {desc && (
        <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Description</p>
          <p style={{ fontSize: 13, color: '#1F2937', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{desc}</p>
        </div>
      )}

      {/* Action buttons - Admin Meeting */}
      {!isMR && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {item.meeting_link && (
            <a href={item.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ExternalLink className="w-4 h-4" /> Join Meeting
            </a>
          )}
          {item.status !== 'Completed' && item.status !== 'Cancelled' && (
            <>
              {item.status === 'Scheduled' && (
                <button onClick={() => updateStatus('Ongoing')} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw className="w-4 h-4" /> Start Meeting
                </button>
              )}
              <button onClick={() => updateStatus('Completed')} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#1E40AF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle className="w-4 h-4" /> Mark Completed
              </button>
              <button onClick={() => updateStatus('Cancelled')} style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid #FCA5A5', background: '#fff', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* Action buttons - Meeting Request */}
      {isMR && item.meeting_link && (
        <a href={item.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
          <ExternalLink className="w-4 h-4" /> Join Meeting
        </a>
      )}

      {/* Respond Form (MR) */}
      {isMR && ['Requested', 'Rescheduled'].includes(item.status) && (
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '18px' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: '0 0 14px' }}>Respond to Request</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Action *</label>
              <select value={respondForm.status} onChange={e => setRespondForm({ ...respondForm, status: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: 13, outline: 'none' }}>
                <option value="Confirmed">Confirm</option>
                <option value="Rescheduled">Reschedule</option>
                <option value="Cancelled">Cancel</option>
              </select>
            </div>
            {respondForm.status === 'Rescheduled' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>New Date *</label>
                <input type="datetime-local" value={respondForm.confirmed_date} onChange={e => setRespondForm({ ...respondForm, confirmed_date: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Meeting Link</label>
              <input type="url" value={respondForm.meeting_link} onChange={e => setRespondForm({ ...respondForm, meeting_link: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                placeholder="Google Meet / Zoom link" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Team Remarks</label>
              <textarea value={respondForm.team_remarks} onChange={e => setRespondForm({ ...respondForm, team_remarks: e.target.value })} rows={2}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="Optional notes for the client..." />
            </div>
            <button onClick={respondToRequest} disabled={responding}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: responding ? 0.6 : 1, alignSelf: 'flex-start' }}>
              {responding ? 'Saving...' : 'Submit Response'}
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Form (MR Confirmed) */}
      {isMR && item.status === 'Confirmed' && (
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '18px' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: '0 0 14px' }}>Reschedule Meeting</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>New Date *</label>
              <input type="datetime-local" value={respondForm.confirmed_date} onChange={e => setRespondForm({ ...respondForm, confirmed_date: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Meeting Link</label>
              <input type="url" value={respondForm.meeting_link} onChange={e => setRespondForm({ ...respondForm, meeting_link: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                placeholder="Google Meet / Zoom link" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Team Remarks</label>
              <textarea value={respondForm.team_remarks} onChange={e => setRespondForm({ ...respondForm, team_remarks: e.target.value })} rows={2}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="Optional notes for the client..." />
            </div>
            <button onClick={rescheduleRequest} disabled={responding}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: responding ? 0.6 : 1, alignSelf: 'flex-start' }}>
              {responding ? 'Saving...' : 'Reschedule'}
            </button>
          </div>
        </div>
      )}

      {/* Shared Members */}
      {shares.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>Shared Team Members ({shares.length})</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {shares.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: 12, fontWeight: 500, color: '#166534' }}>
                <User className="w-3 h-3" />
                {s.user_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderNotes = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: 0 }}>Meeting Notes</h4>
        {item.meeting_notes && !editingNotes && (
          <button onClick={() => { setEditingNotes(true); setMeetingNotes(item.meeting_notes) }} style={{ background: 'none', border: 'none', color: '#5B3DF5', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>
      {editingNotes || !item.meeting_notes ? (
        <>
          <textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} rows={8}
            style={{ width: '100%', padding: '14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }}
            placeholder="Write meeting notes here...&#10;&#10;Discussion points:&#10;- Key topics covered&#10;- Decisions made&#10;&#10;Action items:&#10;- [ ] Task description&#10;- [ ] Assignee + deadline&#10;&#10;Next steps:&#10;1. &#10;2. &#10;" />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={saveNotes} disabled={savingNotes} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: savingNotes ? 0.6 : 1 }}>
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
            {item.meeting_notes && (
              <button onClick={() => { setEditingNotes(false); setMeetingNotes(item.meeting_notes) }} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: '20px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px' }}>
          <p style={{ fontSize: 14, color: '#92400E', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{item.meeting_notes}</p>
        </div>
      )}
    </div>
  )

  const renderDocuments = () => (
    <div>
      <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #D1D5DB', borderRadius: '12px', padding: '24px', textAlign: 'center', background: '#FAFAFA', cursor: 'pointer', marginBottom: '16px' }}
        onMouseOver={e => e.currentTarget.style.borderColor = '#5B3DF5'}
        onMouseOut={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
        <Upload className="w-8 h-8" style={{ color: '#9CA3AF', margin: '0 auto 6px' }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: '#6B7280', margin: 0 }}>{uploading ? 'Uploading...' : 'Click to upload or drag & drop'}</p>
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, ZIP</p>
        <input ref={fileRef} type="file" onChange={handleUpload} hidden />
      </div>
      {docs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {docs.map(d => {
            const Icon = getFileIcon(d.file_type)
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                <Icon className="w-5 h-5" style={{ color: '#5B3DF5', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file_name}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{d.uploaded_by_name || '—'} · {d.uploaded_at ? timeAgo(d.uploaded_at) : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <a href={`${baseDocs}/${d.id}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px', borderRadius: '6px', color: '#6B7280', textDecoration: 'none' }}>
                    <Download className="w-4 h-4" />
                  </a>
                  <button onClick={() => deleteDoc(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: '#DC2626' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: 13 }}>
          <Paperclip className="w-10 h-10" style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ margin: 0 }}>No documents uploaded</p>
        </div>
      )}
    </div>
  )

  const renderTimeline = () => (
    <div>
      {activities.length > 0 ? (
        <div style={{ position: 'relative' }}>
          {activities.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: '14px', paddingBottom: i < activities.length - 1 ? '20px' : 0, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#5B3DF5', border: '2px solid #DDD6FE', zIndex: 1 }} />
                {i < activities.length - 1 && <div style={{ width: 2, flex: 1, background: '#E2E8F0', margin: '2px 0' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{a.user_name || 'System'}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(a.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: 13 }}>
          <Activity className="w-10 h-10" style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ margin: 0 }}>No activity yet</p>
        </div>
      )}
    </div>
  )

  const renderTeam = () => (
    <div>
      {!showShareForm ? (
        <button onClick={() => { setShowShareForm(true); loadUsers() }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px dashed #5B3DF5', background: '#F5F3FF', color: '#5B3DF5', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <Plus className="w-4 h-4" /> Share with Team
        </button>
      ) : (
        <div style={{ marginBottom: '16px', padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', margin: '0 0 10px' }}>Select team members to share with:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
            {allUsers.filter(u => u.id !== (item.created_by || item.requested_by)).map(u => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => { setSelectedUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]) }} style={{ accentColor: '#5B3DF5' }} />
                <User className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                {u.full_name}
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{u.designation || ''}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={shareWithUsers} disabled={!selectedUsers.length} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: selectedUsers.length ? 1 : 0.5 }}>
              <Send className="w-3.5 h-3.5" style={{ marginRight: 4 }} /> Share ({selectedUsers.length})
            </button>
            <button onClick={() => { setShowShareForm(false); setSelectedUsers([]) }} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      {shares.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Shared Members ({shares.length})</p>
          {shares.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User className="w-4 h-4" style={{ color: '#166534' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#065F46', margin: 0 }}>{s.user_name}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{s.user_designation || 'Team Member'}</p>
              </div>
              <button onClick={() => removeShare(s.user_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#DC2626' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: 13 }}>
          <Users className="w-10 h-10" style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ margin: 0 }}>No team members shared</p>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: 13, fontWeight: 500, padding: 0 }}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {onRefresh && (
            <button onClick={onRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar className="w-5 h-5" style={{ color: '#4F46E5' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>{formatDT(dateField)}</p>
          </div>
          <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '6px', fontSize: 11, fontWeight: 600, background: sStyle.bg, color: sStyle.text, whiteSpace: 'nowrap' }}>{item.status}</span>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', overflowX: 'auto' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 18px',
              border: 'none', borderBottom: active ? '2px solid #5B3DF5' : '2px solid transparent',
              background: active ? '#fff' : 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#5B3DF5' : '#64748B',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '24px', maxHeight: '520px', overflowY: 'auto' }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'notes' && renderNotes()}
        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'team' && renderTeam()}
      </div>
    </div>
  )
}