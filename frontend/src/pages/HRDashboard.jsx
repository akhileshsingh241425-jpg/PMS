import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { CheckCheck, Users, Clock, Loader2, ArrowRight } from 'lucide-react'

export default function HRDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 0, total: 0, todayAttendance: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/approvals'),
      api.get('/api/users'),
      api.get('/api/attendance/today'),
    ]).then(([approvalsRes, usersRes, attendanceRes]) => {
      setStats({
        pending: approvalsRes.data.approvals?.length || 0,
        total: usersRes.data.users?.length || 0,
        todayAttendance: attendanceRes.data.count || 0,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#5B3DF5]" />
      </div>
    )
  }

  const cards = [
    {
      label: 'Pending Approvals', value: stats.pending, icon: CheckCheck,
      color: '#F59E0B', bg: '#FFFBEB', path: '/hr/approvals',
    },
    {
      label: 'Total Employees', value: stats.total, icon: Users,
      color: '#3B82F6', bg: '#EFF6FF', path: '/hr/employees',
    },
    {
      label: "Today's Attendance", value: stats.todayAttendance, icon: Clock,
      color: '#10B981', bg: '#F0FDF4', path: '/hr/attendance',
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>
        HR Dashboard
      </h1>
      <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>
        Welcome back, {user?.full_name}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {cards.map(card => (
          <div key={card.label} onClick={() => navigate(card.path)}
            style={{
              background: '#fff', borderRadius: 12, padding: 24, cursor: 'pointer',
              border: '1px solid #E2E8F0', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: '#94A3B8' }} />
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#0F172A' }}>{card.value}</p>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}