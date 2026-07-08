import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { LeadForm } from './Leads'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const C = {
  bg: '#F0F2F8', card: '#fff', border: '#E5E7EB',
  primary: '#5B21B6', primaryLight: '#F5F3FF',
  text: '#1A1A2E', muted: '#9CA3AF', secondary: '#6B7280',
}

const STAGE_TABS = [
  { key: 'Prospecting', label: 'Prospecting', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0' },
  { key: 'Lead Qualification', label: 'Lead Qualification', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z' },
  { key: 'Demo or Meeting', label: 'Demo or Meeting', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
  { key: 'Proposal', label: 'Proposal', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { key: 'Negotiation & Commitment', label: 'Negotiation', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'Purchase Order', label: 'Purchase Order', icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z' },
  { key: 'Lead Closed (Won)', label: 'Closed Won', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'Converted to Account', label: 'Converted', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
]

const TERMINAL_STAGES = ['Lead Closed (Won)','Lead Closed (Lost)','Converted to Account','Approval Rejected']

function StageIcon({ path, size = 16 }) {
  return <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d={path} /></svg>
}

function StageTab({ tab, isActive, onClick, isTerminal }) {
  return (
    <div onClick={isTerminal ? undefined : onClick} style={{
      flex: 1, minWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 5, padding: '10px 6px', cursor: isTerminal ? 'default' : 'pointer',
      borderBottom: `2.5px solid ${isActive ? C.primary : 'transparent'}`, transition: '0.15s', userSelect: 'none',
      opacity: isTerminal && !isActive ? 0.5 : 1,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isActive ? C.primary : '#F0F2F8', transition: '0.15s',
      }}>
        <StageIcon path={tab.icon} size={14} color={isActive ? '#fff' : '#9CA3AF'} />
      </div>
      <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 600, color: isActive ? C.primary : '#9CA3AF', textAlign: 'center', lineHeight: 1.2 }}>{tab.label}</span>
    </div>
  )
}

export default function LeadsDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [remarkText, setRemarkText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activityForm, setActivityForm] = useState({ activity_type: 'Meeting', title: '', description: '', activity_date: '' })
  const [noteText, setNoteText] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [closeOutcome, setCloseOutcome] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [users, setUsers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectForm, setProjectForm] = useState({ title: '', description: '', service_type: '', pm_id: '', total_value: '', start_date: '', target_date: '' })
  const [creatingProject, setCreatingProject] = useState(false)
  const [confirmStage, setConfirmStage] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(null)
  const [editActivity, setEditActivity] = useState(null)
  const [activityDesc, setActivityDesc] = useState('')
  const [viewActivity, setViewActivity] = useState(null)
  const [proposals, setProposals] = useState([])
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposalForm, setProposalForm] = useState({ amount: '', version: 1, status: 'Draft', notes: '' })
  const [editingProposal, setEditingProposal] = useState(null)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertForm, setConvertForm] = useState({})
  const editorRef = useRef(null)
  const fileRef = useRef(null)
  const remarkInputRef = useRef(null)

  const loadDetail = async () => {
    try { const r = await api.get(`/api/leads/${id}`); setData(r.data) }
    catch (e) {} finally { setLoading(false) }
  }

  const loadProposals = async () => {
    try { const r = await api.get(`/api/leads/${id}/proposals`); setProposals(r.data.proposals) }
    catch (e) {}
  }

  useEffect(() => { loadDetail() }, [id])
  useEffect(() => { api.get('/api/auth/users').then(r => setUsers(r.data.users)).catch(() => {}) }, [])
  useEffect(() => { api.get('/api/accounts').then(r => setAccounts(r.data.accounts)).catch(() => {}) }, [])
  useEffect(() => { loadProposals() }, [id])

  const saveProposal = async (e) => {
    e.preventDefault()
    if (!proposalForm.amount) { toast('Amount is required', 'error'); return }
    try {
      if (editingProposal) {
        await api.put(`/api/leads/${id}/proposals/${editingProposal.id}`, proposalForm)
        toast('Proposal updated')
      } else {
        await api.post(`/api/leads/${id}/proposals`, proposalForm)
        toast('Proposal created')
      }
      setShowProposalForm(false); setEditingProposal(null)
      setProposalForm({ amount: '', version: 1, status: 'Draft', notes: '' })
      loadProposals()
    } catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
  }

  const openConvertModal = () => {
    setConvertForm({
      company_name: l?.company_name || '',
      contact_name: l?.contact_name || '',
      contact_email: l?.contact_email || '',
      contact_phone: l?.contact_phone || '',
      website: l?.website || '',
      address: l?.address || '',
      industry: l?.service_type || '',
    })
    setShowConvertModal(true)
  }

  const convertToAccount = async () => {
    setConverting(true)
    try {
      const r = await api.post(`/api/leads/${id}/convert-to-account`, convertForm)
      setShowConvertModal(false)
      toast(`Account ${r.data.account.acc_id} + Project ${r.data.project.proj_id} created`)
      loadDetail()
    } catch (e) { toast(e.response?.data?.error || 'Conversion failed', 'error') }
    finally { setConverting(false) }
  }

  const addRemark = async (e) => {
    e.preventDefault(); if (!remarkText.trim()) return; setSending(true)
    try { await api.post(`/api/leads/${id}/remarks`, { text: remarkText }); setRemarkText(''); loadDetail(); toast('Remark added') }
    catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
    finally { setSending(false) }
  }

  const changeStage = async (stage) => { try { await api.put(`/api/leads/${id}`, { stage }); loadDetail() } catch (e) {} }

  const closeLead = async (outcome) => {
    try { await api.post(`/api/leads/${id}/close`, { outcome }); setCloseOutcome(null); loadDetail(); toast(`Closed ${outcome}`) }
    catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const requestApproval = async () => {
    try { await api.post(`/api/leads/${id}/request-approval`); loadDetail(); toast('Approval request sent') }
    catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const approveLead = async () => {
    try { const r = await api.post(`/api/leads/${id}/approve`); loadDetail(); toast(`Account ${r.data.account.acc_id} + Project ${r.data.project.proj_id} created`) }
    catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const rejectLead = async () => {
    if (!rejectionReason.trim()) { toast('Provide a reason', 'error'); return }
    try { await api.post(`/api/leads/${id}/reject`, { reason: rejectionReason }); setRejectionReason(''); loadDetail(); toast('Rejected') }
    catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const toggleReaction = async (remarkId, emoji) => {
    try {
      const r = await api.post(`/api/leads/${id}/remarks/${remarkId}/react`, { emoji })
      const updatedRemarks = data.remarks.map(rr => rr.id === remarkId ? r.data.remark : rr)
      setData({ ...data, remarks: updatedRemarks })
    } catch (e) {}
  }

  const [editRemark, setEditRemark] = useState(null)
  const [viewRemark, setViewRemark] = useState(null)
  const remarkEditorRef = useRef(null)
  const openRemarkEditor = (r) => { setEditRemark(r); setViewRemark(null); setTimeout(() => { if (remarkEditorRef.current) remarkEditorRef.current.innerHTML = r.text || '' }, 50) }
  const saveRemark = async () => {
    if (!editRemark) return
    const text = remarkEditorRef.current?.innerHTML || ''
    if (!text.trim()) return
    try { await api.put(`/api/leads/${id}/remarks/${editRemark.id}`, { text }); loadDetail(); setEditRemark(null); toast('Saved') }
    catch (e) { toast('Failed to save', 'error') }
  }

  const EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '🚀']

  const reopenLead = async () => {
    if (!confirm('Reopen lead to Prospecting?')) return
    try { await api.post(`/api/leads/${id}/reopen`); loadDetail(); toast('Reopened') }
    catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const addActivity = async (e) => {
    e.preventDefault(); if (!activityForm.title.trim()) return
    try { await api.post(`/api/leads/${id}/activities`, { ...activityForm, activity_date: activityForm.activity_date || undefined }); setActivityForm({ activity_type: 'Meeting', title: '', description: '', activity_date: '' }); loadDetail() }
    catch (e) {}
  }

  const addNote = async (e) => {
    e.preventDefault(); if (!noteText.trim()) return
    try { await api.post(`/api/leads/${id}/notes`, { content: noteText }); setNoteText(''); loadDetail() } catch (e) {}
  }

  const openActivityEditor = (a) => { setEditActivity(a); setActivityDesc(a.description || ''); setViewActivity(null); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = a.description || '' }, 50) }
  const saveActivityDesc = async () => {
    if (!editActivity) return
    const html = editorRef.current?.innerHTML || activityDesc
    try { await api.put(`/api/leads/${id}/activities/${editActivity.id}`, { description: html }); loadDetail(); setEditActivity(null); toast('Saved') }
    catch (e) { toast('Failed to save', 'error') }
  }
  const execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val); editorRef.current?.focus() }

  const createProject = async (e) => {
    e.preventDefault(); if (!projectForm.title.trim()) return; setCreatingProject(true)
    try {
      const payload = { ...projectForm }
      if (payload.total_value) payload.total_value = parseFloat(payload.total_value); else delete payload.total_value
      if (payload.pm_id) payload.pm_id = parseInt(payload.pm_id); else delete payload.pm_id
      if (!payload.target_date) delete payload.target_date
      await api.post(`/api/leads/${id}/create-project`, payload)
      setShowProjectForm(false); loadDetail(); toast('Project created')
    } catch (e) { toast(e.response?.data?.error || 'Failed', 'error') } finally { setCreatingProject(false) }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true)
    try { const fd = new FormData(); fd.append('file', file); await api.post(`/api/leads/${id}/documents`, fd); loadDetail() }
    catch (e) {} finally { setUploading(false) }
  }

  const handleDrop = async (e) => {
    e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (!file) return; setUploading(true)
    try { const fd = new FormData(); fd.append('file', file); await api.post(`/api/leads/${id}/documents`, fd); loadDetail() }
    catch (e) {} finally { setUploading(false) }
  }

  const formatDate = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  const formatDateTime = (d) => { if (!d) return ''; const dt = new Date(d); return formatDate(d) + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }

  const daysOpen = (d) => { if (!d) return 0; return Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60 * 24)) }

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
  if (!data) return null

  const { lead: l, remarks, activities, documents, notes, audit_logs } = data
  const isClosedOrConverted = TERMINAL_STAGES.includes(l.stage)
  const winProb = l.stage === 'Lead Closed (Won)' || l.stage === 'Converted to Account' ? 100 : l.stage === 'Prospecting' ? 10 : l.stage === 'Lead Qualification' ? 20 : l.stage === 'Demo or Meeting' ? 40 : l.stage === 'Proposal' ? 60 : l.stage === 'Negotiation & Commitment' ? 75 : l.stage === 'Purchase Order' ? 90 : 0
  const totalDocuments = (documents || []).length

  const timeline = [
    ...(activities || []).map(a => ({ ...a, _type: 'manual', _date: a.activity_date || a.created_at })),
    ...(audit_logs || []).map(a => ({ ...a, _type: 'audit', _date: a.changed_at })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date))

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: C.text, fontSize: 14 }}>
      <div style={{ padding: '0 0 40px', width: '100%', maxWidth: 'none' }}>
        {/* ═══ HEADER CARD ═══ */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E8E4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: C.primary, flexShrink: 0 }}>
                {(l.contact_name || l.company_name || '?')[0]}{(l.contact_name || '?')[1] || ''}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.3px' }}>{l.contact_name || 'Unnamed Lead'}</span>
                  <StatusBadge stage={l.stage} approval={l.approval_status} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <InfoChip icon={<BuildingIcon />} value={l.company_name} />
                  <InfoChip icon={<MailIcon />} value={l.contact_email} />
                  <InfoChip icon={<PhoneIcon />} value={l.contact_phone} />
                  <InfoChip icon={<PersonIcon />} value={l.assigned_name} label="Owner" />
                  <InfoChip icon={<CalendarIcon />} value={`Created ${formatDate(l.created_at)}`} />
                  {l.estimated_value && <InfoChip icon={<MoneyIcon />} value={`₹${(l.estimated_value / 100000).toFixed(1)}L`} highlight />}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <ActionBtn icon={<EditIcon />} label="Edit" onClick={() => setShowEdit(true)} primary />
              {(l.stage === 'Lead Closed (Won)' || l.stage === 'Purchase Order') && !l.account_id && (
                <ActionBtn icon={<BriefcaseIcon />} label="Convert to Account" onClick={openConvertModal} success />
              )}
              {l.stage === 'Lead Closed (Won)' && l.approval_status !== 'pending_approval' && l.approval_status !== 'approved' && !l.account_id && (
                <ActionBtn label="Request Approval" onClick={requestApproval} />
              )}
              {l.stage === 'Converted to Account' && (
                <ActionBtn icon={<BriefcaseIcon />} label="Create Project" onClick={() => { setProjectForm({ title: l.subject || '', description: l.description || '', service_type: l.service_type || '', pm_id: l.assigned_to || '', total_value: l.estimated_value || '', start_date: new Date().toISOString().slice(0, 10), target_date: '' }); setShowProjectForm(true) }} primary />
              )}
              {isClosedOrConverted && user?.role === 'admin' && (
                <ActionBtn label="Reopen" onClick={reopenLead} danger />
              )}
              {!isClosedOrConverted && (
                <>
                  <ActionBtn label="Close Won" onClick={() => setCloseOutcome('won')} success />
                  <ActionBtn label="Close Lost" onClick={() => setCloseOutcome('lost')} danger />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ═══ KPI CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
          <KPICard icon={<MoneyIcon />} bg="#ECFDF5" color="#059669" label="Est. Revenue" value={l.estimated_value ? `₹${(l.estimated_value / 100000).toFixed(1)}L` : '—'} />
          <KPICard icon={<TargetIcon />} bg="#F5F3FF" color={C.primary} label="Win Probability" value={`${winProb}%`} />
          <KPICard icon={<CalendarIcon />} bg="#FFF7ED" color="#D97706" label="Days Open" value={`${daysOpen(l.created_at)}d`} />
          <KPICard icon={<CalendarIcon />} bg="#EEF2FF" color="#4F46E5" label="Activities" value={timeline.length} />
          <KPICard icon={<PaperclipIcon />} bg="#FDF2F8" color="#DB2777" label="Documents" value={totalDocuments} />
          <KPICard icon={<CheckCircleIcon />} bg="#ECFDF5" color="#059669" label="Stage" value={l.stage === 'Converted to Account' ? 'Converted' : l.stage} />
        </div>

        {/* ═══ PIPELINE / STAGE TABS ═══ */}
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '8px 12px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0 }}>
            {STAGE_TABS.map((tab, i) => (
              <StageTab key={tab.key} tab={tab} isActive={tab.key === l.stage}
                isTerminal={TERMINAL_STAGES.includes(l.stage) && tab.key !== l.stage}
                onClick={() => !TERMINAL_STAGES.includes(l.stage) && setConfirmStage(tab.key)} />
            ))}
          </div>
        </div>

        {/* ═══ MAIN ═══ */}
        <div>
          <div>
            {/* SUBJECT */}
            {l.subject && (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
                <SectionTitle icon={<FileIcon color={C.primary} />} text="Subject" />
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.5, marginTop: 4 }}>{l.subject}</div>
              </div>
            )}
            {/* DESCRIPTION */}
            {l.description && (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
                <SectionTitle icon={<FileIcon color={C.primary} />} text="Description" />
                <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginTop: 4 }}>{l.description}</div>
              </div>
            )}
            {/* LEAD INFO */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
              <SectionTitle icon={<UserIcon />} text="Lead Information" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
                <InfoField icon={<PersonIcon />} label="Name" value={l.contact_name || '—'} />
                <InfoField icon={<PhoneIcon />} label="Phone" value={l.contact_phone || '—'} />
                <InfoField icon={<MailIcon />} label="Email" value={l.contact_email || '—'} />
                <InfoField icon={<BuildingIcon />} label="Company" value={l.company_name || '—'} />
                <InfoField icon={<GlobeIcon />} label="Website" value={l.website || '—'} empty />
                <InfoField icon={<MapIcon />} label="Address" value={l.address || '—'} empty />
                <InfoField icon={<BuildingIcon />} label="State" value={l.state || '—'} empty />
                <InfoField icon={<TagIcon />} label="Source" value={l.source || l.lead_source || '—'} empty />
                <InfoField icon={<TagIcon />} label="Type" value={l.type || l.lead_type || '—'} empty />
                <InfoField icon={<ShieldIcon />} label="Status" value={l.stage} badge />
                <InfoField icon={<BriefcaseIcon />} label="Service" value={l.service_type || '—'} />
                <InfoField icon={<MoneyIcon />} label="Est. Value" value={l.estimated_value ? `₹${l.estimated_value.toLocaleString()}` : '—'} green />
                <InfoField icon={<PersonIcon />} label="Assigned To" value={l.assigned_name || 'Unassigned'} />
                <InfoField icon={<CheckCircleIcon />} label="Closed On" value={l.closed_on ? formatDate(l.closed_on) : '—'} empty />
                <InfoField icon={<CalendarIcon />} label="Last Updated" value={formatDate(l.updated_at)} />
                <InfoField icon={<PersonIcon />} label="Created By" value={l.created_by_name || '—'} />
              </div>
            </div>

            {/* PROPOSALS */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <SectionTitle icon={<FileIcon />} text={`Proposals (${(proposals || []).length})`} />
                <button onClick={() => { setEditingProposal(null); setProposalForm({ amount: '', version: 1, status: 'Draft', notes: '' }); setShowProposalForm(true) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <PlusIcon /> New Proposal
                </button>
              </div>
              {(!proposals || proposals.length === 0) ? (
                <EmptyState icon={<FileIcon />} title="No proposals yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {proposals.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8F9FC', borderRadius: 8 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: C.primary, flexShrink: 0 }}>{p.proposal_no}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>{p.proposal_no}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>v{p.version} · ₹{p.amount?.toLocaleString()} · {p.prepared_by_name}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: p.status === 'Accepted' ? '#D1FAE5' : p.status === 'Sent' ? '#DBEAFE' : p.status === 'Draft' ? '#F3F4F6' : p.status === 'Rejected' ? '#FEE2E2' : '#FFF7ED', color: p.status === 'Accepted' ? '#065F46' : p.status === 'Sent' ? '#1E40AF' : p.status === 'Draft' ? '#6B7280' : p.status === 'Rejected' ? '#991B1B' : '#9A3412' }}>{p.status}</span>
                      <button onClick={() => { setEditingProposal(p); setProposalForm({ amount: p.amount, version: p.version, status: p.status, notes: p.notes || '' }); setShowProposalForm(true) }}
                        style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#F0F2F8', color: '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REMARKS */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
              <SectionTitle icon={<ChatIcon />} text={`Remarks (${(remarks || []).length})`} />
              <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 20 }}>
                <input ref={remarkInputRef} value={remarkText} onChange={e => { if (e.target.value.length <= 1000) setRemarkText(e.target.value) }}
                  onKeyDown={e => { if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && e.ctrlKey)) { e.preventDefault(); addRemark(e) } }}
                  style={{ flex: 1, padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#FAFAFA' }}
                  placeholder="Add a remark..." />
                <button onClick={addRemark} disabled={sending || !remarkText.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: sending || !remarkText.trim() ? 0.5 : 1 }}>
                  <SendIcon /> Add
                </button>
              </div>
              {(!remarks || remarks.length === 0) ? (
                <EmptyState icon={<ChatIcon />} title="No remarks yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {remarks.map((r, i) => {
                    const isLast = i === remarks.length - 1
                    const d = new Date(r.created_at)
                    const reactionEntries = r.reactions ? Object.entries(r.reactions) : []
                    return (
                      <div key={r.id} style={{ display: 'flex', gap: 14, padding: '14px 0', position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.primary, marginTop: 4, flexShrink: 0, zIndex: 1 }} />
                          {!isLast && <div style={{ position: 'absolute', left: 4, top: 20, bottom: -14, width: 2, background: '#EDE9FE' }} />}
                        </div>
                        <div style={{ minWidth: 100, flexShrink: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div style={{ fontSize: 10, color: C.muted }}>{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div onClick={() => openRemarkEditor(r)} style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.color = C.primary} onMouseLeave={e => e.currentTarget.style.color = '#374151'} dangerouslySetInnerHTML={{ __html: r.text }} />
                          {reactionEntries.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              {reactionEntries.map(([emoji, reactors]) => (
                                <button key={emoji} onClick={() => toggleReaction(r.id, emoji)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 99, border: `1.5px solid ${C.border}`, background: '#F8F9FC', fontSize: 13, cursor: 'pointer' }}>
                                  <span>{emoji}</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: C.secondary }}>{reactors.length}</span>
                                </button>
                              ))}
                              <AddReactionBtn r={r} showEmojiPicker={showEmojiPicker} setShowEmojiPicker={setShowEmojiPicker} toggleReaction={toggleReaction} EMOJIS={EMOJIS} />
                            </div>
                          )}
                          {reactionEntries.length === 0 && <AddReactionBtn r={r} showEmojiPicker={showEmojiPicker} setShowEmojiPicker={setShowEmojiPicker} toggleReaction={toggleReaction} EMOJIS={EMOJIS} />}
                        </div>
                        <span style={{ fontSize: 12, color: C.secondary, flexShrink: 0, fontWeight: 500 }}>{r.author || 'User'}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ACTIVITIES + DOCUMENTS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* ACTIVITIES / TIMELINE */}
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px' }}>
                <SectionTitle icon={<CalendarIcon />} text={`Timeline (${timeline.length})`} />
                <form onSubmit={addActivity} style={{ display: 'flex', gap: 6, marginTop: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                  <select value={activityForm.activity_type} onChange={e => setActivityForm({ ...activityForm, activity_type: e.target.value })}
                    style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                    <option>Meeting</option><option>Call</option><option>Email</option><option>Follow Up</option><option>Demo</option>
                  </select>
                  <input value={activityForm.title} onChange={e => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="Title..."
                    style={{ flex: 1, minWidth: 100, padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                  <input type="date" value={activityForm.activity_date} onChange={e => setActivityForm({ ...activityForm, activity_date: e.target.value })}
                    style={{ padding: '8px 8px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none' }} />
                  <button type="submit" style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <PlusIcon /> Add
                  </button>
                </form>
                {timeline.length === 0 ? (
                  <EmptyState icon={<CalendarIcon />} title="No activities yet" />
                ) : (
                  timeline.map((entry, i) => {
                    const isManual = entry._type === 'manual'
                    const label = isManual ? entry.activity_type : entry.action
                    const title = isManual ? entry.title : entry.new_value
                    const user = isManual ? entry.created_by_name : entry.changed_by_name
                    const date = isManual ? entry.activity_date : entry.changed_at
                    const badgeColor = isManual ? '#5B21B6' : (entry.action === 'Lead Created' ? '#059669' : (entry.action?.includes('Stage') ? '#D97706' : (entry.action?.includes('Closed') || entry.action?.includes('Rejected') ? '#DC2626' : (entry.action?.includes('Approved') || entry.action?.includes('Approval') ? '#059669' : '#6B7280'))))
                    const badgeBg = isManual ? '#F0EBFF' : (entry.action === 'Lead Created' ? '#ECFDF5' : (entry.action?.includes('Stage') ? '#FFF7ED' : (entry.action?.includes('Closed') || entry.action?.includes('Rejected') ? '#FEF2F2' : (entry.action?.includes('Approved') || entry.action?.includes('Approval') ? '#ECFDF5' : '#F3F4F6'))))
                    return (
                      <div key={isManual ? `m${entry.id}` : `a${entry.id}`} onClick={() => isManual && openActivityEditor(entry)} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#F8F9FC', borderRadius: 8, marginBottom: 6, cursor: isManual ? 'pointer' : 'default', transition: '0.1s' }}
                        onMouseEnter={e => { if (isManual) e.currentTarget.style.background = '#F0F2F8' }} onMouseLeave={e => { if (isManual) e.currentTarget.style.background = '#F8F9FC' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: badgeBg, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>{label}</span>
                        <span style={{ fontSize: 13, flex: 1, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                        {user && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{user}</span>}
                        {date && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{formatDate(date)}</span>}
                      </div>
                    )
                  })
                )}
              </div>
              {/* DOCUMENTS */}
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px' }}>
                <SectionTitle icon={<PaperclipIcon />} text={`Documents (${totalDocuments})`} />
                <input ref={fileRef} type="file" onChange={handleUpload} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 14, marginBottom: 14 }}>
                  <UploadIcon /> Upload
                </button>
                {uploading && <div style={{ fontSize: 12, color: C.primary, marginBottom: 10 }}>Uploading...</div>}
                {(!documents || documents.length === 0) ? (
                  <EmptyState icon={<PaperclipIcon />} title="No documents uploaded." />
                ) : (
                  documents.map(d => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(d.file_name)
                    const isPdf = /\.pdf$/i.test(d.file_name)
                    return (
                      <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#F8F9FC', borderRadius: 8, marginBottom: 6 }}>
                        {isImage ? (
                          <div style={{ width: 32, height: 32, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#F0F2F8' }}>
                            <img src={d.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 4, background: isPdf ? '#FEE2E2' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isPdf ? <PdfIcon /> : <FileIcon />}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.file_name}</div>
                          <div style={{ fontSize: 10, color: C.muted }}>{d.uploaded_by_name}</div>
                        </div>
                        {d.file_url && (
                          <a href={d.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Open</a>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* NOTES */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 12 }}>
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
                notes.map(n => (
                  <div key={n.id} style={{ padding: '12px 16px', background: '#F8F9FC', borderRadius: 8, fontSize: 14, color: '#374151', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{n.content}</span>
                    <span style={{ fontSize: 11, color: C.muted, flexShrink: 0, marginLeft: 12 }}>{formatDate(n.created_at)}</span>
                  </div>
                ))
              )}
            </div>

            {/* AUDIT LOG */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
              <SectionTitle icon={<FileIcon />} text={`Audit Log (${(audit_logs || []).length})`} />
              <div style={{ marginTop: 14 }}>
                {(!audit_logs || audit_logs.length === 0) ? (
                  <EmptyState icon={<FileIcon />} title="No audit logs." />
                ) : (
                  audit_logs.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#F8F9FC', borderRadius: 8, marginBottom: 4, alignItems: 'center' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{a.action}</span>
                      {a.new_value && <span style={{ fontSize: 11, color: C.secondary }}>— {a.new_value}</span>}
                      <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{a.changed_by_name || 'System'}</span>
                      <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{formatDateTime(a.changed_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONVERT TO ACCOUNT MODAL ═══ */}
      {showConvertModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowConvertModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 520, maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Create Account</span>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Convert lead to a client account</div>
              </div>
              <button onClick={() => setShowConvertModal(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Company Name <span style={{ color: '#DC2626' }}>*</span></label>
                  <input value={convertForm.company_name} onChange={e => setConvertForm({ ...convertForm, company_name: e.target.value })} required
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Contact Name</label>
                  <input value={convertForm.contact_name} onChange={e => setConvertForm({ ...convertForm, contact_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Email</label>
                  <input value={convertForm.contact_email} onChange={e => setConvertForm({ ...convertForm, contact_email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Phone</label>
                  <input value={convertForm.contact_phone} onChange={e => setConvertForm({ ...convertForm, contact_phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Website</label>
                  <input value={convertForm.website} onChange={e => setConvertForm({ ...convertForm, website: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Industry</label>
                  <input value={convertForm.industry} onChange={e => setConvertForm({ ...convertForm, industry: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Address</label>
                  <input value={convertForm.address} onChange={e => setConvertForm({ ...convertForm, address: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowConvertModal(false)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={convertToAccount} disabled={converting || !convertForm.company_name.trim()}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: converting || !convertForm.company_name.trim() ? 0.6 : 1 }}>
                {converting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PROPOSAL FORM MODAL ═══ */}
      {showProposalForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowProposalForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 480, maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{editingProposal ? 'Edit Proposal' : 'New Proposal'}</span>
              <button onClick={() => setShowProposalForm(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <form onSubmit={saveProposal} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Amount (₹)</label>
                  <input type="number" value={proposalForm.amount} onChange={e => setProposalForm({ ...proposalForm, amount: e.target.value })} required
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} placeholder="e.g., 500000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Version</label>
                  <input type="number" value={proposalForm.version} onChange={e => setProposalForm({ ...proposalForm, version: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Status</label>
                  <select value={proposalForm.status} onChange={e => setProposalForm({ ...proposalForm, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                    <option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option><option>Revised</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Lead</label>
                  <div style={{ padding: '10px 12px', background: '#F0F2F8', borderRadius: 8, fontSize: 13, color: '#374151', fontWeight: 600 }}>{l.lead_id}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Notes</label>
                  <textarea value={proposalForm.notes} onChange={e => setProposalForm({ ...proposalForm, notes: e.target.value })} rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Proposal notes or terms..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <button type="button" onClick={() => setShowProposalForm(false)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{editingProposal ? 'Update' : 'Create Proposal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CREATE PROJECT MODAL ═══ */}
      {showProjectForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }} onClick={() => setShowProjectForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 580, maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Create Project from Lead</span><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Fill project details to start tracking</div></div>
              <button onClick={() => setShowProjectForm(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <form onSubmit={createProject} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Project Title <span style={{ color: '#DC2626' }}>*</span></label>
                  <input value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} required style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} placeholder="e.g., Cloud Security Audit 2026" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Description</label>
                  <textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} rows={3} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Project scope and objectives" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Client Account</label>
                  <div style={{ padding: '10px 12px', background: '#F0F2F8', borderRadius: 8, fontSize: 13, color: '#374151', fontWeight: 600 }}>{l.company_name}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Service Type</label>
                  <select value={projectForm.service_type} onChange={e => setProjectForm({ ...projectForm, service_type: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                    <option value="">Select...</option>
                    {['VAPT','IS Audit','ISMS Implementation','RBI Audit','Compliance Audit','Cloud Security Audit','Network Security Audit','Application Security','Red Team Assessment','SOC Setup','Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Project Manager</label>
                  <select value={projectForm.pm_id} onChange={e => setProjectForm({ ...projectForm, pm_id: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: C.card }}>
                    <option value="">Select PM...</option>
                    {users.filter(u => u.is_active).map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Total Value (₹)</label>
                  <input type="number" value={projectForm.total_value} onChange={e => setProjectForm({ ...projectForm, total_value: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} placeholder="e.g., 350000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Start Date</label>
                  <input type="date" value={projectForm.start_date} onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'block' }}>Target Date</label>
                  <input type="date" value={projectForm.target_date} onChange={e => setProjectForm({ ...projectForm, target_date: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid #E5E7EB` }}>
                <button type="button" onClick={() => setShowProjectForm(false)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={creatingProject || !projectForm.title.trim()} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: creatingProject || !projectForm.title.trim() ? 0.6 : 1 }}>{creatingProject ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* ═══ ACTIVITY EDITOR MODAL ═══ */}
      {editActivity && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditActivity(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 640, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, background: '#F0EBFF', padding: '2px 10px', borderRadius: 99, marginRight: 8 }}>{editActivity.activity_type}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{editActivity.title}</span>
              </div>
              <button onClick={() => setEditActivity(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
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
                { cmd: 'outdent', label: '← Outdent' },
                { cmd: 'indent', label: 'Indent →' },
              ].map((btn, i) => btn.type === 'sep' ? (
                <div key={i} style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 4px', alignSelf: 'center' }} />
              ) : (
                <button key={i} onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd, btn.val) }}
                  style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', ...btn.style }}>{btn.label}</button>
              ))}
            </div>
            {/* Editor */}
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', minHeight: 200 }}>
              <div ref={editorRef} contentEditable suppressContentEditableWarning
                style={{ width: '100%', minHeight: 180, outline: 'none', fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: 'inherit' }}
                placeholder="Write your notes here..." />
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid #E5E7EB`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {editActivity.description && (
                <button onClick={() => { setViewActivity(editActivity); setEditActivity(null) }}
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View</button>
              )}
              <button onClick={() => setEditActivity(null)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveActivityDesc}
                style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ACTIVITY VIEW MODAL ═══ */}
      {viewActivity && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewActivity(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 560, maxWidth: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid #E5E7EB`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, background: '#F0EBFF', padding: '2px 10px', borderRadius: 99, marginRight: 8 }}>{viewActivity.activity_type}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{viewActivity.title}</span>
              </div>
              <button onClick={() => setViewActivity(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', fontSize: 14, lineHeight: 1.7, color: '#374151' }} dangerouslySetInnerHTML={{ __html: viewActivity.description || '' }} />
            <div style={{ padding: '12px 24px', borderTop: `1px solid #E5E7EB`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setViewActivity(null); setEditActivity(viewActivity); setActivityDesc(viewActivity.description || ''); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = viewActivity.description || '' }, 50) }}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {closeOutcome === 'won' && <Modal onClose={() => setCloseOutcome(null)}>
        <ModalIcon bg="#D1FAE5"><CheckIcon size={24} color="#059669" /></ModalIcon>
        <ModalTitle>Close Lead as Won?</ModalTitle>
        <ModalText>Lead will be locked. You can request account creation after closing.</ModalText>
        <ModalActions>
          <ModalBtn onClick={() => setCloseOutcome(null)} secondary>Cancel</ModalBtn>
          <ModalBtn onClick={() => closeLead('won')} bg="#059669">Confirm Close Won</ModalBtn>
        </ModalActions>
      </Modal>}

      {closeOutcome === 'lost' && <Modal onClose={() => setCloseOutcome(null)}>
        <ModalIcon bg="#FEE2E2"><XIcon size={24} color="#DC2626" /></ModalIcon>
        <ModalTitle>Close Lead as Lost?</ModalTitle>
        <ModalText>Lead will be locked and no account will be created.</ModalText>
        <ModalActions>
          <ModalBtn onClick={() => setCloseOutcome(null)} secondary>Cancel</ModalBtn>
          <ModalBtn onClick={() => closeLead('lost')} bg="#DC2626">Confirm Close Lost</ModalBtn>
        </ModalActions>
      </Modal>}

      {closeOutcome === 'reject' && <Modal onClose={() => { setCloseOutcome(null); setRejectionReason('') }}>
        <ModalTitle>Reject Account Creation</ModalTitle>
        <ModalText>Provide a reason for rejection.</ModalText>
        <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} autoFocus
          style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', minHeight: 80, resize: 'vertical', margin: '12px 0', fontFamily: 'inherit' }}
          placeholder="Enter rejection reason..." />
        <ModalActions>
          <ModalBtn onClick={() => { setCloseOutcome(null); setRejectionReason('') }} secondary>Cancel</ModalBtn>
          <ModalBtn onClick={rejectLead} bg="#DC2626">Reject Request</ModalBtn>
        </ModalActions>
      </Modal>}

      {confirmStage && <Modal onClose={() => setConfirmStage(null)}>
        <ModalIcon bg="#FEF3C7"><ArrowRightIcon size={24} color="#F59E0B" /></ModalIcon>
        <ModalTitle>Change Stage?</ModalTitle>
        <ModalText>Move from <strong>{l.stage}</strong> → <strong>{confirmStage}</strong>?</ModalText>
        <ModalActions>
          <ModalBtn onClick={() => setConfirmStage(null)} secondary>Cancel</ModalBtn>
          <ModalBtn onClick={() => { changeStage(confirmStage); setConfirmStage(null) }} bg={C.primary}>Confirm Change</ModalBtn>
        </ModalActions>
      </Modal>}

      {showEdit && <LeadForm editData={l} users={users} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); loadDetail() }} />}
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

function SectionTitle({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {icon} {text}
    </div>
  )
}

function KPICard({ icon, bg, color, label, value }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}

function InfoChip({ icon, value, label, highlight }) {
  if (!value) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: highlight ? '#ECFDF5' : '#F0F2F8', fontSize: 12, fontWeight: 500, color: highlight ? '#059669' : C.secondary }}>
      {icon} {label ? `${label}: ` : ''}{value}
    </span>
  )
}

function ActionBtn({ label, onClick, primary, success, danger, icon }) {
  let bg = '#F1F5F9', color = '#475569'
  if (primary) { bg = C.primary; color = '#fff' }
  if (success) { bg = '#059669'; color = '#fff' }
  if (danger) { bg = '#DC2626'; color = '#fff' }
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: bg, color, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.15s' }}>
      {icon} {label}
    </button>
  )
}

/* ═══ SVG ICONS ═══ */

function Svg({ d, size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><path d={d} /></svg>
}

function EditIcon() { return <Svg d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" size={13} color="#fff" /> }
function PlusIcon() { return <Svg d="M12 4.5v15m7.5-7.5h-15" size={13} color="#fff" /> }
function CheckIcon({ size, color }) { return <Svg d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={size || 16} color={color} /> }
function XIcon({ size, color }) { return <Svg d="M6 18L18 6M6 6l12 12" size={size || 16} color={color} /> }
function ArrowRightIcon({ size, color }) { return <Svg d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" size={size || 16} color={color} /> }
function SendIcon() { return <Svg d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" size={13} color="#fff" /> }
function UploadIcon() { return <Svg d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" size={14} color="#fff" /> }
function UserIcon() { return <Svg d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" size={15} color={C.primary} /> }
function PersonIcon() { return <Svg d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" size={11} /> }
function PhoneIcon() { return <Svg d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" size={11} /> }
function MailIcon() { return <Svg d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" size={11} /> }
function BuildingIcon() { return <Svg d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" size={11} /> }
function GlobeIcon() { return <Svg d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" size={11} /> }
function MapIcon() { return <Svg d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" size={11} /> }
function TagIcon() { return <Svg d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z" size={11} /> }
function ShieldIcon() { return <Svg d="M3 3h2.25a1.5 1.5 0 011.5 1.5v.75m0 0H18a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0118 17.25H6.75A1.5 1.5 0 015.25 15.75V5.25" size={11} /> }
function BriefcaseIcon() { return <Svg d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175" size={11} /> }
function MoneyIcon() { return <Svg d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={11} /> }
function TargetIcon() { return <Svg d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={11} /> }
function CheckCircleIcon() { return <Svg d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={11} /> }
function CalendarIcon() { return <Svg d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" size={11} /> }
function FileIcon({ color }) { return <Svg d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" size={14} color={color} /> }
function ChatIcon() { return <Svg d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.74v6.018z" size={15} color={C.primary} /> }
function NoteIcon() { return <Svg d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" size={15} color={C.primary} /> }
function PaperclipIcon() { return <Svg d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" size={15} color={C.primary} /> }
function PdfIcon() { return <Svg d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" size={16} color="#DC2626" /> }

/* ═══ SUB-COMPONENTS ═══ */

function StatusBadge({ stage, approval }) {
  const active = ['Prospecting','Lead Qualification','Demo or Meeting','Proposal','Negotiation & Commitment','Purchase Order'].includes(stage)
  const c = active ? { border: '#059669', text: '#059669', bg: '#ECFDF5' } : { border: C.primary, text: C.primary, bg: '#F5F3FF' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, border: `1.5px solid ${c.border}`, color: c.text, background: c.bg }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
      {approval === 'pending_approval' ? 'Pending Approval' : stage}
    </span>
  )
}

function InfoField({ icon, label, value, empty, green, badge }) {
  return (
    <div style={{ background: '#F8F9FC', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4 }}>
        {icon} {label}
      </div>
      {badge ? (
        <span style={{ color: C.primary, background: '#F0EBFF', display: 'inline-block', padding: '2px 10px', borderRadius: 6, fontSize: 12, border: `1.5px solid #C4B5FD`, fontWeight: 600 }}>{value}</span>
      ) : (
        <div style={{ fontSize: 15, fontWeight: 600, color: empty ? '#D1D5DB' : green ? '#059669' : '#111827' }}>{value}</div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 10px', color: C.muted }}>
      <div style={{ margin: '0 auto 10px', opacity: 0.3 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
function ModalIcon({ children, bg }) {
  return <div style={{ width: 48, height: 48, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{children}</div>
}
function ModalTitle({ children }) {
  return <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>{children}</div>
}
function ModalText({ children }) {
  return <div style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>{children}</div>
}
function ModalActions({ children }) {
  return <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>{children}</div>
}
function ModalBtn({ children, onClick, secondary, bg }) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none',
      background: secondary ? '#F1F5F9' : bg || C.primary, color: secondary ? '#475569' : '#fff',
      cursor: 'pointer', transition: '0.15s',
    }}>{children}</button>
  )
}
