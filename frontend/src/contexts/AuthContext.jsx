import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)
const INACTIVE_TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 hours

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [otpSession, setOtpSession] = useState(null)
  const navigate = useNavigate()

  // Periodic heartbeat to keep session alive
  useEffect(() => {
    const hb = setInterval(() => {
      const token = localStorage.getItem('pms_token')
      if (token) {
        api.get('/api/auth/me').catch(() => {})
      }
    }, 300000)
    return () => clearInterval(hb)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('pms_token')
    let cancelled = false
    const safety = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 5000)
    if (token) {
      api.get('/api/auth/me')
        .then(res => {
          if (cancelled) return
          if (res.data.user?.role === 'client') {
            localStorage.removeItem('pms_token')
            window.location.href = '/client-login'
            return
          }
          setUser(res.data.user)
        })
        .catch(err => {
          if (cancelled) return
          localStorage.removeItem('pms_token')
        })
        .finally(() => {
          if (cancelled) return
          clearTimeout(safety)
          setLoading(false)
        })
    } else {
      clearTimeout(safety)
      setLoading(false)
    }
    return () => { cancelled = true; clearTimeout(safety) }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    if (res.data.requires_otp) {
      // Step 1 complete — return OTP session info
      return { requires_otp: true, ...res.data }
    }
    // Direct login (legacy/fallback)
    if (res.data.user?.role === 'client') {
      localStorage.removeItem('pms_token')
      window.location.href = '/client-login'
      return
    }
    localStorage.setItem('pms_token', res.data.token)
    setUser(res.data.user)
    navigate(res.data.user.role !== 'admin' ? '/employee' : '/')
    return {}
  }

  const verifyOtp = async (tempToken, otpCode) => {
    const res = await api.post('/api/auth/verify-otp', { temp_token: tempToken, otp_code: otpCode })
    const data = res.data
    if (data.token) {
      localStorage.setItem('pms_token', data.token)
      setUser(data.user)
      navigate(data.user.role !== 'admin' ? '/employee' : '/')
    }
    return data
  }

  const logout = () => {
    localStorage.removeItem('pms_token')
    setUser(null)
    navigate('/login')
  }

  const hasRole = useCallback((...roles) => {
    if (!user) return false
    if (user.role && roles.includes(user.role)) return true
    return user.roles?.some(r => roles.includes(r))
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-gray-400">Loading...</p></div>

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, verifyOtp, otpSession, setOtpSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)