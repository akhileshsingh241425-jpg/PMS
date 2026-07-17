import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  Calendar, FileText, Clock, User, ExternalLink,
  Edit3, MessageSquare, Paperclip, Activity, Users,
  Upload, Download, Trash2, X, ChevronLeft,
  CheckCircle, RefreshCw, XCircle, Send, Plus,
  File, Image, Archive, AlertCircle, MoreHorizontal,
  Copy, Link, MapPin, Tag, Briefcase, Building2,
  Star, Clock3, ArrowLeft, Maximize2, Minimize2,
  ChevronRight, ChevronDown, Reply, AtSign, Smile,
  Bold, Italic, Underline, List, ListOrdered, Code,
  Heading1, Heading2, Table, ImageIcon, Link2,
  CheckSquare, CalendarDays, Bell, Share2,
  Globe, Phone, Video, AlignLeft, Grid3X3
} from 'lucide-react'

const STATUS_STYLES = {
  'Scheduled': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Requested': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  'Confirmed': { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  'Rescheduled': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  'Ongoing': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Completed': { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  'Cancelled': { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: AlignLeft },
  { key: 'notes', label: 'Notes', icon: Edit3 },
  { key: 'documents', label: 'Documents', icon: Paperclip },
  { key: 'timeline', label: 'Timeline', icon: Activity },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'comments', label: 'Comments', icon: MessageSquare },
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

const formatDate = (ds) => {
  if (!ds) return '—'
  const d = new Date(ds)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (ds) => {
  if (!ds) return '—'
  const d = new Date(ds)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function RichTextToolbar({ editorRef }) {
  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 2, padding: '8px 12px',
      borderBottom: '1px solid #E5E7EB', background: '#F9FAFB',
      borderTopLeftRadius: 10, borderTopRightRadius: 10,
    }}>
      {[
        { icon: Bold, cmd: 'bold', title: 'Bold' },
        { icon: Italic, cmd: 'italic', title: 'Italic' },
        { icon: Underline, cmd: 'underline', title: 'Underline' },
        { icon: Heading1, cmd: 'formatBlock', val: '<h2>', title: 'Heading 1' },
        { icon: Heading2, cmd: 'formatBlock', val: '<h3>', title: 'Heading 2' },
        { icon: List, cmd: 'insertUnorderedList', title: 'Bullet List' },
        { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Numbered List' },
        { icon: Code, cmd: 'formatBlock', val: '<pre>', title: 'Code Block' },
        { icon: Link2, cmd: 'createLink', val: prompt('Enter URL:') || undefined, title: 'Link' },
      ].map((btn, i) => (
        <button key={i} onClick={() => exec(btn.cmd, btn.val)} title={btn.title}
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer',
            color: '#4B5563', fontSize: 14,
          }}
          onMouseOver={e => e.currentTarget.style.background = '#E5E7EB'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <btn.icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, color = '#6B7280', bg = '#F9FAFB' }) {
  return (
    <div style={{
      padding: '16px', background: bg, borderRadius: 10,
      border: '1px solid #F3F4F6',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', lineHeight: 1.4 }}>{value || '—'}</div>
    </div>
  )
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB',
      overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '14px 18px',
        border: 'none', background: '#FAFBFC', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, color: '#374151',
        borderBottom: open ? '1px solid #E5E7EB' : 'none',
        textAlign: 'left',
      }}>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span>{title}</span>
      </button>
      {open && <div style={{ padding: '18px' }}>{children}</div>}
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.text, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {status}
    </span>
  )
}

export default function MeetingDetailView({ meetingId, meetingType = 'meeting', onBack, onRefresh }) {
  const nav = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState(null)

  // Notes
  const [meetingNotes, setMeetingNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const notesEditorRef = useRef(null)

  // Documents
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const dropRef = useRef(null)

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

  // Comments
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [relatedProjects, setRelatedProjects] = useState([])

  const isMR = meetingType === 'request'
  const baseAPI = isMR ? '/api/meeting-requests' : '/api/meetings'
  const baseDocs = `${baseAPI}/${meetingId}/documents`

  // Drag state
  const [dragOver, setDragOver] = useState(false)

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
    try { const r = await api.get(baseDocs); setDocs(r.data.documents || []) }
    catch(e) { setDocs([]) }
  }

  const loadActivities = async () => {
    try { const r = await api.get(`${baseAPI}/${meetingId}/activities`); setActivities(r.data.activities || []) }
    catch(e) { setActivities([]) }
  }

  const loadShares = async () => {
    try { const r = await api.get(`${baseAPI}/${meetingId}/share`); setShares(r.data.shares || []) }
    catch(e) { setShares([]) }
  }

  const loadUsers = async () => {
    try { const r = await api.get('/api/users?role=user,admin'); setAllUsers(r.data.users || []) }
    catch(e) {}
  }

  const loadComments = async () => {
    try { const r = await api.get(`${baseAPI}/${meetingId}/comments`); setComments(r.data.comments || []) }
    catch(e) { setComments([]) }
  }

  const loadSidebarData = async () => {
    try {
      const r = await api.get('/api/meetings/upcoming?limit=5')
      setUpcomingMeetings(r.data.meetings || [])
    } catch(e) {}
    try {
      if (item?.project_id) {
        const r = await api.get(`/api/projects/${item.project_id}`)
        setRelatedProjects(r.data.project ? [r.data.project] : [])
      }
    } catch(e) {}
  }

  useEffect(() => {
    load()
    loadDocs()
    loadActivities()
    loadShares()
    loadUsers()
    loadComments()
    loadSidebarData()
  }, [meetingId])

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const html = notesEditorRef.current?.innerHTML || meetingNotes
      const body = isMR ? { status: item.status, meeting_notes: html } : { meeting_notes: html }
      const url = isMR ? `${baseAPI}/${meetingId}/respond` : `${baseAPI}/${meetingId}`
      const r = await api.put(url, body)
      setItem(r.data.meeting_request || r.data.meeting)
      setMeetingNotes(html)
      setEditingNotes(false)
      loadActivities()
    } catch(e) { alert('Failed to save notes') }
    finally { setSavingNotes(false) }
  }

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      await api.post(baseDocs, fd)
      loadDocs()
      loadActivities()
    } catch(e) { alert(e.response?.data?.error || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const downloadDoc = async (doc) => {
    try {
      const r = await api.get(`${baseDocs}/${doc.id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href = url; a.download = doc.file_name
      document.body.appendChild(a); a.click()
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 200)
    } catch(e) { alert('Download failed') }
  }

  const deleteDoc = async (doc) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return
    try {
      await api.delete(`${baseAPI}/${meetingId}/documents/${doc.id}`)
      loadDocs()
      loadActivities()
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

  const addComment = async () => {
    if (!commentText.trim()) return
    try {
      await api.post(`${baseAPI}/${meetingId}/comments`, { content: commentText, parent_id: replyTo?.id || null })
      setCommentText('')
      setReplyTo(null)
      loadComments()
      loadActivities()
    } catch(e) { alert('Failed to add comment') }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      const el = document.createElement('div')
      el.textContent = 'Copied!'
      el.style.cssText = 'position:fixed;top:20px;right:20px;background:#10B981;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;'
      document.body.appendChild(el)
      setTimeout(() => document.body.removeChild(el), 2000)
    })
  }

  const getFileIcon = (type) => {
    if (['jpg','jpeg','png','gif','webp','svg'].includes(type)) return Image
    if (['zip','rar','7z','tar','gz'].includes(type)) return Archive
    if (['pdf'].includes(type)) return FileText
    return File
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <p style={{ fontSize: 14, color: '#9CA3AF' }}>Loading meeting...</p>
    </div>
  )
  if (error) return <div style={{ textAlign: 'center', padding: '80px', color: '#DC2626', fontSize: 15 }}>{error}</div>
  if (!item) return <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF', fontSize: 15 }}>Meeting not found</div>

  const sStyle = STATUS_STYLES[item.status] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' }
  const title = isMR ? (item.agenda || item.title || 'Meeting Request') : (item.title || item.agenda || 'Meeting')
  const dateField = isMR ? item.preferred_date : item.meeting_date
  const createdByName = isMR ? item.requested_by_name : item.created_by_name
  const desc = isMR ? null : item.description

  // ---- RENDER HELPERS ----

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Agenda */}
      {title && (
        <Section title="Agenda" defaultOpen={true}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{title}</div>
        </Section>
      )}

      {/* Description */}
      {desc && (
        <Section title="Description">
          <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{desc}</div>
        </Section>
      )}

      {/* Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 12,
      }}>
        <InfoCard icon={Calendar} label="Date" value={formatDate(dateField)} color="#3B82F6" />
        <InfoCard icon={Clock} label="Time" value={formatTime(dateField)} color="#8B5CF6" />
        <InfoCard icon={Tag} label="Status" color="#10B981" value={<StatusBadge status={item.status} />} />
        <InfoCard icon={User} label={isMR ? 'Requested By' : 'Created By'} value={createdByName || '—'} color="#F59E0B" />
        <InfoCard icon={MapPin} label="Location" value={isMR ? (item.confirmed_date ? 'Virtual' : '—') : (item.location || '—')} color="#EF4444" />
        <InfoCard icon={Users} label="Participants" value={`${shares.length + 1} members`} color="#EC4899" />
        {!isMR && <InfoCard icon={Briefcase} label="Priority" value={item.priority || 'Normal'} color="#F59E0B" />}
        {isMR && <InfoCard icon={Globe} label="Meeting Type" value="Client Request" color="#3B82F6" />}
      </div>

      {/* Meeting Link */}
      <Section title="Meeting Link" defaultOpen={true}>
        {item.meeting_link ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: '#F0F5FF', border: '1px solid #BFDBFE',
            borderRadius: 10,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video className="w-5 h-5" style={{ color: '#2563EB' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a href={item.meeting_link} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#2563EB', fontWeight: 500, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.meeting_link}
              </a>
              <span style={{ fontSize: 11, color: '#60A5FA' }}>Google Meet</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={item.meeting_link} target="_blank" rel="noopener noreferrer"
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ExternalLink className="w-3.5 h-3.5" /> Join
              </a>
              <button onClick={() => copyToClipboard(item.meeting_link)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#fff', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px 16px', background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: 10, color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
            No meeting link provided
          </div>
        )}
      </Section>

      {/* Team Remarks (MR only) */}
      {isMR && item.team_remarks && (
        <Section title="Team Remarks">
          <div style={{ padding: '14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10 }}>
            <p style={{ fontSize: 14, color: '#9A3412', margin: 0, lineHeight: 1.6 }}>{item.team_remarks}</p>
          </div>
        </Section>
      )}

      {/* Respond Form (MR) */}
      {isMR && ['Requested', 'Rescheduled'].includes(item.status) && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', margin: '0 0 16px' }}>Respond to Request</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select value={respondForm.status} onChange={e => setRespondForm({ ...respondForm, status: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
              <option value="Confirmed">Confirm</option>
              <option value="Rescheduled">Reschedule</option>
              <option value="Cancelled">Cancel</option>
            </select>
            {respondForm.status === 'Rescheduled' && (
              <input type="datetime-local" value={respondForm.confirmed_date} onChange={e => setRespondForm({ ...respondForm, confirmed_date: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            )}
            <input type="url" value={respondForm.meeting_link} onChange={e => setRespondForm({ ...respondForm, meeting_link: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              placeholder="Meeting link" />
            <textarea value={respondForm.team_remarks} onChange={e => setRespondForm({ ...respondForm, team_remarks: e.target.value })} rows={2}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Team remarks..." />
            <button onClick={respondToRequest} disabled={responding}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: responding ? 0.6 : 1, alignSelf: 'flex-start' }}>
              {responding ? 'Saving...' : 'Submit Response'}
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Form (MR Confirmed) */}
      {isMR && item.status === 'Confirmed' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', margin: '0 0 16px' }}>Reschedule Meeting</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="datetime-local" value={respondForm.confirmed_date} onChange={e => setRespondForm({ ...respondForm, confirmed_date: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <input type="url" value={respondForm.meeting_link} onChange={e => setRespondForm({ ...respondForm, meeting_link: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              placeholder="Meeting link" />
            <textarea value={respondForm.team_remarks} onChange={e => setRespondForm({ ...respondForm, team_remarks: e.target.value })} rows={2}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Team remarks..." />
            <button onClick={rescheduleRequest} disabled={responding}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: responding ? 0.6 : 1, alignSelf: 'flex-start' }}>
              {responding ? 'Saving...' : 'Reschedule'}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isMR && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {item.meeting_link && (
            <a href={item.meeting_link} target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ExternalLink className="w-4 h-4" /> Join Meeting
            </a>
          )}
          {item.status !== 'Completed' && item.status !== 'Cancelled' && (
            <>
              {item.status === 'Scheduled' && (
                <button onClick={() => updateStatus('Ongoing')}
                  style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw className="w-4 h-4" /> Start Meeting
                </button>
              )}
              <button onClick={() => updateStatus('Completed')}
                style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#1E40AF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle className="w-4 h-4" /> Mark Completed
              </button>
              <button onClick={() => updateStatus('Cancelled')}
                style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#fff', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )

  const renderNotes = () => (
    <div>
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        {(editingNotes || !item.meeting_notes) && (
          <RichTextToolbar editorRef={notesEditorRef} />
        )}
        {editingNotes || !item.meeting_notes ? (
          <>
            <div
              ref={notesEditorRef}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: meetingNotes }}
              style={{
                width: '100%', minHeight: 300, padding: '16px 18px',
                border: 'none', outline: 'none', fontFamily: 'inherit',
                fontSize: 14, lineHeight: 1.7, color: '#1F2937',
                whiteSpace: 'pre-wrap', overflowY: 'auto',
              }}
              onInput={() => {
                if (notesEditorRef.current) setMeetingNotes(notesEditorRef.current.innerHTML)
              }}
              placeholder="Write meeting notes here..."
            />
            <div style={{ display: 'flex', gap: 8, padding: '12px 18px', borderTop: '1px solid #E5E7EB', background: '#FAFBFC', justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditingNotes(false); setMeetingNotes(item.meeting_notes || '') }}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveNotes} disabled={savingNotes}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: savingNotes ? 0.6 : 1 }}>
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{ padding: '18px', fontSize: 14, lineHeight: 1.7, color: '#1F2937', minHeight: 200 }}
            dangerouslySetInnerHTML={{ __html: item.meeting_notes }}
          />
        )}
      </div>
      {item.meeting_notes && !editingNotes && (
        <button onClick={() => setEditingNotes(true)}
          style={{ marginTop: 12, padding: '8px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#5B21B6', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Edit3 className="w-3.5 h-3.5" /> Edit Notes
        </button>
      )}
    </div>
  )

  const renderDocuments = () => (
    <div>
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragOver ? '#5B21B6' : '#D1D5DB'}`,
          borderRadius: 12, padding: '32px', textAlign: 'center',
          background: dragOver ? '#F5F3FF' : '#FAFAFA',
          cursor: 'pointer', marginBottom: 20, transition: 'all 0.15s',
        }}
        onClick={() => fileRef.current?.click()}>
        <Upload className="w-10 h-10" style={{ color: dragOver ? '#5B21B6' : '#9CA3AF', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', margin: 0 }}>{uploading ? 'Uploading...' : 'Drag & drop files here or click to browse'}</p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '6px 0 0' }}>PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, ZIP</p>
        <input ref={fileRef} type="file" onChange={e => { handleUpload(e.target.files?.[0]); e.target.value = '' }} hidden />
      </div>

      {docs.length > 0 ? (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC', borderBottom: '1px solid #E5E7EB' }}>
                {['File Name', 'Uploaded By', 'Date', 'Size', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map(d => {
                const Icon = getFileIcon(d.file_type)
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon className="w-4 h-4" style={{ color: '#5B21B6', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 250 }}>{d.file_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{d.uploaded_by_name || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{d.uploaded_at ? timeAgo(d.uploaded_at) : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7280' }}>{formatFileSize(d.file_size)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => window.open(`${baseDocs}/${d.id}/view`, '_blank')} title="Preview"
                          style={{ padding: '5px', borderRadius: 6, border: 'none', background: '#F3F4F6', cursor: 'pointer', color: '#6B7280' }}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => downloadDoc(d)} title="Download"
                          style={{ padding: '5px', borderRadius: 6, border: 'none', background: '#F3F4F6', cursor: 'pointer', color: '#6B7280' }}>
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteDoc(d)} title="Delete"
                          style={{ padding: '5px', borderRadius: 6, border: 'none', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          <Paperclip className="w-12 h-12" style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ fontSize: 14, margin: 0 }}>No documents uploaded yet</p>
        </div>
      )}
    </div>
  )

  const renderTimeline = () => (
    <div>
      {activities.length > 0 ? (
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: '#E5E7EB' }} />
          {activities.map((a, i) => (
            <div key={a.id} style={{ position: 'relative', paddingBottom: i < activities.length - 1 ? 24 : 0 }}>
              <div style={{
                position: 'absolute', left: -24, top: 4,
                width: 24, height: 24, borderRadius: '50%',
                background: '#fff', border: '2px solid #5B21B6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5B21B6' }} />
              </div>
              <div style={{ marginLeft: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{a.user_name || 'System'}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(a.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          <Activity className="w-12 h-12" style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ fontSize: 14, margin: 0 }}>No activity yet</p>
        </div>
      )}
    </div>
  )

  const renderTeam = () => (
    <div>
      {!showShareForm ? (
        <button onClick={() => { setShowShareForm(true); loadUsers() }}
          style={{ marginBottom: 20, padding: '10px 20px', borderRadius: 8, border: '1px dashed #5B21B6', background: '#F5F3FF', color: '#5B21B6', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-4 h-4" /> Share with Team
        </button>
      ) : (
        <div style={{ marginBottom: 20, padding: '18px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', margin: '0 0 12px' }}>Select team members:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
            {allUsers.filter(u => u.id !== (item.created_by || item.requested_by)).map(u => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                <input type="checkbox" checked={selectedUsers.includes(u.id)}
                  onChange={() => setSelectedUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                  style={{ accentColor: '#5B21B6' }} />
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                  {u.full_name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1F2937' }}>{u.full_name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{u.designation || ''}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={shareWithUsers} disabled={!selectedUsers.length}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: selectedUsers.length ? 1 : 0.5 }}>
              Share ({selectedUsers.length})
            </button>
            <button onClick={() => { setShowShareForm(false); setSelectedUsers([]) }}
              style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {shares.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shares.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: '#F9FAFB', borderRadius: 10,
              border: '1px solid #E5E7EB',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#065F46' }}>
                {s.user_name?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>{s.user_name}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{s.user_designation || 'Team Member'}</div>
              </div>
              <button onClick={() => removeShare(s.user_id)}
                style={{ padding: '6px', borderRadius: 6, border: 'none', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          <Users className="w-12 h-12" style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ fontSize: 14, margin: 0 }}>No team members shared</p>
        </div>
      )}
    </div>
  )

  const renderComments = () => (
    <div>
      {/* Comment Input */}
      <div style={{ marginBottom: 24, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#F0F5FF', borderBottom: '1px solid #E5E7EB', fontSize: 12, color: '#2563EB' }}>
            <Reply className="w-3 h-3" />
            Replying to {replyTo.user_name || 'someone'}
            <button onClick={() => setReplyTo(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <textarea value={commentText} onChange={e => setCommentText(e.target.value)} rows={3}
          style={{ width: '100%', padding: '14px', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          placeholder="Write a comment... Use @ to mention someone" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderTop: '1px solid #E5E7EB', background: '#FAFBFC' }}>
          <button style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}>
            <AtSign className="w-4 h-4" />
          </button>
          <button style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}>
            <Smile className="w-4 h-4" />
          </button>
          <button style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}>
            <Paperclip className="w-4 h-4" />
          </button>
          <button onClick={addComment} disabled={!commentText.trim()}
            style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: commentText.trim() ? 1 : 0.5 }}>
            Send
          </button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {comments.map(c => (
            <div key={c.id}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6B7280', flexShrink: 0 }}>
                  {c.user_name?.[0] || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{c.user_name || 'Unknown'}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                  <button onClick={() => setReplyTo(c)}
                    style={{ marginTop: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#F3F4F6', cursor: 'pointer', color: '#6B7280', fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Reply className="w-3 h-3" /> Reply
                  </button>

                  {/* Replies */}
                  {c.replies?.length > 0 && (
                    <div style={{ marginTop: 12, marginLeft: 16, paddingLeft: 16, borderLeft: '2px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {c.replies.map(r => (
                        <div key={r.id} style={{ display: 'flex', gap: 10 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', flexShrink: 0 }}>
                            {r.user_name?.[0] || '?'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{r.user_name}</span>
                              <span style={{ fontSize: 10, color: '#9CA3AF' }}>{timeAgo(r.created_at)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>{r.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          <MessageSquare className="w-12 h-12" style={{ margin: '0 auto 8px', color: '#D1D5DB' }} />
          <p style={{ fontSize: 14, margin: 0 }}>No comments yet. Start the conversation!</p>
        </div>
      )}
    </div>
  )

  const renderSidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Quick Actions */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px' }}>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Quick Actions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <a href={item.meeting_link || '#'} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#F0FDF4', color: '#059669', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <ExternalLink className="w-3.5 h-3.5" /> Join Meeting
          </a>
          <button style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#5B21B6', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Share2 className="w-3.5 h-3.5" /> Share Meeting
          </button>
          <button style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#FFF7ED', color: '#D97706', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar className="w-3.5 h-3.5" /> Reschedule
          </button>
        </div>
      </div>

      {/* Participants */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px' }}>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Participants</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#4F46E5' }}>
              {createdByName?.[0] || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{createdByName || '—'}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>Organizer</div>
            </div>
          </div>
          {shares.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#065F46' }}>
                {s.user_name?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1F2937' }}>{s.user_name}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>{s.user_designation || 'Member'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      {upcomingMeetings.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Upcoming Meetings</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingMeetings.slice(0, 3).map(m => (
              <div key={m.id} style={{ fontSize: 12, color: '#374151', cursor: 'pointer' }}
                onClick={() => nav(`/meetings?id=${m.id}&type=meeting`)}>
                <div style={{ fontWeight: 600 }}>{m.title || m.agenda}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>{formatDT(m.meeting_date || m.preferred_date)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Documents */}
      {docs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Recent Documents</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {docs.slice(0, 3).map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => downloadDoc(d)}>
                <File className="w-3.5 h-3.5" style={{ color: '#5B21B6', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Summary */}
      {activities.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Activity Summary</h4>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            <p style={{ margin: '0 0 4px' }}>{activities.length} activities logged</p>
            <p style={{ margin: 0 }}>Last activity {timeAgo(activities[0]?.created_at)}</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ background: '#F0F2F8', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ═══════════ HEADER ═══════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid #E5E7EB',
        padding: '0 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: 12 }}>
          {/* Back */}
          <button onClick={() => { if (onBack) onBack(); else nav(-1) }} style={{
            width: 36, height: 36, borderRadius: 8,
            border: '1px solid #E5E7EB', background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B7280', flexShrink: 0,
          }}>
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Calendar className="w-5 h-5" style={{ color: '#4F46E5' }} />
          </div>

          {/* Title + Meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{
                fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 500,
              }} title={title}>{title}</h1>
              <StatusBadge status={item.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{formatDT(dateField)}</span>
              <span style={{ color: '#D1D5DB' }}>·</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>Created by {createdByName || '—'}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {item.meeting_link && (
              <a href={item.meeting_link} target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#059669', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                <ExternalLink className="w-3.5 h-3.5" /> Join
              </a>
            )}
            {isMR && ['Requested', 'Rescheduled'].includes(item.status) && (
              <button
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                  background: '#fff', color: '#374151',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                <RefreshCw className="w-3.5 h-3.5" /> Reschedule
              </button>
            )}
            {isMR && item.status === 'Confirmed' && (
              <button
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                  background: '#fff', color: '#374151',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                <Calendar className="w-3.5 h-3.5" /> Reschedule
              </button>
            )}
            <button
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                background: '#fff', color: '#374151',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            {!isMR && item.status !== 'Completed' && item.status !== 'Cancelled' && (
              <button onClick={() => updateStatus('Completed')}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: '#1E40AF', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </button>
            )}
            <button style={{
              width: 36, height: 36, borderRadius: 8,
              border: '1px solid #E5E7EB', background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6B7280',
            }}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              width: 36, height: 36, borderRadius: 8,
              border: '1px solid #E5E7EB', background: sidebarOpen ? '#EEF2FF' : '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: sidebarOpen ? '#4F46E5' : '#6B7280',
            }}>
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ TABS BAR ═══════════ */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E5E7EB',
        padding: '0 28px', display: 'flex', overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '14px 18px',
                border: 'none', borderBottom: `2px solid ${active ? '#5B21B6' : 'transparent'}`,
                background: 'transparent', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? '#5B21B6' : '#6B7280',
                whiteSpace: 'nowrap', transition: 'all 0.12s',
                marginBottom: -1,
              }}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div style={{
        display: 'flex', gap: 24,
        padding: '24px 28px',
        maxWidth: sidebarOpen ? undefined : 960,
        margin: '0 auto',
      }}>
        {/* Left - Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'notes' && renderNotes()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'timeline' && renderTimeline()}
          {activeTab === 'team' && renderTeam()}
          {activeTab === 'comments' && renderComments()}
        </div>

        {/* Right - Sidebar */}
        {sidebarOpen && (
          <div style={{ width: 280, flexShrink: 0 }}>
            {renderSidebar()}
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #9CA3AF;
        }
      `}</style>
    </div>
  )
}
