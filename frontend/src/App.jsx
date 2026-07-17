import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Accounts from './pages/Accounts'
import Projects from './pages/Projects'
import UsersPage from './pages/Users'
import { ClientLogin, ClientPortalDashboard } from './pages/ClientPortal'
import InfocusitCRM from './pages/InfocusitCRM'
import AccountsDetailPage from './pages/AccountsDetailPage'
import LeadsDetailPage from './pages/LeadsDetailPage'
import ProjectsDetailPage from './pages/ProjectsDetailPage'
import TeamsPage from './pages/TeamsPage'
import MyWorkspacePage from './pages/MyWorkspacePage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import EmployeeLayout from './components/EmployeeLayout'
import EmployeePortal from './pages/EmployeePortal'

function Protected({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/employee" replace />
  return children
}

function EmployeeRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/" replace />
  return children
}

function AppLayout() {
  const { user } = useAuth()
  if (user && user.role !== 'admin') return <Navigate to="/employee" replace />
  return <Layout><Outlet /></Layout>
}

function EmployeeAppLayout() {
  return <EmployeeLayout><Outlet /></EmployeeLayout>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/client-portal" element={<ClientPortalDashboard />} />
              <Route path="/crm" element={<InfocusitCRM />} />
              <Route path="/" element={<Protected><AppLayout /></Protected>}>
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<Leads />} />
                <Route path="leads/:id" element={<LeadsDetailPage />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="accounts/:id" element={<AccountsDetailPage />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<ProjectsDetailPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="my-workspace" element={<MyWorkspacePage />} />
                <Route path="meetings" element={<MeetingDetailPage />} />
                <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
              </Route>
              <Route path="/employee" element={<Protected><EmployeeRoute><EmployeeAppLayout /></EmployeeRoute></Protected>}>
                <Route index element={<EmployeePortal activeTab="dashboard" />} />
                <Route path="projects" element={<EmployeePortal activeTab="projects" />} />
                <Route path="tasks" element={<EmployeePortal activeTab="tasks" />} />
                <Route path="meetings" element={<EmployeePortal activeTab="meetings" />} />
                <Route path="documents" element={<EmployeePortal activeTab="documents" />} />
                <Route path="calendar" element={<EmployeePortal activeTab="calendar" />} />
                <Route path="team" element={<EmployeePortal activeTab="team" />} />
                <Route path="performance" element={<EmployeePortal activeTab="performance" />} />
                <Route path="notifications" element={<EmployeePortal activeTab="notifications" />} />
                <Route path="profile" element={<EmployeePortal activeTab="profile" />} />
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
