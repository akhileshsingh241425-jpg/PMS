import { useState, useEffect, useCallback } from 'react'
import { Mail, Search, RefreshCw, Inbox, BarChart3, Columns, AlertTriangle, Clock, Bell } from 'lucide-react'
import { C } from '../components/styleConstants'
import { listMessages, fetchEmails, listAccounts, connectEmail, disconnectAccount, getDashboard, getKanban, getNotifications, getFollowups } from '../api/emailApi'
import { TableSkeleton } from '../components/LoadingSkeleton'
import EmailDetailPanel from '../components/EmailDetailPanel'
import EmailRulesPanel from '../components/EmailRulesPanel'
import EmailTemplatesPanel from '../components/EmailTemplatesPanel'
import EmailKanban from '../components/EmailKanban'

const CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']
const STATUSES = ['New', 'Assigned', 'Working', 'Waiting Customer', 'Completed', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
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
  const [showRules, setShowRules] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [view, setView] = useState('list')
  const [dashData, setDashData] = useState(null)
  const [notifs, setNotifs] = useState({})
  const [followups, setFollowups] = useState({ upcoming: [], overdue: [] })

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
    } catch (e) { } finally { setLoading(false) }
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
      if (res.auth_url) { window.location.href = res.auth_url }
      else if (res.error) { alert(res.error) }
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
    { label: 'My Tasks', value: dashData?.assigned_to_me || 0, color: '#6D28D9', icon: BarChart3 },
  ]

  const badge = (s) => ({ padding: '4px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: C.font, whiteSpace: 'nowrap', ...s })

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, background: C.bg, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ padding: 0 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Email Inbox</h1>
            <p style={{ fontSize: 13, color: C.secondary, margin: '4px 0 0' }}>
              {dashData?.total || 0} total {accounts.length > 0 && ` · ${accounts[0].email}`}
              {notifs?.new_emails_today > 0 && <span style={{ color: '#EF4444', marginLeft: 8 }}>· {notifs.new_emails_today} new today</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowTemplates(!showTemplates)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: showTemplates ? C.blue : '#fff', fontSize: 12, cursor: 'pointer', color: showTemplates ? '#fff' : C.text, fontFamily: C.font }}>
              Templates
            </button>
            <button onClick={() => setShowRules(!showRules)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: showRules ? C.blue : '#fff', fontSize: 12, cursor: 'pointer', color: showRules ? '#fff' : C.text, fontFamily: C.font }}>
              Auto Rules
            </button>
            {accounts.length === 0 ? (
              <button onClick={handleConnect} disabled={connecting}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
                <Mail className="w-4 h-4" style={{ marginRight: 4 }} /> {connecting ? '...' : 'Connect Outlook'}
              </button>
            ) : (
              <>
                <button onClick={handleFetch}
                  style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text, fontFamily: C.font }}>
                  <RefreshCw className="w-4 h-4" style={{ marginRight: 4 }} /> Fetch
                </button>
                <button onClick={() => handleDisconnect(accounts[0].id)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 13, cursor: 'pointer', color: '#DC2626', fontFamily: C.font }}>
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Cards */}
        <div style={{ padding: '16px 24px 0', display: 'flex', gap: 12 }}>
          {dashes.map(d => {
            const Icon = d.icon
            return (
              <div key={d.label} style={{ flex: 1, background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: d.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon className="w-4 h-4" style={{ color: d.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: d.color, lineHeight: 1.2 }}>{d.value}</div>
                  <div style={{ fontSize: 11, color: C.secondary }}>{d.label}</div>
                </div>
              </div>
            )
          })}
          {followups.overdue.length > 0 && (
            <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, marginBottom: 4 }}>Follow-ups Overdue</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>{followups.overdue.length}</div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ padding: '12px 24px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 4, marginRight: 12, borderRight: `1px solid ${C.border}`, paddingRight: 12 }}>
            <button onClick={() => setView('list')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: C.font, background: view === 'list' ? C.blue : '#F1F5F9', color: view === 'list' ? '#fff' : C.text }}>List</button>
            <button onClick={() => setView('kanban')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: C.font, background: view === 'kanban' ? C.blue : '#F1F5F9', color: view === 'kanban' ? '#fff' : C.text }}><Columns className="w-3 h-3" style={{ marginRight: 4 }} />Kanban</button>
          </div>
          {tabs.map(t => (
            <button key={t.key} onClick={() => {
              if (['new', 'assigned', 'unassigned'].includes(t.key)) { setStatusFilter(t.key); setCategoryFilter('') }
              else if (t.label === 'All') { setStatusFilter(''); setCategoryFilter('') }
              else { setCategoryFilter(t.label); setStatusFilter('') }
            }}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: C.font, whiteSpace: 'nowrap',
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

        {/* Search */}
        <div style={{ padding: '12px 24px', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.secondary, pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 34px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font, background: '#fff', color: C.text, boxSizing: 'border-box' }}
              placeholder="Search by subject, sender, company..." />
          </div>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
            <option value="">All Priority</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Panels */}
        {showRules && <EmailRulesPanel onClose={() => setShowRules(false)} />}
        {showTemplates && <EmailTemplatesPanel onClose={() => setShowTemplates(false)} />}

        {/* Content */}
        {view === 'kanban' ? (
          <EmailKanban onSelect={setSelectedMsg} selectedId={selectedMsg?.id} />
        ) : (
          <div style={{ padding: '0 24px 24px', display: 'flex', gap: 16 }}>
            <div style={{ flex: selectedMsg ? '0 0 40%' : 1, minWidth: 0 }}>
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
                    <div key={msg.id} onClick={() => setSelectedMsg(msg)}
                      style={{
                        display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer',
                        borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s',
                        background: selectedMsg?.id === msg.id ? '#EEF2FF' : msg.is_read ? 'transparent' : '#F8FAFC',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = selectedMsg?.id === msg.id ? '#EEF2FF' : '#F1F5F9'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedMsg?.id === msg.id ? '#EEF2FF' : msg.is_read ? 'transparent' : '#F8FAFC'}
                    >
                      <div style={{ width: 4, height: 36, borderRadius: 2, background: (msg.priority === 'Urgent' ? '#EF4444' : msg.priority === 'High' ? '#F59E0B' : msg.priority === 'Low' ? '#94A3B8' : '#3B82F6'), flexShrink: 0 }} />
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
                          {msg.category && <span style={badge({ background: (msg.category === 'Lead' ? '#6D28D9' : msg.category === 'Support' ? '#3B82F6' : msg.category === 'Invoice' ? '#EF4444' : msg.category === 'Meeting' ? '#8B5CF6' : msg.category === 'Task' ? '#EC4899' : msg.category === 'Follow-up' ? '#F59E0B' : msg.category === 'Client' ? '#10B981' : '#64748B') + '20', color: msg.category === 'Lead' ? '#6D28D9' : msg.category === 'Support' ? '#3B82F6' : msg.category === 'Invoice' ? '#EF4444' : msg.category === 'Meeting' ? '#8B5CF6' : msg.category === 'Task' ? '#EC4899' : msg.category === 'Follow-up' ? '#F59E0B' : msg.category === 'Client' ? '#10B981' : '#64748B' })}>{msg.category}</span>}
                          <span style={badge({ background: STATUS_COLORS[msg.status] + '20', color: STATUS_COLORS[msg.status] })}>{msg.status}</span>
                          {msg.company && <span style={badge({ background: '#DEEBFF', color: C.blue })}>{msg.company}</span>}
                          {msg.assigned_to_name && <span style={badge({ background: '#F3E8FF', color: '#6D28D9' })}>{msg.assigned_to_name}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
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
