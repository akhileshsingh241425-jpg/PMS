import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Target, FileText, Building2, Briefcase, TrendingUp, ArrowUpRight, HelpCircle, Calendar } from 'lucide-react'
import { StatCardSkeleton } from '../components/LoadingSkeleton'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ opps: 0, leads: 0, accounts: 0, projects: 0, open_queries: 0, pending_meetings: 0 })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/overview').catch(() => ({ data: {} })),
      api.get('/api/opportunities').catch(() => ({ data: { opportunities: [] } })),
      api.get('/api/leads').catch(() => ({ data: { leads: [] } })),
      api.get('/api/accounts').catch(() => ({ data: { accounts: [] } })),
      api.get('/api/projects').catch(() => ({ data: { projects: [] } })),
    ]).then(([ov, o, l, a, p]) => {
      setStats({
        opps: o.data.opportunities.length,
        leads: l.data.leads.length,
        accounts: a.data.accounts.length,
        projects: p.data.projects.length,
        open_queries: ov.data.open_queries || 0,
        pending_meetings: ov.data.pending_meetings || 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Active Projects', value: stats.projects, icon: Briefcase, color: 'from-orange-500 to-amber-600', to: '/projects' },
    { label: 'Opportunities', value: stats.opps, icon: Target, color: 'from-violet-500 to-indigo-600', to: '/leads' },
    { label: 'Leads', value: stats.leads, icon: FileText, color: 'from-blue-500 to-cyan-600', to: '/leads' },
    { label: 'Clients', value: stats.accounts, icon: Building2, color: 'from-emerald-500 to-teal-600', to: '/accounts' },
    { label: 'Open Queries', value: stats.open_queries, icon: HelpCircle, color: 'from-red-500 to-pink-600', to: '/projects' },
    { label: 'Pending Meetings', value: stats.pending_meetings, icon: Calendar, color: 'from-purple-500 to-violet-600', to: '/projects' },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name}</h1>
        <p className="text-slate-500 text-sm mt-1">Here's your pipeline overview</p>
      </div>

      {/* Stats */}
      {loading ? <StatCardSkeleton /> : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="border border-slate-300 p-4 hover:bg-slate-50 bg-white">
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
          </Link>
        ))}
      </div>
      )}

      {/* Quick start */}
      <div className="border border-slate-300 p-5 bg-slate-50">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3">Quick Start</h2>
        <p className="text-xs text-slate-500 mb-3">Begin your workflow — create a lead, track through stages, and manage projects.</p>
        <div className="flex gap-2">
          <Link to="/leads" className="px-4 py-1.5 bg-blue-700 text-white text-xs font-medium hover:bg-blue-800">New Opportunity</Link>
          <Link to="/projects" className="px-4 py-1.5 border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 bg-white">View Projects</Link>
        </div>
      </div>
    </div>
  )
}
