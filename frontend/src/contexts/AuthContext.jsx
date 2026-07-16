import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('[AuthProvider] useEffect running')
    const token = localStorage.getItem('pms_token')
    console.log('[AuthProvider] token:', token)
    let cancelled = false
    const safety = setTimeout(() => {
      if (!cancelled) {
        console.log('[AuthProvider] SAFETY TIMEOUT - forcing loading=false')
        setLoading(false)
      }
    }, 5000)
    if (token) {
      api.get('/api/auth/me')
        .then(res => {
          if (cancelled) return
          console.log('[AuthProvider] /api/auth/me success:', res.data)
          if (res.data.user?.role === 'client') {
            localStorage.removeItem('pms_token')
            window.location.href = '/client-login'
            return
          }
          setUser(res.data.user)
        })
        .catch(err => {
          if (cancelled) return
          console.log('[AuthProvider] /api/auth/me failed:', err.message)
          localStorage.removeItem('pms_token')
        })
        .finally(() => {
          if (cancelled) return
          clearTimeout(safety)
          console.log('[AuthProvider] setting loading=false')
          setLoading(false)
        })
    } else {
      clearTimeout(safety)
      console.log('[AuthProvider] no token, setting loading=false')
      setLoading(false)
    }
    return () => { cancelled = true; clearTimeout(safety) }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    if (res.data.user?.role === 'client') {
      localStorage.removeItem('pms_token')
      window.location.href = '/client-login'
      return
    }
    localStorage.setItem('pms_token', res.data.token)
    setUser(res.data.user)
    navigate('/')
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

  console.log('[AuthProvider] render, loading:', loading)
  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-gray-400">Loading...</p></div>

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
