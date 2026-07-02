import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import Leads from './pages/Leads'
import Accounts from './pages/Accounts'
import Projects from './pages/Projects'
import UsersPage from './pages/Users'
import { ClientLogin, ClientPortalDashboard } from './pages/ClientPortal'

function Protected({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppLayout() {
  return <Layout><Outlet /></Layout>
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
              <Route path="*" element={<Navigate to="/login" replace />} />
              <Route path="/" element={<Protected><AppLayout /></Protected>}>
                <Route index element={<Dashboard />} />
                <Route path="opportunities" element={<Opportunities />} />
                <Route path="leads" element={<Leads />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="projects" element={<Projects />} />
                <Route path="users" element={<UsersPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
