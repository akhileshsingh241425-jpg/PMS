import { useState, useEffect, useCallback } from 'react'
import { Mail, Search, RefreshCw, Inbox, BarChart3, Columns, AlertTriangle, Clock, Bell, UserCheck, ChevronDown, Filter, X, Settings, Sliders, FileText } from 'lucide-react'
import { C } from '../components/styleConstants'
import { listMessages, fetchEmails, listAccounts, connectEmail, disconnectAccount, getDashboard, getNotifications, getFollowups } from '../api/emailApi'
import { TableSkeleton } from '../components/LoadingSkeleton'
import EmailDetailPanel from '../components/EmailDetailPanel'
import EmailRulesPanel from '../components/EmailRulesPanel'
import EmailTemplatesPanel from '../components/EmailTemplatesPanel'
import EmailKanban from '../components/EmailKanban'

const CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const STATUS_COLORS = { New: '#6D28D9', Assigned: '#3B82F6', Working: '#F59E0B', 'Waiting Customer': '#EC4899', Completed: '#10B981', Closed: '#94A3B8' }
const PRIORITY_COLORS = { Urgent: '#DC2626', High: '#D97706', Medium: '#3B82F6', Low: '#64748B' }

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
  const [showRules, setShowRules] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [view, setView] = useState('list')
  const [dashData, setDashData] = useState(null)
  const [notifs, setNotifs] = useState({})
  const [followups, setFollowups] = useState({ upcoming: [], overdue: [] })
  const [showFilter, setShowFilter] = useState(false)

  const loadMessages = useCallback(async () => {
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
    } catch (e) {} finally { setLoading(false) }
  }, [categoryFilter, statusFilter, priorityFilter, search])

  useEffect(() => { loadMessages() }, [loadMessages])

  const loadMeta = useCallback(async () => {
    try { const r = await listAccounts(); setAccounts(r.accounts || []) } catch (e) {}
    try { const r = await getDashboard(); setDashData(r) } catch (e) {}
    try { const r = await getNotifications(); setNotifs(r) } catch (e) {}
    try { const r = await getFollowups(); setFollowups(r) } catch (e) {}
  }, [])

  useEffect(() => { loadMeta() }, [loadMeta])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await connectEmail()
      if (res.auth_url) window.location.href = res.auth_url
      else if (res.error) alert(res.error)
    } catch (e) { alert(e.response?.data?.error || 'Connection failed') } finally { setConnecting(false) }
  }

  const handleFetch = async () => {
    setLoading(true)
    try { await fetchEmails(); loadMessages(); loadMeta() } catch (e) { setLoading(false) }
  }

  const handleDisconnect = async (id) => { await disconnectAccount(id); loadMeta(); loadMessages() }

  const tabs = [
    { key: '', label: 'All', count: counts.total },
    { key: 'new', label: 'New', count: counts.new },
    { key: 'unread', label: 'Unread', count: counts.unread },
    { key: 'assigned', label: 'Assigned', count: counts.assigned },
    { key: 'unassigned', label: 'Unassigned', count: counts.unassigned },
    ...CATEGORIES.map(c => ({ key: c.toLowerCase(), label: c, count: counts[c.toLowerCase()] || 0 })),
  ]

  const dashes = [
    { label: 'Today', value: dashData?.today || 0, color: '#3B82F6', icon: Clock },
    { label: 'Unread', value: dashData?.unread || 0, color: '#EF4444', icon: Mail },
    { label: 'Overdue', value: dashData?.overdue || 0, color: '#F59E0B', icon: AlertTriangle },
    { label: 'My Tasks', value: dashData?.assigned_to_me || 0, color: '#6D28D9', icon: UserCheck },
  ]

  const isTabActive = (t) => {
    if (t.key === '' && !statusFilter && !categoryFilter) return true
    if (['new', 'assigned', 'unassigned'].includes(t.key) && statusFilter === t.key) return true
    if (!['new', 'assigned', 'unassigned'].includes(t.key) && t.key !== '' && categoryFilter === t.label) return true
    return false
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, background: C.bg }}>
      <div style={{ maxWidth: '100%' }}>

        <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Email Inbox</h1>
            <p style={{ fontSize: 13, color: C.secondary, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{dashData?.total || 0} total</span>
              {accounts.length > 0 && <><span style={{ opacity: 0.3 }}>·</span><span>{accounts[0].email}</span></>}
              {notifs?.new_emails_today > 0 && <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{notifs.new_emails_today} new today</span>}
              {notifs?.followup_today > 0 && <span style={{ background: '#FEF3C7', color: '#D97706', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{notifs.followup_today} follow-ups today</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowTemplates(!showTemplates)}
              style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: showTemplates ? C.blue : '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: showTemplates ? '#fff' : C.text, fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
              <FileText className="w-3.5 h-3.5" /> Templates
            </button>
            <button onClick={() => setShowRules(!showRules)}
              style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: showRules ? C.blue : '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: showRules ? '#fff' : C.text, fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
              <Sliders className="w-3.5 h-3.5" /> Rules
            </button>
            {accounts.length === 0 ? (
              <button onClick={handleConnect} disabled={connecting}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                <Mail className="w-4 h-4" /> {connecting ? 'Connecting...' : 'Connect Outlook'}
              </button>
            ) : (
              <>
                <button onClick={handleFetch}
                  style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: C.text, fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw className="w-3.5 h-3.5" /> Fetch
                </button>
                <button onClick={() => handleDisconnect(accounts[0].id)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#DC2626', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <X className="w-3.5 h-3.5" /> Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '18px 28px 0', display: 'flex', gap: 12 }}>
          {dashes.map(d => {
            const Icon = d.icon
            return (
              <div key={d.label} style={{
                flex: 1, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `linear-gradient(135deg, ${d.color}15, ${d.color}08)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: d.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: d.color, lineHeight: 1.2 }}>{d.value}</div>
                  <div style={{ fontSize: 12, color: C.secondary, fontWeight: 500 }}>{d.label}</div>
                </div>
              </div>
            )
          })}
          {followups.overdue.length > 0 && (
            <div style={{
              flex: 1, background: '#FFF5F5', borderRadius: 12, border: '1px solid #FECACA',
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle className="w-4.5 h-4.5" style={{ color: '#DC2626' }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#DC2626', lineHeight: 1.2 }}>{followups.overdue.length}</div>
                <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>Overdue Follow-ups</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 28px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, overflow: 'auto', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, marginRight: 12, borderRight: `1px solid ${C.border}`, paddingRight: 12 }}>
            <button onClick={() => setView('list')} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: C.font,
              background: view === 'list' ? C.blue : '#F1F5F9', color: view === 'list' ? '#fff' : C.text, transition: 'all 0.15s',
            }}>List</button>
            <button onClick={() => setView('kanban')} style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: C.font,
              background: view === 'kanban' ? C.blue : '#F1F5F9', color: view === 'kanban' ? '#fff' : C.text, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
            }}><Columns className="w-3 h-3" />Kanban</button>
          </div>
          {tabs.map(t => (
            <button key={t.key} onClick={() => {
              if (['new', 'assigned', 'unassigned'].includes(t.key)) { setStatusFilter(t.key); setCategoryFilter('') }
              else if (t.label === 'All') { setStatusFilter(''); setCategoryFilter('') }
              else { setCategoryFilter(t.label); setStatusFilter('') }
            }} style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, fontFamily: C.font, whiteSpace: 'nowrap', transition: 'all 0.15s',
              background: isTabActive(t) ? C.blue : '#F1F5F9',
              color: isTabActive(t) ? '#fff' : C.text,
            }}>
              {t.label} {t.count > 0 && <span style={{ opacity: 0.7, marginLeft: 4 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 28px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.secondary, pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 14px 9px 38px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff', color: C.text, boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              placeholder="Search by subject, sender, company..." />
          </div>
          <button onClick={() => setShowFilter(!showFilter)} style={{
            padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: showFilter ? C.blue : '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: showFilter ? '#fff' : C.text, fontFamily: C.font, transition: 'all 0.15s',
          }}>
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          {showFilter && (
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, outline: 'none' }}>
              <option value="">All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>

        {showRules && <EmailRulesPanel onClose={() => setShowRules(false)} />}
        {showTemplates && <EmailTemplatesPanel onClose={() => setShowTemplates(false)} />}

        {view === 'kanban' ? (
          <EmailKanban onSelect={setSelectedMsg} selectedId={selectedMsg?.id} />
        ) : (
          <div style={{ padding: '0 28px 28px', display: 'flex', gap: 20 }}>
            <div style={{ flex: selectedMsg ? '0 0 38%' : 1, minWidth: 0 }}>
              {loading ? <TableSkeleton rows={8} cols={3} />
              : messages.length === 0 ? (
                <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center', padding: '64px 20px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Inbox className="w-7 h-7" style={{ color: C.secondary, opacity: 0.4 }} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>No emails found</div>
                  <div style={{ fontSize: 13, color: C.secondary, marginTop: 6 }}>
                    {accounts.length > 0 ? 'Click "Fetch" to pull new emails.' : 'Connect your Outlook to get started.'}
                  </div>
                </div>
              ) : (
                <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  {messages.map((msg, idx) => {
                    const initials = (msg.sender_name || msg.sender_email || '?').charAt(0).toUpperCase()
                    const bgColors = ['#3B82F6', '#6D28D9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444']
                    const avatarBg = bgColors[idx % bgColors.length]
                    return (
                      <div key={msg.id} onClick={() => setSelectedMsg(msg)}
                        style={{
                          display: 'flex', gap: 12, padding: '14px 18px', cursor: 'pointer',
                          borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s',
                          background: selectedMsg?.id === msg.id ? '#EEF2FF' : msg.is_read ? '#fff' : '#F8FAFC',
                        }}
                        onMouseEnter={e => { if (selectedMsg?.id !== msg.id) e.currentTarget.style.background = '#F1F5F9' }}
                        onMouseLeave={e => { if (selectedMsg?.id !== msg.id) e.currentTarget.style.background = msg.is_read ? '#fff' : '#F8FAFC' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, background: avatarBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0, marginTop: 2,
                        }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: msg.is_read ? 500 : 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.sender_name || msg.sender_email}</span>
                            {!msg.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue, flexShrink: 0 }} />}
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: C.secondary, flexShrink: 0 }}>
                              {msg.received_at ? new Date(msg.received_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{msg.subject || '(no subject)'}</div>
                          <div style={{ fontSize: 12, color: C.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{msg.body_preview}</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {msg.category && (
                              <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: (msg.category === 'Lead' ? '#6D28D9' : msg.category === 'Support' ? '#3B82F6' : msg.category === 'Invoice' ? '#EF4444' : msg.category === 'Meeting' ? '#8B5CF6' : msg.category === 'Task' ? '#EC4899' : msg.category === 'Follow-up' ? '#F59E0B' : msg.category === 'Client' ? '#10B981' : '#64748B') + '18', color: msg.category === 'Lead' ? '#6D28D9' : msg.category === 'Support' ? '#3B82F6' : msg.category === 'Invoice' ? '#EF4444' : msg.category === 'Meeting' ? '#8B5CF6' : msg.category === 'Task' ? '#EC4899' : msg.category === 'Follow-up' ? '#F59E0B' : msg.category === 'Client' ? '#10B981' : '#64748B' }}>
                                {msg.category}
                              </span>
                            )}
                            <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: (STATUS_COLORS[msg.status] || '#94A3B8') + '18', color: STATUS_COLORS[msg.status] || '#94A3B8' }}>{msg.status}</span>
                            {msg.priority && (
                              <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: (PRIORITY_COLORS[msg.priority] || '#64748B') + '18', color: PRIORITY_COLORS[msg.priority] || '#64748B' }}>
                                {msg.priority}
                              </span>
                            )}
                            {msg.assigned_to_name && (
                              <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#F3E8FF', color: '#6D28D9', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <UserCheck className="w-2.5 h-2.5" /> {msg.assigned_to_name}
                              </span>
                            )}
                            {msg.company && (
                              <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#DEEBFF', color: C.blue }}>{msg.company}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {selectedMsg && (
              <EmailDetailPanel
                msg={selectedMsg}
                employees={employees}
                onClose={() => setSelectedMsg(null)}
                onRefresh={() => { loadMessages(); loadMeta() }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
