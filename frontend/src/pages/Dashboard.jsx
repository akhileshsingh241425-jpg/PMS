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
    { label: 'Opportunities', value: stats.opps, icon: Target, color: 'from-violet-500 to-indigo-600', to: '/opportunities' },
    { label: 'Leads', value: stats.leads, icon: FileText, color: 'from-blue-500 to-cyan-600', to: '/leads' },
    { label: 'Accounts', value: stats.accounts, icon: Building2, color: 'from-emerald-500 to-teal-600', to: '/accounts' },
    { label: 'Open Queries', value: stats.open_queries, icon: HelpCircle, color: 'from-red-500 to-pink-600', to: '/projects' },
    { label: 'Pending Meetings', value: stats.pending_meetings, icon: Calendar, color: 'from-purple-500 to-violet-600', to: '/projects' },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name}</h1>
        <p className="text-slate-500 text-sm mt-1">Here's your pipeline overview</p>
      </div>

      {/* Stats */}
      {loading ? <StatCardSkeleton /> : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{c.label}</p>
          </Link>
        ))}
      </div>
      )}

      {/* Quick start */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-6 h-6 text-violet-400" />
          <h2 className="font-semibold text-lg">Quick Start</h2>
        </div>
        <p className="text-slate-300 text-sm mb-4">Begin your workflow — create an opportunity, track through stages, convert to lead, and manage projects.</p>
        <div className="flex gap-3">
          <Link to="/opportunities" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-sm font-medium hover:opacity-90">New Opportunity</Link>
          <Link to="/projects" className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium hover:bg-white/20">View Projects</Link>
        </div>
      </div>
    </div>
  )
}
