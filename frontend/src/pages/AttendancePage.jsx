import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { Clock, MapPin, Briefcase, LogOut, History, Users, CheckCircle, XCircle } from 'lucide-react'

const C = {
  card: '#fff',
  border: '#E5E7EB',
  primary: '#5B21B6',
  primaryLight: '#EDE9FE',
  success: '#059669',
  successLight: '#D1FAE5',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  muted: '#6B7280',
  text: '#1F2937',
}

export default function AttendancePage() {
  const [today, setToday] = useState(null)
  const [history, setHistory] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [clocking, setClocking] = useState(false)
  const [location, setLocation] = useState({ lat: null, lon: null, name: '' })
  const [selectedProject, setSelectedProject] = useState('')
  const [workDesc, setWorkDesc] = useState('')
  const [tab, setTab] = useState('today')
  const [locStatus, setLocStatus] = useState('')

  const loadAll = useCallback(async () => {
    try {
      const [t, a, p] = await Promise.all([
        api.get('/api/attendance/today'),
        api.get('/api/attendance/active'),
        api.get('/api/employee/projects'),
      ])
      setToday(t.data.attendance)
      setActiveSessions(a.data.active)
      setMyProjects(p.data.projects || [])
      if (!t.data.attendance?.clock_in) {
        detectLocation()
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('Geolocation not available')
      return
    }
    setLocStatus('Detecting location...')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        setLocation({ lat: latitude, lon: longitude, name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` })
        setLocStatus('')
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`)
          const d = await r.json()
          if (d.display_name) setLocation(prev => ({ ...prev, name: d.display_name }))
        } catch (_) {}
      },
      err => {
        setLocStatus('Could not detect location. Please allow location access or enter manually.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleClockIn = async () => {
    setClocking(true)
    try {
      const r = await api.post('/api/attendance/clock-in', {
        lat: location.lat,
        lon: location.lon,
        location_name: location.name,
        project_id: selectedProject ? Number(selectedProject) : undefined,
        work_description: workDesc,
      })
      setToday(r.data.attendance)
      setWorkDesc('')
      const a = await api.get('/api/attendance/active')
      setActiveSessions(a.data.active)
    } catch (e) {
      alert(e.response?.data?.error || 'Clock-in failed')
    }
    setClocking(false)
  }

  const handleClockOut = async () => {
    setClocking(true)
    try {
      const r = await api.post('/api/attendance/clock-out', { work_description: workDesc || undefined })
      setToday(r.data.attendance)
      setWorkDesc('')
      const a = await api.get('/api/attendance/active')
      setActiveSessions(a.data.active)
    } catch (e) {
      alert(e.response?.data?.error || 'Clock-out failed')
    }
    setClocking(false)
  }

  const loadHistory = async () => {
    try {
      const r = await api.get('/api/attendance/history')
      setHistory(r.data.attendance)
    } catch (e) {}
  }

  const formatDuration = (h) => {
    if (!h) return '—'
    const hrs = Math.floor(h)
    const mins = Math.round((h - hrs) * 60)
    return `${hrs}h ${mins}m`
  }

  const formatTime = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>

  const isClockedIn = today && !today.clock_out
  const todayStart = today ? new Date(today.clock_in) : null

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 }}>Attendance</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
        {[
          { key: 'today', label: 'Today', icon: Clock },
          { key: 'active', label: 'Active Now', icon: Users },
          { key: 'history', label: 'History', icon: History },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'history') loadHistory() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t.key ? C.primary : 'transparent',
              color: tab === t.key ? '#fff' : C.muted,
              transition: '0.15s',
            }}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ───── TAB: Today ───── */}
      {tab === 'today' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Clock Card */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{isClockedIn ? '🟢' : '⏸️'}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
                {isClockedIn ? 'Clocked in since' : 'Not clocked in today'}
              </div>
              {isClockedIn && todayStart && (
                <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>
                  {todayStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              )}
              {!isClockedIn && today && (
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                  Last session: {formatTime(today.clock_in)} — {formatTime(today.clock_out)} ({formatDuration(today.duration)})
                </div>
              )}
              <div style={{ marginTop: 20 }}>
                {isClockedIn ? (
                  <button onClick={handleClockOut} disabled={clocking}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px',
                      border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 700,
                      background: C.danger, color: '#fff', transition: '0.15s', opacity: clocking ? 0.6 : 1,
                    }}>
                    <LogOut className="w-5 h-5" /> Clock Out
                  </button>
                ) : (
                  <div>
                    {locStatus && <div style={{ fontSize: 12, color: C.warning, marginBottom: 8 }}>{locStatus}</div>}
                    <button onClick={handleClockIn} disabled={clocking}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px',
                        border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 700,
                        background: C.success, color: '#fff', transition: '0.15s', opacity: clocking ? 0.6 : 1,
                      }}>
                      <Clock className="w-5 h-5" /> Clock In
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 16 }}>Session Details</div>
              {isClockedIn ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InfoRow icon={MapPin} label="Location" value={today?.location_name || location.name || 'Not detected'} />
                  <InfoRow icon={Briefcase} label="Project" value={today?.project_name || 'Not set'} />
                  {today?.work_description && <InfoRow icon={CheckCircle} label="Work" value={today.work_description} />}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Project selector */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>Working on project</div>
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <option value="">— Not specified —</option>
                      {myProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  {/* Work description */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>What will you work on?</div>
                    <textarea value={workDesc} onChange={e => setWorkDesc(e.target.value)} rows={2}
                      placeholder="Describe your work for today..."
                      style={{ width: '100%', padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
                  </div>
                  {/* Location */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin className="w-3 h-3" /> Location
                    </div>
                    <div style={{ fontSize: 12, color: C.text, wordBreak: 'break-all' }}>
                      {location.name || (locStatus || 'Click "Detect Location"')}
                    </div>
                    <button onClick={detectLocation}
                      style={{ fontSize: 11, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, textDecoration: 'underline' }}>
                      {location.name ? 'Refresh' : 'Detect Location'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── TAB: Active Now ───── */}
      {tab === 'active' && (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users className="w-4 h-4" style={{ color: C.success }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>Active Now</h2>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted }}>{activeSessions.length} online</span>
          </div>
          {activeSessions.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 20 }}>No active sessions</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeSessions.map(s => {
                const start = new Date(s.clock_in)
                const dur = (Date.now() - start.getTime()) / 3600000
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: C.successLight, borderRadius: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.success, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.user_name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>Since {formatTime(s.clock_in)} ({formatDuration(dur)})</div>
                    </div>
                    {s.project_name && <span style={{ fontSize: 11, color: C.primary, background: C.primaryLight, padding: '2px 8px', borderRadius: 4 }}>{s.project_name}</span>}
                    {s.location_name && (
                      <div style={{ fontSize: 11, color: C.muted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.location_name}>
                        <MapPin className="w-3 h-3" style={{ display: 'inline', marginRight: 2 }} />{s.location_name}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ───── TAB: History ───── */}
      {tab === 'history' && (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', marginBottom: 16 }}>Attendance History</h2>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 20 }}>No records found</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 12 }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Clock In</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Clock Out</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Project</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid #F3F4F6` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{formatDate(r.date)}</td>
                    <td style={{ padding: '10px 12px' }}>{formatTime(r.clock_in)}</td>
                    <td style={{ padding: '10px 12px' }}>{formatTime(r.clock_out)}</td>
                    <td style={{ padding: '10px 12px' }}>{formatDuration(r.duration)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12 }}>{r.project_name || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.location_name}>
                      {r.location_name || '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: r.clock_out ? C.successLight : C.warningLight,
                        color: r.clock_out ? C.success : C.warning,
                      }}>{r.clock_out ? 'Completed' : 'In Progress'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <Icon className="w-4 h-4" style={{ color: C.primary, marginTop: 1, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>{label}</div>
        <div style={{ fontSize: 13, color: C.text }}>{value}</div>
      </div>
    </div>
  )
}
