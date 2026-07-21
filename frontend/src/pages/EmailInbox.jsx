import { useState, useEffect, useCallback } from 'react'
import { Mail, Search, RefreshCw, Inbox, UserPlus, Tag, CheckCircle, X, ExternalLink, MessageSquare } from 'lucide-react'
import { C } from '../components/styleConstants'
import { listMessages, markRead, categorizeMessage, assignMessage, connectEmail, fetchEmails, listAccounts, disconnectAccount } from '../api/emailApi'
import { TableSkeleton } from '../components/LoadingSkeleton'

const CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']
const CAT_COLORS = {
  Lead: '#6D28D9', Client: '#10B981', 'Follow-up': '#F59E0B',
  Support: '#3B82F6', Task: '#EC4899', Meeting: '#8B5CF6',
  Invoice: '#EF4444', Other: '#64748B',
}

export default function EmailInbox() {
  const [messages, setMessages] = useState([])
  const [counts, setCounts] = useState({})
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [connecting, setConnecting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (categoryFilter) params.category = categoryFilter
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const res = await listMessages(params)
      setMessages(res.messages || [])
      setCounts(res.counts || {})
      setEmployees(res.employees || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, statusFilter, search])

  useEffect(() => { load() }, [load])

  const loadAccounts = useCallback(async () => {
    try { const r = await listAccounts(); setAccounts(r.accounts || []) } catch (e) {}
  }, [])
  useEffect(() => { loadAccounts() }, [loadAccounts])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await connectEmail()
      if (res.auth_url) window.location.href = res.auth_url
    } catch (e) {
    } finally {
      setConnecting(false)
    }
  }

  const handleFetch = async () => {
    setLoading(true)
    try { await fetchEmails(); load() } catch (e) { setLoading(false) }
  }

  const handleDisconnect = async (id) => {
    await disconnectAccount(id)
    loadAccounts()
    load()
  }

  const handleMsgClick = async (msg) => {
    setSelectedMsg(msg)
    if (!msg.is_read) {
      await markRead(msg.id)
      load()
    }
  }

  const handleCategorize = async (id, cat) => {
    await categorizeMessage(id, cat)
    load()
    if (selectedMsg?.id === id) setSelectedMsg(prev => ({ ...prev, category: cat }))
  }

  const handleAssign = async (id, uid) => {
    await assignMessage(id, uid)
    load()
    if (selectedMsg?.id === id) {
      const emp = employees.find(e => e.id === uid)
      setSelectedMsg(prev => ({ ...prev, assigned_to_id: uid, assigned_to_name: emp?.name }))
    }
  }

  const tabs = [
    { key: '', label: 'All', count: counts.total },
    { key: 'unread', label: 'Unread', count: counts.unread },
    ...CATEGORIES.map(c => ({ key: c.toLowerCase(), label: c, count: counts[c.toLowerCase()] || 0 })),
  ]

  const activeTab = categoryFilter.toLowerCase() || statusFilter

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
            {accounts.length === 0 ? (
              <button onClick={handleConnect} disabled={connecting} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: C.font,
              }}>
                <Mail className="w-4 h-4" /> {connecting ? 'Connecting...' : 'Connect Outlook'}
              </button>
            ) : (
              <>
                <button onClick={handleFetch} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: '#fff', fontSize: 13, cursor: 'pointer', color: C.text, fontFamily: C.font,
                }}>
                  <RefreshCw className="w-4 h-4" /> Fetch
                </button>
                <button onClick={() => handleDisconnect(accounts[0].id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, border: `1px solid #FECACA`,
                  background: '#FEF2F2', fontSize: 13, cursor: 'pointer', color: '#DC2626', fontFamily: C.font,
                }}>
                  <X className="w-4 h-4" /> Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ padding: '12px 24px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}` }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setCategoryFilter(t.key === 'unread' ? '' : t.label === 'All' ? '' : t.label); setStatusFilter(t.key === 'unread' ? 'unread' : '') }}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, fontFamily: C.font, whiteSpace: 'nowrap',
                background: (t.key === 'unread' ? statusFilter === 'unread' : t.label === 'All' ? !categoryFilter && statusFilter !== 'unread' : categoryFilter === t.label) ? C.blue : '#F1F5F9',
                color: (t.key === 'unread' ? statusFilter === 'unread' : t.label === 'All' ? !categoryFilter && statusFilter !== 'unread' : categoryFilter === t.label) ? '#fff' : C.text,
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
              style={{
                width: '100%', padding: '8px 12px 8px 34px', border: `1px solid ${C.border}`,
                borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font,
                background: '#fff', boxSizing: 'border-box', color: C.text,
              }}
              placeholder="Search by subject, sender..."
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 16 }}>
          {/* List */}
          <div style={{ flex: selectedMsg ? '0 0 45%' : 1, minWidth: 0 }}>
            {loading ? (
              <TableSkeleton rows={8} cols={3} />
            ) : messages.length === 0 ? (
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
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 16px', cursor: 'pointer',
                      borderBottom: '1px solid #F1F5F9',
                      background: selectedMsg?.id === msg.id ? '#EEF2FF' : msg.is_read ? 'transparent' : '#F8FAFC',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = selectedMsg?.id === msg.id ? '#EEF2FF' : '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.background = selectedMsg?.id === msg.id ? '#EEF2FF' : msg.is_read ? 'transparent' : '#F8FAFC'}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: CAT_COLORS[msg.category] || '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {msg.sender_name?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: msg.is_read ? 500 : 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.sender_name || msg.sender_email}</span>
                        {!msg.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue, flexShrink: 0 }} />}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.secondary, flexShrink: 0 }}>
                          {msg.received_at ? new Date(msg.received_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{msg.subject || '(no subject)'}</div>
                      <div style={{ fontSize: 12, color: C.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body_preview}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 10, background: CAT_COLORS[msg.category] + '20', color: CAT_COLORS[msg.category] }}>
                          {msg.category}
                        </span>
                        {msg.assigned_to_name && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 10, background: '#DEEBFF', color: C.blue }}>
                            {msg.assigned_to_name}
                          </span>
                        )}
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
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
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

              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3 }}>{selectedMsg.subject || '(no subject)'}</h2>
              <p style={{ fontSize: 12, color: C.secondary, margin: '0 0 16px' }}>
                {selectedMsg.received_at ? new Date(selectedMsg.received_at).toLocaleString('en-IN') : ''}
                {selectedMsg.recipient_email && ` · To: ${selectedMsg.recipient_email}`}
              </p>

              <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: C.text, marginBottom: 20, minHeight: 120 }}>
                {selectedMsg.body_preview || '(no content)'}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <Tag className="w-4 h-4" style={{ color: C.secondary }} />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => handleCategorize(selectedMsg.id, cat)}
                      style={{
                        padding: '4px 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, fontFamily: C.font, whiteSpace: 'nowrap',
                        background: selectedMsg.category === cat ? CAT_COLORS[cat] : CAT_COLORS[cat] + '20',
                        color: selectedMsg.category === cat ? '#fff' : CAT_COLORS[cat],
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <UserPlus className="w-4 h-4" style={{ color: C.secondary }} />
                <select value={selectedMsg.assigned_to_id || ''} onChange={e => handleAssign(selectedMsg.id, parseInt(e.target.value))}
                  style={{
                    padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`,
                    fontSize: 13, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, flex: 1,
                  }}>
                  <option value="">Assign to...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
