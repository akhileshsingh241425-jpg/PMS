import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { Loader2, Search, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { C } from '../components/styleConstants'

const STATUS_STYLE = {
  Present: { bg: '#ECFDF5', text: '#065F46' },
  Working: { bg: '#EFF6FF', text: '#1E40AF' },
  'On Leave': { bg: '#FFFBEB', text: '#92400E' },
  Absent: { bg: '#FEF2F2', text: '#991B1B' },
  Weekend: { bg: '#F1F5F9', text: '#64748B' },
  Holiday: { bg: '#F1F5F9', text: '#64748B' },
  Upcoming: { bg: '#F1F5F9', text: '#64748B' },
}

const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'
const todayStr = () => new Date().toISOString().slice(0, 10)

const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow }
const inputStyle = { padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12.5, outline: 'none', fontFamily: C.font }

function Pill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Absent
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2.5px 9px', borderRadius: 10, background: s.bg, color: s.text, whiteSpace: 'nowrap' }}>{status}</span>
}

function TodayTab() {
  const toast = useToast()
  const [date, setDate] = useState(todayStr())
  const [dept, setDept] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/hr/attendance', { params: { date, department: dept, status, q } })
      .then(r => setData(r.data))
      .catch(() => toast('Failed to load attendance', 'error'))
      .finally(() => setLoading(false))
  }, [date, dept, status, q])

  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t) }, [load])

  const shiftDate = delta => {
    const d = new Date(date); d.setDate(d.getDate() + delta)
    setDate(d.toISOString().slice(0, 10))
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => shiftDate(-1)} style={{ ...inputStyle, padding: 6, cursor: 'pointer' }}><ChevronLeft className="w-3.5 h-3.5" /></button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          <button onClick={() => shiftDate(1)} disabled={date >= todayStr()} style={{ ...inputStyle, padding: 6, cursor: date >= todayStr() ? 'not-allowed' : 'pointer', opacity: date >= todayStr() ? 0.4 : 1 }}><ChevronRight className="w-3.5 h-3.5" /></button>
          {date !== todayStr() && <button onClick={() => setDate(todayStr())} style={{ fontSize: 11.5, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Today</button>}
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)} style={inputStyle}>
          <option value="">All departments</option>
          {(data?.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
          <option value="">All statuses</option>
          {['Present', 'Working', 'On Leave', 'Absent', 'Weekend', 'Holiday'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 9, top: 9, color: C.muted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name / email / emp ID" style={{ ...inputStyle, paddingLeft: 28, width: 220 }} />
        </div>
      </div>

      {data?.day_type !== 'Working' && data && (
        <div style={{ marginBottom: 12, fontSize: 12, color: '#92400E', background: '#FFFBEB', padding: '8px 14px', borderRadius: 8 }}>
          {date === todayStr() ? 'Today' : date} is a <b>{data.day_type}</b>{data.holiday_name ? ` — ${data.holiday_name}` : ''}.
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            ['Present', data.summary.present, '#059669', '#ECFDF5'],
            ['Still working', data.summary.still_working, '#1E40AF', '#EFF6FF'],
            ['On leave', data.summary.on_leave, '#92400E', '#FFFBEB'],
            ['Absent', data.summary.absent, '#B91C1C', '#FEF2F2'],
            ['Weekend/Holiday', data.summary.non_working, '#64748B', '#F1F5F9'],
          ].map(([label, val, color, bg]) => (
            <div key={label} style={{ background: bg, borderRadius: 9, padding: '8px 14px', minWidth: 90 }}>
              <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color, fontVariantNumeric: 'tabular-nums' }}>{val}</p>
              <p style={{ fontSize: 10.5, margin: '1px 0 0', color: C.muted }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 720 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Employee', 'Department', 'Status', 'Clock In', 'Clock Out', 'Hours', 'Work Log'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30 }}><Loader2 className="w-5 h-5 animate-spin" style={{ color: C.blue, margin: '0 auto' }} /></td></tr>
              ) : !data || data.records.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: C.muted }}>No employees match these filters</td></tr>
              ) : data.records.map(r => (
                <tr key={r.user_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '9px 14px' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: C.text }}>{r.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: C.muted }}>{r.emp_id || r.email}</p>
                  </td>
                  <td style={{ padding: '9px 14px', color: C.muted }}>{r.department || '—'}</td>
                  <td style={{ padding: '9px 14px' }}><Pill status={r.status} /></td>
                  <td style={{ padding: '9px 14px', color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(r.clock_in)}</td>
                  <td style={{ padding: '9px 14px', color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(r.clock_out)}</td>
                  <td style={{ padding: '9px 14px', color: C.text, fontVariantNumeric: 'tabular-nums' }}>{r.hours ? `${r.hours}h` : '—'}</td>
                  <td style={{ padding: '9px 14px' }}>
                    {(r.status === 'Present' || r.status === 'Working') && (
                      r.work_log_submitted
                        ? <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>✓ Submitted</span>
                        : <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>Not yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function SummaryTab() {
  const toast = useToast()
  const today = todayStr()
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10) })
  const [endDate, setEndDate] = useState(today)
  const [dept, setDept] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState('attendance_percent')
  const [sortDir, setSortDir] = useState('asc')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/hr/attendance/summary', { params: { start_date: startDate, end_date: endDate, department: dept } })
      .then(r => setData(r.data)).catch(() => toast('Failed to load summary', 'error')).finally(() => setLoading(false))
  }, [startDate, endDate, dept])

  useEffect(() => { load() }, [load])

  const rows = data ? [...data.rows].sort((a, b) => sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]) : []
  const toggleSort = key => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc') } }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <label style={{ fontSize: 11.5, color: C.muted }}>From <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, marginLeft: 4 }} /></label>
        <label style={{ fontSize: 11.5, color: C.muted }}>To <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputStyle, marginLeft: 4 }} /></label>
        <select value={dept} onChange={e => setDept(e.target.value)} style={inputStyle}>
          <option value="">All departments</option>
          {(data?.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {data && <span style={{ fontSize: 11.5, color: C.muted, marginLeft: 'auto' }}>{data.working_days} working days in range · full day = {data.full_day_hours}h</span>}
      </div>

      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 780 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                <th style={{ textAlign: 'left', padding: '9px 14px', fontSize: 10.5, textTransform: 'uppercase', color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>Employee</th>
                {[['present_days', 'Present'], ['leave_days', 'Leave'], ['absent_days', 'Absent'], ['total_hours', 'Total Hrs'], ['avg_hours', 'Avg Hrs/day'], ['work_logs', 'Logs Filed'], ['attendance_percent', 'Attendance %']].map(([key, label]) => (
                  <th key={key} onClick={() => toggleSort(key)} style={{ textAlign: 'right', padding: '9px 14px', fontSize: 10.5, textTransform: 'uppercase', color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}`, cursor: 'pointer', userSelect: 'none' }}>
                    {label}{sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30 }}><Loader2 className="w-5 h-5 animate-spin" style={{ color: C.blue, margin: '0 auto' }} /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: C.muted }}>No employees in this range</td></tr>
              ) : rows.map(r => (
                <tr key={r.user_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '9px 14px' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: C.text }}>{r.name}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: C.muted }}>{r.department || '—'}</p>
                  </td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.present_days}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.leave_days ? '#92400E' : C.text }}>{r.leave_days}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.absent_days ? '#B91C1C' : C.text, fontWeight: r.absent_days ? 700 : 400 }}>{r.absent_days}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.total_hours}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.avg_hours}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.work_logs}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: r.attendance_percent < 70 ? '#B91C1C' : r.attendance_percent < 90 ? '#B45309' : '#059669' }}>{r.attendance_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function HolidaysTab() {
  const toast = useToast()
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: '', name: '', holiday_type: 'Public' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/api/hr/holidays', { params: { year } }).then(r => setData(r.data)).catch(() => toast('Failed to load holidays', 'error')).finally(() => setLoading(false))
  }, [year])
  useEffect(() => { load() }, [load])

  const addHoliday = async e => {
    e.preventDefault()
    if (!form.date || !form.name.trim()) return
    setSaving(true)
    try {
      await api.post('/api/hr/holidays', form)
      setForm({ date: '', name: '', holiday_type: 'Public' })
      toast('Holiday added')
      load()
    } catch (e) { toast(e.response?.data?.error || 'Failed to add holiday', 'error') }
    finally { setSaving(false) }
  }

  const removeHoliday = async id => {
    try { await api.delete(`/api/hr/holidays/${id}`); toast('Holiday removed'); load() }
    catch (e) { toast('Failed to remove', 'error') }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
      <div style={cardStyle}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700 }}>Add a holiday</div>
        <form onSubmit={addHoliday} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          <input placeholder="Holiday name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <select value={form.holiday_type} onChange={e => setForm({ ...form, holiday_type: e.target.value })} style={inputStyle}>
            <option>Public</option><option>Optional</option><option>Company</option>
          </select>
          <button disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: C.blue, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            <Plus className="w-3.5 h-3.5" /> Add holiday
          </button>
        </form>
        {data && (
          <div style={{ padding: '0 16px 14px', fontSize: 11.5, color: C.muted }}>
            Weekly off: {data.weekly_offs.length ? data.weekly_offs.map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ') : 'none set'} — configurable via Settings.
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Holiday calendar</span>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={inputStyle}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center' }}><Loader2 className="w-5 h-5 animate-spin" style={{ color: C.blue, margin: '0 auto' }} /></div>
        ) : !data || data.holidays.length === 0 ? (
          <p style={{ padding: '20px 16px', color: C.muted, fontSize: 12.5, textAlign: 'center', margin: 0 }}>No holidays configured for {year}</p>
        ) : data.holidays.map(h => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: C.text }}>{h.name}</p>
              <p style={{ margin: '1px 0 0', fontSize: 11, color: C.muted }}>{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} · {h.holiday_type}</p>
            </div>
            <button onClick={() => removeHoliday(h.id)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: 4 }}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HRAttendancePage() {
  const [tab, setTab] = useState('today')
  const TABS = [
    { key: 'today', label: 'Daily Roster' },
    { key: 'summary', label: 'Attendance Summary' },
    { key: 'holidays', label: 'Holidays' },
  ]
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: C.text }}>Attendance</h1>
      <p style={{ fontSize: 12.5, color: C.muted, margin: '0 0 16px' }}>Company-wide attendance, leave and holiday visibility.</p>

      <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${C.border}`, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 4px', marginRight: 20, background: 'none', border: 'none',
            borderBottom: tab === t.key ? `2px solid ${C.blue}` : '2px solid transparent', marginBottom: -2,
            fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? C.blue : C.muted, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'today' && <TodayTab />}
      {tab === 'summary' && <SummaryTab />}
      {tab === 'holidays' && <HolidaysTab />}
    </div>
  )
}
