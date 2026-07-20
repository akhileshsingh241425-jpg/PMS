import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'

const C = {
  bg: '#F0F2F8', card: '#fff', border: '#E5E7EB',
  primary: '#5B21B6', primaryLight: '#F5F3FF',
  text: '#1A1A2E', muted: '#9CA3AF', secondary: '#6B7280',
}

const DELIVERY_STAGES = ['Initiated','Planning','Information Gathering','Execution','Internal Review','Client Review','Remediation Support','Final Delivery']

const FINANCE_STAGES = ['Invoice Raised','Payment Pending','Partial Payment Received','Full Payment Received']

const BLOCKED_STAGES = ['On Hold','Delayed','Cancelled','Escalated']

const SUPPORT_STAGES = ['Awaiting Client Response','Awaiting Documents','Awaiting Payment']

const ALL_STAGES = [...DELIVERY_STAGES, ...FINANCE_STAGES, ...BLOCKED_STAGES, ...SUPPORT_STAGES]

const TERMINAL_STAGES = ['Closed', ...BLOCKED_STAGES, ...SUPPORT_STAGES]

const STAGE_ICONS = {
  'Initiated': 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  'Planning': 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
  'Information Gathering': 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  'Execution': 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605',
  'Internal Review': 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  'Client Review': 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0',
  'Remediation Support': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  'Final Delivery': 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Invoice Raised': 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125V9M3.75 6v6m0 0v3m0-3h.75M3.75 12h.75m-2.25 0h2.25m0 0h2.25m-2.25 0v3m0 0H3.75m0 0h2.25M20.25 9v.75c0 .414.336.75.75.75h.75M20.25 9v9m0-9h-2.25m2.25 0H18m2.25 0V6',
  'Payment Pending': 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Partial Payment Received': 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Full Payment Received': 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'Closed': 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'On Hold': 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  'Delayed': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'Cancelled': 'M6 18L18 6M6 6l12 12',
  'Escalated': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  'Awaiting Client Response': 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
  'Awaiting Documents': 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  'Awaiting Payment': 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const STAGE_DESCRIPTIONS = {
  'Initiated': 'Project kick-off and initial setup',
  'Planning': 'Scope definition and resource planning',
  'Information Gathering': 'Collecting requirements and data',
  'Execution': 'Active work and implementation',
  'Internal Review': 'Quality check by internal team',
  'Client Review': 'Client reviews the deliverables',
  'Remediation Support': 'Addressing client feedback',
  'Final Delivery': 'Final handover to client',
  'Invoice Raised': 'Invoice has been generated',
  'Payment Pending': 'Awaiting payment from client',
  'Partial Payment Received': 'Partial payment received',
  'Full Payment Received': 'Full payment completed',
  'Closed': 'Project is closed',
  'On Hold': 'Project paused temporarily',
  'Delayed': 'Project behind schedule',
  'Cancelled': 'Project terminated',
  'Escalated': 'Project escalated for attention',
  'Awaiting Client Response': 'Waiting for client reply',
  'Awaiting Documents': 'Waiting for required documents',
  'Awaiting Payment': 'Waiting for payment clearance',
}

function StageIcon({ path, size = 16 }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d={path} /></svg>
}

function StageTab({ stage, status, tooltip, onClick }) {
  const icon = STAGE_ICONS[stage] || STAGE_ICONS['On Hold']
  const isActive = status === 'current'
  const isCompleted = status === 'completed'
  const isTerminal = status === 'terminal'
  const bgColor = isActive ? C.primary : isCompleted ? '#D1FAE5' : '#F0F2F8'
  const iconColor = isActive ? '#fff' : isCompleted ? '#059669' : '#9CA3AF'
  const labelColor = isActive ? C.primary : isCompleted ? '#065F46' : '#6B7280'
  const labelWeight = isActive ? 800 : isCompleted ? 700 : 600
  const borderColor = isActive ? C.primary : 'transparent'
  const cursor = isTerminal && !isActive ? 'default' : 'pointer'
  const opacity = isTerminal && !isActive ? 0.4 : 1
  return (
    <div title={tooltip} onClick={isTerminal && !isActive ? undefined : onClick} style={{
      flex: 1, minWidth: 110, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '12px 8px', cursor, opacity,
      borderBottom: `3px solid ${borderColor}`, transition: '0.15s', userSelect: 'none',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bgColor, transition: '0.15s',
      }}>
        {isCompleted ? <svg width={18} height={18} fill="none" stroke="#059669" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg> : <StageIcon path={icon} size={16} />}
      </div>
      <span style={{ fontSize: 11, fontWeight: labelWeight, color: labelColor, textAlign: 'center', lineHeight: 1.2, maxWidth: 110 }}>{stage}</span>
    </div>
  )
}

export default function ProjectsDetailPage() {
  const { id } = useParams()
  const { user, hasRole } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const openBlob = async (url) => {
    try { const r = await api.get(url.replace('/api/', ''), { responseType: 'blob' }); const u = URL.createObjectURL(r.data); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000) }
    catch (e) { toast('Failed to open file', 'error') }
  }
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgUrls, setImgUrls] = useState({})
  useEffect(() => {
    if (!data) return; const docs = data.documents || []; const pending = {}
    docs.forEach(d => { if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(d.file_name)) pending[d.id] = d.file_url })
    Object.entries(pending).forEach(([id, url]) => { api.get(url.replace('/api/', ''), { responseType: 'blob' }).then(r => setImgUrls(p => ({ ...p, [id]: URL.createObjectURL(r.data) }))).catch(() => {}) })
  }, [data])
  const [remarkText, setRemarkText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'Normal', due_date: '', assigned_to: '' })
  const [editTask, setEditTask] = useState(null)
  const [editTaskDesc, setEditTaskDesc] = useState('')
  const [taskDetail, setTaskDetail] = useState(null)
  const [viewTask, setViewTask] = useState(null)
  const taskEditorRef = useRef(null)
  const taskFetching = useRef(false)
  const openTaskEditor = async (t) => {
    setEditTask(t); setEditTaskDesc(t.description || ''); setViewTask(null)
    try { if (!taskFetching.current) { taskFetching.current = true; const r = await api.get(`/api/tasks/${t.id}`); setTaskDetail(r.data); taskFetching.current = false } }
    catch (e) { taskFetching.current = false }
    setTimeout(() => { if (taskEditorRef.current) taskEditorRef.current.innerHTML = t.description || '' }, 50)
  }
  const fileRef = useRef(null)
  const remarkInputRef = useRef(null)
  const [editRemark, setEditRemark] = useState(null)
  const [viewRemark, setViewRemark] = useState(null)
  const [showExtraStages, setShowExtraStages] = useState(false)
  const remarkEditorRef = useRef(null)
  const openRemarkEditor = (r) => { setEditRemark(r); setViewRemark(null); setTimeout(() => { if (remarkEditorRef.current) remarkEditorRef.current.innerHTML = r.text || '' }, 50) }
  const saveRemark = async () => {
    if (!editRemark) return
    const text = remarkEditorRef.current?.innerHTML || ''
    if (!text.trim()) return
    try { await api.put(`/api/projects/${id}/remarks/${editRemark.id}`, { text }); fetchData(); setEditRemark(null); toast('Saved') }
    catch (e) { toast('Failed to save', 'error') }
  }
  const [showEmojiPicker, setShowEmojiPicker] = useState(null)
  const [expandedRemark, setExpandedRemark] = useState(null)
  const [users, setUsers] = useState([])
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingForm, setMeetingForm] = useState({ title: '', meeting_date: '', meeting_link: '', status: 'Scheduled' })
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamForm, setTeamForm] = useState({ userId: '', role: 'Member' })
  const [selectedMember, setSelectedMember] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({})
  useEffect(() => { if (data?.project) setEditForm({ title: data.project.title, description: data.project.description, service_type: data.project.service_type, pm_id: data.project.pm_id || '', total_value: data.project.total_value || '', start_date: data.project.start_date || '', target_date: data.project.target_date || '' }) }, [data?.project])
  const [mstoneForm, setMstoneForm] = useState(null)
  const [reports, setReports] = useState([])
  const [reportUploading, setReportUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('document')

  // Inline edit for title & description
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descVal, setDescVal] = useState('')
  const [savingField, setSavingField] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [addTaskPhase, setAddTaskPhase] = useState(null)
  const [phaseTaskForm, setPhaseTaskForm] = useState({ title: '', assigned_to: '', due_date: '', status: 'Open' })
  const [addSubtaskOf, setAddSubtaskOf] = useState(null)
  const [subtaskForm, setSubtaskForm] = useState({ title: '', assigned_to: '', due_date: '', status: 'Open' })

  const fetchData = async () => {
    try { const r = await api.get(`/api/projects/${id}`); setData(r.data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])
  useEffect(() => { api.get('/api/auth/users').then(r => setUsers(r.data.users)).catch(() => {}) }, [])

  const changeStage = async (stage) => {
    try { await api.put(`/api/projects/${id}`, { stage }); fetchData(); toast(`Moved to ${stage}`) }
    catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
  }

  const saveTitle = async () => {
    if (!titleVal.trim()) return toast('Title required', 'error')
    setSavingField(true)
    try { await api.put(`/api/projects/${id}`, { title: titleVal }); setEditingTitle(false); fetchData(); toast('Title updated') }
    catch (e) { toast('Failed', 'error') }
    finally { setSavingField(false) }
  }

  const saveDesc = async () => {
    setSavingField(true)
    try { await api.put(`/api/projects/${id}`, { description: descVal }); setEditingDesc(false); fetchData(); toast('Description updated') }
    catch (e) { toast('Failed', 'error') }
    finally { setSavingField(false) }
  }

  const generatePlan = async () => {
    setGeneratingPlan(true)
    try { await api.post(`/api/projects/${id}/generate-plan`); fetchData(); toast('Project plan generated from template') }
    catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
    finally { setGeneratingPlan(false) }
  }

  const addTaskToPhase = async (e) => {
    e.preventDefault(); if (!phaseTaskForm.title.trim()) return
    try { await api.post(`/api/projects/${id}/phases/${addTaskPhase}/tasks`, phaseTaskForm); setAddTaskPhase(null); setPhaseTaskForm({ title: '', assigned_to: '', due_date: '', status: 'Open' }); fetchData(); toast('Task added') }
    catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
  }

  const addSubtask = async (e) => {
    e.preventDefault(); if (!subtaskForm.title.trim()) return
    try { await api.post(`/api/projects/${id}/tasks/${addSubtaskOf}/subtasks`, subtaskForm); setAddSubtaskOf(null); setSubtaskForm({ title: '', assigned_to: '', due_date: '', status: 'Open' }); fetchData(); toast('Subtask added') }
    catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
  }

  const addRemark = async (e) => {
    e.preventDefault(); if (!remarkText.trim()) return; setSending(true)
    try { await api.post(`/api/projects/${id}/remarks`, { text: remarkText }); setRemarkText(''); fetchData(); toast('Remark added') }
    catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
    finally { setSending(false) }
  }

  const toggleReaction = async (remarkId, emoji) => {
    try {
      const r = await api.post(`/api/projects/${id}/remarks/${remarkId}/react`, { emoji })
      const updated = data.remarks.map(rr => rr.id === remarkId ? r.data.remark : rr)
      setData({ ...data, remarks: updated })
    } catch (e) {}
  }

  const EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '🚀']

  const uploadDoc = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true)
    try { const fd = new FormData(); fd.append('file', file); await api.post(`/api/projects/${id}/documents`, fd); fetchData() }
    catch (e) { toast('Upload failed', 'error') } finally { setUploading(false) }
  }

  const loadReports = async () => {
    try { const r = await api.get(`/api/projects/${id}/reports`); setReports(r.data.reports) }
    catch (e) {}
  }

  useEffect(() => { loadReports() }, [id])

  const uploadReport = async (e, reportType) => {
    const file = e.target.files?.[0]; if (!file) return; setReportUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      fd.append('report_type', reportType)
      fd.append('title', file.name)
      await api.post(`/api/projects/${id}/reports`, fd); loadReports(); toast('Report uploaded')
    } catch (e) { toast('Upload failed', 'error') } finally { setReportUploading(false); e.target.value = '' }
  }

  const deleteReport = async (rid) => {
    if (!confirm('Delete this report?')) return
    try { await api.delete(`/api/projects/${id}/reports/${rid}`); loadReports(); toast('Deleted') }
    catch (e) { toast('Failed', 'error') }
  }

  const reviewDoc = async (docId, status) => {
    const remarks = status === 'Revision Required' ? prompt('Revision remarks:') : ''
    if (status === 'Revision Required' && !remarks) return
    try { await api.post(`/api/projects/documents/${docId}/review`, { status, remarks, make_client_visible: status === 'Approved' }); fetchData() }
    catch (e) { toast('Failed', 'error') }
  }

  const addTask = async (e) => {
    e.preventDefault(); if (!taskForm.title.trim()) return
    try { await api.post('/api/tasks', { ...taskForm, project_id: parseInt(id) }); setTaskForm({ title: '', priority: 'Normal', due_date: '', assigned_to: '' }); setShowTaskForm(false); fetchData() }
    catch (e) { toast('Failed to add task', 'error') }
  }

  const updateTaskStatus = async (taskId, status) => {
    try { await api.put(`/api/tasks/${taskId}`, { status }); fetchData() } catch (e) {}
  }


  const saveTaskDesc = async () => {
    if (!editTask) return
    const html = taskEditorRef.current?.innerHTML || editTaskDesc
    try { await api.put(`/api/tasks/${editTask.id}`, { description: html }); fetchData(); setEditTask(null); toast('Saved') }
    catch (e) { toast('Failed to save', 'error') }
  }
  const execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val); taskEditorRef.current?.focus() }

  const addMeeting = async (e) => {
    e.preventDefault(); if (!meetingForm.title.trim() || !meetingForm.meeting_date || !meetingForm.meeting_link.trim()) return toast('Title, date, and meeting link are required', 'error')
    try { await api.post(`/api/projects/${id}/meetings`, meetingForm); setMeetingForm({ title: '', meeting_date: '', meeting_link: '', status: 'Scheduled' }); setShowMeetingForm(false); fetchData(); toast('Meeting added') }
    catch (e) { toast('Failed', 'error') }
  }

  const addVuln = async (e) => {
    e.preventDefault(); if (!vulnForm.title.trim()) return toast('Title required', 'error')
    setVulnSaving(true)
    try {
      const payload = { ...vulnForm, project_id: parseInt(id), account_id: p.account_id }
      if (payload.date_found) payload.date_found = payload.date_found + 'T00:00:00'
      if (payload.fix_deadline) payload.fix_deadline = payload.fix_deadline + 'T00:00:00'
      const slaDays = parseInt(payload.sla_days)
      delete payload.sla_days
      if (!payload.fix_deadline && !isNaN(slaDays) && slaDays > 0) payload.sla_days = slaDays
      await api.post('/api/vulnerabilities', payload)
      setVulnForm({ title: '', severity: 'Medium', status: 'Open', date_found: new Date().toISOString().split('T')[0], fix_deadline: '', sla_days: '30' })
      setShowVulnForm(false); loadVulns(); toast('Vulnerability added')
    } catch (e) { toast('Failed', 'error') } finally { setVulnSaving(false) }
  }

  const markVulnPatched = async (vid) => {
    try { await api.post(`/api/vulnerabilities/${vid}/patch`); loadVulns() } catch (e) { toast('Failed', 'error') }
  }

  const addNote = async (e) => {
    e.preventDefault(); if (!noteText.trim()) return
    try { await api.post(`/api/projects/${id}/notes`, { content: noteText }); setNoteText(''); fetchData() } catch (e) { toast('Failed', 'error') }
  }

  const addTeamMember = async () => {
    if (!teamForm.userId) return
    try { await api.post(`/api/projects/${id}/team`, { user_id: parseInt(teamForm.userId), role_in_project: teamForm.role }); setShowTeamForm(false); setTeamForm({ userId: '', role: 'Member' }); fetchData() }
    catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const removeTeamMember = async (tid) => {
    if (!confirm('Remove this team member?')) return
    try { await api.delete(`/api/projects/team/${tid}`); fetchData() } catch (e) { toast('Failed', 'error') }
  }

  const [vulnerabilities, setVulnerabilities] = useState([])
  const [vulnFilterSev, setVulnFilterSev] = useState('')
  const [vulnFilterStat, setVulnFilterStat] = useState('')
  const [showVulnForm, setShowVulnForm] = useState(false)
  const [vulnForm, setVulnForm] = useState({ title: '', severity: 'Medium', status: 'Open', date_found: new Date().toISOString().split('T')[0], fix_deadline: '', sla_days: '30' })
  const [vulnSaving, setVulnSaving] = useState(false)
  const loadVulns = () => { api.get(`/api/vulnerabilities?project_id=${id}`).then(r => setVulnerabilities(r.data.vulnerabilities)).catch(() => {}) }
  useEffect(() => { loadVulns() }, [id])

  const formatDate = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  const formatDateTime = (d) => { if (!d) return ''; const dt = new Date(d); return formatDate(d) + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
  if (!data) return null

  const { project: p, remarks, documents, team, tasks, meetings, notes, queries = [], meeting_requests = [], milestones = [], phases = [] } = data
  const isTerminal = TERMINAL_STAGES.includes(p.stage)
  const isBlocked = BLOCKED_STAGES.includes(p.stage)
  const openTasks = tasks.filter(t => t.status !== 'Completed').length
  const totalDocs = (documents || []).length
  const allMeetings = [
    ...(meetings || []).map(m => ({ ...m, _type: 'meeting' })),
    ...(meeting_requests || []).map(mr => ({ ...mr, _type: 'request', title: mr.agenda || 'Meeting Request', meeting_date: mr.preferred_date || mr.confirmed_date })),
  ].sort((a, b) => new Date(b.meeting_date || b.created_at) - new Date(a.meeting_date || a.created_at))
  const totalMeetings = allMeetings.length
  const vulnOverdueCount = vulnerabilities.filter(v => v.status !== 'Patched' && v.fix_deadline && new Date(v.fix_deadline) < new Date()).length

  const timelineEvents = [
    { date: p.created_at, label: 'Project Created', user: p.creator_name || 'System' },
    ...(tasks || []).slice(0, 5).map(t => ({ date: t.created_at, label: `Task: ${t.title}`, user: t.assigned_name || '—' })),
  ]

  const getStageGroup = (stage) => {
    if (SUPPORT_STAGES.includes(stage)) return 'Support'
    if (DELIVERY_STAGES.includes(stage)) return 'Delivery'
    if (FINANCE_STAGES.includes(stage)) return 'Finance'
    return 'Blocked'
  }

  const currentDeliveryIdx = DELIVERY_STAGES.indexOf(p.stage)

  const getStageStatus = (stage, group) => {
    if (group === 'delivery') {
      const idx = DELIVERY_STAGES.indexOf(stage)
      if (stage === p.stage) return 'current'
      if (currentDeliveryIdx >= 0 && idx < currentDeliveryIdx) return 'completed'
      return 'pending'
    }
    if (stage === p.stage) return 'current'
    if (TERMINAL_STAGES.includes(stage)) return 'terminal'
    return 'pending'
  }

  const GROUP_CONFIG = [
    { key: 'delivery', label: 'Project Lifecycle', stages: DELIVERY_STAGES, icon: '▶' },
    { key: 'finance', label: 'Billing Status', stages: FINANCE_STAGES, icon: '💰' },
    { key: 'support', label: 'Current Blockers', stages: SUPPORT_STAGES, icon: '⏳' },
    { key: 'blocked', label: 'Exception States', stages: BLOCKED_STAGES, icon: '⚠' },
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: C.text, fontSize: 14 }}>
      <div style={{ padding: '0 0 40px', width: '100%', maxWidth: 'none' }}>
        {/* ═══ HEADER CARD ═══ */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8E4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: C.primary, flexShrink: 0 }}>
                {(p.title || 'P')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {editingTitle ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input value={titleVal} onChange={e => setTitleVal(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                        style={{ fontSize: 24, fontWeight: 900, color: '#111827', border: `2px solid ${C.primary}`, borderRadius: 6, padding: '2px 8px', outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.3px' }} />
                      <button onClick={saveTitle} disabled={savingField} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{savingField ? '...' : 'Save'}</button>
                      <button onClick={() => setEditingTitle(false)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.3px' }}>{p.title}</span>
                      {hasRole('super_admin', 'admin', 'project_lead') && (
                        <button onClick={() => { setTitleVal(p.title); setEditingTitle(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9CA3AF', display: 'flex' }} title="Edit title">
                          <EditIcon size={14} />
                        </button>
                      )}
                    </>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, border: `1.5px solid ${C.primary}`, color: C.primary, background: '#F5F3FF' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isBlocked ? '#DC2626' : isTerminal ? '#059669' : C.primary }} />
                    {p.stage}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <InfoChip icon={<BriefcaseIcon />} value={p.proj_id} />
                  <InfoChip icon={<BuildingIcon />} value={p.account_name} />
                  <InfoChip icon={<PersonIcon />} value={p.pm_name} label="PM" />
                  <InfoChip icon={<CalendarIcon />} value={`Start ${formatDate(p.start_date)}`} />
                  <InfoChip icon={<TargetIcon />} value={`Target ${formatDate(p.target_date)}`} />
                  {p.total_value && <InfoChip icon={<MoneyIcon />} value={`₹${(p.total_value / 100000).toFixed(1)}L`} highlight />}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {hasRole('super_admin', 'admin', 'project_lead') && (
                <ActionBtn icon={<EditIcon />} label="Edit" onClick={() => setShowEditForm(true)} primary />
              )}
            </div>
          </div>
        </div>

        {/* ═══ KPI CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 16 }}>
          <KPICard icon={<MoneyIcon />} bg="#ECFDF5" color="#059669" label="Total Value" value={p.total_value ? `₹${(p.total_value / 100000).toFixed(1)}L` : '—'} />
          <KPICard icon={<CheckCircleIcon />} bg="#F5F3FF" color={C.primary} label="Open Tasks" value={`${openTasks}/${tasks.length}`} onClick={() => document.getElementById('section-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <KPICard icon={<UsersIcon />} bg="#EEF2FF" color="#4F46E5" label="Team" value={(team || []).length} onClick={() => document.getElementById('section-team')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <KPICard icon={<PaperclipIcon />} bg="#FDF2F8" color="#DB2777" label="Documents" value={totalDocs} onClick={() => document.getElementById('section-documents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <KPICard icon={<CalendarIcon />} bg="#FFF7ED" color="#D97706" label="Meetings" value={totalMeetings} onClick={() => document.getElementById('section-meetings')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <KPICard icon={<ShieldExclamationIcon />} bg={vulnOverdueCount > 0 ? '#FEF2F2' : '#F5F3FF'} color={vulnOverdueCount > 0 ? '#DC2626' : C.primary} label="Vulnerabilities" value={vulnerabilities.length} onClick={() => document.getElementById('section-vulnerabilities')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <KPICard icon={<TagIcon />} bg="#ECFDF5" color="#059669" label="Stage" value={getStageGroup(p.stage)} />
        </div>

        {/* ═══ STAGE SELECTOR ═══ */}
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TagIcon />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 2 }}>Current Stage</div>
              <select value={p.stage} onChange={e => changeStage(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#1F2937', background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                <optgroup label="— Project Lifecycle —">
                  {DELIVERY_STAGES.map(s => <option key={s} value={s}>{s}{s === p.stage ? '  (current)' : ''}</option>)}
                </optgroup>
                <optgroup label="— Billing —">
                  {FINANCE_STAGES.map(s => <option key={s} value={s}>{s}{s === p.stage ? '  (current)' : ''}</option>)}
                </optgroup>
                <optgroup label="— Support —">
                  {SUPPORT_STAGES.map(s => <option key={s} value={s}>{s}{s === p.stage ? '  (current)' : ''}</option>)}
                </optgroup>
                <optgroup label="— Exceptions —">
                  {BLOCKED_STAGES.map(s => <option key={s} value={s}>{s}{s === p.stage ? '  (current)' : ''}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* ═══ PROJECT INFO (FULL WIDTH) ═══ */}
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px', marginBottom: 16 }}>
          <SectionTitle icon={<BriefcaseIcon />} text="Project Information" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
            <InfoField icon={<BuildingIcon />} label="Account" value={p.account_name || '—'} empty={!p.account_name} />
            <InfoField icon={<PersonIcon />} label="Project Manager" value={p.pm_name || '—'} empty={!p.pm_name} />
            <InfoField icon={<TagIcon />} label="Service" value={p.service_type || '—'} empty={!p.service_type} />
            <InfoField icon={<CalendarIcon />} label="Start Date" value={formatDate(p.start_date)} empty={!p.start_date} />
            <InfoField icon={<TargetIcon />} label="Target Date" value={formatDate(p.target_date)} empty={!p.target_date} />
            <InfoField icon={<CalendarIcon />} label="End Date" value={formatDate(p.actual_end_date)} empty={!p.actual_end_date} />
            <InfoField icon={<MoneyIcon />} label="Total Value" value={p.total_value ? `₹${p.total_value.toLocaleString()}` : '—'} empty={!p.total_value} green />
            <InfoField icon={<ShieldIcon />} label="Stage Group" value={getStageGroup(p.stage)} badge />
            <InfoField icon={<CheckCircleIcon />} label="Client Review" value={p.is_client_review_enabled ? 'Enabled' : 'Off'} />
            <InfoField icon={<UsersIcon />} label="Team Size" value={p.team_count || '0'} />
            <InfoField icon={<PersonIcon />} label="Created By" value={p.creator_name || '—'} empty={!p.creator_name} />
            <InfoField icon={<CalendarIcon />} label="Updated" value={formatDate(p.updated_at)} empty={!p.updated_at} />
          </div>
        </div>

        {/* ═══ STAGE STATUS BANNER ═══ */}
        {isBlocked && (
          <div style={{ background: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', borderRadius: 12, border: '1.5px solid #FECACA', padding: '12px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>!</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>Blocked — Project is in <strong>{p.stage}</strong> status</span>
          </div>
        )}
        {isTerminal && !isBlocked && (
          <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', borderRadius: 12, border: '1.5px solid #A7F3D0', padding: '12px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon size={12} color="#fff" /></div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>{p.stage === 'Closed' ? 'Closed' : 'Cancelled'}</span>
          </div>
        )}

        {/* ═══ PO IN SECTION ═══ */}
        {(p.po_number || p.project_type || p.plan_generated) && (
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px', marginBottom: 12 }}>
            <SectionTitle icon={<FileTextIcon />} text={p.plan_generated ? 'Project Plan' : 'Purchase Order (PO In)'} />
            {!p.plan_generated && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
                {p.po_number && <InfoField icon={<HashIcon />} label="PO Number" value={p.po_number} empty={!p.po_number} />}
                {p.po_date && <InfoField icon={<CalendarIcon />} label="PO Date" value={formatDate(p.po_date)} empty={!p.po_date} />}
                {p.po_amount && <InfoField icon={<MoneyIcon />} label="PO Amount" value={`₹${p.po_amount.toLocaleString()}`} empty={!p.po_amount} green />}
                {p.project_type && <InfoField icon={<TagIcon />} label="Project Type" value={p.project_type} empty={!p.project_type} badge />}
                {p.po_terms && <div style={{ gridColumn: '1 / -1' }}><InfoField icon={<FileTextIcon />} label="Terms & Conditions" value={p.po_terms} empty={!p.po_terms} /></div>}
              </div>
            )}
            {!p.plan_generated && p.project_type && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={generatePlan} disabled={generatingPlan}
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: generatingPlan ? 0.6 : 1 }}>
                  {generatingPlan ? 'Generating...' : `Generate Plan from ${p.project_type} Template`}
                </button>
              </div>
            )}
            {p.plan_generated && phases.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {phases.map((phase, pi) => (
                  <div key={phase.id} style={{ marginBottom: 12, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F9FAFB', borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: C.primary, flexShrink: 0 }}>{pi + 1}</div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', flex: 1 }}>{phase.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: phase.status === 'Completed' ? '#D1FAE5' : phase.status === 'In Progress' ? '#FEF3C7' : '#F3F4F6', color: phase.status === 'Completed' ? '#065F46' : phase.status === 'In Progress' ? '#92400E' : '#6B7280' }}>
                        {phase.status}
                      </span>
                    </div>
                    <div style={{ padding: '6px 14px' }}>
                      {phase.tasks.map(task => (
                        <div key={task.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: task.subtasks?.length ? 'none' : '1px solid #F3F4F6' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: task.status === 'Completed' ? '#059669' : task.status === 'In Progress' ? '#D97706' : '#D1D5DB', flexShrink: 0 }} />
                            <div style={{ fontSize: 13, color: '#374151', flex: 1 }}>{task.title}</div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: task.assigned_name ? '#6B7280' : '#9CA3AF' }}>{task.assigned_name || 'Unassigned'}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{task.due_date ? formatDate(task.due_date) : ''}</div>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: task.status === 'Completed' ? '#D1FAE5' : task.status === 'In Progress' ? '#FEF3C7' : '#F3F4F6', color: task.status === 'Completed' ? '#065F46' : task.status === 'In Progress' ? '#92400E' : '#6B7280' }}>{task.status}</span>
                            <button onClick={() => { setAddSubtaskOf(task.id); setSubtaskForm({ title: '', assigned_to: '', due_date: '', status: 'Open' }) }} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Subtask</button>
                          </div>
                          {task.subtasks?.map(st => (
                            <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 24px', borderBottom: '1px solid #F9FAFB' }}>
                              <div style={{ width: 4, height: 4, borderRadius: '50%', background: st.status === 'Completed' ? '#059669' : '#D1D5DB', flexShrink: 0 }} />
                              <div style={{ fontSize: 12, color: '#6B7280', flex: 1 }}>{st.title}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{st.assigned_name || ''}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{st.due_date ? formatDate(st.due_date) : ''}</div>
                              <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 4, background: st.status === 'Completed' ? '#D1FAE5' : '#F3F4F6', color: st.status === 'Completed' ? '#065F46' : '#6B7280' }}>{st.status}</span>
                            </div>
                          ))}
                          {addSubtaskOf === task.id && (
                            <form onSubmit={addSubtask} style={{ display: 'flex', gap: 6, padding: '6px 0 6px 24px', borderBottom: '1px solid #F3F4F6' }}>
                              <input value={subtaskForm.title} onChange={e => setSubtaskForm({ ...subtaskForm, title: e.target.value })} placeholder="Subtask title" style={{ flex: 1, padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, outline: 'none' }} />
                              <select value={subtaskForm.assigned_to} onChange={e => setSubtaskForm({ ...subtaskForm, assigned_to: e.target.value })} style={{ padding: '4px 6px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 11, background: '#fff' }}>
                                <option value="">Owner</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                              </select>
                              <input type="date" value={subtaskForm.due_date} onChange={e => setSubtaskForm({ ...subtaskForm, due_date: e.target.value })} style={{ padding: '4px 6px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 11 }} />
                              <select value={subtaskForm.status} onChange={e => setSubtaskForm({ ...subtaskForm, status: e.target.value })} style={{ padding: '4px 6px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 11, background: '#fff' }}>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                              <button type="submit" style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: C.primary, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                              <button type="button" onClick={() => setAddSubtaskOf(null)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.border}` }}>
                      {addTaskPhase === phase.id ? (
                        <form onSubmit={addTaskToPhase} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input value={phaseTaskForm.title} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, title: e.target.value })} placeholder="Task title" style={{ flex: 1, padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, outline: 'none' }} />
                          <select value={phaseTaskForm.assigned_to} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, assigned_to: e.target.value })} style={{ padding: '4px 6px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 11, background: '#fff' }}>
                            <option value="">Owner</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                          </select>
                          <input type="date" value={phaseTaskForm.due_date} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, due_date: e.target.value })} style={{ padding: '4px 6px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 11 }} />
                          <select value={phaseTaskForm.status} onChange={e => setPhaseTaskForm({ ...phaseTaskForm, status: e.target.value })} style={{ padding: '4px 6px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 11, background: '#fff' }}>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <button type="submit" style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: C.primary, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                          <button type="button" onClick={() => setAddTaskPhase(null)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                        </form>
                      ) : (
                        <button onClick={() => { setAddTaskPhase(phase.id); setPhaseTaskForm({ title: '', assigned_to: '', due_date: '', status: 'Open' }) }} style={{ padding: '4px 12px', borderRadius: 4, border: '1px dashed #D1D5DB', background: 'none', color: C.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Task</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ═══ FULL WIDTH SECTIONS ═══ */}
        <div>
          {/* DESCRIPTION */}
          {(p.description || editingDesc || hasRole('super_admin', 'admin', 'project_lead')) && (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <SectionTitle icon={<FileIcon />} text="Description" />
                {!editingDesc && p.description && hasRole('super_admin', 'admin', 'project_lead') && (
                  <button onClick={() => { setDescVal(p.description); setEditingDesc(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <EditIcon size={13} /> Edit
                  </button>
                )}
              </div>
              {editingDesc ? (
                <div>
                  <textarea rows={4} value={descVal} onChange={e => setDescVal(e.target.value)} autoFocus
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.8, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={saveDesc} disabled={savingField} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: savingField ? 0.5 : 1 }}>{savingField ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditingDesc(false)} style={{ padding: '7px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginTop: 4 }}>{p.description || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No description added yet.</span>}</div>
              )}
            </div>
          )}

            {/* REMARKS */}
            <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
              <SectionTitle icon={<ChatIcon />} text={`Remarks (${(remarks || []).length})`} />
              <div style={{ marginTop: 14, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChatIcon />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Add a remark</span>
                </div>
                <textarea ref={remarkInputRef} rows={4} value={remarkText} onChange={e => { if (e.target.value.length <= 1000) setRemarkText(e.target.value) }}
                  style={{
                    width: '100%', padding: '12px 14px', border: `1.5px solid ${remarkText.trim() ? C.primary : C.border}`, borderRadius: 10,
                    fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                    lineHeight: 1.6, background: '#fff', color: '#374151', boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                  placeholder="Write your remark here..." />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <button onClick={addRemark} disabled={sending || !remarkText.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: sending || !remarkText.trim() ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                    <SendIcon /> Add Remark
                  </button>
                  {remarkText.trim() && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{remarkText.length} characters</span>}
                </div>
              </div>
              {(!remarks || remarks.length === 0) ? (
                <EmptyState icon={<ChatIcon />} title="No remarks yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {remarks.map((r, i) => {
                    const d = new Date(r.created_at)
                    const now = new Date()
                    const diffMs = now - d
                    const diffMins = Math.floor(diffMs / 60000)
                    const diffHrs = Math.floor(diffMs / 3600000)
                    const diffDays = Math.floor(diffMs / 86400000)
                    let timeAgo
                    if (diffMins < 1) timeAgo = 'just now'
                    else if (diffMins < 60) timeAgo = `${diffMins}m ago`
                    else if (diffHrs < 24) timeAgo = `${diffHrs}h ago`
                    else if (diffDays < 7) timeAgo = `${diffDays}d ago`
                    else timeAgo = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    const author = r.author || 'User'
                    const initial = author.charAt(0).toUpperCase()
                    const avatarColors = ['#5B21B6', '#059669', '#DB2777', '#D97706', '#2563EB', '#DC2626', '#0891B2', '#7C3AED']
                    const avatarColor = avatarColors[author.length % avatarColors.length]
                    const reactionEntries = r.reactions ? Object.entries(r.reactions) : []
                    const isLong = r.text && r.text.replace(/<[^>]*>/g, '').length > 180
                    const isExpanded = expandedRemark === r.id
                    const shortText = isLong ? r.text.replace(/<[^>]*>/g, '').slice(0, 180) + '...' : r.text
                    const isLast = i === remarks.length - 1
                    return (
                      <div key={r.id} style={{ padding: '16px 0', borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{initial}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>{author}</span>
                              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{timeAgo}</span>
                            </div>
                            <div onClick={() => openRemarkEditor(r)} style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, cursor: 'pointer', wordBreak: 'break-word' }}>
                              {isLong ? (
                                <>
                                  {isExpanded ? <span dangerouslySetInnerHTML={{ __html: r.text }} /> : <span>{shortText}</span>}
                                  <span onClick={e => { e.stopPropagation(); setExpandedRemark(isExpanded ? null : r.id) }} style={{ color: C.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}>
                                    {isExpanded ? 'Show less' : 'Show more'}
                                  </span>
                                </>
                              ) : (
                                <span dangerouslySetInnerHTML={{ __html: r.text }} />
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                              {reactionEntries.map(([emoji, reactors]) => (
                                <button key={emoji} onClick={() => toggleReaction(r.id, emoji)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 99, border: `1.5px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer' }}>
                                  <span>{emoji}</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: C.secondary }}>{reactors.length}</span>
                                </button>
                              ))}
                              <AddReactionBtn r={r} showEmojiPicker={showEmojiPicker} setShowEmojiPicker={setShowEmojiPicker} toggleReaction={toggleReaction} EMOJIS={EMOJIS} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* TASKS + DOCUMENTS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* TASKS */}
              <div id="section-tasks" style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px' }}>
                <SectionTitle icon={<CheckCircleIcon />} text={`Tasks (${tasks.length})`} />
                <div style={{ marginTop: 14, marginBottom: 12 }}>
                  <button onClick={() => setShowTaskForm(!showTaskForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <PlusIcon /> Assign Task
                  </button>
                </div>
                {showTaskForm && (
                  <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, padding: '12px', background: '#F8F9FC', borderRadius: 8 }}>
                    <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title..."
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} style={{ flex: 1, padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                        <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
                      </select>
                      <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        style={{ padding: '8px 8px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none' }} />
                    </div>
                    <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })} style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                      <option value="">Assign to...</option>
                      {team.map(t => <option key={t.user_id} value={t.user_id}>{t.user_name} ({t.role_in_project || 'Member'})</option>)}
                    </select>
                    <button type="submit" disabled={!taskForm.title.trim()} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: taskForm.title.trim() ? 1 : 0.5 }}>
                      <PlusIcon /> Add Task
                    </button>
                  </form>
                )}
                {tasks.length === 0 ? (
                  <EmptyState icon={<CheckCircleIcon />} title="No tasks yet" />
                ) : (
                  tasks.map(t => (
                    <div key={t.id} onClick={() => openTaskEditor(t)} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#F8F9FC', borderRadius: 8, marginBottom: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={t.status === 'Completed'} onChange={e => { e.stopPropagation(); updateTaskStatus(t.id, t.status === 'Completed' ? 'Open' : 'Completed') }}
                        style={{ width: 16, height: 16, accentColor: C.primary, cursor: 'pointer', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: t.status === 'Completed' ? C.muted : '#374151', textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>{t.title}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                          {t.priority && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: t.priority === 'Urgent' || t.priority === 'High' ? '#FEE2E2' : '#F0F2F8', color: t.priority === 'Urgent' || t.priority === 'High' ? '#DC2626' : C.secondary }}>{t.priority}</span>}
                          {t.assigned_name && <span style={{ fontSize: 10, color: C.secondary }}>{t.assigned_name}</span>}
                        </div>
                      </div>
                      {t.description && <span style={{ fontSize: 9, color: C.muted, fontStyle: 'italic' }}>notes</span>}
                      {t.due_date && <span style={{ fontSize: 10, color: C.muted }}>{formatDate(t.due_date)}</span>}
                    </div>
                  ))
                )}
              </div>
              {/* ═══ DOCUMENTS & REPORTS (UNIFIED) ═══ */}
            <div id="section-documents" style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px' }}>
              <SectionTitle icon={<PaperclipIcon />} text={`Documents & Reports (${totalDocs + reports.length})`} />
              <div style={{ display: 'flex', gap: 10, marginTop: 14, marginBottom: 14, alignItems: 'center' }}>
                <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                  style={{ padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.card }}>
                  <option value="document">General Document</option>
                  <option value="working">Working Report</option>
                  <option value="final">Final Report</option>
                </select>
                <input ref={fileRef} type="file" onChange={e => { if (!e.target.files?.[0]) return; if (uploadCategory === 'document') { setUploading(true); const fd = new FormData(); fd.append('file', e.target.files[0]); api.post(`/api/projects/${id}/documents`, fd).then(fetchData).catch(() => toast('Upload failed', 'error')).finally(() => { setUploading(false); e.target.value = '' }) } else { uploadReport(e, uploadCategory) } }} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading || reportUploading}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: C.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: uploading || reportUploading ? 0.5 : 1 }}>
                  <UploadIcon /> {uploading || reportUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {(uploading || reportUploading) && <div style={{ fontSize: 12, color: C.primary, marginBottom: 10 }}>Uploading...</div>}

              {(!documents || documents.length === 0) && reports.length === 0 ? (
                <EmptyState icon={<PaperclipIcon />} title="No documents or reports uploaded." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {documents.map(d => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(d.file_name)
                    const isPdf = /\.pdf$/i.test(d.file_name)
                    return (
                      <div key={`doc-${d.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#F8F9FC', borderRadius: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 4, background: isImage ? '#F0F2F8' : isPdf ? '#FEE2E2' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {isImage ? <img src={imgUrls[d.id] || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : isPdf ? <PdfIcon /> : <FileIcon />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.file_name}</div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#EDE9FE', color: C.primary }}>Document</span>
                            <DocStatusBadge status={d.review_status} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {d.file_url && <span onClick={() => openBlob(d.file_url)} style={{ fontSize: 11, color: C.primary, textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}>Open</span>}
                          {user?.role === 'admin' && d.review_status !== 'Approved' && (
                            <><button onClick={() => reviewDoc(d.id, 'Approved')} style={{ fontSize: 10, padding: '2px 6px', border: 'none', borderRadius: 4, background: '#D1FAE5', color: '#059669', fontWeight: 700, cursor: 'pointer' }}>✓</button>
                              <button onClick={() => reviewDoc(d.id, 'Revision Required')} style={{ fontSize: 10, padding: '2px 6px', border: 'none', borderRadius: 4, background: '#FEE2E2', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>✕</button></>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {reports.map(r => {
                    const isWorking = r.report_type === 'working'
                    return (
                      <div key={`rpt-${r.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#F8F9FC', borderRadius: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 4, background: isWorking ? '#EDE9FE' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileIcon />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{r.file_name}</div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: isWorking ? '#EDE9FE' : '#D1FAE5', color: isWorking ? C.primary : '#059669' }}>{isWorking ? 'Working Report' : 'Final Report'}</span>
                            <span style={{ fontSize: 10, color: C.muted }}>v{r.version}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <span onClick={() => openBlob(r.file_url)} style={{ fontSize: 11, color: C.primary, textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}>View</span>
                          <button onClick={() => deleteReport(r.id)} style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Del</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            </div>

            {/* ═══ MEETINGS + NOTES ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12, alignItems: 'start' }}>
              {/* MEETINGS */}
              <div id="section-meetings" style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px' }}>
                <SectionTitle icon={<CalendarIcon />} text={`Meetings (${totalMeetings})`} />
                <div style={{ marginTop: 14, marginBottom: 12 }}>
                  <button onClick={() => setShowMeetingForm(!showMeetingForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <PlusIcon /> Add Meeting
                  </button>
                </div>
                {showMeetingForm && (
                  <form onSubmit={addMeeting} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, padding: '14px', background: '#F8F9FC', borderRadius: 8 }}>
                    <input value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="Meeting title *"
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                    <input type="datetime-local" value={meetingForm.meeting_date} onChange={e => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                    <input value={meetingForm.meeting_link} onChange={e => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })} placeholder="Meeting link (Google Meet / Zoom) *"
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                    <button type="submit" disabled={!meetingForm.title.trim() || !meetingForm.meeting_date || !meetingForm.meeting_link.trim()} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: meetingForm.title.trim() && meetingForm.meeting_date && meetingForm.meeting_link.trim() ? 1 : 0.5 }}>
                      <PlusIcon /> Add
                    </button>
                  </form>
                )}
                {allMeetings.length === 0 ? (
                  <EmptyState icon={<CalendarIcon />} title="No meetings or requests" />
                ) : (
                  <>
                    <style>{`
                      #section-meetings .scroll-area::-webkit-scrollbar { width: 4px }
                      #section-meetings .scroll-area::-webkit-scrollbar-track { background: transparent }
                      #section-meetings .scroll-area::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; opacity: 0 }
                      #section-meetings .scroll-area:hover::-webkit-scrollbar-thumb { opacity: 1 }
                    `}</style>
                    <div className="scroll-area" style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 6 }}>
                    {allMeetings.map(m => {
                      const isReq = m._type === 'request'
                      const status = (m.status || '').toLowerCase()
                      const isCancelled = status === 'cancelled'
                      const isConfirmed = status === 'confirmed'
                      const isScheduled = status === 'scheduled'
                      const isPending = status === 'pending'
                      const statusColor = isConfirmed ? '#059669' : isCancelled ? '#DC2626' : isScheduled ? '#2563EB' : isPending ? '#D97706' : '#6B7280'
                      const statusBg = isConfirmed ? '#D1FAE5' : isCancelled ? '#FEE2E2' : isScheduled ? '#DBEAFE' : isPending ? '#FEF3C7' : '#F3F4F6'
                      const iconBg = isCancelled ? '#FEE2E2' : isReq ? '#FEF3C7' : '#DBEAFE'
                      const iconColor = isCancelled ? '#DC2626' : isReq ? '#D97706' : '#2563EB'
                      return (
                        <div key={`${m._type}-${m.id}`} style={{
                          display: 'flex', gap: 12, padding: '12px 16px', marginBottom: 8,
                          background: isCancelled ? '#F9FAFB' : '#F8F9FC',
                          borderRadius: 10, cursor: 'pointer', opacity: isCancelled ? 0.7 : 1,
                          border: `1px solid ${isCancelled ? '#E5E7EB' : 'transparent'}`,
                          transition: 'background 0.12s',
                        }}
                          onClick={() => navigate(`/meetings?id=${m.id}&type=${isReq ? 'request' : 'meeting'}`)}
                          onMouseOver={e => { if (!isCancelled) e.currentTarget.style.background = '#EEF2FF' }}
                          onMouseOut={e => { if (!isCancelled) e.currentTarget.style.background = '#F8F9FC' }}>
                          {/* Left: color-coded calendar icon */}
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          {/* Middle: title, date, by, status */}
                          <div style={{ flex: 1, minWidth: 0, maxWidth: 'calc(100% - 120px)' }}>
                            <div title={m.title} style={{ fontSize: 13, fontWeight: 600, color: isCancelled ? '#6B7280' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{m.title}</div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: isCancelled ? '#9CA3AF' : C.muted }}>{m.meeting_date ? formatDateTime(m.meeting_date) : '—'}</span>
                              {isReq && m.requested_by_name && <span style={{ fontSize: 11, color: '#9CA3AF' }}>· By {m.requested_by_name}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: statusBg, color: statusColor }}>{m.status || '—'}</span>
                            </div>
                          </div>
                          {/* Right: badge + actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0, width: 80, justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: isReq ? '#FEF3C7' : '#DBEAFE', color: isReq ? '#92400E' : '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isReq ? 'Request' : 'Meeting'}</span>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {m.meeting_link && (
                                <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 10, color: '#fff', background: '#059669', padding: '2px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>Join</a>
                              )}
                              {!isReq && (
                                <span onClick={e => { e.stopPropagation(); /* reschedule handler */ }} style={{ fontSize: 10, color: '#5B21B6', background: '#EEF2FF', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>Reschedule</span>
                              )}
                              {isReq && m.meeting_notes && (
                                <span style={{ fontSize: 9, color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>Has Notes</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    </div>
                  </>
                )}
              </div>
              {/* NOTES */}
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px' }}>
                <SectionTitle icon={<NoteIcon />} text={`Notes (${(notes || []).length})`} />
                <form onSubmit={addNote} style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 16 }}>
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..."
                    onKeyDown={e => { if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && e.ctrlKey)) { e.preventDefault(); addNote(e) } }}
                    style={{ flex: 1, padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#FAFAFA' }} />
                  <button type="submit" disabled={!noteText.trim()} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: noteText.trim() ? 1 : 0.5 }}>Add Note</button>
                </form>
                {(!notes || notes.length === 0) ? (
                  <EmptyState icon={<NoteIcon />} title="No notes." />
                ) : (
                  <div style={{ maxHeight: 440, overflowY: 'auto', paddingRight: 4 }}>
                  {notes.map(n => (
                    <div key={n.id} style={{ padding: '10px 14px', background: '#F8F9FC', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{n.content}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{formatDateTime(n.created_at)}</div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>

            {/* ═══ VULNERABILITIES ═══ */}
            <div id="section-vulnerabilities" style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <SectionTitle icon={<ShieldExclamationIcon size={16} />} text={`Vulnerabilities (${vulnerabilities.length})`} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {vulnOverdueCount > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '3px 10px', borderRadius: 6 }}>{vulnOverdueCount} overdue</span>}
                  <a href="/vulnerabilities" style={{ fontSize: 11, color: C.primary, fontWeight: 600, textDecoration: 'none' }}>View in Vulnerability Dashboard →</a>
                  <button onClick={() => setShowVulnForm(!showVulnForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <PlusIcon /> Add Vulnerability
                  </button>
                </div>
              </div>
              {showVulnForm && (
                <form onSubmit={addVuln} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, padding: '14px', background: '#F8F9FC', borderRadius: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <input value={vulnForm.title} onChange={e => setVulnForm({ ...vulnForm, title: e.target.value })} placeholder="Vulnerability title *"
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                    <select value={vulnForm.severity} onChange={e => setVulnForm({ ...vulnForm, severity: e.target.value })}
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.card, fontFamily: 'inherit' }}>
                      <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                    </select>
                    <select value={vulnForm.status} onChange={e => setVulnForm({ ...vulnForm, status: e.target.value })}
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.card, fontFamily: 'inherit' }}>
                      <option>Open</option><option>In Progress</option><option>Patched</option>
                    </select>
                    <input type="date" value={vulnForm.date_found} onChange={e => setVulnForm({ ...vulnForm, date_found: e.target.value })}
                      style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="date" value={vulnForm.fix_deadline} onChange={e => setVulnForm({ ...vulnForm, fix_deadline: e.target.value })} placeholder="Fix deadline"
                        style={{ flex: 1, padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none' }} />
                      <input type="number" value={vulnForm.sla_days} onChange={e => setVulnForm({ ...vulnForm, sla_days: e.target.value })} placeholder="SLA"
                        style={{ width: 70, padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none' }} />
                    </div>
                    <button type="submit" disabled={vulnSaving || !vulnForm.title.trim()} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: vulnSaving || !vulnForm.title.trim() ? 0.5 : 1 }}>
                      {vulnSaving ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                </form>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select value={vulnFilterSev} onChange={e => setVulnFilterSev(e.target.value)} style={{ padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 11, outline: 'none', background: C.card }}>
                  <option value="">All Severities</option>
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
                <select value={vulnFilterStat} onChange={e => setVulnFilterStat(e.target.value)} style={{ padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 11, outline: 'none', background: C.card }}>
                  <option value="">All Statuses</option>
                  <option>Open</option><option>In Progress</option><option>Patched</option>
                </select>
              </div>
              {vulnerabilities.length === 0 ? (
                <EmptyState icon={<ShieldExclamationIcon size={24} />} title="No vulnerabilities recorded" sub="Add a vulnerability using the button above" />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                        <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase' }}>Title</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase' }}>Severity</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase' }}>Date Found</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase' }}>Fix Deadline</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase' }}>Patched</th>
                        <th style={{ textAlign: 'center', padding: '8px 10px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vulnerabilities.filter(v => {
                        if (vulnFilterSev && v.severity !== vulnFilterSev) return false
                        if (vulnFilterStat && v.status !== vulnFilterStat) return false
                        return true
                      }).map(v => {
                        const sevColors = { Critical: { bg: '#FEE2E2', text: '#991B1B' }, High: { bg: '#FFF7ED', text: '#9A3412' }, Medium: { bg: '#FEF3C7', text: '#92400E' }, Low: { bg: '#DBEAFE', text: '#1E40AF' } }
                        const statColors = { Open: { bg: '#FEF3C7', text: '#92400E' }, 'In Progress': { bg: '#DBEAFE', text: '#1E40AF' }, Patched: { bg: '#D1FAE5', text: '#065F46' } }
                        const sc = sevColors[v.severity] || sevColors.Medium
                        const stc = statColors[v.status] || statColors.Open
                        return (
                          <tr key={v.id} style={{ borderBottom: `1px solid #F3F4F6`, background: v.overdue ? '#FFF5F5' : 'transparent' }}>
                            <td style={{ padding: '10px', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={v.title}>{v.title}</td>
                            <td style={{ textAlign: 'center', padding: 10 }}><span style={{ background: sc.bg, color: sc.text, padding: '2px 10px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>{v.severity}</span></td>
                            <td style={{ textAlign: 'center', padding: 10 }}><span style={{ background: stc.bg, color: stc.text, padding: '2px 10px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>{v.status}</span></td>
                            <td style={{ textAlign: 'center', padding: 10, color: '#6B7280' }}>{formatDate(v.date_found)}</td>
                            <td style={{ textAlign: 'center', padding: 10, color: v.overdue ? '#DC2626' : '#6B7280', fontWeight: v.overdue ? 700 : 400 }}>{formatDate(v.fix_deadline)}</td>
                            <td style={{ textAlign: 'center', padding: 10, color: '#6B7280' }}>{formatDate(v.date_patched)}</td>
                            <td style={{ textAlign: 'center', padding: 10 }}>
                              {v.status !== 'Patched' && (
                                <button onClick={() => markVulnPatched(v.id)} style={{ padding: '4px 10px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Mark Patched</button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* FINDING QUERIES */}
            {queries.length > 0 && (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
                <SectionTitle icon={<ChatIcon />} text={`Finding Queries (${queries.length})`} />
                <div style={{ marginTop: 14 }}>
                  {queries.map(q => (
                    <div key={q.id} style={{ padding: '12px 16px', background: '#F8F9FC', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{q.subject}</div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{q.question}</div>
                      {q.response && (
                        <div style={{ marginTop: 8, padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: `1px solid #EDE9FE` }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 2 }}>Response:</div>
                          <div style={{ fontSize: 13, color: '#374151' }}>{q.response}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ MILESTONES ═══ */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px', marginBottom: 12 }}>
              <SectionTitle icon={<TargetIcon />} text={`Milestones (${milestones.length})`} />
              <button onClick={() => setMstoneForm(mstoneForm ? null : { title: '', due_date: '', description: '' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.primary, fontSize: 11, fontWeight: 700, padding: 0, marginTop: 10 }}>+ Add Milestone</button>
              {mstoneForm && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 10, padding: 10, background: '#F8F9FC', borderRadius: 8 }}>
                  <input value={mstoneForm.title} onChange={e => setMstoneForm({...mstoneForm, title: e.target.value})} placeholder="Title" style={{ flex:1, padding:'6px 8px', border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:11, outline:'none', fontFamily:'inherit' }} />
                  <input type="date" value={mstoneForm.due_date} onChange={e => setMstoneForm({...mstoneForm, due_date: e.target.value})} style={{ padding:'6px 8px', border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:11, outline:'none' }} />
                  <button onClick={async () => { if (!mstoneForm.title) return; await api.post(`/api/projects/${id}/milestones`, mstoneForm); setMstoneForm(null); fetchData() }} style={{ padding:'6px 12px', border:'none', borderRadius:6, background:C.primary, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>Add</button>
                </div>
              )}
              {milestones.length === 0 ? <EmptyState icon={<TargetIcon />} title="No milestones" /> : (
                <div style={{ marginTop: 8 }}>{milestones.map(m => (
                  <div key={m.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:`1px solid #F3F4F6` }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background: m.status === 'Completed' ? '#D1FAE5' : '#FEF3C7', flexShrink:0 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background: m.status === 'Completed' ? '#059669' : '#D97706' }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{m.title}</div>
                      <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{m.due_date ? formatDate(m.due_date) : '—'} · {m.status}</div>
                    </div>
                    {m.status !== 'Completed' && <button onClick={async () => { await api.put(`/api/projects/${id}/milestones/${m.id}`, { status: 'Completed' }); fetchData() }} style={{ fontSize:10, padding:'2px 8px', borderRadius:4, border:'none', background:'#D1FAE5', color:'#059669', fontWeight:700, cursor:'pointer' }}>Done</button>}
                  </div>
                ))}</div>
              )}
            </div>
            {/* TEAM */}
            <div id="section-team" style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionTitle icon={<UsersIcon />} text={`Team (${(team || []).length})`} />
                {hasRole('super_admin', 'admin', 'project_lead') && (
                  <button onClick={() => setShowTeamForm(!showTeamForm)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.primary, fontSize: 11, fontWeight: 700, padding: 0 }}>+ Add</button>
                )}
              </div>
              {showTeamForm && (
                <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, background: '#F8F9FC' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={teamForm.userId} onChange={e => setTeamForm({ ...teamForm, userId: e.target.value })} style={{ flex: 1, padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 11, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                      <option value="">Select user...</option>
                      {users.filter(u => !team.some(t => t.user_id === u.id)).map(u => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                      ))}
                    </select>
                    <button onClick={addTeamMember} disabled={!teamForm.userId} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: C.primary, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Add</button>
                  </div>
                </div>
              )}
              <div style={{ padding: '8px 18px 14px' }}>
                {(team || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '10px 0' }}>No team members yet. Click "+ Add" to assign.</div>
                ) : (
                  team.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: C.primary, flexShrink: 0 }}>
                        {(t.user_name || '?')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.user_name}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{t.role_in_project || 'Member'}</div>
                      </div>
                      {hasRole('admin') && (
                        <button onClick={() => removeTeamMember(t.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: C.muted, padding: 0 }}>×</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          </div>

        {/* ═══ REMARK EDITOR MODAL ═══ */}
        {editRemark && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditRemark(null)}>
            <div style={{ background: '#fff', borderRadius: 16, width: 640, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Edit Remark</span>
                <button onClick={() => setEditRemark(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ padding: '8px 16px', borderBottom: `1px solid #E5E7EB`, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {[
                  { cmd: 'bold', label: 'B', style: { fontWeight: 700 } },
                  { cmd: 'italic', label: 'I', style: { fontStyle: 'italic' } },
                  { cmd: 'underline', label: 'U', style: { textDecoration: 'underline' } },
                  { type: 'sep' },
                  { cmd: 'insertUnorderedList', label: '• List' },
                  { cmd: 'insertOrderedList', label: '1. List' },
                  { type: 'sep' },
                  { cmd: 'formatBlock', val: 'h3', label: 'H3' },
                  { cmd: 'formatBlock', val: 'p', label: 'P' },
                ].map((btn, i) => btn.type === 'sep' ? (
                  <div key={i} style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 4px', alignSelf: 'center' }} />
                ) : (
                  <button key={i} onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd, btn.val) }}
                    style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', ...btn.style }}>{btn.label}</button>
                ))}
              </div>
              <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', minHeight: 180 }}>
                <div ref={remarkEditorRef} contentEditable suppressContentEditableWarning
                  style={{ width: '100%', minHeight: 160, outline: 'none', fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: 'inherit' }} />
              </div>
              <div style={{ padding: '12px 20px', borderTop: `1px solid #E5E7EB`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                {editRemark.text && (
                  <button onClick={() => { setViewRemark(editRemark); setEditRemark(null) }}
                    style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View</button>
                )}
                <button onClick={() => setEditRemark(null)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveRemark} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ REMARK VIEW MODAL ═══ */}
        {viewRemark && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewRemark(null)}>
            <div style={{ background: '#fff', borderRadius: 16, width: 560, maxWidth: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Remark</span>
                <button onClick={() => setViewRemark(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', fontSize: 14, lineHeight: 1.7, color: '#374151' }} dangerouslySetInnerHTML={{ __html: viewRemark.text || '' }} />
              <div style={{ padding: '12px 24px', borderTop: `1px solid #E5E7EB`, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setViewRemark(null); setEditRemark(viewRemark); setTimeout(() => { if (remarkEditorRef.current) remarkEditorRef.current.innerHTML = viewRemark.text || '' }, 50) }}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TASK EDITOR MODAL ═══ */}
        {editTask && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditTask(null)}>
            <div style={{ background: '#fff', borderRadius: 16, width: 620, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{editTask.title}</span>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {editTask.priority && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: editTask.priority === 'Urgent' || editTask.priority === 'High' ? '#FEE2E2' : '#F0F2F8', color: editTask.priority === 'Urgent' || editTask.priority === 'High' ? '#DC2626' : C.secondary }}>{editTask.priority}</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: editTask.status === 'Completed' ? '#D1FAE5' : '#FEF3C7', color: editTask.status === 'Completed' ? '#059669' : '#D97706' }}>{editTask.status}</span>
                  </div>
                </div>
                <button onClick={() => setEditTask(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              {/* Toolbar */}
              <div style={{ padding: '8px 16px', borderBottom: `1px solid #E5E7EB`, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {[
                  { cmd: 'bold', label: 'B', style: { fontWeight: 700 } },
                  { cmd: 'italic', label: 'I', style: { fontStyle: 'italic' } },
                  { cmd: 'underline', label: 'U', style: { textDecoration: 'underline' } },
                  { type: 'sep' },
                  { cmd: 'insertUnorderedList', label: '• List' },
                  { cmd: 'insertOrderedList', label: '1. List' },
                  { type: 'sep' },
                  { cmd: 'formatBlock', val: 'h3', label: 'H3' },
                  { cmd: 'formatBlock', val: 'p', label: 'P' },
                  { type: 'sep' },
                  { cmd: 'outdent', label: '←' }, { cmd: 'indent', label: '→' },
                ].map((btn, i) => btn.type === 'sep' ? (
                  <div key={i} style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 4px', alignSelf: 'center' }} />
                ) : (
                  <button key={i} onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd, btn.val) }}
                    style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', ...btn.style }}>{btn.label}</button>
                ))}
              </div>
              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Description */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid #F3F4F6` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Description</div>
                  <div ref={taskEditorRef} contentEditable suppressContentEditableWarning
                    style={{ width: '100%', minHeight: 80, outline: 'none', fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: 'inherit' }} />
                </div>
                {/* Time Tracking */}
                <div style={{ padding: '12px 20px', borderBottom: `1px solid #F3F4F6`, display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 4 }}>Est. Hours</div>
                    <input type="number" step="0.5" value={editTask.estimated_hours || ''} onChange={async e => { const v = e.target.value; await api.put(`/api/tasks/${editTask.id}`, { estimated_hours: v }); setEditTask({...editTask, estimated_hours: v}) }} placeholder="0" style={{ padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit', width: '100%' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 4 }}>Actual Hours</div>
                    <input type="number" step="0.5" value={editTask.actual_hours || ''} onChange={async e => { const v = e.target.value; await api.put(`/api/tasks/${editTask.id}`, { actual_hours: v }); setEditTask({...editTask, actual_hours: v}) }} placeholder="0" style={{ padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit', width: '100%' }} />
                  </div>
                </div>
                {/* Checklist */}
                <div style={{ padding: '12px 20px', borderBottom: `1px solid #F3F4F6` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                    Checklist {taskDetail?.checklist ? `(${taskDetail.checklist.filter(i=>i.is_completed).length}/${taskDetail.checklist.length})` : ''}
                  </div>
                  {taskDetail?.checklist?.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <input type="checkbox" checked={item.is_completed} onChange={async () => {
                        await api.put(`/api/checklist/${item.id}`, { is_completed: !item.is_completed });
                        const r = await api.get(`/api/tasks/${editTask.id}`); setTaskDetail(r.data);
                        fetchData()
                      }} style={{ width: 14, height: 14, accentColor: C.primary, cursor: 'pointer' }} />
                      <span style={{ fontSize: 13, color: item.is_completed ? C.muted : '#374151', textDecoration: item.is_completed ? 'line-through' : 'none' }}>{item.text}</span>
                    </div>
                  ))}
                  <form onSubmit={async e => { e.preventDefault(); const f = new FormData(e.target); const text = f.get('checklist_text'); if (!text?.trim()) return; await api.post(`/api/tasks/${editTask.id}/checklist`, { text }); e.target.reset(); const r = await api.get(`/api/tasks/${editTask.id}`); setTaskDetail(r.data); fetchData() }} style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <input name="checklist_text" placeholder="Add checklist item..." style={{ flex: 1, padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
                    <button type="submit" style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: C.primary, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+</button>
                  </form>
                </div>
                {/* Comments */}
                <div style={{ padding: '12px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Comments ({taskDetail?.comments?.length || 0})</div>
                  {taskDetail?.comments?.map(c => (
                    <div key={c.id} style={{ padding: '8px 12px', background: '#F8F9FC', borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, color: '#374151' }}>{c.text}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{c.author_name} · {formatDateTime(c.created_at)}</div>
                    </div>
                  ))}
                  <form onSubmit={async e => { e.preventDefault(); const f = new FormData(e.target); const text = f.get('comment_text'); if (!text?.trim()) return; await api.post(`/api/tasks/${editTask.id}/comments`, { text }); e.target.reset(); const r = await api.get(`/api/tasks/${editTask.id}`); setTaskDetail(r.data) }} style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <input name="comment_text" placeholder="Add a comment..." style={{ flex: 1, padding: '6px 8px', border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
                    <button type="submit" style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: C.primary, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Post</button>
                  </form>
                </div>
              </div>
              {/* Footer */}
              <div style={{ padding: '12px 20px', borderTop: `1px solid #E5E7EB`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                {editTask.description && (
                  <button onClick={() => { setViewTask(editTask); setEditTask(null) }}
                    style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View</button>
                )}
                <button onClick={() => setEditTask(null)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                <button onClick={saveTaskDesc} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Desc</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TASK VIEW MODAL ═══ */}
        {viewTask && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewTask(null)}>
            <div style={{ background: '#fff', borderRadius: 16, width: 520, maxWidth: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{viewTask.title}</span>
                <button onClick={() => setViewTask(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', fontSize: 14, lineHeight: 1.7, color: '#374151' }} dangerouslySetInnerHTML={{ __html: viewTask.description || '' }} />
              <div style={{ padding: '12px 24px', borderTop: `1px solid #E5E7EB`, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setViewTask(null); setEditTask(viewTask); setEditTaskDesc(viewTask.description || ''); setTimeout(() => { if (taskEditorRef.current) taskEditorRef.current.innerHTML = viewTask.description || '' }, 50) }}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ MEMBER PROFILE MODAL ═══ */}
        {selectedMember && (() => {
          const memberTasks = tasks.filter(t => t.assigned_to === selectedMember.user_id)
          const completed = memberTasks.filter(t => t.status === 'Completed').length
          const open = memberTasks.filter(t => t.status !== 'Completed').length
          const joinedDate = selectedMember.created_at ? new Date(selectedMember.created_at) : null
          const daysOnProject = joinedDate ? Math.floor((Date.now() - joinedDate.getTime()) / 86400000) : null
          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedMember(null)}>
              <div style={{ background: '#fff', borderRadius: 16, width: 480, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: C.primary, flexShrink: 0 }}>
                    {(selectedMember.user_name || '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{selectedMember.user_name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{selectedMember.designation || selectedMember.role_in_project || 'Team Member'}</div>
                  </div>
                  <button onClick={() => setSelectedMember(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '16px 24px' }}>
                  <div style={{ background: '#F5F3FF', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.primary }}>{memberTasks.length}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>Total Tasks</div>
                  </div>
                  <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>{completed}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>Completed</div>
                  </div>
                  <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706' }}>{open}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>Open</div>
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: '0 24px', fontSize: 12, color: C.muted, marginBottom: 12 }}>
                  Role in project: <strong style={{ color: '#374151' }}>{selectedMember.role_in_project || 'Member'}</strong>
                  {daysOnProject !== null && <span> · Working since <strong style={{ color: '#374151' }}>{daysOnProject} days</strong></span>}
                </div>
                {/* Task list */}
                <div style={{ padding: '0 24px 20px', flex: 1, overflowY: 'auto', maxHeight: 300 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Assigned Tasks</div>
                  {memberTasks.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '20px 0' }}>No tasks assigned</div>
                  ) : (
                    memberTasks.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.status === 'Completed' ? '#059669' : '#D97706', flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: t.status === 'Completed' ? '#059669' : '#D97706' }}>{t.status}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })()}
        
        {/* ═══ EDIT PROJECT MODAL ═══ */}
        {showEditForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowEditForm(false)}>
            <div style={{ background: '#fff', borderRadius: 16, width: 600, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Edit Project</span>
                <button onClick={() => setShowEditForm(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Title *</label>
                    <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Project Manager *</label>
                    <select value={editForm.pm_id} onChange={e => setEditForm({...editForm, pm_id: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                      <option value="">Select PM...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Service Type</label>
                    <select value={editForm.service_type} onChange={e => setEditForm({...editForm, service_type: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                      <option value="">Select...</option>
                      {['VAPT','IS Audit','ISMS Implementation','RBI Audit','Compliance Audit','Cloud Security Audit','Network Security Audit','Application Security','Red Team Assessment','SOC Setup','Other'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Total Value (₹)</label>
                    <input type="number" value={editForm.total_value} onChange={e => setEditForm({...editForm, total_value: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Start Date</label>
                    <input type="date" value={editForm.start_date} onChange={e => setEditForm({...editForm, start_date: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Target Date</label>
                    <input type="date" value={editForm.target_date} onChange={e => setEditForm({...editForm, target_date: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Description</label>
                    <textarea rows={4} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 24px', borderTop: `1px solid #E5E7EB`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setShowEditForm(false)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={async () => {
                  if (!editForm.title.trim() || !editForm.pm_id) { toast('Title and PM required', 'error'); return }
                  try { await api.put(`/api/projects/${id}`, editForm); setShowEditForm(false); fetchData(); toast('Saved') }
                  catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
                }} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

    </div>
  )
}

/* ═══ SMALL REUSABLE COMPONENTS ═══ */

function AddReactionBtn({ r, showEmojiPicker, setShowEmojiPicker, toggleReaction, EMOJIS }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', marginTop: 4 }}>
      <button onClick={() => setShowEmojiPicker(showEmojiPicker === r.id ? null : r.id)}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#9CA3AF', padding: 0 }}>
        {showEmojiPicker === r.id ? 'Cancel' : 'Add reaction'}
      </button>
      {showEmojiPicker === r.id && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, display: 'flex', gap: 2, padding: '4px 6px', background: '#fff', borderRadius: 8, border: `1px solid #E5E7EB`, boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 10 }}>
          {EMOJIS.map(emoji => (
            <button key={emoji} onClick={() => { toggleReaction(r.id, emoji); setShowEmojiPicker(null) }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, padding: '2px 5px', borderRadius: 4 }}
              onMouseEnter={e => e.target.style.background = '#F0F2F8'} onMouseLeave={e => e.target.style.background = 'transparent'}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DocStatusBadge({ status }) {
  if (!status) return null
  const colors = {
    'Pending': { bg: '#FEF3C7', color: '#D97706' },
    'Approved': { bg: '#D1FAE5', color: '#059669' },
    'Revision Required': { bg: '#FEE2E2', color: '#DC2626' },
  }
  const s = colors[status] || { bg: '#F0F2F8', color: '#6B7280' }
  return <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: s.bg, color: s.color }}>{status}</span>
}

function KPICard({ icon, bg, color, label, value, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary }}>{label}</div>
      </div>
    </div>
  )
}

function SectionTitle({ icon, text }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#111827' }}>{icon}{text}</div>
}

function InfoField({ icon, label, value, empty, green, badge }) {
  return (
    <div style={{ background: '#F8F9FC', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 2 }}>
        {icon} {label}
      </div>
      {badge ? (
        <span style={{ color: C.primary, background: '#F0EBFF', display: 'inline-block', padding: '1px 8px', borderRadius: 4, fontSize: 11, border: `1.5px solid #C4B5FD`, fontWeight: 600 }}>{value}</span>
      ) : (
        <div style={{ fontSize: 14, fontWeight: 600, color: empty ? '#D1D5DB' : green ? '#059669' : '#111827' }}>{value}</div>
      )}
    </div>
  )
}

function InfoChip({ icon, value, label, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: highlight ? '#F0EBFF' : '#F0F2F8', fontSize: 12, fontWeight: 600, color: highlight ? C.primary : '#374151' }}>
      {icon}
      {label && <span style={{ color: C.muted, fontWeight: 500 }}>{label}:</span>}
      <span>{value || '—'}</span>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, primary, success, danger }) {
  const bg = success ? '#059669' : danger ? '#DC2626' : primary ? C.primary : '#F0F2F8'
  const color = primary || success || danger ? '#fff' : '#374151'
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 8, border: 'none', background: bg, color, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.15s', whiteSpace: 'nowrap' }}>
      {icon} {label}
    </button>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 10px', color: C.muted }}>
      <div style={{ margin: '0 auto 8px', opacity: 0.3 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function SumItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginTop: 1 }}>{value}</div>
    </div>
  )
}

/* ═══ SVG ICONS ═══ */
function CheckIcon({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
}

function MoneyIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function BriefcaseIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
}

function BuildingIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21h18M3 7v14M21 7v14M6 11h4M10 11h4M14 11h4M6 15h4M10 15h4M14 15h4M6 19h4M10 19h4M14 19h4M6 3h12v4H6z" /></svg>
}

function PersonIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
}

function CalendarIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
}

function CheckCircleIcon({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function TargetIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function UsersIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
}

function PaperclipIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
}

function TagIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path d="M6 6h.008v.008H6V6z" /></svg>
}

function ShieldIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
}

function ShieldExclamationIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285zM12 16.5h.008v.008H12v-.008z" /></svg>
}

function FileIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
}

function ChatIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
}

function SendIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
}

function PlusIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" /></svg>
}

function UploadIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
}

function PdfIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
}

function NoteIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
}

function EditIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
}

function FileTextIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path d="M9 12h3.75M9 15h3.75M9 18h3.75" strokeWidth="1.5" /></svg>
}

function HashIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></svg>
}


