import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { C } from '../components/styleConstants'
import { createClient, checkDuplicate } from '../api/clientsApi'
import api from '../services/api'

const BUSINESS_TYPES = ['B2B', 'B2C']
const REFERENCE_SOURCES = ['Google', 'LinkedIn', 'Referral', 'Cold Call', 'Email Campaign', 'Trade Show', 'Website', 'Other']
const PAYMENT_TERMS = ['Advance', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'Milestone Based', 'Other']

const inputCls = {
  width: '100%', padding: '5px 8px', border: `1px solid ${C.border}`,
  borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: C.font,
  background: '#fff', boxSizing: 'border-box', color: C.text,
  transition: 'border-color 0.15s',
}

const selectCls = { ...inputCls, cursor: 'pointer' }

const labelCls = { fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 2, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }

function Label({ children, required }) {
  return (
    <label style={labelCls}>
      {children} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
  )
}

export default function ClientOnboarding() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', client_type: 'main', business_type: 'B2B', client_category: '',
    parent_client_id: '', is_independent: false, gst_number: '', gst_unregistered: false, pan_no: '',
    registered_address: '', state: '', city: '', country: '', website: '', cin_number: '',
    industry: '', vendor_category: '', nda_file_path: '', nda_validity: '',
    payment_terms: '', credit_limit: '', bank_account_no: '', bank_ifsc: '',
    msme_status: '', default_tds_section: '',
    reference_source: '', referring_client_id: '', account_owner_id: '',
    first_follow_up_date: '', onboarding_remarks: '',
    blacklist_reason: '', business_value: '', last_business_date: '',
    b2c_mobile: '', b2c_id_proof_type: '', b2c_id_proof_number: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sectors, setSectors] = useState([])
  const [vendorCategories, setVendorCategories] = useState([])
  const [parentClients, setParentClients] = useState([])
  const [referringClients, setReferringClients] = useState([])
  const [users, setUsers] = useState([])
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [dupStatus, setDupStatus] = useState(null)

  useEffect(() => {
    api.get('/api/masters/sectors').then(r => setSectors(r.data?.sectors || [])).catch(() => {})
    api.get('/api/masters/vendor-categories').then(r => setVendorCategories(r.data?.categories || [])).catch(() => {})
    api.get('/api/clients', { params: { per_page: 500 } }).then(r => {
      const list = r.data?.clients || []
      setParentClients(list)
      setReferringClients(list)
    }).catch(() => {})
    api.get('/api/users').then(r => setUsers(r.data?.users || [])).catch(() => {})
    api.get('/api/masters/countries').then(r => setCountries(r.data?.countries || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (form.country) {
      const c = countries.find(c => c.name === form.country)
      if (c) {
        api.get('/api/masters/states', { params: { country_id: c.id } })
          .then(r => setStates(r.data?.states || [])).catch(() => {})
      } else {
        setStates([])
      }
    } else {
      setStates([])
    }
  }, [form.country, countries])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleDupCheck = async (fields) => {
    const payload = {}
    for (const f of fields) {
      if (form[f] && form[f].trim) payload[f] = form[f].trim()
      else if (form[f]) payload[f] = form[f]
    }
    if (Object.keys(payload).length === 0) return
    try {
      const res = await checkDuplicate(payload)
      setDupStatus(res)
    } catch { setDupStatus(null) }
  }

  const handleNameBlur = () => handleDupCheck(['name'])
  const handleGstBlur = () => handleDupCheck(['gst_number'])
  const handlePanBlur = () => handleDupCheck(['pan_no'])
  const handlePhoneBlur = () => handleDupCheck(['contact_phone'])

  const validate = () => {
    if (!form.name.trim()) return 'Company name is required'
    if (form.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.gst_number)) return 'Invalid GST format'
    if (form.pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan_no)) return 'Invalid PAN format'
    if (form.client_type === 'sub' && !form.parent_client_id) return 'Please select a parent client for sub-client'
    if (form.business_type === 'B2B' && form.client_type !== 'vendor' && !form.reference_source) return 'Reference source is required for B2B clients'
    if (form.business_type === 'B2B' && form.client_type !== 'vendor' && !form.parent_client_id && !form.is_independent) return 'Please select a parent client or mark as Independent'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    const payload = { ...form }
    if (!payload.parent_client_id) delete payload.parent_client_id
    if (payload.parent_client_id) payload.parent_client_id = parseInt(payload.parent_client_id)
    if (!payload.b2c_mobile) delete payload.b2c_mobile
    if (!payload.b2c_id_proof_type) delete payload.b2c_id_proof_type
    if (!payload.b2c_id_proof_number) delete payload.b2c_id_proof_number
    if (payload.referring_client_id) payload.referring_client_id = parseInt(payload.referring_client_id)
    if (payload.account_owner_id) payload.account_owner_id = parseInt(payload.account_owner_id)
    if (payload.credit_limit) payload.credit_limit = parseFloat(payload.credit_limit)
    if (payload.business_value) payload.business_value = parseFloat(payload.business_value)
    if (!payload.first_follow_up_date) delete payload.first_follow_up_date
    if (!payload.last_business_date) delete payload.last_business_date
    if (!payload.nda_validity) delete payload.nda_validity
    if (!payload.vendor_category) delete payload.vendor_category
    if (!payload.state_code) delete payload.state_code
    delete payload.status
    try {
      const result = await createClient(payload)
      navigate(`/clients/${result.client?.id || result.id}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create client')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased', background: C.bg, padding: '14px 20px 24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={() => navigate('/clients')} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, flexShrink: 0 }}>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: C.text }}>New Client Onboarding</h1>
            <p style={{ fontSize: 11, color: C.secondary, margin: '1px 0 0' }}>Complete all required fields to register a new client or vendor</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, fontWeight: 500, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}

          {dupStatus?.match && (
            <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: 12, color: '#9A3412', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Similar client found: {dupStatus.matches?.slice(0, 3).map(m => `${m.name} (${m.client_code})`).join(', ')}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <Section title="Basic Information">
            <Field gridCol="span 2">
              <Label required>Company Name</Label>
              <input value={form.name} onChange={e => set('name', e.target.value)} onBlur={handleNameBlur} required style={inputCls} placeholder="e.g. Acme Corp Pvt Ltd" />
            </Field>
            <Field>
              <Label required>Client Type</Label>
              <select value={form.client_type} onChange={e => set('client_type', e.target.value)} style={selectCls}>
                <option value="main">Main Client</option>
                <option value="sub">Sub-Client</option>
                <option value="vendor">Vendor</option>
                <option value="both">Both (Client + Vendor)</option>
              </select>
            </Field>
            <Field>
              <Label>Business Type</Label>
              <select value={form.business_type} onChange={e => set('business_type', e.target.value)} style={selectCls}>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            {form.business_type === 'B2B' && form.client_type !== 'vendor' && (
              <Field gridCol="span 4">
                <Label required>Parent Client</Label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={form.parent_client_id} onChange={e => set('parent_client_id', e.target.value)} style={{ ...selectCls, flex: 1 }} disabled={form.is_independent}>
                    <option value="">-- Select Parent --</option>
                    {parentClients.filter(c => c.client_type === 'main').map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.client_code})</option>
                    ))}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.muted, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_independent} onChange={e => { set('is_independent', e.target.checked); if (e.target.checked) set('parent_client_id', '') }} style={{ width: 14, height: 14, accentColor: C.blue }} />
                    Independent
                  </label>
                </div>
              </Field>
            )}
            <Field>
              <Label>Client Category / Sector</Label>
              <select value={form.client_category} onChange={e => set('client_category', e.target.value)} style={selectCls}>
                <option value="">-- Select --</option>
                {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </Field>
          </Section>

          {/* Section 2: Registration & Tax */}
          <Section title="Registration & Tax Information">
            <Field>
              <Label>GST Number</Label>
              <input value={form.gst_number} onChange={e => set('gst_number', e.target.value)} style={inputCls} placeholder="22AAAAA0000A1Z5" />
            </Field>
            <Field>
              <Label>&nbsp;</Label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, cursor: 'pointer', paddingTop: 4 }}>
                <input type="checkbox" checked={form.gst_unregistered} onChange={e => set('gst_unregistered', e.target.checked)} style={{ width: 16, height: 16, accentColor: C.blue }} />
                GST Unregistered
              </label>
            </Field>
            <Field>
              <Label>PAN Number</Label>
              <input value={form.pan_no} onChange={e => set('pan_no', e.target.value.toUpperCase())} style={inputCls} placeholder="AAAAA0000A" />
            </Field>
            <Field>
              <Label>CIN Number</Label>
              <input value={form.cin_number} onChange={e => set('cin_number', e.target.value.toUpperCase())} style={inputCls} placeholder="U99999XX0000XXX000000" />
            </Field>
            <Field gridCol="span 2">
              <Label>Country</Label>
              <select value={form.country} onChange={e => { set('country', e.target.value); set('state', ''); set('city', '') }} style={selectCls}>
                <option value="">-- Select Country --</option>
                {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field>
              <Label>State</Label>
              <select value={form.state} onChange={e => set('state', e.target.value)} style={selectCls} disabled={!form.country}>
                <option value="">-- Select State --</option>
                {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </Field>
            <Field>
              <Label>City</Label>
              <input value={form.city} onChange={e => set('city', e.target.value)} style={inputCls} placeholder="e.g. Mumbai" />
            </Field>
            <Field gridCol="span 2">
              <Label>Registered Address</Label>
              <textarea value={form.registered_address} onChange={e => set('registered_address', e.target.value)} style={{ ...inputCls, minHeight: 44, resize: 'vertical' }} placeholder="Full registered address" />
            </Field>
            <Field gridCol="span 4">
              <Label>Website</Label>
              <input value={form.website} onChange={e => set('website', e.target.value)} style={inputCls} placeholder="https://example.com" />
            </Field>
          </Section>

          {/* Section 3: B2C Specific */}
          {form.business_type === 'B2C' && (
            <Section title="Individual Details (B2C)">
              <Field>
                <Label required>Mobile Number</Label>
                <input value={form.b2c_mobile} onChange={e => set('b2c_mobile', e.target.value)} style={inputCls} placeholder="e.g. 9876543210" />
              </Field>
              <Field>
                <Label>ID Proof Type</Label>
                <select value={form.b2c_id_proof_type} onChange={e => set('b2c_id_proof_type', e.target.value)} style={selectCls}>
                  <option value="">-- Select --</option>
                  <option value="Aadhaar">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                </select>
              </Field>
              <Field>
                <Label>ID Proof Number</Label>
                <input value={form.b2c_id_proof_number} onChange={e => set('b2c_id_proof_number', e.target.value)} style={inputCls} placeholder="ID number" />
              </Field>
            </Section>
          )}

          {/* Section 4: Classification */}
          {(form.client_type === 'vendor' || form.client_type === 'both') && (
            <Section title="Vendor Classification">
              <Field>
                <Label>Vendor Category</Label>
                <select value={form.vendor_category} onChange={e => set('vendor_category', e.target.value)} style={selectCls}>
                  <option value="">-- Select --</option>
                  {vendorCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field>
                <Label>MSME / UDYAM</Label>
                <input value={form.msme_status} onChange={e => set('msme_status', e.target.value)} style={inputCls} placeholder="e.g. UDYAM-XX-00-0000000" />
              </Field>
              <Field>
                <Label>Default TDS Section</Label>
                <select value={form.default_tds_section} onChange={e => set('default_tds_section', e.target.value)} style={selectCls}>
                  <option value="">-- Select --</option>
                  <option value="194J">194J — Professional / Technical (10%)</option>
                  <option value="194C">194C — Contract (1% / 2%)</option>
                  <option value="194H">194H — Commission (5%)</option>
                  <option value="194I">194I — Rent (10% / 24%)</option>
                  <option value="194IA">194IA — Property (1%)</option>
                  <option value="195">195 — NRO Payment</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </Section>
          )}

          {/* Section 4: NDA & Financial */}
          <Section title="NDA & Financial">
            <Field gridCol="span 2">
              <Label>NDA File Path</Label>
              <input value={form.nda_file_path} onChange={e => set('nda_file_path', e.target.value)} style={inputCls} placeholder="File path or URL" />
            </Field>
            <Field>
              <Label>NDA Validity</Label>
              <input type="date" value={form.nda_validity} onChange={e => set('nda_validity', e.target.value)} style={inputCls} />
            </Field>
            <Field>
              <Label>Payment Terms</Label>
              <select value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} style={selectCls}>
                <option value="">-- Select --</option>
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field>
              <Label>Credit Limit (INR)</Label>
              <input type="number" value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} style={inputCls} placeholder="e.g. 500000" />
            </Field>
            <Field>
              <Label>Bank Account No.</Label>
              <input value={form.bank_account_no} onChange={e => set('bank_account_no', e.target.value)} style={inputCls} placeholder="Account number" />
            </Field>
            <Field>
              <Label>IFSC Code</Label>
              <input value={form.bank_ifsc} onChange={e => set('bank_ifsc', e.target.value.toUpperCase())} style={inputCls} placeholder="SBIN0001234" />
            </Field>
          </Section>

          {/* Section 5: Reference & Assignment */}
          <Section title="Reference & Assignment">
            <Field>
              <Label required={form.business_type === 'B2B'}>Reference Source</Label>
              <select value={form.reference_source} onChange={e => set('reference_source', e.target.value)} style={selectCls}>
                <option value="">-- Select --</option>
                {REFERENCE_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field>
              <Label>Referring Client</Label>
              <select value={form.referring_client_id} onChange={e => set('referring_client_id', e.target.value)} style={selectCls}>
                <option value="">-- Select --</option>
                {referringClients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.client_code})</option>
                ))}
              </select>
            </Field>
            <Field>
              <Label>Account Owner</Label>
              <select value={form.account_owner_id} onChange={e => set('account_owner_id', e.target.value)} style={selectCls}>
                <option value="">-- Select --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            </Field>
            <Field>
              <Label>First Follow-Up Date</Label>
              <input type="date" value={form.first_follow_up_date} onChange={e => set('first_follow_up_date', e.target.value)} style={inputCls} />
            </Field>
            <Field gridCol="span 4">
              <Label>Onboarding Remarks</Label>
              <textarea value={form.onboarding_remarks} onChange={e => set('onboarding_remarks', e.target.value)} style={{ ...inputCls, minHeight: 44, resize: 'vertical' }} placeholder="Any notes about this client" />
            </Field>
          </Section>

          {/* Section 6: Business Value */}
          <Section title="Business Details">
            <Field>
              <Label>Business Value (INR)</Label>
              <input type="number" value={form.business_value} onChange={e => set('business_value', e.target.value)} style={inputCls} placeholder="e.g. 1000000" />
            </Field>
            <Field>
              <Label>Last Business Date</Label>
              <input type="date" value={form.last_business_date} onChange={e => set('last_business_date', e.target.value)} style={inputCls} />
            </Field>
          </Section>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingBottom: 20 }}>
            <button type="button" onClick={() => navigate('/clients')} style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: C.font, color: C.text, fontWeight: 500 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: C.blue, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: '10px 14px', marginBottom: 8 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 8px', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px 12px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ children, gridCol }) {
  return (
    <div style={gridCol ? { gridColumn: gridCol } : {}}>{children}</div>
  )
}