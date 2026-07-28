import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  CheckCheck, Users, Clock, Loader2, ArrowRight, UserX, CalendarClock,
  AlertTriangle, TrendingUp, UserPlus, PartyPopper, UserCog,
} from 'lucide-react'
import { C } from '../components/styleConstants'

const STATUS_COLORS = {
  Present: { bg: '#ECFDF5', text: '#065F46' },
  Working: { bg: '#EFF6FF', text: '#1E40AF' },
  'On Leave': { bg: '#FFFBEB', text: '#92400E' },
  Absent: { bg: '#FEF2F2', text: '#991B1B' },
}

function StatCard({ icon: Icon, label, value, sub, color, bg, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 12, padding: '18px 20px', cursor: onClick ? 'pointer' : 'default',
      border: `1px solid ${C.border}`, transition: 'box-shadow 0.15s', boxShadow: C.shadow,
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = C.shadowMd)}
      onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = C.shadow)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        {onClick && <ArrowRight className="w-3.5 h-3.5" style={{ color: C.muted }} />}
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, margin: 0, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p style={{ fontSize: 12.5, color: C.muted, margin: '4px 0 0' }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: C.muted, margin: '2px 0 0', opacity: 0.8 }}>{sub}</p>}
    </div>
  )
}

function Panel({ title, icon: Icon, children, action }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: C.text }}>
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: C.muted }} />} {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function PersonRow({ p, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: C.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
        <p style={{ fontSize: 11, color: C.muted, margin: '1px 0 0' }}>{p.department || 'Unassigned'} · {p.designation || '—'}</p>
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  )
}

function EmptyRow({ text }) {
  return <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '20px 16px', margin: 0 }}>{text}</p>
}

