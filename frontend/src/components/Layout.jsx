import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Users, LogOut, Menu, X, UserCircle,
  FileText, Building2, Briefcase, CreditCard, BarChart3, Bell, Target,
  Calendar, Clock, ClipboardList, Receipt, DollarSign, TrendingUp,
  CheckSquare, UserCheck, Award, Wallet, ChevronDown
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'it_manager', 'admin_manager', 'hr_manager', 'employee'] },
  { to: '/opportunities', icon: Target, label: 'Opportunities', roles: ['super_admin', 'it_manager', 'admin_manager', 'employee'] },
  { to: '/leads', icon: FileText, label: 'Leads', roles: ['super_admin', 'it_manager', 'admin_manager', 'employee'] },
  { to: '/accounts', icon: Building2, label: 'Accounts', roles: ['super_admin', 'it_manager', 'admin_manager'] },
  { to: '/projects', icon: Briefcase, label: 'Projects', roles: ['super_admin', 'it_manager', 'admin_manager', 'employee'] },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', roles: ['super_admin', 'it_manager', 'admin_manager', 'hr_manager', 'employee'] },
  { to: '/meetings', icon: Calendar, label: 'Meetings', roles: ['super_admin', 'it_manager', 'admin_manager', 'hr_manager', 'employee'] },
  { to: '/reminders', icon: Bell, label: 'Reminders', roles: ['super_admin', 'it_manager', 'admin_manager', 'hr_manager', 'employee'] },
  { to: '/purchase-orders', icon: ClipboardList, label: 'Purchase Order', roles: ['super_admin', 'it_manager', 'admin_manager'] },
  { to: '/invoices', icon: Receipt, label: 'Invoices', roles: ['super_admin', 'it_manager', 'admin_manager'] },
  { to: '/billings', icon: DollarSign, label: 'Billings', roles: ['super_admin', 'it_manager', 'admin_manager'] },
  { to: '/reports', icon: TrendingUp, label: 'Reports', roles: ['super_admin', 'it_manager', 'admin_manager'] },
  { to: '/attendance', icon: Clock, label: 'Attendance', roles: ['super_admin', 'it_manager', 'hr_manager', 'employee'] },
  { to: '/clients', icon: Building2, label: 'Clients', roles: ['super_admin', 'it_manager', 'admin_manager', 'employee'] },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['super_admin', 'it_manager', 'hr_manager'] },
  { to: '/certificates', icon: Award, label: 'Certificates', roles: ['super_admin', 'it_manager', 'admin_manager'] },
  { to: '/expenses', icon: Wallet, label: 'Expenses', roles: ['super_admin', 'it_manager', 'admin_manager', 'hr_manager', 'employee'] },
]

export default function Layout({ children }) {
  const { user, logout, hasRole } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-lg">PMS</span>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.filter(item => item.roles.some(r => hasRole(r))).map(item => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <UserCircle className="w-8 h-8 text-gray-400" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500">{user?.roles?.join(', ')}</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
