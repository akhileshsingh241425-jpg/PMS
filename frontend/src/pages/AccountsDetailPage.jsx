import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  ChevronLeft, Calendar, FileText, Briefcase,
  Clock, MessageSquare, Send, Users, Building2,
  Phone, Mail, Globe, MapPin, Hash, Tag, User,
  Edit3, MoreHorizontal, Target, CheckCircle,
  Activity, Download, Trash2, Upload, Plus,
  Bookmark, Paperclip, AlertTriangle, Info,
  DollarSign, TrendingUp, UserCircle,
  ChevronRight, ExternalLink, BarChart3,
  FolderOpen, ListChecks, PlusCircle,
  Bell, Pause, Play, XCircle, UserPlus
} from 'lucide-react'

const STAGE_COLORS = {
  'Prospecting': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  'Qualification': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  'Lead Qualification': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  'Needs Analysis': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  'Demo or Meeting': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Value Proposition': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Identify Decision Makers': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Perception Analysis': { bg: '#FFF7ED', text: '#9A3412', dot: '#F97316' },
  'Proposal': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Proposal/Price Quote': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Negotiation': { bg: '#FFF7ED', text: '#9A3412', dot: '#F97316' },
  'Negotiation/Review': { bg: '#FFF7ED', text: '#9A3412', dot: '#F97316' },
  'Negotiation & Commitment': { bg: '#FFF7ED', text: '#9A3412', dot: '#F97316' },
  'Execution': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Planning': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  'Purchase Order': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  'Closed Won': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  'Closed Lost': { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  'Lead Closed': { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  'Lead Converted': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  'Active': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  'Inactive': { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  'Completed': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  'In Progress': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Open': { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  'Pending': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  'Approved': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  'Rejected': { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  '(Requested)': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  'Scheduled': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
}

const PRIORITY_COLORS = {
  'Low': { bg: '#F3F4F6', text: '#6B7280', dot: '#D1D5DB' },
  'Medium': { bg: '#FFF7ED', text: '#9A3412', dot: '#F59E0B' },
  'High': { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
}

const STATUS_COLORS = {
  'Open': { bg: '#F3F4F6', text: '#6B7280', dot: '#D1D5DB' },
  'In Progress': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Completed': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
}

const ACTIVITY_ICONS = {
  note: { icon: Bookmark, color: '#8B5CF6', bg: '#EDE9FE' },
  meeting: { icon: Calendar, color: '#3B82F6', bg: '#DBEAFE' },
  opportunity: { icon: Target, color: '#F59E0B', bg: '#FEF3C7' },
  lead: { icon: TrendingUp, color: '#22C55E', bg: '#D1FAE5' },
  task: { icon: CheckCircle, color: '#EC4899', bg: '#FCE7F3' },
  document: { icon: FileText, color: '#6B7280', bg: '#F3F4F6' },
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const formatCurrency = (v) => {
  if (!v) return null
  return '₹' + Number(v).toLocaleString('en-IN')
}

const TICKER_ITEMS = [
  { icon: '🔴', type: 'High Priority', message: 'Prepare Preliminary Findings Report due Today', time: '02:00 PM', priority: 'high', link: '#' },
  { icon: '📅', type: 'Meeting', message: 'Kickoff - Cloud Security Audit at 10:00 AM', time: 'Today', priority: 'medium', link: '#' },
  { icon: '💰', type: 'Opportunity', message: 'OPP0003 moved to Proposal Stage', time: '2h ago', priority: 'low', link: '#' },
  { icon: '🟢', type: 'Lead', message: 'LD0003 converted into Account', time: '3h ago', priority: 'completed', link: '#' },
  { icon: '📄', type: 'Document', message: 'New Proposal.pdf uploaded by Project Lead', time: '5h ago', priority: 'low', link: '#' },
  { icon: '⚠', type: 'Alert', message: '2 Finding Queries awaiting response', time: '1d ago', priority: 'high', link: '#' },
  { icon: '🎉', type: 'Milestone', message: 'Project PRJ0003 moved to Execution', time: '1d ago', priority: 'completed', link: '#' },
  { icon: '📌', type: 'Follow-up', message: 'Follow-up Meeting scheduled for Tomorrow • 11:00 AM', time: '1d ago', priority: 'medium', link: '#' },
]

const PRIORITY_STYLES = {
  high: { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
  medium: { bg: '#FFF7ED', text: '#EA580C', dot: '#EA580C' },
  low: { bg: '#EFF6FF', text: '#2563EB', dot: '#2563EB' },
  completed: { bg: '#F0FDF4', text: '#16A34A', dot: '#16A34A' },
}

const timeAgo = (d) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(d)
}

export default function AccountsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [contactForm, setContactForm] = useState({ salutation: '', first_name: '', last_name: '', email: '', phone: '', mobile: '', designation: '', department: '', is_primary: false, notes: '' })
  const [showOppForm, setShowOppForm] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingModalItem, setMeetingModalItem] = useState(null)
  const [meetingModalType, setMeetingModalType] = useState('meeting') // 'meeting' | 'request'
  const [meetingResponseForm, setMeetingResponseForm] = useState({ status: 'Confirmed', confirmed_date: '', meeting_link: '', team_remarks: '' })
  const [responding, setResponding] = useState(false)
  const [oppForm, setOppForm] = useState({
    company_name: '', contact_name: '', contact_email: '', contact_phone: '',
    source: 'Referral', service_interest: '', description: '', stage: 'Prospecting',
    estimated_value: '', expected_close_date: '', assigned_to: '',
    referral_notes: '', location: '', product_interest: '', referral_status: 'New Referral',
  })
  const [savingOpp, setSavingOpp] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [referralData, setReferralData] = useState(null)
  const [referralTimeline, setReferralTimeline] = useState([])
  const fileRef = useRef(null)
  const tickerRef = useRef(null)
  const [tickerPaused, setTickerPaused] = useState(false)
  const [mobileIdx, setMobileIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showPortalForm, setShowPortalForm] = useState(false)
  const [portalForm, setPortalForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', designation: '' })
  const [savingPortal, setSavingPortal] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const interval = setInterval(() => {
      if (!tickerPaused) setMobileIdx(i => (i + 1) % TICKER_ITEMS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isMobile, tickerPaused])

  const goNext = () => setMobileIdx(i => (i + 1) % TICKER_ITEMS.length)
  const goPrev = () => setMobileIdx(i => (i - 1 + TICKER_ITEMS.length) % TICKER_ITEMS.length)
  const togglePause = () => setTickerPaused(p => !p)

  const loadDetail = async () => {
    try {
      const response = await api.get(`/api/accounts/${id}`)
      setData(response.data)
    } catch (error) {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadDetail() }, [id])
  useEffect(() => {
    if (activeTab === 'referrals' && id) {
      api.get(`/api/accounts/${id}/referral-dashboard`).then(r => setReferralData(r.data)).catch(() => {})
      api.get(`/api/accounts/${id}/referral-timeline`).then(r => setReferralTimeline(r.data.timeline || [])).catch(() => {})
    }
  }, [activeTab, id])

  const openContactForm = (c) => {
    setEditContact(c || null)
    setContactForm(c ? {
      salutation: c.salutation || '', first_name: c.first_name || '', last_name: c.last_name || '',
      email: c.email || '', phone: c.phone || '', mobile: c.mobile || '',
      designation: c.designation || '', department: c.department || '',
      is_primary: c.is_primary || false, notes: c.notes || '',
    } : { salutation: '', first_name: '', last_name: '', email: '', phone: '', mobile: '', designation: '', department: '', is_primary: false, notes: '' })
    setShowContactForm(true)
  }
  const saveContact = async () => {
    if (!contactForm.first_name.trim()) return
    try {
      if (editContact) {
        await api.put(`/api/accounts/${id}/contacts/${editContact.id}`, contactForm)
      } else {
        await api.post(`/api/accounts/${id}/contacts`, contactForm)
      }
      setShowContactForm(false); setEditContact(null); loadDetail()
    } catch (e) {}
  }
  const deleteContact = async (cid) => {
    if (!confirm('Delete this contact?')) return
    try { await api.delete(`/api/accounts/${id}/contacts/${cid}`); loadDetail() } catch (e) {}
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    setAddingNote(true)
    try {
      const p = data?.projects?.[0]
      if (!p) { alert('Create a project first to add notes.'); return }
      await api.post('/api/notes', { content: noteText, project_id: p.id })
      setNoteText('')
      loadDetail()
    } catch (error) {}
    finally { setAddingNote(false) }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const fd = new FormData(); fd.append('file', file)
      const p = data?.projects?.[0]
      if (p) await api.post(`/api/projects/${p.id}/documents`, fd)
      loadDetail()
    } catch (e) {} finally { e.target.value = '' }
  }

  const getStageStyle = (stage) => STAGE_COLORS[stage] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' }

  if (loading) return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="flex items-center gap-3" style={{ color: '#6B7280' }}>
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span style={{ fontSize: '14px' }}>Loading account details...</span>
      </div>
    </div>
  )
  if (!data) return null

  const { account: acc, contacts = [], opportunities = [], leads = [], referral_leads = [], projects = [], documents = [], tasks = [], meetings = [], notes = [], meeting_requests = [], finding_queries = [], client_users = [] } = data

  const allTimelineItems = [
    ...notes.map(n => ({ ...n, _type: 'note', _date: n.created_at })),
    ...meetings.map(m => ({ ...m, _type: 'meeting', _date: m.meeting_date })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date))

  const lastActivity = allTimelineItems[0]?._date

  return (
    <div style={{ background: '#F6F8FC', minHeight: '100vh', padding: '0 4px 32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <button onClick={() => navigate('/accounts')} className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '12px', fontWeight: 500, padding: 0 }}>
          <ChevronLeft className="w-4 h-4" /> Back to Accounts
        </button>

        {/* ═══ ACTIVITY TICKER ═══ */}
        <div style={{
          background: '#F8FAFC', borderRadius: '14px', borderLeft: '4px solid #5B3DF5',
          boxShadow: '0 2px 10px rgba(0,0,0,.04)', marginBottom: '16px', height: '52px',
          display: 'flex', alignItems: 'center', overflow: 'hidden', border: '1px solid #E8EAF2',
          borderLeftWidth: '4px',
        }}
          className="activity-ticker"
          onMouseEnter={() => !isMobile && setTickerPaused(true)}
          onMouseLeave={() => !isMobile && setTickerPaused(false)}
        >
          {/* Bell icon */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '100%', flexShrink: 0,
            borderRight: '1px solid #E8EAF2', position: 'relative',
          }}>
            <Bell className="w-4 h-4" style={{ color: '#5B3DF5' }} />
            <span style={{
              position: 'absolute', top: '13px', right: '13px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#DC2626', animation: 'pulse-dot 2s infinite',
            }} />
          </div>

          {/* Desktop: marquee scroll */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}
            className="ticker-desktop"
          >
            <div ref={tickerRef} style={{
              display: 'flex', gap: '40px', whiteSpace: 'nowrap', alignItems: 'center',
              height: '100%', paddingLeft: '20px',
              animation: tickerPaused ? 'none' : 'marquee 45s linear infinite',
            }}>
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <div key={i} className="flex items-center gap-2 ticker-item" style={{ cursor: 'pointer', height: '100%' }}
                  onClick={() => alert('Navigate to: ' + item.message)}>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{item.icon}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                    color: PRIORITY_STYLES[item.priority].text,
                    background: PRIORITY_STYLES[item.priority].bg,
                    padding: '2px 7px', borderRadius: '4px',
                  }}>{item.type}</span>
                  <span style={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>{item.message}</span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>{item.time}</span>
                  <span style={{ width: '1px', height: '14px', background: '#E8EAF2', display: 'inline-block' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: single item */}
          <div style={{ flex: 1, padding: '0 16px', overflow: 'hidden' }}
            className="ticker-mobile"
            onTouchStart={e => { e.currentTarget._sx = e.touches[0].clientX }}
            onTouchEnd={e => {
              const dx = e.changedTouches[0].clientX - (e.currentTarget._sx || 0)
              if (Math.abs(dx) > 40) { dx > 0 ? goPrev() : goNext() }
            }}
          >
            <div className="flex items-center gap-2" style={{ cursor: 'pointer' }}
              onClick={() => alert('Navigate to: ' + TICKER_ITEMS[mobileIdx].message)}>
              <span style={{ fontSize: '16px' }}>{TICKER_ITEMS[mobileIdx].icon}</span>
              <span style={{
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                color: PRIORITY_STYLES[TICKER_ITEMS[mobileIdx].priority].text,
                background: PRIORITY_STYLES[TICKER_ITEMS[mobileIdx].priority].bg,
                padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
              }}>{TICKER_ITEMS[mobileIdx].type}</span>
              <span style={{ fontSize: '13px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{TICKER_ITEMS[mobileIdx].message}</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>{TICKER_ITEMS[mobileIdx].time}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0.5" style={{ paddingRight: '10px', flexShrink: 0 }}>
            {[
              { icon: ChevronLeft, action: goPrev },
              { icon: tickerPaused ? Play : Pause, action: togglePause },
              { icon: ChevronRight, action: goNext },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action}
                style={{
                  width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: 'none', background: 'transparent',
                  borderRadius: '6px', cursor: 'pointer', color: '#6B7280', transition: 'all .15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#5B3DF5' }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280' }}
              >
                <btn.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* ═══ 1. HEADER ═══ */}
        <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.05)', border: '1px solid #ECECEC', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '28px 32px' }}>
            <div className="flex items-start justify-between gap-6" style={{ marginBottom: '16px' }}>
              <div className="flex items-start gap-5">
                <div style={{ width: '72px', height: '72px', borderRadius: '14px', background: 'linear-gradient(135deg, #5B3DF5, #7C5CFC)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(91,61,245,.2)' }}>
                  <span style={{ color: '#fff', fontSize: '28px', fontWeight: 700 }}>{(acc.company_name || '?')[0]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', margin: 0, lineHeight: 1.2 }}>{acc.company_name}</h1>
                    <BadgeDot stage={acc.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ color: '#6B7280', fontSize: '13px' }}>
                    <span style={{ fontWeight: 500 }}>{acc.acc_id}</span>
                    <span style={{ color: '#D1D5DB' }}>|</span>
                    <span>{acc.industry || '—'}</span>
                    <span style={{ color: '#D1D5DB' }}>|</span>
                    <span>{acc.account_type}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3" style={{ color: '#6B7280', fontSize: '13px' }}>
                    {acc.contact_name && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" style={{ color: '#5B3DF5' }} />{acc.contact_name}</span>}
                    {acc.contact_phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" style={{ color: '#5B3DF5' }} />{acc.contact_phone}</span>}
                    {acc.contact_email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" style={{ color: '#5B3DF5' }} />{acc.contact_email}</span>}
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" style={{ color: '#5B3DF5' }} />{acc.city || acc.state || '—'}</span>
                  </div>
                  {/* Meta dates */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2" style={{ color: '#9CA3AF', fontSize: '12px' }}>
                    <span>Created: {formatDate(acc.created_at)}</span>
                    <span>Updated: {formatDate(acc.updated_at)}</span>
                    {lastActivity && <span>Last Activity: {formatDate(lastActivity)}</span>}
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <ActionBtn icon={<Briefcase className="w-4 h-4" />} label="Create Project" onClick={() => navigate(`/projects?create=1&account_id=${id}`)} />
                {client_users.length > 0 ? (
                  <button onClick={() => { setPortalForm({ email: client_users[0].email, password: '', first_name: '', last_name: '', phone: '', designation: '' }); setShowPortalForm(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#059669', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#DCFCE7'; e.currentTarget.style.borderColor = '#86EFAC' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.borderColor = '#BBF7D0' }}>
                    <UserPlus className="w-4 h-4" /> Portal Active ({client_users[0].email})
                  </button>
                ) : (
                  <ActionBtn icon={<UserPlus className="w-4 h-4" />} label="Portal Access" onClick={() => { setPortalForm({ email: '', password: '', first_name: '', last_name: '', phone: '', designation: '' }); setShowPortalForm(true) }} />
                )}
                <ActionBtn icon={<PlusCircle className="w-4 h-4" />} label="Refer Client" onClick={() => { setOppForm({ ...oppForm, company_name: '' }); setShowOppForm(true) }} />
                <ActionBtn icon={<Calendar className="w-4 h-4" />} label="Add Meeting" />
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', border: 'none', background: '#5B3DF5', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#4727F5'}
                  onMouseOut={e => e.currentTarget.style.background = '#5B3DF5'}>
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #E5E7EB' }}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'referrals', label: 'Referrals', count: opportunities.length },
            { key: 'projects', label: 'Projects', count: projects.length },
            { key: 'contacts', label: 'Contacts', count: contacts.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: 'none', background: 'none', color: activeTab === tab.key ? '#5B3DF5' : '#6B7280',
                borderBottom: activeTab === tab.key ? '2.5px solid #5B3DF5' : '2.5px solid transparent',
                marginBottom: -2, transition: '0.15s', display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {tab.label}
              {tab.count !== undefined && <span style={{ fontSize: 11, background: activeTab === tab.key ? '#EDE9FE' : '#F3F4F6', color: activeTab === tab.key ? '#5B3DF5' : '#9CA3AF', padding: '1px 8px', borderRadius: 99, fontWeight: 700 }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
        <div>
        {/* ═══ KPI CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          <KpiCard icon={Target} bg="#EDE9FE" color="#5B21B6" label="Total Projects" value={projects.length} />
          <KpiCard icon={DollarSign} bg="#D1FAE5" color="#059669" label="Revenue" value={projects.reduce((s,p) => s + (p.total_value || 0), 0) ? `₹${(projects.reduce((s,p) => s + (p.total_value || 0), 0) / 100000).toFixed(1)}L` : '—'} />
          <KpiCard icon={TrendingUp} bg="#FEF3C7" color="#D97706" label="Opportunities" value={opportunities.length + referral_leads.length} />
          <KpiCard icon={Users} bg="#DBEAFE" color="#2563EB" label="Contacts" value={contacts.length} />
          <KpiCard icon={FileText} bg="#FCE7F3" color="#DB2777" label="Documents" value={documents.length} />
        </div>

        {/* ═══ 2-COLUMN: ACCOUNT INFO | ACTIVITY TIMELINE ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '32px', marginBottom: '32px', alignItems: 'start' }}>

          {/* LEFT: Account Information */}
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.05)', border: '1px solid #ECECEC' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #ECECEC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 className="w-4 h-4" style={{ color: '#5B3DF5' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: 0 }}>Account Information</h3>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
                <InfoRow2 label="Client ID" value={acc.acc_id} />
                <InfoRow2 label="Company Name" value={acc.company_name} />
                <InfoRow2 label="Client Name" value={acc.contact_name || '—'} />
                <InfoRow2 label="Phone" value={acc.contact_phone || '—'} />
                <InfoRow2 label="Email" value={acc.contact_email || '—'} />
                <InfoRow2 label="Website" value={acc.website || '—'} />
                <InfoRow2 label="Nature of Business" value={acc.industry || '—'} />
                <InfoRow2 label="GST No." value={acc.gst_no || '—'} />
                <InfoRow2 label="Address" value={acc.address || '—'} />
                <InfoRow2 label="State" value={acc.state || '—'} />
                <InfoRow2 label="Country" value={acc.country || '—'} />
                <InfoRow2 label="Pincode" value={acc.pincode || '—'} />
                <InfoRow2 label="Created" value={formatDate(acc.created_at)} />
                <InfoRow2 label="Updated" value={formatDate(acc.updated_at)} />
              </div>
            </div>
          </div>

          {/* RIGHT: Activity Timeline */}
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.05)', border: '1px solid #ECECEC' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #ECECEC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity className="w-4 h-4" style={{ color: '#5B3DF5' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: 0 }}>Activity Timeline</h3>
            </div>
            <div style={{ padding: '20px 24px', maxHeight: '520px', overflowY: 'auto' }}>
              {allTimelineItems.length > 0 ? (
                <div style={{ position: 'relative', paddingLeft: '28px' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '2px', background: '#E8EAF2', borderRadius: '1px' }} />
                  {allTimelineItems.slice(0, 15).map((item, idx) => {
                    const isNote = item._type === 'note'
                    const iconDef = isNote ? ACTIVITY_ICONS.note : ACTIVITY_ICONS.meeting
                    const Icon = iconDef.icon
                    const d = new Date(isNote ? item.created_at : item.meeting_date)
                    return (
                      <div key={item.id || idx} style={{ position: 'relative', marginBottom: '18px' }}>
                        <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '28px', height: '28px', borderRadius: '8px', background: iconDef.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, transition: 'all .2s' }}
                          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${iconDef.bg}` }}
                          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: iconDef.color }} />
                        </div>
                        <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#F6F8FC', transition: 'all .2s' }}
                          onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                          onMouseOut={e => e.currentTarget.style.background = '#F6F8FC'}>
                          <div className="flex items-center gap-2 text-xs" style={{ color: iconDef.color, fontWeight: 600, marginBottom: '3px' }}>
                            <span>{formatDate(d)}</span>
                            <span>{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#1F2937', margin: 0, fontWeight: 500 }}>{isNote ? item.content : item.title}</p>
                          <p style={{ fontSize: '11px', color: '#6B7280', margin: '3px 0 0' }}>
                            {isNote ? `Note by ${item.author || '—'}` : `Meeting by ${item.created_by_name || '—'}`}
                            <span style={{ color: '#D1D5DB', margin: '0 6px' }}>·</span>
                            {timeAgo(isNote ? item.created_at : item.meeting_date)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9CA3AF' }}>
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>No activity yet</p>
                  <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Activities will appear here as you work</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ CONTACTS ═══ */}
        <SectionCard title="Contacts" icon={User} iconColor="#8B5CF6" count={contacts.length} onViewAll={() => {}}>
          <div style={{ padding: '0 0 8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => openContactForm(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          </div>
          {contacts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {contacts.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#5B21B6', flexShrink: 0 }}>
                    {(c.first_name?.[0] || '?')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{c.full_name}</span>
                      {c.is_primary && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#D1FAE5', color: '#059669' }}>PRIMARY</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                      {[c.designation, c.department].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                      {[c.email, c.phone].filter(Boolean).join(' | ') || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => openContactForm(c)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#F3F4F6', color: '#6B7280', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit</button>
                    <button onClick={() => deleteContact(c.id)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: '#9CA3AF' }}>
              <User className="w-8 h-8 mx-auto mb-2" />
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>No contacts yet</p>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>Add contacts for this account</p>
            </div>
          )}
        </SectionCard>

        {/* ═══ CONTACT FORM MODAL ═══ */}
        {showContactForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowContactForm(false)}>
            <div style={{ background: '#fff', borderRadius: 16, width: 500, maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{editContact ? 'Edit Contact' : 'Add Contact'}</span>
                <button onClick={() => setShowContactForm(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280' }}>✕</button>
              </div>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Salutation</label>
                    <select value={contactForm.salutation} onChange={e => setContactForm({ ...contactForm, salutation: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff', marginTop: 4 }}>
                      <option value="">—</option>
                      <option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>First Name *</label>
                      <input value={contactForm.first_name} onChange={e => setContactForm({ ...contactForm, first_name: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Last Name</label>
                      <input value={contactForm.last_name} onChange={e => setContactForm({ ...contactForm, last_name: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Email</label>
                    <input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Phone</label>
                    <input value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Mobile</label>
                    <input value={contactForm.mobile} onChange={e => setContactForm({ ...contactForm, mobile: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Designation</label>
                    <input value={contactForm.designation} onChange={e => setContactForm({ ...contactForm, designation: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Department</label>
                    <input value={contactForm.department} onChange={e => setContactForm({ ...contactForm, department: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                      <input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm({ ...contactForm, is_primary: e.target.checked })} style={{ width: 16, height: 16 }} />
                      Primary Contact
                    </label>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Notes</label>
                  <textarea value={contactForm.notes} onChange={e => setContactForm({ ...contactForm, notes: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ padding: '12px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setShowContactForm(false)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveContact} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{editContact ? 'Update' : 'Add Contact'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PROJECTS ═══ */}
        <SectionCard title="Projects" icon={Briefcase} iconColor="#3B82F6" count={projects.length} onViewAll={() => navigate('/projects')}>
          {projects.length > 0 ? (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => navigate(`/projects?create=1&account_id=${id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#5B3DF5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  <Plus className="w-4 h-4" /> Create Project
                </button>
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader headers={['Project No', 'Name', 'Stage', 'Team', 'PM', 'Created']} />
                <tbody>
                  {projects.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', cursor: 'pointer', transition: 'background .15s' }}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                      onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F9FAFB'}>
                      <Td><span style={{ fontWeight: 600, color: '#5B3DF5' }}>{p.proj_id}</span></Td>
                      <Td style={{ fontWeight: 500 }}>{p.title || '—'}</Td>
                      <Td><BadgeDot stage={p.stage} /></Td>
                      <Td>{p.team_names || '—'}</Td>
                      <Td>{p.pm_name || '—'}</Td>
                      <Td><span style={{ color: '#9CA3AF', fontSize: '12px' }}>{timeAgo(p.created_at)}</span></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            </div>
          ) : (
            <EmptyState icon={Briefcase} text="No projects found for this account"
              action={{ label: 'Create Project', onClick: () => navigate(`/projects?create=1&account_id=${id}`) }} />
          )}
        </SectionCard>

        {/* ═══ LEADS ═══ */}
        <SectionCard title="Leads" icon={TrendingUp} iconColor="#22C55E" count={leads.length} onViewAll={() => navigate('/leads')}>
          {leads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader headers={['Lead ID', 'Service', 'Stage', 'Value', 'Assigned', 'Created']} />
                <tbody>
                  {leads.map((l, i) => (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', cursor: 'pointer', transition: 'background .15s' }}
                      onClick={() => navigate(`/leads/${l.id}`)}
                      onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                      onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F9FAFB'}>
                      <Td><span style={{ fontWeight: 600, color: '#5B3DF5' }}>{l.lead_id}</span></Td>
                      <Td>{l.service_type || '—'}</Td>
                      <Td><BadgeDot stage={l.stage} /></Td>
                      <Td><span style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(l.estimated_value) || '—'}</span></Td>
                      <Td>{l.assigned_name || '—'}</Td>
                      <Td><span style={{ color: '#9CA3AF', fontSize: '12px' }}>{timeAgo(l.created_at)}</span></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={TrendingUp} text="No leads found for this account"
              action={{ label: 'Create Lead', onClick: () => navigate(`/leads?create=1&account_id=${id}`) }} />
          )}
        </SectionCard>

        {/* ═══ OPPORTUNITIES ═══ */}
        {(() => {
          const allItems = [
            ...opportunities.map(o => ({ ...o, _type: 'opportunity', _id: o.opp_id })),
            ...referral_leads.map(l => ({ ...l, _type: 'referral_lead', _id: l.lead_id, service_interest: l.service_type, opp_id: l.lead_id, assigned_name: l.assigned_name })),
          ].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          const count = allItems.length
          return (
            <SectionCard title="Opportunities" icon={Target} iconColor="#F59E0B" count={count}>
              {allItems.length > 0 ? (
                <div>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setOppForm({ ...oppForm, company_name: '' }); setShowOppForm(true) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#5B3DF5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <Plus className="w-4 h-4" /> Refer Client
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader headers={['ID', 'Service', 'Stage', 'Value', 'Assigned', 'Updated']} />
                      <tbody>
                        {allItems.map((o, i) => (
                          <tr key={`${o._type}_${o.id}`} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', cursor: 'pointer', transition: 'background .15s' }}
                          onClick={() => navigate(o._type === 'opportunity' ? `/leads/${o.id}?type=opportunity` : `/leads/${o.id}`)}
                          onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                          onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F9FAFB'}>
                          <Td>
                            <span style={{ fontWeight: 600, color: '#5B3DF5' }}>{o._id}</span>
                            {o._type === 'referral_lead' && (
                              <span style={{ fontSize: 9, fontWeight: 700, marginLeft: 6, padding: '1px 6px', borderRadius: 4, background: '#FEF3C7', color: '#92400E' }}>REFERRAL</span>
                            )}
                          </Td>
                          <Td>{o.service_interest || '—'}</Td>
                          <Td><BadgeDot stage={o.stage} /></Td>
                          <Td><span style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(o.estimated_value) || '—'}</span></Td>
                          <Td>{o.assigned_name || '—'}</Td>
                          <Td><span style={{ color: '#9CA3AF', fontSize: '12px' }}>{timeAgo(o.updated_at)}</span></Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Target} text="No opportunities found for this account"
                  action={{ label: 'Create Opportunity', onClick: () => { setOppForm({ ...oppForm, company_name: acc.company_name }); setShowOppForm(true) } }} />
              )}
            </SectionCard>
          )
        })()}

        {/* ═══ MEETINGS ═══ */}
        <SectionCard title="Meetings" icon={Calendar} iconColor="#3B82F6" count={meetings.length + meeting_requests.length} onViewAll={() => navigate('/meetings')}>
          {meetings.length + meeting_requests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader headers={['Title / Agenda', 'Date', 'Location', 'Status', 'By']} />
                <tbody>
                  {meetings.map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', cursor: 'pointer', transition: 'background .15s' }}
                      onClick={() => { setMeetingModalItem(m); setMeetingModalType('meeting'); setShowMeetingModal(true) }}
                      onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                      onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F9FAFB'}>
                      <Td style={{ fontWeight: 500 }}>{m.title}</Td>
                      <Td>{formatDateTime(m.meeting_date)}</Td>
                      <Td>{m.location || '—'}</Td>
                      <Td><BadgeDot stage={m.status} /></Td>
                      <Td>{m.created_by_name || '—'}</Td>
                    </tr>
                  ))}
                  {meeting_requests.map((mr, i) => (
                    <tr key={`mr_${mr.id}`} style={{ background: '#F9FAFB', cursor: 'pointer', transition: 'background .15s' }}
                      onClick={() => { setMeetingModalItem(mr); setMeetingModalType('request'); setMeetingResponseForm({ status: mr.status === 'Confirmed' ? 'Confirmed' : 'Confirmed', confirmed_date: mr.confirmed_date ? mr.confirmed_date.slice(0, 16) : '', meeting_link: mr.meeting_link || '', team_remarks: mr.team_remarks || '' }); setShowMeetingModal(true) }}
                      onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                      onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}>
                      <Td style={{ color: '#6B7280' }}>{mr.agenda}</Td>
                      <Td>{formatDateTime(mr.preferred_date)}</Td>
                      <Td><span style={{ color: '#F59E0B' }}>(Requested)</span></Td>
                      <Td><BadgeDot stage={mr.status} /></Td>
                      <Td>{mr.requested_by_name || '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={Calendar} text="No meetings scheduled for this account" />
          )}
        </SectionCard>

        {/* ═══ MEETING MODAL ═══ */}
        {showMeetingModal && meetingModalItem && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={e => { if (e.target === e.currentTarget) setShowMeetingModal(false) }}>
            <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #ECECEC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  {meetingModalType === 'meeting' ? meetingModalItem.title : meetingModalItem.agenda?.slice(0, 60)}
                </h3>
                <button onClick={() => setShowMeetingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                {meetingModalType === 'meeting' ? (
                  /* Regular Meeting */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <DetailField label="Title" value={meetingModalItem.title} />
                      <DetailField label="Status" value={meetingModalItem.status} />
                      <DetailField label="Date" value={formatDateTime(meetingModalItem.meeting_date)} />
                      <DetailField label="Location" value={meetingModalItem.location || '—'} />
                      {meetingModalItem.created_by_name && <DetailField label="Created By" value={meetingModalItem.created_by_name} />}
                    </div>
                    {meetingModalItem.description && (
                      <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Description</p>
                        <p style={{ fontSize: '13px', color: '#1F2937', margin: 0, whiteSpace: 'pre-wrap' }}>{meetingModalItem.description}</p>
                      </div>
                    )}
                    {meetingModalItem.meeting_link && (
                      <div style={{ padding: '12px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ExternalLink className="w-4 h-4" style={{ color: '#4F46E5', flexShrink: 0 }} />
                        <a href={meetingModalItem.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4338CA', fontWeight: 500, textDecoration: 'none', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meetingModalItem.meeting_link}</a>
                      </div>
                    )}
                    {meetingModalItem.mom && (
                      <div style={{ padding: '14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Minutes of Meeting</p>
                        <p style={{ fontSize: '13px', color: '#92400E', margin: 0, whiteSpace: 'pre-wrap' }}>{meetingModalItem.mom}</p>
                      </div>
                    )}
                    {meetingModalItem.meeting_link && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <a href={meetingModalItem.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Meeting Request */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <DetailField label="Agenda" value={meetingModalItem.agenda} />
                      <DetailField label="Status" value={meetingModalItem.status} />
                      <DetailField label="Preferred Date" value={formatDateTime(meetingModalItem.preferred_date)} />
                      <DetailField label="Requested By" value={meetingModalItem.requested_by_name || '—'} />
                      {meetingModalItem.confirmed_date && <DetailField label="Confirmed Date" value={formatDateTime(meetingModalItem.confirmed_date)} />}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Meeting Link</p>
                      {meetingModalItem.meeting_link ? (
                        <div style={{ padding: '10px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ExternalLink className="w-4 h-4" style={{ color: '#4F46E5', flexShrink: 0 }} />
                          <a href={meetingModalItem.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4338CA', fontWeight: 500, textDecoration: 'none', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meetingModalItem.meeting_link}</a>
                          {['Requested', 'Rescheduled', 'Confirmed'].includes(meetingModalItem.status) && (
                            <button onClick={async () => {
                              if (!confirm('Remove meeting link?')) return
                              try {
                                const r = await api.put(`/api/meeting-requests/${meetingModalItem.id}/respond`, {
                                  status: meetingModalItem.status,
                                  meeting_link: null,
                                })
                                setMeetingModalItem(r.data.meeting_request)
                                setMeetingResponseForm({ ...meetingResponseForm, meeting_link: '' })
                                loadDetail()
                              } catch (e) { alert(e.response?.data?.error || 'Failed') }
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px', flexShrink: 0 }}
                              title="Remove meeting link">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: '10px 14px', background: '#F8FAFC', border: '1px dashed #D1D5DB', borderRadius: '10px', color: '#9CA3AF', fontSize: '13px' }}>
                          {meetingModalItem.status === 'Requested' ? 'Client did not provide a meeting link' : 'No meeting link added'}
                        </div>
                      )}
                    </div>
                    {meetingModalItem.team_remarks && (
                      <div style={{ padding: '14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px' }}>
                        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Team Remarks</p>
                        <p style={{ fontSize: '13px', color: '#9A3412', margin: 0 }}>{meetingModalItem.team_remarks}</p>
                      </div>
                    )}

                    {meetingModalItem.meeting_link && (
                      <a href={meetingModalItem.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
                        Join Meeting
                      </a>
                    )}

                    {/* Respond Form */}
                    {['Requested', 'Rescheduled', 'Confirmed'].includes(meetingModalItem.status) && (
                      <div style={{ borderTop: '1px solid #ECECEC', paddingTop: '18px', marginTop: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: '0 0 14px' }}>
                          {meetingModalItem.status === 'Confirmed' ? 'Update Meeting' : 'Respond to Request'}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Action *</label>
                            <select value={meetingResponseForm.status} onChange={e => setMeetingResponseForm({ ...meetingResponseForm, status: e.target.value })}
                              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                              <option value="Confirmed">Confirm</option>
                              <option value="Rescheduled">Reschedule</option>
                              <option value="Cancelled">Cancel</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                              {meetingResponseForm.status === 'Confirmed' ? 'Confirmed Date *' : 'New Date'}
                            </label>
                            <input type="datetime-local" value={meetingResponseForm.confirmed_date} onChange={e => setMeetingResponseForm({ ...meetingResponseForm, confirmed_date: e.target.value })}
                              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Meeting Link</label>
                            <input type="url" value={meetingResponseForm.meeting_link} onChange={e => setMeetingResponseForm({ ...meetingResponseForm, meeting_link: e.target.value })}
                              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                              placeholder="Google Meet / Zoom link — optional" />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Team Remarks</label>
                            <textarea value={meetingResponseForm.team_remarks} onChange={e => setMeetingResponseForm({ ...meetingResponseForm, team_remarks: e.target.value })} rows={2}
                              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                              placeholder="Optional notes for the client..." />
                          </div>
                          <button onClick={async () => {
                            if (!meetingResponseForm.confirmed_date && meetingResponseForm.status === 'Confirmed') { return alert('Confirmed date is required') }
                            setResponding(true)
                            try {
                              const r = await api.put(`/api/meeting-requests/${meetingModalItem.id}/respond`, {
                                status: meetingResponseForm.status,
                                confirmed_date: meetingResponseForm.confirmed_date || null,
                                meeting_link: meetingResponseForm.meeting_link || null,
                                team_remarks: meetingResponseForm.team_remarks || null,
                              })
                              setMeetingModalItem(r.data.meeting_request)
                              setMeetingResponseForm({ status: 'Confirmed', confirmed_date: '', meeting_link: '', team_remarks: '' })
                              loadDetail()
                            } catch (e) { alert(e.response?.data?.error || 'Failed to respond') }
                            finally { setResponding(false) }
                          }} disabled={responding}
                            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: responding ? 0.6 : 1, alignSelf: 'flex-start' }}>
                            {responding ? 'Saving...' : meetingModalItem.status === 'Confirmed' ? 'Update Meeting' : 'Submit Response'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TASKS ═══ */}
        <SectionCard title="Tasks" icon={CheckCircle} iconColor="#EC4899" count={tasks.length}>
          {tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader headers={['Title', 'Priority', 'Status', 'Assigned', 'Due Date']} />
                <tbody>
                  {tasks.map((t, i) => {
                    const pStyle = PRIORITY_COLORS[t.priority] || { bg: '#F3F4F6', text: '#6B7280', dot: '#D1D5DB' }
                    const sStyle = STATUS_COLORS[t.status] || { bg: '#F3F4F6', text: '#6B7280', dot: '#D1D5DB' }
                    return (
                      <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', transition: 'background .15s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                        onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F9FAFB'}>
                        <Td>
                          <div style={{ fontWeight: 500 }}>{t.title}</div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                            {t.creator_name ? `Assigned by ${t.creator_name}` : ''}
                            {t.updated_at ? ` · Updated ${timeAgo(t.updated_at)}` : ''}
                          </div>
                        </Td>
                        <Td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: pStyle.bg, color: pStyle.text }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pStyle.dot, display: 'inline-block' }} />
                            {t.priority || '—'}
                          </span>
                        </Td>
                        <Td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: sStyle.bg, color: sStyle.text }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sStyle.dot, display: 'inline-block' }} />
                            {t.status || '—'}
                          </span>
                        </Td>
                        <Td>{t.assigned_name || '—'}</Td>
                        <Td>{t.due_date ? formatDate(t.due_date) : '—'}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={CheckCircle} text="No tasks assigned for this account" />
          )}
        </SectionCard>

        {/* ═══ FINDING QUERIES ═══ */}
        <SectionCard title="Finding Queries" icon={AlertTriangle} iconColor="#F59E0B" count={finding_queries.length}>
          {finding_queries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader headers={['Subject', 'Question', 'Status', 'Raised By', 'Response', 'Date']} />
                <tbody>
                  {finding_queries.map((fq, i) => (
                    <tr key={fq.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', transition: 'background .15s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                      onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F9FAFB'}>
                      <Td style={{ fontWeight: 500 }}>{fq.subject}</Td>
                      <Td>{fq.question}</Td>
                      <Td><BadgeDot stage={fq.status} /></Td>
                      <Td>{fq.raised_by_name || '—'}</Td>
                      <Td>{fq.response || '—'}</Td>
                      <Td><span style={{ color: '#9CA3AF', fontSize: '12px' }}>{timeAgo(fq.created_at)}</span></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
              <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#6B7280' }}>No Finding Queries</p>
              <p style={{ fontSize: '13px', margin: '4px 0 12px' }}>Finding queries generated during projects will appear here.</p>
              <button style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: '#5B3DF5', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all .2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onMouseOver={e => e.currentTarget.style.background = '#4727F5'}
                onMouseOut={e => e.currentTarget.style.background = '#5B3DF5'}>
                <Plus className="w-3.5 h-3.5" /> Create Finding
              </button>
            </div>
          )}
        </SectionCard>

        {/* ═══ NOTES + DOCUMENTS SIDE BY SIDE ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>

          {/* NOTES */}
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.05)', border: '1px solid #ECECEC' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #ECECEC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bookmark className="w-4 h-4" style={{ color: '#8B5CF6' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: 0 }}>Notes ({notes.length})</h3>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #ECECEC', borderRadius: '10px', fontSize: '13px', outline: 'none', minHeight: '100px', resize: 'none', transition: 'all .2s', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                  placeholder="Write a note..." />
                <button onClick={addNote} disabled={addingNote || !noteText.trim()}
                  style={{ marginTop: '10px', padding: '9px 22px', borderRadius: '10px', border: 'none', background: '#5B3DF5', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .2s', opacity: addingNote || !noteText.trim() ? 0.5 : 1 }}
                  onMouseOver={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#4727F5' }}
                  onMouseOut={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#5B3DF5' }}>
                  {addingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
              {notes.length > 0 ? (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Recent Notes</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notes.slice(0, 5).map(n => (
                      <div key={n.id} style={{ padding: '12px 14px', borderRadius: '10px', background: '#F6F8FC', transition: 'all .2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#EEF2FF' }}
                        onMouseOut={e => { e.currentTarget.style.background = '#F6F8FC' }}>
                        <div className="flex items-start gap-2.5">
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#5B3DF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{(n.author || '?')[0]}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', color: '#1F2937', margin: 0, lineHeight: 1.6 }}>{n.content}</p>
                            <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0' }}>{n.author} · {timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                  <Bookmark className="w-8 h-8 mx-auto mb-2" />
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#6B7280' }}>No notes yet</p>
                  <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Write a note above to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* DOCUMENTS */}
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.05)', border: '1px solid #ECECEC' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #ECECEC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip className="w-4 h-4" style={{ color: '#6B7280' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: 0 }}>Documents ({documents.length})</h3>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #D1D5DB', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', background: '#FAFAFA', cursor: 'pointer', transition: 'all .2s', marginBottom: '16px' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#5B3DF5'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', margin: 0 }}>Upload files</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '6px 0 0' }}>or <span style={{ color: '#5B3DF5', fontWeight: 600, textDecoration: 'underline' }}>browse files</span> to attach</p>
                <input ref={fileRef} type="file" onChange={handleUpload} hidden />
              </div>
              {documents.length > 0 ? (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Recent Files</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {documents.slice(0, 5).map(d => (
                      <div key={d.id} style={{ padding: '10px 12px', borderRadius: '10px', background: '#F6F8FC', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all .2s' }}
                        onMouseOver={e => { e.currentTarget.style.background = '#EEF2FF' }}
                        onMouseOut={e => { e.currentTarget.style.background = '#F6F8FC' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText className="w-4 h-4" style={{ color: '#5B3DF5' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file_name}</p>
                          <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>{d.uploaded_by_name || '—'} · {timeAgo(d.uploaded_at)}</p>
                        </div>
                        <button style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6B7280' }}
                          onMouseOver={e => e.currentTarget.style.background = '#fff'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF' }}>
                  <Paperclip className="w-8 h-8 mx-auto mb-2" />
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#6B7280' }}>No documents uploaded</p>
                  <p style={{ fontSize: '12px', margin: '4px 0 0' }}>Upload a file using the drop zone above</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      )}

      {activeTab === 'referrals' && (
      <div>
        {/* Referral Dashboard KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <KpiCard icon={TrendingUp} bg="#EDE9FE" color="#5B21B6" label="Total Referrals" value={referralData?.total_referrals ?? opportunities.length} />
          <KpiCard icon={Target} bg="#DBEAFE" color="#2563EB" label="Active Referrals" value={referralData?.active_referrals ?? '—'} />
          <KpiCard icon={CheckCircle} bg="#D1FAE5" color="#059669" label="Converted Leads" value={referralData?.converted_leads ?? '—'} />
          <KpiCard icon={DollarSign} bg="#FEF3C7" color="#D97706" label="Revenue Generated" value={referralData?.total_revenue_generated ? `₹${(referralData.total_revenue_generated / 100000).toFixed(1)}L` : '—'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <KpiCard icon={Users} bg="#D1FAE5" color="#059669" label="Won Customers" value={referralData?.won_customers ?? '—'} />
          <KpiCard icon={XCircle} bg="#FEE2E2" color="#DC2626" label="Lost Referrals" value={referralData?.lost_referrals ?? '—'} />
          <KpiCard icon={BarChart3} bg="#FCE7F3" color="#DB2777" label="Conversion Rate" value={referralData?.conversion_rate != null ? `${referralData.conversion_rate}%` : '—'} />
          <KpiCard icon={DollarSign} bg="#FFF7ED" color="#D97706" label="Total Business" value={referralData?.total_business_generated ? `₹${(referralData.total_business_generated / 100000).toFixed(1)}L` : '—'} />
        </div>

        {/* Referral Timeline */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #ECECEC', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #ECECEC', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity className="w-4 h-4" style={{ color: '#5B3DF5' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', margin: 0 }}>Referral Timeline</h3>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {referralTimeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
                <Activity className="w-8 h-8 mx-auto mb-2" />
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#6B7280' }}>No referral activity yet</p>
                <p style={{ fontSize: 12, margin: '4px 0 0' }}>Create an opportunity to start</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {referralTimeline.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#F8F9FC', borderRadius: 8, alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%',
                      background: item.type === 'referral_created' ? '#F59E0B' : item.type === 'converted_to_lead' ? '#3B82F6' : item.type === 'account_created' ? '#059669' : '#8B5CF6', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{item.event}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{formatDate(item.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Opportunities list under Referrals */}
        {(() => {
          const allRefItems = [
            ...opportunities.map(o => ({ ...o, _type: 'opportunity', _id: o.opp_id, company: o.company_name })),
            ...referral_leads.map(l => ({ ...l, _type: 'referral_lead', _id: l.lead_id, company: l.company_name, service_interest: l.service_type, opp_id: l.lead_id, assigned_name: l.assigned_name, referral_status: l.stage === 'Converted to Account' ? 'Converted' : 'New Referral' })),
          ].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          return (
            <SectionCard title="Opportunities / Referrals" icon={Target} iconColor="#F59E0B" count={allRefItems.length}>
              {allRefItems.length > 0 ? (
                <div>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setOppForm({ ...oppForm, company_name: acc.company_name }); setShowOppForm(true) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#5B3DF5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <Plus className="w-4 h-4" /> New Referral
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader headers={['ID', 'Company', 'Service', 'Stage', 'Status', 'Value', 'Assigned', 'Updated']} />
                      <tbody>
                        {allRefItems.map((o, i) => (
                          <tr key={`${o._type}_${o.id}`} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', cursor: 'pointer' }}
                          onClick={() => navigate(o._type === 'opportunity' ? `/leads/${o.id}?type=opportunity` : `/leads/${o.id}`)}
                          onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                          onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F9FAFB'}>
                          <Td>
                            <span style={{ fontWeight: 600, color: '#5B3DF5' }}>{o._id}</span>
                            {o._type === 'referral_lead' && (
                              <span style={{ fontSize: 9, fontWeight: 700, marginLeft: 6, padding: '1px 6px', borderRadius: 4, background: '#FEF3C7', color: '#92400E' }}>LEAD</span>
                            )}
                          </Td>
                          <Td>{o.company || '—'}</Td>
                          <Td>{o.service_interest || '—'}</Td>
                          <Td><BadgeDot stage={o.stage} /></Td>
                          <Td><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                            background: o.referral_status === 'New Referral' ? '#FEF3C7' : o.referral_status === 'Converted' ? '#D1FAE5' : o.referral_status === 'Contacted' ? '#DBEAFE' : '#F3F4F6',
                            color: o.referral_status === 'New Referral' ? '#92400E' : o.referral_status === 'Converted' ? '#065F46' : o.referral_status === 'Contacted' ? '#1E40AF' : '#6B7280' }}>{o.referral_status || 'New Referral'}</span></Td>
                          <Td><span style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(o.estimated_value) || '—'}</span></Td>
                          <Td>{o.assigned_name || '—'}</Td>
                          <Td><span style={{ color: '#9CA3AF', fontSize: '12px' }}>{timeAgo(o.updated_at)}</span></Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Target} text="No referrals yet"
                  action={{ label: 'Create Referral Opportunity', onClick: () => { setOppForm({ ...oppForm, company_name: acc.company_name, source: 'Referral' }); setShowOppForm(true) } }} />
              )}
            </SectionCard>
          )
        })()}
      </div>
      )}

      </div>  {/* end max-width */}

      {/* Opportunity Form Modal */}
      {showOppForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowOppForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 500, maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Refer a Client from {acc.company_name}</span>
              <button onClick={() => setShowOppForm(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Referred Company Name <span style={{ color: '#DC2626' }}>*</span></label>
                <input value={oppForm.company_name} onChange={e => setOppForm({ ...oppForm, company_name: e.target.value })} placeholder="Enter referred company name"
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              {['contact_name', 'contact_email', 'contact_phone'].map(f => (
                <div key={f} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {f === 'contact_name' ? 'Contact Name' : f === 'contact_email' ? 'Contact Email' : 'Contact Phone'}
                  </label>
                  <input value={oppForm[f]} onChange={e => setOppForm({ ...oppForm, [f]: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Service Required</label>
                  <select value={oppForm.service_interest} onChange={e => setOppForm({ ...oppForm, service_interest: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                    <option value="">-- Select --</option>
                    {['VAPT', 'IS Audit', 'ISMS Implementation', 'RBI Audit', 'Compliance Audit', 'Cloud Security Audit', 'Network Security Audit', 'Application Security', 'Red Team Assessment', 'SOC Setup', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Estimated Value (₹)</label>
                  <input type="number" value={oppForm.estimated_value} onChange={e => setOppForm({ ...oppForm, estimated_value: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={oppForm.description} onChange={e => setOppForm({ ...oppForm, description: e.target.value })} rows={2}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowOppForm(false)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                setSavingOpp(true)
                try {
                  if (!oppForm.company_name.trim()) { alert('Company name is required'); setSavingOpp(false); return }
                  const payload = {
                    company_name: oppForm.company_name,
                    contact_name: oppForm.contact_name,
                    contact_email: oppForm.contact_email,
                    contact_phone: oppForm.contact_phone,
                    service_type: oppForm.service_interest,
                    description: oppForm.description,
                    estimated_value: oppForm.estimated_value || undefined,
                    source: 'Customer Referral',
                    referring_account_id: parseInt(id),
                    assigned_to: oppForm.assigned_to || undefined,
                  }
                  await api.post('/api/leads', payload)
                  setShowOppForm(false); loadDetail()
                  alert('Lead created from referral!')
                } catch (e) { alert(e.response?.data?.error || 'Failed to create') }
                finally { setSavingOpp(false) }
              }} disabled={savingOpp || !oppForm.company_name.trim()}
                style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: savingOpp || !oppForm.company_name.trim() ? 0.6 : 1 }}>
                {savingOpp ? 'Creating...' : 'Create Referral Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PORTAL ACCESS MODAL ═══ */}
      {showPortalForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowPortalForm(false) }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '440px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" style={{ color: client_users.length > 0 ? '#059669' : '#5B21B6' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1F2937' }}>{client_users.length > 0 ? 'Portal Access - Active' : 'Create Portal Access'}</h3>
              </div>
              <button onClick={() => setShowPortalForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {client_users.length > 0 ? (
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px' }}>
                  Portal access is already active for <strong>{client_users[0].email}</strong>. You can reset their password below.
                </p>
              ) : (
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px' }}>
                  Create a client login for <strong>{acc?.company_name || 'this account'}</strong>. The client will use these credentials to access the portal.
                </p>
              )}
              {client_users.length > 0 ? (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Email</label>
                  <input value={client_users[0].email} disabled style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#F9FAFB', color: '#6B7280', marginTop: 4, fontFamily: 'inherit' }} />
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>New Password *</label>
                    <input type="password" value={portalForm.password} onChange={e => setPortalForm({ ...portalForm, password: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>First Name *</label>
                      <input value={portalForm.first_name} onChange={e => setPortalForm({ ...portalForm, first_name: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Last Name</label>
                      <input value={portalForm.last_name} onChange={e => setPortalForm({ ...portalForm, last_name: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Email *</label>
                    <input type="email" value={portalForm.email} onChange={e => setPortalForm({ ...portalForm, email: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Password *</label>
                    <input type="password" value={portalForm.password} onChange={e => setPortalForm({ ...portalForm, password: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Phone</label>
                      <input value={portalForm.phone} onChange={e => setPortalForm({ ...portalForm, phone: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Designation</label>
                      <input value={portalForm.designation} onChange={e => setPortalForm({ ...portalForm, designation: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginTop: 4 }} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowPortalForm(false)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (client_users.length > 0) {
                  if (!portalForm.password.trim()) { alert('New password is required'); return }
                  setSavingPortal(true)
                  try {
                    await api.post(`/api/accounts/${id}/reset-client-password`, { password: portalForm.password })
                    setShowPortalForm(false)
                    alert(`Password reset successful for ${client_users[0].email}`)
                  } catch (e) { alert(e.response?.data?.error || 'Failed to reset password') }
                  finally { setSavingPortal(false) }
                } else {
                  if (!portalForm.first_name.trim() || !portalForm.email.trim() || !portalForm.password.trim()) {
                    alert('First Name, Email, and Password are required'); return
                  }
                  setSavingPortal(true)
                  try {
                    await api.post('/api/auth/users', {
                      first_name: portalForm.first_name, last_name: portalForm.last_name,
                      email: portalForm.email, password: portalForm.password,
                      phone: portalForm.phone || undefined, designation: portalForm.designation || 'Client Contact',
                      role: 'client', account_id: parseInt(id), client_company_name: acc?.company_name || '',
                    })
                    setShowPortalForm(false)
                    alert('Portal access created! Client can login at /client-login')
                    loadDetail()
                  } catch (e) { alert(e.response?.data?.error || 'Failed to create portal access') }
                  finally { setSavingPortal(false) }
                }
              }} disabled={savingPortal}
                style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: client_users.length > 0 ? '#059669' : '#5B21B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: savingPortal ? 0.6 : 1 }}>
                {savingPortal ? 'Saving...' : client_users.length > 0 ? 'Reset Password' : 'Create Portal Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────── Reusable Components ─────────── */

function BadgeDot({ stage }) {
  const s = STAGE_COLORS[stage] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: s.bg, color: s.text }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {stage}
    </span>
  )
}

function ActionBtn({ icon, label, onClick }) {
  const Icon = icon?.type || (() => null)
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid #ECECEC', background: '#fff', color: '#6B7280', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}
      onMouseOver={e => { e.currentTarget.style.background = '#F6F8FC'; e.currentTarget.style.borderColor = '#D1D5DB' }}
      onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ECECEC' }}>
      {icon}
      {label}
    </button>
  )
}

function InfoRow2({ label, value }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#1F2937', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function DetailField({ label, value }) {
  return (
    <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px' }}>
      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#1F2937', margin: 0, fontWeight: 500 }}>{value || '—'}</p>
    </div>
  )
}

function SectionCard({ title, icon: Icon, iconColor, count, onViewAll, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.05)', border: '1px solid #ECECEC', marginBottom: '32px' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #ECECEC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{title} ({count})</h3>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} style={{ fontSize: '12px', fontWeight: 600, color: '#5B3DF5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
            onMouseOver={e => e.currentTarget.style.color = '#4727F5'}
            onMouseOut={e => e.currentTarget.style.color = '#5B3DF5'}>
            See Complete List <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div style={{ padding: '16px 24px 20px' }}>
        {children}
      </div>
    </div>
  )
}

function Table({ children }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      {children}
    </table>
  )
}

function TableHeader({ headers }) {
  return (
    <thead>
      <tr style={{ background: '#F6F8FC' }}>
        {headers.map(h => (
          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #ECECEC', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em', position: 'sticky', top: 0, background: '#F6F8FC' }}>{h}</th>
        ))}
      </tr>
    </thead>
  )
}

function Td({ children, style: extraStyle }) {
  return (
    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#1F2937', borderBottom: '1px solid #F3F4F6', ...extraStyle }}>
      {children}
    </td>
  )
}

function EmptyState({ icon: Icon, text, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 0', color: '#9CA3AF' }}>
      <Icon className="w-8 h-8 mx-auto mb-2" />
      <p style={{ fontSize: '13px', fontWeight: 500, margin: 0, marginBottom: action ? 12 : 0 }}>{text}</p>
      {action && (
        <button onClick={action.onClick} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          background: '#5B21B6', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}><Plus className="w-3.5 h-3.5" /> {action.label}</button>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, bg, color, label, value }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ECECEC', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{label}</div>
      </div>
    </div>
  )
}

/* ═══ GLOBAL TICKER STYLES ═══ */
const TICKER_STYLE_ID = '__ticker_styles'
if (typeof document !== 'undefined' && !document.getElementById(TICKER_STYLE_ID)) {
  const s = document.createElement('style')
  s.id = TICKER_STYLE_ID
  s.textContent = `
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.activity-ticker .ticker-item:last-child > span:last-child { display: none; }
@media (max-width: 767px) {
  .ticker-desktop { display: none !important; }
  .ticker-mobile { display: flex !important; }
}
@media (min-width: 768px) {
  .ticker-desktop { display: flex !important; }
  .ticker-mobile { display: none !important; }
}
`
  document.head.appendChild(s)
}
