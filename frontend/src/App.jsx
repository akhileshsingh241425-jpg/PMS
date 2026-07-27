import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ChatProvider } from './contexts/ChatContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'

import Projects from './pages/Projects'
import UsersPage from './pages/Users'
import { ClientLogin, ClientPortalDashboard } from './pages/ClientPortal'
import InfocusitCRM from './pages/InfocusitCRM'

import LeadsDetailPage from './pages/LeadsDetailPage'
import ProjectsDetailPage from './pages/ProjectsDetailPage'
import Backlog from './pages/Backlog'
import TeamsPage from './pages/TeamsPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import AttendancePage from './pages/AttendancePage'
import FaceRegisterPage from './pages/FaceRegisterPage'
import EmployeeLayout from './components/EmployeeLayout'
import EmployeePortal from './pages/EmployeePortal'
import MyDayPage from './pages/MyDayPage'
import PMLayout from './components/PMLayout'
import PMDashboard from './pages/PMDashboard'
import PMProjects from './pages/PMProjects'
import PMTasks from './pages/PMTasks'
import PMTeam from './pages/PMTeam'
import PMMeetings from './pages/PMMeetings'
import PMReports from './pages/PMReports'
import PMApprovalQueue from './pages/PMApprovalQueue'
import VulnerabilityDashboard from './pages/VulnerabilityDashboard'
import Clients from './pages/Clients'
import ClientOnboarding from './pages/ClientOnboarding'
import ClientDetailPage from './pages/ClientDetailPage'

import POVendorPage from './pages/POVendor'
import POVendorDetail from './pages/POVendorDetail'
import POInPage from './pages/POInPage'
import POInDetail from './pages/POInDetail'
import Settings from './pages/Settings'
import EmailInbox from './pages/EmailInbox'
import ChatPage from './pages/ChatPage'
import PlanBuilderPage from './pages/PlanBuilderPage'
import FloatingChat from './components/FloatingChat'

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
  if (user.role === 'project_manager') return <Navigate to="/pm" replace />
  return children
}

function PMRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'project_manager' && user.role !== 'admin') return <Navigate to="/employee" replace />
  return children
}

function AppLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'project_manager') return <Navigate to="/pm" replace />
  if (user.role !== 'admin') return <Navigate to="/employee" replace />
  return <Layout><Outlet /></Layout>
}

function EmployeeAppLayout() {
  return <EmployeeLayout><Outlet /></EmployeeLayout>
}

function PMAppLayout() {
  return <PMLayout><Outlet /></PMLayout>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ChatProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/client-portal" element={<ClientPortalDashboard />} />
              <Route path="/crm" element={<InfocusitCRM />} />
              <Route path="/" element={<Protected><AppLayout /></Protected>}>
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<Leads />} />
                <Route path="leads/:id" element={<LeadsDetailPage />} />
                <Route path="clients" element={<Clients />} />
                <Route path="clients/new" element={<ClientOnboarding />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="po-out" element={<POVendorPage />} />
                <Route path="po-out/:id" element={<POVendorDetail />} />
                <Route path="po-in" element={<POInPage />} />
                <Route path="po-in/:id" element={<POInDetail />} />
                <Route path="vendors/:id" element={<ClientDetailPage />} />
                <Route path="email" element={<EmailInbox />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<ProjectsDetailPage />} />
                <Route path="projects/:id/backlog" element={<Backlog />} />

                <Route path="projects/:id/plan" element={<PlanBuilderPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="meetings" element={<MeetingDetailPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="attendance/face-register" element={<FaceRegisterPage />} />
                <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
                <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
                <Route path="chat" element={<ChatPage />} />
              </Route>
              <Route path="/employee" element={<Protected><EmployeeRoute><EmployeeAppLayout /></EmployeeRoute></Protected>}>
                <Route index element={<MyDayPage />} />
                <Route path="projects" element={<EmployeePortal activeTab="projects" />} />
                <Route path="tasks" element={<EmployeePortal activeTab="tasks" />} />
                <Route path="meetings" element={<EmployeePortal activeTab="meetings" />} />
                <Route path="documents" element={<EmployeePortal activeTab="documents" />} />
                <Route path="calendar" element={<EmployeePortal activeTab="calendar" />} />
                <Route path="team" element={<EmployeePortal activeTab="team" />} />
                <Route path="performance" element={<EmployeePortal activeTab="performance" />} />
                <Route path="notifications" element={<EmployeePortal activeTab="notifications" />} />
                <Route path="profile" element={<EmployeePortal activeTab="profile" />} />
                <Route path="face-register" element={<FaceRegisterPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="email" element={<EmailInbox />} />
              </Route>
              <Route path="/pm" element={<Protected><PMRoute><PMAppLayout /></PMRoute></Protected>}>
                <Route path="face-register" element={<FaceRegisterPage />} />
                <Route index element={<PMDashboard />} />
                <Route path="projects" element={<PMProjects />} />
                <Route path="tasks" element={<PMTasks />} />
                <Route path="team" element={<PMTeam />} />
                <Route path="meetings" element={<PMMeetings />} />
                <Route path="approvals" element={<PMApprovalQueue />} />
                <Route path="reports" element={<PMReports />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="email" element={<EmailInbox />} />
              </Route>
              <Route path="/vulnerabilities" element={<Protected><Layout><VulnerabilityDashboard /></Layout></Protected>} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <FloatingChat />
            </ChatProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
