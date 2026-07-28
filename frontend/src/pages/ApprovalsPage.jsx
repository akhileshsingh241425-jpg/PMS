import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import {
  CheckCircle, XCircle, Clock, User, FileText,
  AlertCircle, Loader2, MessageSquare, ExternalLink, Ban,
  IndianRupee, CalendarDays, ChevronDown, ChevronUp, History
} from 'lucide-react'

const REQUEST_TYPE_STYLES = {
  leave: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Leave' },
  short_leave: { bg: '#FFF7ED', text: '#C2410C', label: 'Short Leave' },
  expense: { bg: '#F0FDF4', text: '#15803D', label: 'Expense' },
  task: { bg: '#F5F3FF', text: '#6D28D9', label: 'Task' },
  vendor_payment: { bg: '#FEF2F2', text: '#B91C1C', label: 'Vendor Payment' },
}

const STATUS_STYLES = {
  pending: { bg: '#FFFBEB', text: '#D97706', label: 'Pending' },
  approved: { bg: '#F0FDF4', text: '#15803D', label: 'Approved' },
  rejected: { bg: '#FEF2F2', text: '#B91C1C', label: 'Rejected' },
  cancelled: { bg: '#F1F5F9', text: '#64748B', label: 'Cancelled' },
}

function formatDT(ds) {
  if (!ds) return ''
  const d = new Date(ds)
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function PayloadDetails({ payload, request_type }) {
  if (!payload) return null
  if (request_type === 'leave' || request_type === 'short_leave') {
    return (
      <div style={{ fontSize: 12, color: '#64748B' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {payload.leave_type && <span>{payload.leave_type}</span>}
          {payload.days && <span>{payload.days} day(s)</span>}
          {payload.from_date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarDays className="w-3 h-3" /> {payload.from_date?.slice(0, 10)}
          </span>}
          {payload.to_date && <span>→ {payload.to_date?.slice(0, 10)}</span>}
        </div>
        {payload.reason && <div style={{ marginTop: 4, color: '#0F172A', fontWeight: 500 }}>
          {payload.reason}
        </div>}
      </div>
    )
  }
  if (request_type === 'expense') {
    return (
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
        {payload.category && <span>{payload.category}</span>}
        {payload.amount && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#0F172A' }}>
          <IndianRupee className="w-3 h-3" /> {payload.amount}
        </span>}
        {payload.date && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarDays className="w-3 h-3" /> {payload.date?.slice(0, 10)}
        </span>}
      </div>
    )
  }
  return <pre style={{ fontSize: 11, margin: 0 }}>{JSON.stringify(payload, null, 2)}</pre>
}

export default function ApprovalsPage() {
  const { user, hasRole } = useAuth()
  const { addToast } = useToast()
  const [tab, setTab] = useState('pending')
  const [approvals, setApprovals] = useState([])
  const [history, setHistory] = useState([])
  const [allApprovals, setAllApprovals] = useState([])
  const [allHistory, setAllHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [acting, setActing] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const isAdminUser = hasRole('admin', 'super_admin')

  const loadData = (silent) => {
    if (!silent) setLoading(true)
    const allPromises = [api.get('/api/approvals'), api.get('/api/approvals/history')]
    if (isAdminUser) {
      allPromises.push(api.get('/api/approvals/all'))
      allPromises.push(api.get('/api/approvals/all/history'))
    }
    Promise.all(allPromises)
      .then(([pendingRes, historyRes, allRes, allHistRes]) => {
        setApprovals(pendingRes.data.approvals || [])
        setHistory(historyRes.data.approvals || [])
        if (allRes) setAllApprovals(allRes.data.approvals || [])
        if (allHistRes) setAllHistory(allHistRes.data.approvals || [])
      })
      .catch(() => addToast('Failed to load approvals', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { const iv = setInterval(() => loadData(true), 15000); return () => clearInterval(iv) }, [])

  const handleAction = async (id, action) => {
    if (action === 'reject' && !remarks.trim()) {
      addToast('Please provide remarks for rejection', 'error')
      return
    }
    setActing(true)
    try {
      await api.post(`/api/approvals/${id}/${action}`, { remarks })
      addToast(`${action === 'approve' ? 'Approved' : 'Rejected'} successfully`, 'success')
      setActionId(null)
      setRemarks('')
      loadData(true)
    } catch (e) {
      addToast(e.response?.data?.error || 'Action failed', 'error')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="w-8 h-8" style={{ animation: 'spin 1s linear infinite', color: '#5B3DF5' }} />
      </div>
    )
  }

  const pendingCount = approvals.length
  const historyCount = history.length
  const allCount = allApprovals.length
  const allHistoryCount = allHistory.length

  const listData = tab === 'pending' ? approvals
    : tab === 'history' ? history
    : tab === 'all' ? allApprovals
    : allHistory

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0F172A' }}>Approvals</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
          Review and manage approval requests
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'pending', label: 'Pending', count: pendingCount, icon: Clock },
            { key: 'history', label: 'History', count: historyCount, icon: History },
            ...(isAdminUser ? [
              { key: 'all', label: 'All Requests', count: allCount, icon: FileText },
              { key: 'allHistory', label: 'All History', count: allHistoryCount, icon: History },
            ] : []),
          ].map(t => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 10, border: '1px solid',
                borderColor: active ? '#6D28D9' : '#E2E8F0',
                background: active ? '#F5F3FF' : '#fff',
                color: active ? '#6D28D9' : '#64748B',
                fontWeight: active ? 600 : 500, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              <Icon className="w-4 h-4" />
              {t.label}
              <span style={{
                background: active ? '#6D28D9' : '#F1F5F9',
                color: active ? '#fff' : '#64748B',
                padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
              }}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {listData.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <CheckCircle className="w-12 h-12" style={{ color: '#22C55E', margin: '0 auto 16px' }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>All clear!</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
            {tab === 'pending' ? 'No pending approvals' : tab === 'allHistory' ? 'No approval history' : 'No approval history'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {listData.map(a => {
            const rt = REQUEST_TYPE_STYLES[a.request_type] || REQUEST_TYPE_STYLES.leave
            const st = STATUS_STYLES[a.status] || STATUS_STYLES.pending
            const isExpanded = expandedId === a.id

            return (
              <div key={a.id} style={{
                background: '#fff', borderRadius: 12, padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                border: a.status === 'pending' && a.current_approver_id === user?.id ? '1px solid #DDD6FE' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 4, background: rt.bg, color: rt.text }}>{rt.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 4, background: st.bg, color: st.text }}>{st.label}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: '#DEEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#0052CC', fontSize: 11, fontWeight: 800, flexShrink: 0,
                      }}>{a.requester_name?.[0] || '?'}</div>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{a.requester_name || 'Unknown'}</span>
                        <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>{a.requester_role || ''}</span>
                      </div>
                    </div>

                    <PayloadDetails payload={a.payload} request_type={a.request_type} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 11, color: '#94A3B8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock className="w-3 h-3" /> {formatDT(a.created_at)}
                      </span>
                      {a.current_approver_name && a.status === 'pending' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User className="w-3 h-3" /> Approver: {a.current_approver_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons for pending items where user can approve */}
                  {a.status === 'pending' && (
                    user?.role === 'admin' || user?.role === 'super_admin' ||
                    a.current_approver_id === user?.id ||
                    (user?.role === 'hr' && ['leave', 'short_leave'].includes(a.request_type)) ||
                    (user?.role === 'finance' && ['expense', 'vendor_payment'].includes(a.request_type))
                  ) && (
                    <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0, flexDirection: 'column' }}>
                      <button onClick={() => handleAction(a.id, 'approve')} disabled={acting}
                        style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#15803D', color: '#fff', cursor: acting ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => setActionId(actionId === a.id ? null : a.id)}
                        style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Reject remarks input */}
                {actionId === a.id && (
                  <div style={{ marginTop: 12, padding: '12px 16px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', display: 'block', marginBottom: 6 }}>Rejection Remarks *</label>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Explain why this is being rejected..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #FECACA', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setActionId(null); setRemarks('') }}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                      <button onClick={() => handleAction(a.id, 'reject')} disabled={acting || !remarks.trim()}
                        style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', cursor: acting ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {acting ? 'Processing...' : 'Confirm Reject'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Expand history */}
                {(tab === 'history' || a.status !== 'pending') && a.history_entries?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#F8FAFC', cursor: 'pointer', fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? 'Hide' : 'Show'} approval chain
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        {(a.history_entries || []).map((h, i) => (
                          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 11, color: '#64748B' }}>
                            <span style={{ color: h.action === 'approve' ? '#15803D' : '#DC2626', fontWeight: 600 }}>
                              {h.action === 'approve' ? '✓' : '✗'} {h.action}
                            </span>
                            <span>by {h.actor_name || 'Unknown'}</span>
                            {h.remarks && <span>- {h.remarks}</span>}
                            <span style={{ color: '#94A3B8' }}>{formatDT(h.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}