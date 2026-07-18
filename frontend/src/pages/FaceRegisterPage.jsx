import { useState, useRef, useEffect } from 'react'
import api from '../services/api'

export default function FaceRegisterPage() {
  const [registered, setRegistered] = useState(false)
  const [faceImage, setFaceImage] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    api.get('/api/attendance/face-status').then(r => setRegistered(r.data.face_registered))
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [])

  const startCamera = async () => {
    setCapturing(true)
    setFaceImage(null)
    setMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setMsg('Camera access denied')
      setCapturing(false)
    }
  }

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth || 320
    c.height = v.videoHeight || 240
    c.getContext('2d').drawImage(v, 0, 0)
    setFaceImage(c.toDataURL('image/jpeg', 0.8))
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    setCapturing(false)
  }

  const register = async () => {
    if (!faceImage) return
    setSaving(true)
    setMsg('')
    try {
      await api.post('/api/attendance/register-face', { image: faceImage })
      setMsg('Face registered successfully! ✅')
      setRegistered(true)
      setFaceImage(null)
    } catch (e) {
      setMsg(e.response?.data?.error || 'Registration failed')
    }
    setSaving(false)
  }

  const deleteFace = async () => {
    if (!confirm('Delete your registered face?')) return
    try {
      await api.post('/api/attendance/delete-face')
      setRegistered(false)
      setMsg('Face data deleted')
    } catch { setMsg('Failed to delete') }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Face Registration</h2>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
        Register your face once. Then every clock in/out will verify your identity.
      </p>

      {registered ? (
        <div style={{ background: '#D1FAE5', borderRadius: 10, padding: 16, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 700, color: '#059669', fontSize: 15 }}>Face Registered</div>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Your face will be verified at each clock in/out</p>
          <button onClick={deleteFace} style={{ marginTop: 12, padding: '6px 16px', border: '1px solid #FEE2E2', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', background: '#FEE2E2' }}>Delete Face Data</button>
        </div>
      ) : (
        <div style={{ background: '#EDE9FE', borderRadius: 10, padding: 16, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
          <div style={{ fontWeight: 700, color: '#5B21B6', fontSize: 15 }}>Not Registered</div>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Register your face to enable face verification</p>
        </div>
      )}

      {capturing && (
        <div style={{ marginBottom: 16 }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12, maxHeight: 240, objectFit: 'cover', background: '#000' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={capture} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, background: '#5B21B6', color: '#fff' }}>Capture Photo</button>
            <button onClick={() => { setCapturing(false); if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }} style={{ padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontWeight: 600, background: '#fff', color: '#6B7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {faceImage && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src={faceImage} alt="Preview" style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
            <button onClick={register} disabled={saving} style={{ padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, background: '#5B21B6', color: '#fff', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : '✅ Save Face'}
            </button>
            <button onClick={() => setFaceImage(null)} style={{ padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontWeight: 600, background: '#fff', color: '#6B7280' }}>Retake</button>
          </div>
        </div>
      )}

      {!capturing && !faceImage && !registered && (
        <button onClick={startCamera} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15, background: '#5B21B6', color: '#fff' }}>📸 Open Camera</button>
      )}

      {msg && <div style={{ marginTop: 16, fontSize: 13, color: msg.includes('✅') ? '#059669' : '#DC2626', textAlign: 'center', fontWeight: 600 }}>{msg}</div>}
    </div>
  )
}
