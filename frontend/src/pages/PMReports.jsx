import { useState, useEffect } from 'react'
import api from '../services/api'
import { BarChart3, CheckCircle, AlertCircle, Users, Calendar } from 'lucide-react'

export default function PMReports() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/pm/reports')
      .then(r => setProjects(r.data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalTasks = projects.reduce((s, p) => s + p.total_tasks, 0)
  const totalCompleted = projects.reduce((s, p) => s + p.completed_tasks, 0)
  const totalOverdue = projects.reduce((s, p) => s + p.overdue_tasks, 0)
  const overallCompletion = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 24px' }}>Reports</h1>

      {/* Overall Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '18px' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0 }}>{totalTasks}</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>Total Tasks</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '18px' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#10B981', margin: 0 }}>{totalCompleted}</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>Completed</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '18px' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#DC2626', margin: 0 }}>{totalOverdue}</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>Overdue</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '18px' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#5B21B6', margin: 0 }}>{overallCompletion}%</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>Completion Rate</p>
        </div>
      </div>

      {/* Per-Project Breakdown */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
          <BarChart3 className="w-16 h-16" style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
          <p style={{ fontSize: 15, margin: 0 }}>No project data available</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFBFC', borderBottom: '1px solid #E5E7EB' }}>
                {['Project', 'Stage', 'Tasks', 'Completed', 'Overdue', 'Completion', 'Team'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.project_id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{p.project_title}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: ['Closed','Full Payment Received','Cancelled'].includes(p.stage) ? '#F0FDF4' : '#EFF6FF',
                      color: ['Closed','Full Payment Received','Cancelled'].includes(p.stage) ? '#059669' : '#3B82F6',
                    }}>{p.stage}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{p.total_tasks}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#059669', fontWeight: 600 }}>{p.completed_tasks}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: p.overdue_tasks > 0 ? '#DC2626' : '#374151', fontWeight: p.overdue_tasks > 0 ? 600 : 400 }}>{p.overdue_tasks}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                        <div style={{
                          width: `${p.completion_pct}%`, height: 6, borderRadius: 3,
                          background: p.completion_pct >= 80 ? '#10B981' : p.completion_pct >= 40 ? '#F59E0B' : '#DC2626',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{p.completion_pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{p.team_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
