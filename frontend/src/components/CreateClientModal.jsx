import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { C } from './styleConstants'
import { createClient, fetchClients } from '../api/clientsApi'

const INDUSTRIES = ['PSU', 'Education', 'VAPT', 'IT', 'Manufacturing', 'Finance & Banking', 'Healthcare', 'Government', 'Defence', 'BFSI', 'Retail', 'Other']

export default function CreateClientModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    gst_number: '',
    client_type: 'main',
    parent_client_id: '',
    location: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    industry: '',
    status: 'Active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [parentClients, setParentClients] = useState([])
  const [customIndustry, setCustomIndustry] = useState('')

  useEffect(() => {
    fetchClients({ filter: 'main', per_page: 500 })
      .then(res => setParentClients(res.clients || []))
      .catch(() => {})
  }, [])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const validateGST = (gst) => {
    if (!gst) return true
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (!form.name.trim()) {
      setError('Company name is required')
      setSaving(false)
      return
    }

    if (form.gst_number && !validateGST(form.gst_number)) {
      setError('Invalid GST format')
      setSaving(false)
      return
    }

    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      setError('Invalid email format')
      setSaving(false)
      return
    }

    if (form.client_type === 'sub' && !form.parent_client_id) {
      setError('Please select a parent client for sub-client')
      setSaving(false)
      return
    }

    const payload = { ...form }
    payload.industry = form.industry === '__custom__' ? customIndustry : form.industry
    if (!payload.parent_client_id) delete payload.parent_client_id
    else payload.parent_client_id = parseInt(payload.parent_client_id)

    try {
      await createClient(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 12, width: 560, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadowMd, fontFamily: C.font }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>New Client</h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary, fontSize: 18 }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, fontWeight: 500, color: '#B91C1C' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>Company Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Company Name <span style={{ color: '#EF4444' }}>*</span></Label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle} placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <Label>GST Number</Label>
                <input value={form.gst_number} onChange={e => set('gst_number', e.target.value)} style={inputStyle} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <Label>Client Type</Label>
                <select value={form.client_type} onChange={e => set('client_type', e.target.value)} style={inputStyle}>
                  <option value="main">Main Client</option>
                  <option value="sub">Sub-Client</option>
                </select>
              </div>
              {form.client_type === 'sub' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <Label>Parent Client <span style={{ color: '#EF4444' }}>*</span></Label>
                  <select value={form.parent_client_id} onChange={e => set('parent_client_id', e.target.value)} style={inputStyle}>
                    <option value="">-- Select Parent --</option>
                    {parentClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.client_code})</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Location / City</Label>
                <input value={form.location} onChange={e => set('location', e.target.value)} style={inputStyle} placeholder="e.g. Delhi" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Industry</Label>
                <select value={form.industry} onChange={e => set('industry', e.target.value)} style={inputStyle}>
                  <option value="">-- Select Industry --</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  <option value="__custom__">+ Custom</option>
                </select>
                {form.industry === '__custom__' && (
                  <input
                    value={customIndustry}
                    onChange={e => setCustomIndustry(e.target.value)}
                    style={{ ...inputStyle, marginTop: 8 }}
                    placeholder="Enter custom industry"
                  />
                )}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              <div>
                <Label>Contact Person</Label>
                <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} style={inputStyle} placeholder="Full name" />
              </div>
              <div>
                <Label>Email</Label>
                <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} style={inputStyle} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} style={inputStyle} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: C.font, color: C.text, fontWeight: 500 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: C.font }}>
              {saving ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Label({ children }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>
      {children}
    </label>
  )
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 13,
  outline: 'none',
  fontFamily: C.font,
  background: '#fff',
  boxSizing: 'border-box',
  color: C.text,
  transition: 'border-color 0.15s',
}
