import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Users, Building2, Briefcase, CreditCard, TrendingUp, Activity, Bell, FileText, Target, CheckSquare, Calendar, Clock, Wallet, Award, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    users: 0, clients: 0, projects: 0, leads: 0,
    opportunities: 0, tasks: 0, meetings: 0,
    invoices: 0, expenses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const [usersRes, clientsRes, projectsRes, leadsRes, oppsRes, tasksRes, meetingsRes, invoicesRes, expensesRes] = await Promise.allSettled([
        api.get('/api/auth/users').catch(() => ({ value: { data: { users: [] } } })),
        api.get('/api/clients').catch(() => ({ value: { data: { clients: [] } } })),
        api.get('/api/projects').catch(() => ({ value: { data: { projects: [] } } })),
        api.get('/api/leads').catch(() => ({ value: { data: { leads: [] } } })),
        api.get('/api/opportunities').catch(() => ({ value: { data: { opportunities: [] } } })),
        api.get('/api/activities/tasks').catch(() => ({ value: { data: { tasks: [] } } })),
        api.get('/api/activities/meetings').catch(() => ({ value: { data: { meetings: [] } } })),
        api.get('/api/finance/invoices').catch(() => ({ value: { data: { invoices: [] } } })),
        api.get('/api/expenses').catch(() => ({ value: { data: { expenses: [] } } })),
      ])

      setStats({
        users: usersRes.value?.data?.users?.length || 0,
        clients: clientsRes.value?.data?.clients?.length || 0,
        projects: projectsRes.value?.data?.projects?.length || 0,
        leads: leadsRes.value?.data?.leads?.length || 0,
        opportunities: oppsRes.value?.data?.opportunities?.length || 0,
        tasks: tasksRes.value?.data?.tasks?.length || 0,
        meetings: meetingsRes.value?.data?.meetings?.length || 0,
        invoices: invoicesRes.value?.data?.invoices?.length || 0,
        expenses: expensesRes.value?.data?.expenses?.length || 0,
      })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statCards = [
    { title: 'Total Users', value: stats.users, icon: Users, color: 'bg-blue-500', link: '/users' },
    { title: 'Active Clients', value: stats.clients, icon: Building2, color: 'bg-green-500', link: '/clients' },
    { title: 'Running Projects', value: stats.projects, icon: Briefcase, color: 'bg-purple-500', link: '/projects' },
    { title: 'Open Leads', value: stats.leads, icon: FileText, color: 'bg-cyan-500', link: '/leads' },
    { title: 'Opportunities', value: stats.opportunities, icon: Target, color: 'bg-violet-500', link: '/opportunities' },
    { title: 'Tasks', value: stats.tasks, icon: CheckSquare, color: 'bg-emerald-500', link: '/tasks' },
    { title: 'Meetings', value: stats.meetings, icon: Calendar, color: 'bg-orange-500', link: '/meetings' },
    { title: 'Invoices', value: stats.invoices, icon: CreditCard, color: 'bg-pink-500', link: '/invoices' },
    { title: 'Expenses', value: stats.expenses, icon: Wallet, color: 'bg-rose-500', link: '/expenses' },
  ]

  const quickLinks = [
    { title: 'New Lead', icon: FileText, color: 'text-blue-600 bg-blue-50', desc: 'Capture a new sales lead', path: '/leads' },
    { title: 'New Client', icon: Building2, color: 'text-green-600 bg-green-50', desc: 'Onboard B2B/B2C client', path: '/clients' },
    { title: 'New Project', icon: Briefcase, color: 'text-purple-600 bg-purple-50', desc: 'Create project from lead', path: '/projects' },
    { title: 'New Invoice', icon: CreditCard, color: 'text-orange-600 bg-orange-50', desc: 'Generate invoice', path: '/invoices' },
    { title: 'New Task', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50', desc: 'Add a task', path: '/tasks' },
    { title: 'Log Expense', icon: Wallet, color: 'text-rose-600 bg-rose-50', desc: 'Record an expense', path: '/expenses' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date().toLocaleTimeString()}</span>
          <span className="text-gray-300">|</span>
          <span>Login ID: {user?.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map(card => (
          <div key={card.title} onClick={() => navigate(card.link)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(link => (
              <button key={link.title} onClick={() => navigate(link.path)}
                className={`p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow text-left`}>
                <link.icon className={`w-6 h-6 mb-2 ${link.color.split(' ')[0]}`} />
                <p className="font-medium text-gray-900 text-sm">{link.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Leads', count: stats.leads, icon: FileText, color: 'text-blue-600' },
              { label: 'Opportunities', count: stats.opportunities, icon: Target, color: 'text-purple-600' },
              { label: 'Projects', count: stats.projects, icon: Briefcase, color: 'text-indigo-600' },
              { label: 'Tasks', count: stats.tasks, icon: CheckSquare, color: 'text-emerald-600' },
              { label: 'Meetings', count: stats.meetings, icon: Calendar, color: 'text-orange-600' },
              { label: 'Invoices', count: stats.invoices, icon: CreditCard, color: 'text-pink-600' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{loading ? '...' : item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
