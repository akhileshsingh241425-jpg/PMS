import { useState, useEffect, useCallback } from 'react'
import { Mail, Search, RefreshCw, Inbox, UserPlus, Tag, CheckCircle, X, MessageSquare, Clock, Flag, Bell, FileText, Activity, MoreHorizontal } from 'lucide-react'
import { C } from '../components/styleConstants'
import { listMessages, markRead, categorizeMessage, assignMessage, connectEmail, fetchEmails, listAccounts, disconnectAccount, updateStatus, setPriority, setTags, snoozeMessage, listNotes, addNote, listActivities, listRules, createRule, deleteRule, updateRule } from '../api/emailApi'
import { TableSkeleton } from '../components/LoadingSkeleton'

const CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']
const STATUSES = ['New', 'Assigned', 'Working', 'Waiting Customer', 'Completed', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const TAGS_PRESET = ['Solar', 'Urgent', 'Tender', 'Payment', 'Warranty', 'Support', 'VIP']

const CAT_COLORS = { Lead: '#6D28D9', Client: '#10B981', 'Follow-up': '#F59E0B', Support: '#3B82F6', Task: '#EC4899', Meeting: '#8B5CF6', Invoice: '#EF4444', Other: '#64748B' }
const PRIORITY_COLORS = { Low: '#94A3B8', Medium: '#3B82F6', High: '#F59E0B', Urgent: '#EF4444' }
const STATUS_COLORS = { New: '#6D28D9', Assigned: '#3B82F6', Working: '#F59E0B', 'Waiting Customer': '#EC4899', Completed: '#10B981', Closed: '#94A3B8' }

export default function EmailInbox() {
  const [messages, setMessages] = useState([])
  const [counts, setCounts] = useState({})
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [connecting, setConnecting] = useState(false)
  const [notes, setNotes] = useState([])
  const [activities, setActivities] = useState([])
  const [newNote, setNewNote] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [showRules, setShowRules] = useState(false)
  const [rules, setRules] = useState([])
  const [snoozeDate, setSnoozeDate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (categoryFilter) params.category = categoryFilter
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (search) params.search = search
      const res = await listMessages(params)
      setMessages(res.messages || [])
      setCounts(res.counts || {})
      setEmployees(res.employees || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, statusFilter, priorityFilter, search])

  useEffect(() => { load() }, [load])

  const loadAccounts = useCallback(async () => { try { const r = await listAccounts(); setAccounts(r.accounts || []) } catch (e) {} }, [])
  useEffect(() => { loadAccounts() }, [loadAccounts])

  const loadDetails = useCallback(async (id) => {
    try { const r = await listNotes(id); setNotes(r.notes || []) } catch (e) {}
    try { const r = await listActivities(id); setActivities(r.activities || []) } catch (e) {}
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await connectEmail()
      if (res.auth_url) { window.location.href = res.auth_url }
      else if (res.error) { alert(res.error) }
    } catch (e) { alert(e.response?.data?.error || 'Connection failed') } finally { setConnecting(false) }
  }

  const handleFetch = async () => {
    setLoading(true)
    try { await fetchEmails(); load() } catch (e) { setLoading(false) }
  }

  const handleDisconnect = async (id) => { await disconnectAccount(id); loadAccounts(); load() }

  const handleMsgClick = async (msg) => {
    setSelectedMsg(msg)
    setNewNote('')
    setTagInput('')
    setSnoozeDate('')
    loadDetails(msg.id)
    if (!msg.is_read) { await markRead(msg.id); load() }
  }

  const handleCategorize = async (id, cat) => {
    await categorizeMessage(id, cat); load()
    if (selectedMsg?.id === id) setSelectedMsg(p => ({ ...p, category: cat }))
  }

  const handleAssign = async (id, uid) => {
    await assignMessage(id, uid); load()
    if (selectedMsg?.id === id) {
      const emp = employees.find(e => e.id === uid)
      setSelectedMsg(p => ({ ...p, assigned_to_id: uid, assigned_to_name: emp?.name, status: 'Assigned' }))
    }
  }

  const handleStatus = async (id, st) => {
    await updateStatus(id, st); load()
    if (selectedMsg?.id === id) setSelectedMsg(p => ({ ...p, status: st }))
  }

  const handlePriority = async (id, pr) => {
    await setPriority(id, pr); load()
    if (selectedMsg?.id === id) setSelectedMsg(p => ({ ...p, priority: pr }))
  }

  const handleTags = async (id) => {
    const existing = selectedMsg?.tags || []
    const tags = tagInput ? [...new Set([...existing, tagInput])] : existing
    await setTags(id, tags); load()
    setSelectedMsg(p => ({ ...p, tags })); setTagInput('')
  }

  const handleRemoveTag = async (id, tag) => {
    const existing = selectedMsg?.tags || []
    const tags = existing.filter(t => t !== tag)
    await setTags(id, tags); load()
    setSelectedMsg(p => ({ ...p, tags }))
  }

  const handleSnooze = async (id) => {
    if (!snoozeDate) return
    await snoozeMessage(id, new Date(snoozeDate).toISOString()); load()
    setSelectedMsg(null); setSnoozeDate('')
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedMsg) return
    await addNote(selectedMsg.id, newNote); setNewNote('')
    loadDetails(selectedMsg.id)
  }

  const tabs = [
    { key: '', label: 'All', count: counts.total },
    { key: 'new', label: 'New', count: counts.new },
    { key: 'unread', label: 'Unread', count: counts.unread },
    { key: 'assigned', label: 'Assigned', count: counts.assigned },
    { key: 'unassigned', label: 'Unassigned', count: counts.unassigned },
    ...CATEGORIES.map(c => ({ key: c.toLowerCase(), label: c, count: counts[c.toLowerCase()] || 0 })),
  ]

  const styleBtn = (s) => ({ padding: '4px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: C.font, whiteSpace: 'nowrap', ...s })

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased', background: C.bg }}>
      <div style={{ padding: 0 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.2 }}>Email Inbox</h1>
            <p style={{ fontSize: 13, color: C.secondary, margin: '4px 0 0' }}>
              {counts.unread || 0} unread &middot; {counts.total || 0} total
              {accounts.length > 0 && ` &middot; ${accounts[0].email}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowRules(!showRules)} style={{
              padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text, fontFamily: C.font,
            }}><Flag className="w-4 h-4" style={{ marginRight: 4 }} /> Rules</button>
            {accounts.length === 0 ? (
              <button onClick={handleConnect} disabled={connecting} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
                border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: C.font,
              }}><Mail className="w-4 h-4" /> {connecting ? 'Connecting...' : 'Connect Outlook'}</button>
            ) : (
              <>
                <button onClick={handleFetch} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff',
                  fontSize: 13, cursor: 'pointer', color: C.text, fontFamily: C.font,
                }}><RefreshCw className="w-4 h-4" /> Fetch</button>
                <button onClick={() => handleDisconnect(accounts[0].id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2',
                  fontSize: 13, cursor: 'pointer', color: '#DC2626', fontFamily: C.font,
                }}><X className="w-4 h-4" /> Disconnect</button>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ padding: '12px 24px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, overflow: 'auto' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => {
              if (['new', 'assigned', 'unassigned'].includes(t.key)) {
                setStatusFilter(t.key); setCategoryFilter('')
              } else if (t.label === 'All') {
                setStatusFilter(''); setCategoryFilter('')
              } else {
                setCategoryFilter(t.label); setStatusFilter('')
              }
            }}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, fontFamily: C.font, whiteSpace: 'nowrap',
                background: (
                  (['new', 'assigned', 'unassigned'].includes(t.key) && statusFilter === t.key) ||
                  (t.label === 'All' && !statusFilter && !categoryFilter) ||
                  (!['new', 'assigned', 'unassigned'].includes(t.key) && t.label !== 'All' && categoryFilter === t.label)
                ) ? C.blue : '#F1F5F9',
                color: (
                  (['new', 'assigned', 'unassigned'].includes(t.key) && statusFilter === t.key) ||
                  (t.label === 'All' && !statusFilter && !categoryFilter) ||
                  (!['new', 'assigned', 'unassigned'].includes(t.key) && t.label !== 'All' && categoryFilter === t.label)
                ) ? '#fff' : C.text,
              }}>
              {t.label} {t.count > 0 && <span style={{ opacity: 0.7, marginLeft: 4 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {/* Search + Priority Filter */}
        <div style={{ padding: '12px 24px', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.secondary, pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 34px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff', color: C.text, boxSizing: 'border-box' }}
              placeholder="Search by subject, sender, company..." />
          </div>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
            <option value="">All Priority</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Rules Panel */}
        {showRules && <RulesPanel onClose={() => setShowRules(false)} />}

        {/* Content */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 16 }}>
          {/* List */}
          <div style={{ flex: selectedMsg ? '0 0 45%' : 1, minWidth: 0 }}>
            {loading ? <TableSkeleton rows={8} cols={3} />
            : messages.length === 0 ? (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, textAlign: 'center', padding: '56px 20px' }}>
                <Inbox className="w-12 h-12" style={{ margin: '0 auto 12px', color: C.secondary, opacity: 0.25 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>No emails found</div>
                <div style={{ fontSize: 13, color: C.secondary, marginTop: 4 }}>
                  {accounts.length > 0 ? 'Click "Fetch" to pull new emails.' : 'Connect your Outlook to get started.'}
                </div>
              </div>
            ) : (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
                {messages.map(msg => (
                  <div key={msg.id} onClick={() => handleMsgClick(msg)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                      cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                      background: selectedMsg?.id === msg.id ? '#EEF2FF' : msg.is_read ? 'transparent' : '#F8FAFC',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = selectedMsg?.id === msg.id ? '#EEF2FF' : '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.background = selectedMsg?.id === msg.id ? '#EEF2FF' : msg.is_read ? 'transparent' : '#F8FAFC'}
                  >
                    <div style={{ width: 4, height: 36, borderRadius: 2, background: PRIORITY_COLORS[msg.priority] || '#94A3B8', flexShrink: 0 }} />
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: CAT_COLORS[msg.category] || '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {msg.sender_name?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: msg.is_read ? 500 : 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.sender_name || msg.sender_email}</span>
                        {!msg.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue, flexShrink: 0 }} />}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.secondary, flexShrink: 0 }}>
                          {msg.received_at ? new Date(msg.received_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{msg.subject || '(no subject)'}</div>
                      <div style={{ fontSize: 12, color: C.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body_preview}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={styleBtn({ background: CAT_COLORS[msg.category] + '20', color: CAT_COLORS[msg.category] })}>{msg.category}</span>
                        <span style={styleBtn({ background: PRIORITY_COLORS[msg.priority] + '20', color: PRIORITY_COLORS[msg.priority] })}>{msg.priority}</span>
                        <span style={styleBtn({ background: STATUS_COLORS[msg.status] + '20', color: STATUS_COLORS[msg.status] })}>{msg.status}</span>
                        {msg.company && <span style={styleBtn({ background: '#DEEBFF', color: C.blue })}>{msg.company}</span>}
                        {msg.assigned_to_name && <span style={styleBtn({ background: '#F3E8FF', color: '#6D28D9' })}>{msg.assigned_to_name}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedMsg && (
            <div style={{ flex: '0 0 55%', minWidth: 0, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 20, overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: CAT_COLORS[selectedMsg.category] || '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                    {selectedMsg.sender_name?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedMsg.sender_name || selectedMsg.sender_email}</div>
                    <div style={{ fontSize: 12, color: C.secondary }}>{selectedMsg.sender_email}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedMsg(null)} style={{ padding: 4, borderRadius: 6, border: 'none', background: '#F1F5F9', cursor: 'pointer', color: C.secondary }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3 }}>{selectedMsg.subject || '(no subject)'}</h2>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={styleBtn({ background: CAT_COLORS[selectedMsg.category] + '20', color: CAT_COLORS[selectedMsg.category] })}>{selectedMsg.category}</span>
                <span style={styleBtn({ background: PRIORITY_COLORS[selectedMsg.priority] + '20', color: PRIORITY_COLORS[selectedMsg.priority] })}>{selectedMsg.priority}</span>
                <span style={styleBtn({ background: STATUS_COLORS[selectedMsg.status] + '20', color: STATUS_COLORS[selectedMsg.status] })}>{selectedMsg.status}</span>
                {selectedMsg.company && <span style={styleBtn({ background: '#DEEBFF', color: C.blue })}>{selectedMsg.company}</span>}
              </div>

              <p style={{ fontSize: 12, color: C.secondary, margin: '0 0 12px' }}>
                {selectedMsg.received_at ? new Date(selectedMsg.received_at).toLocaleString('en-IN') : ''}
                {selectedMsg.recipient_email && ` · To: ${selectedMsg.recipient_email}`}
              </p>

              {/* Body */}
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: C.text, marginBottom: 16, minHeight: 100, maxHeight: 200, overflow: 'auto' }}>
                {selectedMsg.body_preview || '(no content)'}
              </div>

              {/* Actions Row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                {/* Status */}
                <select value={selectedMsg.status} onChange={e => handleStatus(selectedMsg.id, e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {/* Priority */}
                <select value={selectedMsg.priority} onChange={e => handlePriority(selectedMsg.id, e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {/* Assign */}
                <select value={selectedMsg.assigned_to_id || ''} onChange={e => handleAssign(selectedMsg.id, parseInt(e.target.value))}
                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                  <option value="">Assign to...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                {/* Category */}
                <select value={selectedMsg.category} onChange={e => handleCategorize(selectedMsg.id, e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                <Tag className="w-4 h-4" style={{ color: C.secondary }} />
                {(selectedMsg.tags || []).map(t => (
                  <span key={t} style={{
                    padding: '2px 10px', borderRadius: 12, background: '#DEEBFF', color: C.blue,
                    fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {t}
                    <X className="w-3 h-3" style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(selectedMsg.id, t)} />
                  </span>
                ))}
                <select value="" onChange={e => { if (e.target.value) { setTagInput(e.target.value); setTimeout(() => handleTags(selectedMsg.id), 100) } }}
                  style={{ padding: '2px 8px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                  <option value="">+ Tag</option>
                  {TAGS_PRESET.filter(t => !(selectedMsg.tags || []).includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Snooze */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                <Bell className="w-4 h-4" style={{ color: C.secondary }} />
                <input type="datetime-local" value={snoozeDate} onChange={e => setSnoozeDate(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, flex: 1 }} />
                <button onClick={() => handleSnooze(selectedMsg.id)} disabled={!snoozeDate}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: snoozeDate ? C.blue : '#E2E8F0', color: snoozeDate ? '#fff' : '#94A3B8', fontSize: 12, cursor: snoozeDate ? 'pointer' : 'default', fontFamily: C.font }}>
                  Snooze
                </button>
              </div>

              {/* Internal Notes */}
              <div style={{ marginBottom: 16, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare className="w-4 h-4" /> Internal Notes
                </h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..."
                    style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, outline: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }} />
                  <button onClick={handleAddNote} disabled={!newNote.trim()}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: newNote.trim() ? C.blue : '#E2E8F0', color: newNote.trim() ? '#fff' : '#94A3B8', fontSize: 12, cursor: newNote.trim() ? 'pointer' : 'default', fontFamily: C.font }}>
                    Add
                  </button>
                </div>
                {notes.length > 0 ? notes.slice(0, 5).map(n => (
                  <div key={n.id} style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: C.secondary, marginBottom: 2 }}>{n.user_name} · {n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}</div>
                    <div style={{ fontSize: 12, color: C.text }}>{n.note}</div>
                  </div>
                )) : <p style={{ fontSize: 12, color: C.secondary }}>No notes yet</p>}
              </div>

              {/* Activity Timeline */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity className="w-4 h-4" /> Activity
                </h3>
                {activities.length > 0 ? activities.slice(0, 10).map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6, padding: '4px 0', borderLeft: '2px solid #E2E8F0', paddingLeft: 12 }}>
                    <div style={{ fontSize: 11, color: C.secondary, flexShrink: 0, width: 80 }}>{a.created_at ? new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    <div style={{ fontSize: 12, color: C.text }}><strong>{a.action}</strong>{a.detail ? `: ${a.detail}` : ''}</div>
                  </div>
                )) : <p style={{ fontSize: 12, color: C.secondary }}>No activity yet</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Rules Panel ─── */
function RulesPanel({ onClose }) {
  const [rules, setRules] = useState([])
  const [employees, setEmployees] = useState([])
  const [name, setName] = useState('')
  const [matchType, setMatchType] = useState('domain')
  const [matchValue, setMatchValue] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assignTo, setAssignTo] = useState('')

  const load = useCallback(async () => {
    try { const r = await listRules(); setRules(r.rules || []); setEmployees(r.employees || []) } catch (e) {}
  }, [])
  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!name || !matchValue) return
    await createRule({ name, match_type: matchType, match_value: matchValue, category, priority, assign_to_id: assignTo || null })
    setName(''); setMatchValue(''); setCategory(''); setPriority('Medium'); setAssignTo('')
    load()
  }

  const handleDelete = async (id) => { await deleteRule(id); load() }
  const handleToggle = async (rule) => { await updateRule(rule.id, { is_active: !rule.is_active }); load() }

  return (
    <div style={{ margin: '0 24px 16px', padding: 16, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Flag className="w-4 h-4" /> Auto Rules</h3>
        <button onClick={onClose} style={{ padding: 4, borderRadius: 6, border: 'none', background: '#F1F5F9', cursor: 'pointer' }}><X className="w-4 h-4" /></button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Rule name"
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, width: 140 }} />
        <select value={matchType} onChange={e => setMatchType(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          <option value="domain">Domain</option>
          <option value="sender">Sender</option>
          <option value="subject">Subject</option>
        </select>
        <input value={matchValue} onChange={e => setMatchValue(e.target.value)} placeholder="e.g. gautamsolar.us"
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, width: 160 }} />
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          <option value="">Any Category</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          <option value="">No auto-assign</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <button onClick={handleAdd} disabled={!name || !matchValue}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: name && matchValue ? C.blue : '#E2E8F0', color: name && matchValue ? '#fff' : '#94A3B8', fontSize: 12, cursor: name && matchValue ? 'pointer' : 'default', fontFamily: C.font }}>
          + Add Rule
        </button>
      </div>
      {rules.length > 0 && (
        <div>
          {rules.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
              <button onClick={() => handleToggle(r)} style={{ padding: '2px 6px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: C.font, background: r.is_active ? '#D1FAE5' : '#FEE2E2', color: r.is_active ? '#065F46' : '#991B1B' }}>
                {r.is_active ? 'ON' : 'OFF'}
              </button>
              <span style={{ fontWeight: 600, width: 120 }}>{r.name}</span>
              <span style={{ color: C.secondary }}>{r.match_type}: {r.match_value}</span>
              {r.category && <span style={{ color: C.blue }}>→ {r.category}</span>}
              {r.priority && <span style={{ color: '#F59E0B' }}>| {r.priority}</span>}
              {r.assign_to_name && <span style={{ color: '#6D28D9' }}>| → {r.assign_to_name}</span>}
              <button onClick={() => handleDelete(r.id)} style={{ marginLeft: 'auto', padding: 2, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
