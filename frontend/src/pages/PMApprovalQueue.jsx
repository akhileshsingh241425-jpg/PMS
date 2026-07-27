import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  CheckCircle, XCircle, Clock, Send, User, FileText,
  AlertCircle, ChevronRight, Loader2, MessageSquare, ExternalLink
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import Breadcrumb from '../components/Breadcrumb'

const STATUS_STYLES = {
  'ALLOTTED': { bg: '#EFF6FF', text: '#1D4ED8' },
  'IN PROGRESS': { bg: '#FFF7ED', text: '#C2410C' },
  'BLOCKED': { bg: '#FEF2F2', text: '#B91C1C' },
  'SENT FOR APPROVAL': { bg: '#F5F3FF', text: '#6D28D9' },
  'REWORK': { bg: '#FFFBEB', text: '#A16207' },
  'APPROVED': { bg: '#F0FDF4', text: '#15803D' },
}

function formatDate(ds) {
  if (!ds) return ''
  const d = new Date(ds)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDT(ds) {
  if (!ds) return ''
  const d = new Date(ds)
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PMApprovalQueue() {
  const { addToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionTask, setActionTask] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [acting, setActing] = useState(false)

  const loadData = () => {
    setLoading(true)
    api.get('/api/pm/approvals')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleApprove = async (tid) => {
    setActing(true)
    try {
      await api.post(`/api/pm/approvals/${tid}/approve`)
      setActionTask(null)
      loadData()
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error') }
    finally { setActing(false) }
  }

  const handleRework = async (tid) => {
    if (!remarks.trim()) return
    setActing(true)
    try {
      await api.post(`/api/pm/approvals/${tid}/rework`, { remarks })
      setActionTask(null)
      setRemarks('')
      loadData()
    } catch (e) { addToast(e.response?.data?.error || 'Failed', 'error') }
    finally { setActing(false) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="w-8 h-8" style={{ animation: 'spin 1s linear infinite', color: '#5B3DF5' }} />
      </div>
    )
  }

  const approvals = data?.approvals || []
  const stats = data?.stats || {}

  return (
    <div>
      <Breadcrumb items={[{ label: 'PM Dashboard', to: '/pm' }, { label: 'Approvals' }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Approval Queue</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            {stats.total || 0} task(s) awaiting your decision
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#6D28D9' }}>{stats.total || 0}</p>
          <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>Pending Approval</p>
        </div>
        {(stats.by_project || []).map(p => (
          <div key={p.project} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#0F172A' }}>{p.count}</p>
            <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.project}</p>
          </div>
        ))}
      </div>

      {approvals.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <CheckCircle className="w-12 h-12" style={{ color: '#22C55E', margin: '0 auto 16px' }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>All caught up!</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>No tasks pending approval</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {approvals.map(t => {
            const st = STATUS_STYLES[t.status] || STATUS_STYLES['ALLOTTED']
            return (
              <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: st.bg, color: st.text }}>{t.status}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{t.project_name}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{t.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 12, color: '#64748B' }}>
                      {t.assigned_name && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User className="w-3 h-3" /> {t.assigned_name}
                        </span>
                      )}
                      {t.due_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock className="w-3 h-3" /> Due: {formatDate(t.due_date)}
                        </span>
                      )}
                      {t.created_at && (
                        <span style={{ color: '#94A3B8' }}>Submitted {formatDT(t.created_at)}</span>
                      )}
                    </div>
                    {t.description && (
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>{t.description}</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
                    <button onClick={() => handleApprove(t.id)} disabled={acting}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#15803D', color: '#fff', cursor: acting ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => setActionTask(actionTask === t.id ? null : t.id)}
                      style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <XCircle className="w-4 h-4" /> Rework
                    </button>
                  </div>
                </div>

                {actionTask === t.id && (
                  <div style={{ marginTop: 12, padding: '12px 16px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#92400E', display: 'block', marginBottom: 6 }}>Rework Remarks *</label>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Explain what needs to be fixed..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #FDE68A', fontSize: 13, resize: 'vertical', background: '#fff' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setActionTask(null); setRemarks('') }}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                      <button onClick={() => handleRework(t.id)} disabled={acting || !remarks.trim()}
                        style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', cursor: acting ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {acting ? 'Sending...' : 'Send Back for Rework'}
                      </button>
                    </div>
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
