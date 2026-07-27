import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Navigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')
  const [isBootstrap, setIsBootstrap] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('login') // login | otp
  const [otpCode, setOtpCode] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const { login, verifyOtp, user } = useAuth()
  const navigate = useNavigate()

  if (user) return <Navigate to="/" replace />

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const result = await login(email, password)
      if (result?.requires_otp) {
        setTempToken(result.temp_token)
        setMaskedEmail(result.email)
        setStep('otp')
        setOtpCode('')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  const handleOtpVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await verifyOtp(tempToken, otpCode)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const handleBootstrap = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post('/api/auth/bootstrap', { email, password, first_name: firstName })
      localStorage.setItem('pms_token', res.data.token)
      navigate('/')
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Users already exist. Please login.')
        setIsBootstrap(false)
      } else {
        setError(err.response?.data?.error || 'Failed')
      }
    } finally { setLoading(false) }
  }

  const otpFields = Array(6).fill(0)

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-serif font-bold text-gray-900">PMS v2</h1>
          <p className="text-sm text-gray-500">INFOCUS-IT Project Management</p>
        </div>

        {step === 'login' ? (
          <form onSubmit={isBootstrap ? handleBootstrap : handleLogin} className="bg-white border border-slate-300 p-6 space-y-4">
            <h2 className="text-lg font-semibold">{isBootstrap ? 'Setup First Admin' : 'Sign In'}</h2>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 ">{error}</p>}

            {isBootstrap && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full px-3 py-2 border border-gray-300 text-sm" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 text-white py-2.5 font-medium hover:bg-blue-800 disabled:opacity-50">
              {loading ? '...' : isBootstrap ? 'Create Admin & Login' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-gray-500">
              {isBootstrap
                ? <button type="button" onClick={() => setIsBootstrap(false)} className="text-indigo-600 hover:underline">Back to Login</button>
                : <button type="button" onClick={() => setIsBootstrap(true)} className="text-indigo-600 hover:underline">First time? Setup Admin</button>
              }
            </p>
          </form>
        ) : (
          <form onSubmit={handleOtpVerify} className="bg-white border border-slate-300 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Enter OTP</h2>
            <p className="text-sm text-gray-500">OTP sent to {maskedEmail}</p>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-digit OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-3 border border-gray-300 text-lg text-center tracking-[8px] font-bold"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading || otpCode.length !== 6}
              className="w-full bg-blue-700 text-white py-2.5 font-medium hover:bg-blue-800 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <p className="text-center text-xs text-gray-500">
              <button type="button" onClick={() => {
                setStep('login')
                setError('')
              }} className="text-indigo-600 hover:underline">
                Back to Login
              </button>
              <span className="mx-2">·</span>
              <button type="button" onClick={async () => {
                setLoading(true)
                try {
                  await login(email, password)
                  setError('OTP resent')
                } catch (err) {
                  setError(err.response?.data?.error || 'Failed to resend')
                } finally { setLoading(false) }
              }} className="text-indigo-600 hover:underline">
                Resend OTP
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}