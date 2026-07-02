import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Clients from './pages/Clients'
import Leads from './pages/Leads'
import Projects from './pages/Projects'
import Accounts from './pages/Accounts'
import Opportunities from './pages/Opportunities'
import Tasks from './pages/Tasks'
import Meetings from './pages/Meetings'
import Reminders from './pages/Reminders'
import PurchaseOrders from './pages/PurchaseOrders'
import Invoices from './pages/Invoices'
import Billings from './pages/Billings'
import Reports from './pages/Reports'
import Attendance from './pages/Attendance'
import Employees from './pages/Employees'
import Certificates from './pages/Certificates'
import Expenses from './pages/Expenses'
import { Outlet } from 'react-router-dom'

function AppLayout() {
  return <Layout><Outlet /></Layout>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="leads" element={<Leads />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="clients" element={<Clients />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="billings" element={<Billings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="employees" element={<Employees />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="expenses" element={<Expenses />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