function Trend({ trend }) {
  const max = Math.max(1, ...trend.map(t => t.present + t.on_leave + t.absent))
  return (
    <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-end', gap: 4, height: 130 }}>
      {trend.map(t => {
        const total = t.present + t.on_leave + t.absent
        const h = total ? Math.max((total / max) * 92, t.day_type !== 'Working' ? 4 : 8) : 4
        const nonWorking = t.day_type !== 'Working'
        return (
          <div key={t.date} title={`${t.date} (${t.day_type}) — Present ${t.present}, Leave ${t.on_leave}, Absent ${t.absent}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column-reverse', height: h, borderRadius: 3, overflow: 'hidden' }}>
              {nonWorking ? (
                <div style={{ flex: 1, background: '#E2E8F0' }} />
              ) : (
                <>
                  {t.absent > 0 && <div style={{ flexBasis: `${(t.absent / total) * 100}%`, background: '#FCA5A5' }} />}
                  {t.on_leave > 0 && <div style={{ flexBasis: `${(t.on_leave / total) * 100}%`, background: '#FCD34D' }} />}
                  {t.present > 0 && <div style={{ flexBasis: `${(t.present / total) * 100}%`, background: C.blue }} />}
                </>
              )}
            </div>
            <p style={{ fontSize: 8.5, color: C.muted, textAlign: 'center', margin: '4px 0 0' }}>{t.date.slice(8, 10)}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function HRDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/api/hr/dashboard').then(r => { setData(r.data); setErr(false) })
      .catch(() => setErr(true)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.blue }} />
    </div>
  }
  if (err || !data) {
    return <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: 13 }}>
      Couldn't load the HR dashboard. <button onClick={load} style={{ color: C.blue, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
    </div>
  }

  const { headcount, attendance, work_log, trend } = data

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 3px', color: C.text }}>HR Dashboard</h1>
          <p style={{ fontSize: 12.5, color: C.muted, margin: 0 }}>
            {new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            {data.day_type !== 'Working' && <span style={{ marginLeft: 8, color: C.orangeText, background: C.orangeLight, padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{data.holiday_name || data.day_type}</span>}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 16 }}>
        <StatCard icon={Users} label="Active employees" value={headcount.total}
          sub={headcount.inactive ? `${headcount.inactive} inactive` : null}
          color={C.blue} bg={C.blueLight} onClick={() => navigate('/hr/employees')} />
        <StatCard icon={CheckCheck} label="Present today" value={`${attendance.present}/${attendance.total}`}
          sub={`${attendance.percent}% attendance`}
          color="#059669" bg="#ECFDF5" onClick={() => navigate('/hr/attendance')} />
        <StatCard icon={CalendarClock} label="On leave today" value={attendance.on_leave}
          color="#B45309" bg="#FFFBEB" onClick={() => navigate('/hr/attendance')} />
        <StatCard icon={UserX} label="Absent today" value={attendance.absent}
          color="#B91C1C" bg="#FEF2F2" onClick={() => navigate('/hr/attendance')} />
        <StatCard icon={AlertTriangle} label="Missing work log" value={work_log.missing}
          sub={`of ${work_log.expected} present`}
          color="#B45309" bg="#FFFBEB" />
        <StatCard icon={CheckCheck} label="Pending leave requests" value={data.pending_leave_requests}
          color="#7C3AED" bg="#F5F3FF" onClick={() => navigate('/hr/approvals')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14, alignItems: 'start' }}>
        <Panel title="14-day attendance trend" icon={TrendingUp}>
          <Trend trend={trend} />
          <div style={{ display: 'flex', gap: 14, padding: '0 16px 12px', fontSize: 10.5, color: C.muted }}>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: C.blue, marginRight: 4 }} />Present</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#FCD34D', marginRight: 4 }} />Leave</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#FCA5A5', marginRight: 4 }} />Absent</span>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#E2E8F0', marginRight: 4 }} />Weekend/Holiday</span>
          </div>
        </Panel>

        <Panel title="Headcount by department" icon={Users}>
          <div style={{ padding: '10px 16px 14px' }}>
            {headcount.by_department.slice(0, 7).map(d => (
              <div key={d.department} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 11.5, color: C.text, width: 110, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.department}</span>
                <div style={{ flex: 1, background: C.bg, borderRadius: 4, height: 7 }}>
                  <div style={{ width: `${(d.count / headcount.total) * 100}%`, background: C.blue, height: 7, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text, width: 18, textAlign: 'right' }}>{d.count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <Panel title={`On leave today (${data.on_leave_today.length})`} icon={CalendarClock}>
          {data.on_leave_today.length === 0 ? <EmptyRow text="Nobody is on approved leave today" /> :
            data.on_leave_today.map(p => (
              <PersonRow key={p.user_id} p={p} right={
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: STATUS_COLORS['On Leave'].bg, color: STATUS_COLORS['On Leave'].text }}>{p.leave_type}</span>
              } />
            ))}
        </Panel>

        <Panel title={`Absent today (${data.absent_today.length})`} icon={UserX}>
          {data.absent_today.length === 0 ? <EmptyRow text="No unexplained absences today" /> :
            data.absent_today.slice(0, 8).map(p => (
              <PersonRow key={p.user_id} p={p} right={
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: STATUS_COLORS.Absent.bg, color: STATUS_COLORS.Absent.text }}>Absent</span>
              } />
            ))}
          {data.absent_today.length > 8 && <EmptyRow text={`+${data.absent_today.length - 8} more — see full attendance`} />}
        </Panel>

        <Panel title={`Missing today's work log (${data.missing_work_log.length})`} icon={AlertTriangle}>
          {data.missing_work_log.length === 0 ? <EmptyRow text="Everyone present has logged today" /> :
            data.missing_work_log.slice(0, 8).map(p => (
              <PersonRow key={p.user_id} p={p} right={<span style={{ fontSize: 11, color: C.muted }}>{p.status}</span>} />
            ))}
        </Panel>

        <Panel title="Upcoming holidays" icon={PartyPopper}>
          {data.upcoming_holidays.length === 0 ? <EmptyRow text="No holidays configured — add one under Attendance → Holidays" /> :
            data.upcoming_holidays.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{h.name}</span>
                <span style={{ fontSize: 11.5, color: C.muted }}>{new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
            ))}
        </Panel>

        {data.recent_joiners.length > 0 && (
          <Panel title={`Recent joiners (30d)`} icon={UserPlus}>
            {data.recent_joiners.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{u.name}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{u.department || '—'}</span>
              </div>
            ))}
          </Panel>
        )}

        {headcount.missing_reporting_manager > 0 && (
          <Panel title="Data hygiene" icon={UserCog}>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                <b style={{ color: C.text }}>{headcount.missing_reporting_manager}</b> employees have no "Reports To" manager set —
                their leave requests will fall back to the first available HR approver instead of a direct manager.
              </p>
              <button onClick={() => navigate('/hr/employees')} style={{ marginTop: 8, fontSize: 11.5, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>
                Review in Employees →
              </button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
