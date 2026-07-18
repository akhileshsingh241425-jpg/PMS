import {createContext, useContext, useState, useEffect} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({children}) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restoreSession()
  }, [])

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('pms_token')
      if (token) {
        const r = await api.get('/api/auth/me')
        setUser(r.data.user)
      }
    } catch (_) {
      await AsyncStorage.removeItem('pms_token')
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    const r = await api.post('/api/auth/login', {email, password})
    await AsyncStorage.setItem('pms_token', r.data.token)
    setUser(r.data.user)
    return r.data
  }

  const logout = async () => {
    await AsyncStorage.removeItem('pms_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{user, loading, login, logout}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
