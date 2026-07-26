import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Globe, FileText, Shield,
  UserPlus, MessageSquare, Calendar, History, Link2, ChevronRight,
  Plus, Pencil, Trash2, CheckCircle, X, Save, AlertCircle, Pin,
  PinOff, Loader2, Clock, Ban, UserCheck, Users, ChevronDown
} from 'lucide-react'
import { C } from '../components/styleConstants'
import * as clientApi from '../api/clientsApi'
import { useToast } from '../contexts/ToastContext'

const STATUS_COLORS = {
  PROSPECT: { bg: '#DBEAFE', text: '#1E40AF' },
  ACTIVE: { bg: '#DCFCE7', text: '#166534' },
  DORMANT: { bg: '#FEF3C7', text: '#92400E' },
  BLACKLISTED: { bg: '#FEE2E2', text: '#991B1B' },
  ARCHIVED: { bg: '#F1F5F9', text: '#475569' },
}

const FOLLOWUP_STATUS_COLORS = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  COMPLETED: { bg: '#DCFCE7', text: '#166534' },
  CANCELLED: { bg: '#F1F5F9', text: '#475569' },
}

const REFERENCE_SOURCES = ['Google', 'LinkedIn', 'Referral', 'Cold Call', 'Email Campaign', 'Trade Show', 'Website', 'Other']
const PAYMENT_TERMS = ['Advance', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'Milestone Based', 'Other']
const BUSINESS_TYPES = ['B2B', 'B2C']

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [saving, setSaving] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactForm, setContactForm] = useState({})
  const [editingContactId, setEditingContactId] = useState(null)
  const [remarkInput, setRemarkInput] = useState('')
  const [editingRemark, setEditingRemark] = useState(null)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({})
  const [editingFollowUpId, setEditingFollowUpId] = useState(null)
  const [showReferenceModal, setShowReferenceModal] = useState(false)
  const [refForm, setRefForm] = useState({})
  const [allClients, setAllClients] = useState([])
  const [users, setUsers] = useState([])
  const [sectors, setSectors] = useState([])
  const [vendorCategories, setVendorCategories] = useState([])

  const loadDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientApi.fetchClient(id)
      if (!res?.client) { setNotFound(true); return }
      setClient(res.client)
    } catch { setNotFound(true) } finally { setLoading(false) }
  }, [id])

  useEffect(() => { loadDetail() }, [loadDetail])
  useEffect(() => {
    if (showEditModal) {
      clientApi.fetchClients({ per_page: 500 }).then(r => setAllClients(r.clients || [])).catch(() => {})
      clientApi.fetchClients({ per_page: 500, filter: 'main' }).then(r => setAllClients(prev => [...prev, ...(r.clients || [])])).catch(() => {})
      Promise.all([
        fetch('/api/users').then(r => r.json()).catch(() => ({ users: [] })),
        fetch('/api/masters/sectors').then(r => r.json()).catch(() => ({ sectors: [] })),
        fetch('/api/masters/vendor-categories').then(r => r.json()).catch(() => ({ categories: [] })),
      ]).then(([u, s, v]) => {
        setUsers(u.users || [])
        setSectors(s.sectors || [])
        setVendorCategories(v.categories || [])
      }).catch(() => {})
    }
  }, [showEditModal])

  if (loading) return <LoadingState />
  if (notFound || !client) return <NotFoundState />

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'contacts', label: `Contacts (${client.contacts?.length || 0})`, icon: UserPlus },
    { key: 'remarks', label: `Remarks (${client.remark_count || 0})`, icon: MessageSquare },
    { key: 'followups', label: `Follow-ups (${client.follow_up_count || 0})`, icon: Calendar },
    { key: 'changelogs', label: `Change Logs (${client.change_logs?.length || 0})`, icon: History },
    { key: 'references', label: 'References', icon: Link2 },
  ]

  const sc = STATUS_COLORS[client.status] || { bg: '#F1F5F9', text: '#475569' }

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased', background: C.bg, padding: '24px 32px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/clients')} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 className="w-5 h-5" style={{ color: C.blue }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{client.name}</h1>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 12, background: sc.bg, color: sc.text }}>{client.status}</span>
                <span style={{ fontSize: 11, color: C.muted, background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>{client.client_code}</span>
              </div>
              <p style={{ fontSize: 12, color: C.secondary, margin: '2px 0 0' }}>
                {client.client_type === 'vendor' ? 'Vendor' : `${client.business_type || ''} Client`}
                {client.client_category && ` · ${client.client_category}`}
                {client.industry && ` · ${client.industry}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setEditForm(client); setShowEditModal(true) }} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6, color: C.text }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          <KpiCard icon={Building2} label="Projects" value={client.project_count || 0} color={C.blue} bg="#EFF6FF" />
          <KpiCard icon={Users} label="Contacts" value={client.contacts?.length || 0} color="#7C3AED" bg="#F5F3FF" />
          <KpiCard icon={MessageSquare} label="Remarks" value={client.remark_count || 0} color="#D97706" bg="#FFFBEB" />
          <KpiCard icon={Calendar} label="Follow-ups" value={client.follow_up_count || 0} color="#16A34A" bg="#F0FDF4" />
          <KpiCard icon={History} label="Changes" value={client.change_logs?.length || 0} color="#DC2626" bg="#FEF2F2" />
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: `2px solid ${C.border}` }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px', fontSize: 12, fontWeight: 600, fontFamily: C.font,
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: activeTab === tab.key ? C.blue : C.secondary,
                borderBottom: activeTab === tab.key ? `2px solid ${C.blue}` : '2px solid transparent',
                marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6,
                transition: 'color 0.15s',
              }}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: 20 }}>
          {activeTab === 'overview' && <OverviewTab client={client} />}
          {activeTab === 'contacts' && (
            <ContactsTab
              client={client}
              setClient={setClient}
              loadDetail={loadDetail}
              showContactModal={showContactModal}
              setShowContactModal={setShowContactModal}
              contactForm={contactForm}
              setContactForm={setContactForm}
              editingContactId={editingContactId}
              setEditingContactId={setEditingContactId}
            />
          )}
          {activeTab === 'remarks' && (
            <RemarksTab
              client={client}
              setClient={setClient}
              loadDetail={loadDetail}
              remarkInput={remarkInput}
              setRemarkInput={setRemarkInput}
              editingRemark={editingRemark}
              setEditingRemark={setEditingRemark}
            />
          )}
          {activeTab === 'followups' && (
            <FollowUpsTab
              client={client}
              setClient={setClient}
              loadDetail={loadDetail}
              showFollowUpModal={showFollowUpModal}
              setShowFollowUpModal={setShowFollowUpModal}
              followUpForm={followUpForm}
              setFollowUpForm={setFollowUpForm}
              editingFollowUpId={editingFollowUpId}
              setEditingFollowUpId={setEditingFollowUpId}
            />
          )}
          {activeTab === 'changelogs' && <ChangeLogsTab client={client} loadDetail={loadDetail} />}
          {activeTab === 'references' && (
            <ReferencesTab
              client={client}
              loadDetail={loadDetail}
              showReferenceModal={showReferenceModal}
              setShowReferenceModal={setShowReferenceModal}
              refForm={refForm}
              setRefForm={setRefForm}
              allClients={allClients}
              setAllClients={setAllClients}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditClientModal
          client={client}
          editForm={editForm}
          setEditForm={setEditForm}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); loadDetail() }}
          sectors={sectors}
          vendorCategories={vendorCategories}
          users={users}
          allClients={allClients}
        />
      )}
    </div>
  )
}

/* ─────────── TAB COMPONENTS ─────────── */

function OverviewTab({ client }) {
  return (
    <div>
      {/* Info Grid */}
      <SectionCard title="Company Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
          <InfoField label="Client Code" value={client.client_code} />
          <InfoField label="Business Type" value={client.business_type || '—'} />
          <InfoField label="Client Category" value={client.client_category || '—'} />
          <InfoField label="Vendor Category" value={client.vendor_category || '—'} />
          <InfoField label="Industry / Sector" value={client.industry || '—'} />
          <InfoField label="Status" value={client.status} />
        </div>
      </SectionCard>

      <SectionCard title="Contact Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
          <InfoField label="Contact Person" value={client.contact_name || '—'} icon={<UserPlus className="w-3 h-3" />} />
          <InfoField label="Email" value={client.contact_email || '—'} icon={<Mail className="w-3 h-3" />} />
          <InfoField label="Phone" value={client.contact_phone || '—'} icon={<Phone className="w-3 h-3" />} />
          <InfoField label="Location" value={client.location || '—'} icon={<MapPin className="w-3 h-3" />} />
          <InfoField label="State" value={client.state || '—'} />
          <InfoField label="State Code" value={client.state_code || '—'} />
          <InfoField label="Registered Address" value={client.registered_address || '—'} gridCol="span 3" />
          <InfoField label="Website" value={client.website || '—'} icon={<Globe className="w-3 h-3" />} />
        </div>
      </SectionCard>

      <SectionCard title="Tax & Registration">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
          <InfoField label="GST Number" value={client.gst_number || (client.gst_unregistered ? 'Unregistered' : '—')} />
          <InfoField label="PAN Number" value={client.pan_no || '—'} />
          <InfoField label="CIN Number" value={client.cin_number || '—'} />
          <InfoField label="MSME / UDYAM" value={client.msme_status || '—'} />
          <InfoField label="Default TDS Section" value={client.default_tds_section || '—'} />
        </div>
      </SectionCard>

      <SectionCard title="NDA & Financial">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
          <InfoField label="NDA File" value={client.nda_file_path || '—'} />
          <InfoField label="NDA Validity" value={client.nda_validity || '—'} />
          <InfoField label="Payment Terms" value={client.payment_terms || '—'} />
          <InfoField label="Credit Limit" value={client.credit_limit ? `₹${Number(client.credit_limit).toLocaleString()}` : '—'} />
          <InfoField label="Bank Account" value={client.bank_account_no || '—'} />
          <InfoField label="IFSC Code" value={client.bank_ifsc || '—'} />
        </div>
      </SectionCard>

      <SectionCard title="Reference & Assignment">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }}>
          <InfoField label="Reference Source" value={client.reference_source || '—'} />
          <InfoField label="Referring Client" value={client.referring_client_name || '—'} />
          <InfoField label="Account Owner" value={client.account_owner_name || '—'} />
          <InfoField label="First Follow-up Date" value={client.first_follow_up_date || '—'} />
          <InfoField label="Business Value" value={client.business_value ? `₹${Number(client.business_value).toLocaleString()}` : '—'} />
          <InfoField label="Last Business Date" value={client.last_business_date || '—'} />
          <InfoField label="Onboarding Remarks" value={client.onboarding_remarks || '—'} gridCol="span 3" />
          {client.status === 'BLACKLISTED' && (
            <InfoField label="Blacklist Reason" value={client.blacklist_reason || '—'} gridCol="span 3" />
          )}
        </div>
      </SectionCard>

      {/* Sub-clients */}
      {client.sub_clients?.length > 0 && (
        <SectionCard title={`Sub-Clients (${client.sub_clients.length})`}>
          {client.sub_clients.map(sub => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <div>
                <strong>{sub.name}</strong>
                <span style={{ color: C.muted, marginLeft: 8, fontSize: 11 }}>{sub.client_code}</span>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: STATUS_COLORS[sub.status]?.bg || '#F1F5F9', color: STATUS_COLORS[sub.status]?.text || '#475569' }}>{sub.status}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Projects */}
      {client.projects?.length > 0 && (
        <SectionCard title={`Projects (${client.projects.length})`}>
          {client.projects.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <div>
                <strong>{p.name}</strong>
                <span style={{ color: C.muted, marginLeft: 8, fontSize: 11 }}>{p.status}</span>
              </div>
              <span style={{ fontSize: 11, color: C.secondary }}>{p.start_date || ''}</span>
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  )
}

function ContactsTab({ client, setClient, loadDetail, showContactModal, setShowContactModal, contactForm, setContactForm, editingContactId, setEditingContactId }) {
  const { addToast } = useToast()

  const openAddContact = () => {
    setEditingContactId(null)
    setContactForm({ name: '', designation: '', mobile: '', email: '', role: '', is_primary: false })
    setShowContactModal(true)
  }

  const openEditContact = (c) => {
    setEditingContactId(c.id)
    setContactForm({ name: c.name, designation: c.designation || '', mobile: c.mobile || '', email: c.email || '', role: c.role || '', is_primary: c.is_primary })
    setShowContactModal(true)
  }

  const saveContact = async () => {
    if (!contactForm.name.trim()) return addToast('Name is required', 'error')
    try {
      if (editingContactId) {
        await clientApi.updateClientContact(client.id, editingContactId, contactForm)
      } else {
        await clientApi.createClientContact(client.id, contactForm)
      }
      setShowContactModal(false)
      addToast(`Contact ${editingContactId ? 'updated' : 'added'}`, 'success')
      loadDetail()
    } catch (e) { addToast(e.response?.data?.error || 'Failed to save', 'error') }
  }

  const deleteContact = async (coid) => {
    if (!confirm('Delete this contact?')) return
    try {
      await clientApi.deleteClientContact(client.id, coid)
      addToast('Contact deleted', 'success')
      loadDetail()
    } catch (e) { addToast('Failed to delete', 'error') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={openAddContact} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </div>
      {(!client.contacts || client.contacts.length === 0) ? (
        <EmptyState icon={UserPlus} text="No contacts yet" />
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: '#F8FAFC', fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase' }}>
            <div style={{ flex: 2 }}>Name</div>
            <div style={{ flex: 1.5 }}>Designation</div>
            <div style={{ flex: 1.5 }}>Email</div>
            <div style={{ flex: 1.5 }}>Phone</div>
            <div style={{ flex: 1 }}>Role</div>
            <div style={{ width: 70, textAlign: 'center' }}>Actions</div>
          </div>
          {client.contacts.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <div style={{ flex: 2, fontWeight: 500 }}>{c.name} {c.is_primary && <span style={{ fontSize: 10, color: C.blue, background: C.blueLight, padding: '1px 6px', borderRadius: 4, marginLeft: 6 }}>Primary</span>}</div>
              <div style={{ flex: 1.5, color: C.secondary }}>{c.designation || '—'}</div>
              <div style={{ flex: 1.5, color: C.blue }}>{c.email || '—'}</div>
              <div style={{ flex: 1.5 }}>{c.mobile || '—'}</div>
              <div style={{ flex: 1, color: C.secondary }}>{c.role || '—'}</div>
              <div style={{ width: 70, textAlign: 'center', display: 'flex', gap: 4, justifyContent: 'center' }}>
                <button onClick={() => openEditContact(c)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}><Pencil className="w-3 h-3" /></button>
                <button onClick={() => deleteContact(c.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#FEE2E2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showContactModal && (
        <Modal title={editingContactId ? 'Edit Contact' : 'Add Contact'} onClose={() => setShowContactModal(false)} onSave={saveContact}>
          <ModalField label="Name" required><input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Full name" /></ModalField>
          <ModalField label="Designation"><input value={contactForm.designation} onChange={e => setContactForm(p => ({ ...p, designation: e.target.value }))} style={inputStyle} placeholder="e.g. Manager" /></ModalField>
          <ModalField label="Email"><input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="email@example.com" /></ModalField>
          <ModalField label="Phone"><input value={contactForm.mobile} onChange={e => setContactForm(p => ({ ...p, mobile: e.target.value }))} style={inputStyle} placeholder="+91 98765 43210" /></ModalField>
          <ModalField label="Role">
            <select value={contactForm.role} onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))} style={inputStyle}>
              <option value="">— Select —</option>
              <option value="primary">Primary</option>
              <option value="accounts">Accounts</option>
              <option value="technical">Technical</option>
              <option value="escalation">Escalation</option>
            </select>
          </ModalField>
          <ModalField label=" "><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm(p => ({ ...p, is_primary: e.target.checked }))} style={{ accentColor: C.blue }} /> Primary Contact</label></ModalField>
        </Modal>
      )}
    </div>
  )
}

function RemarksTab({ client, loadDetail, remarkInput, setRemarkInput, editingRemark, setEditingRemark }) {
  const { addToast } = useToast()

  const addRemark = async () => {
    if (!remarkInput.trim()) return
    try {
      await clientApi.createClientRemark(client.id, { text: remarkInput })
      setRemarkInput('')
      addToast('Remark added', 'success')
      loadDetail()
    } catch (e) { addToast('Failed to add', 'error') }
  }

  const saveEditRemark = async (rid) => {
    if (!editingRemark?.trim()) return
    try {
      await clientApi.updateClientRemark(client.id, rid, { text: editingRemark })
      setEditingRemark(null)
      addToast('Remark updated', 'success')
      loadDetail()
    } catch (e) { addToast('Failed to update', 'error') }
  }

  const deleteRemark = async (rid) => {
    if (!confirm('Delete this remark?')) return
    try {
      await clientApi.deleteClientRemark(client.id, rid)
      addToast('Remark deleted', 'success')
      loadDetail()
    } catch (e) { addToast('Failed to delete', 'error') }
  }

  const togglePin = async (r) => {
    try {
      await clientApi.updateClientRemark(client.id, r.id, { is_pinned: !r.is_pinned })
      loadDetail()
    } catch (e) { addToast('Failed to update', 'error') }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <textarea
          value={remarkInput}
          onChange={e => setRemarkInput(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: C.font, resize: 'vertical', minHeight: 50 }}
          placeholder="Add a remark about this client..."
        />
        <button onClick={addRemark} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      {(!client.remarks || client.remarks.length === 0) ? (
        <EmptyState icon={MessageSquare} text="No remarks yet" />
      ) : (
        client.remarks.map(r => (
          <div key={r.id} style={{ background: C.card, borderRadius: 10, border: `1px solid ${r.is_pinned ? '#FDE68A' : C.border}`, padding: '14px 16px', marginBottom: 8, boxShadow: C.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                {editingRemark === r.id ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <textarea value={editingRemark === r.id && editingRemark !== null ? editingRemark : r.text} onChange={e => setEditingRemark(e.target.value)} style={{ ...inputStyle, minHeight: 40, flex: 1 }} />
                    <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-start' }}>
                      <button onClick={() => saveEditRemark(r.id)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: C.font }}>Save</button>
                      <button onClick={() => setEditingRemark(null)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontSize: 11, cursor: 'pointer', fontFamily: C.font }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.text}</div>
                )}
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  {r.author_name && <span>{r.author_name} · </span>}
                  {r.created_at && new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => togglePin(r)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.is_pinned ? '#D97706' : C.border }}>
                  {r.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </button>
                <button onClick={() => setEditingRemark(r.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}>
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => deleteRemark(r.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function FollowUpsTab({ client, loadDetail, showFollowUpModal, setShowFollowUpModal, followUpForm, setFollowUpForm, editingFollowUpId, setEditingFollowUpId }) {
  const { addToast } = useToast()

  const openAdd = () => {
    setEditingFollowUpId(null)
    setFollowUpForm({ date: '', purpose: '', assigned_to: '', outcome_remark: '' })
    setShowFollowUpModal(true)
  }

  const openEdit = (f) => {
    setEditingFollowUpId(f.id)
    setFollowUpForm({ date: f.date, purpose: f.purpose, assigned_to: f.assigned_to || '', outcome_remark: f.outcome_remark || '' })
    setShowFollowUpModal(true)
  }

  const save = async () => {
    if (!followUpForm.date || !followUpForm.purpose.trim()) return addToast('Date and purpose are required', 'error')
    try {
      const payload = { ...followUpForm }
      if (payload.assigned_to) payload.assigned_to = parseInt(payload.assigned_to)
      else delete payload.assigned_to
      if (editingFollowUpId) {
        await clientApi.updateClientFollowUp(client.id, editingFollowUpId, payload)
      } else {
        await clientApi.createClientFollowUp(client.id, payload)
      }
      setShowFollowUpModal(false)
      addToast(`Follow-up ${editingFollowUpId ? 'updated' : 'created'}`, 'success')
      loadDetail()
    } catch (e) { addToast(e.response?.data?.error || 'Failed to save', 'error') }
  }

  const complete = async (fid) => {
    const outcome = prompt('Outcome remarks (optional):')
    try {
      await clientApi.completeClientFollowUp(client.id, fid, { outcome_remark: outcome || '' })
      addToast('Follow-up completed', 'success')
      loadDetail()
    } catch (e) { addToast('Failed to complete', 'error') }
  }

  const deleteFollowUp = async (fid) => {
    if (!confirm('Delete this follow-up?')) return
    try {
      await clientApi.deleteClientFollowUp(client.id, fid)
      addToast('Follow-up deleted', 'success')
      loadDetail()
    } catch (e) { addToast('Failed to delete', 'error') }
  }

  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {})
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={openAdd} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-3.5 h-3.5" /> Add Follow-up
        </button>
      </div>
      {(!client.follow_ups || client.follow_ups.length === 0) ? (
        <EmptyState icon={Calendar} text="No follow-ups scheduled" />
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: '#F8FAFC', fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase' }}>
            <div style={{ flex: 1 }}>Date</div>
            <div style={{ flex: 2 }}>Purpose</div>
            <div style={{ flex: 1 }}>Assignee</div>
            <div style={{ flex: 1 }}>Status</div>
            <div style={{ flex: 1.5 }}>Outcome</div>
            <div style={{ width: 80, textAlign: 'center' }}>Actions</div>
          </div>
          {client.follow_ups.map(f => {
            const fc = FOLLOWUP_STATUS_COLORS[f.status] || { bg: '#F1F5F9', text: '#475569' }
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <div style={{ flex: 1 }}>{f.date || '—'}</div>
                <div style={{ flex: 2, fontWeight: 500 }}>{f.purpose}</div>
                <div style={{ flex: 1, color: C.secondary }}>{f.assignee_name || '—'}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: fc.bg, color: fc.text }}>{f.status}</span>
                </div>
                <div style={{ flex: 1.5, fontSize: 12, color: C.muted }}>{f.outcome_remark || '—'}</div>
                <div style={{ width: 80, textAlign: 'center', display: 'flex', gap: 4, justifyContent: 'center' }}>
                  {f.status === 'PENDING' && (
                    <>
                      <button onClick={() => complete(f.id)} title="Complete" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#DCFCE7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}><CheckCircle className="w-3 h-3" /></button>
                      <button onClick={() => openEdit(f)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}><Pencil className="w-3 h-3" /></button>
                    </>
                  )}
                  <button onClick={() => deleteFollowUp(f.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#FEE2E2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showFollowUpModal && (
        <Modal title={editingFollowUpId ? 'Edit Follow-up' : 'New Follow-up'} onClose={() => setShowFollowUpModal(false)} onSave={save}>
          <ModalField label="Date" required><input type="date" value={followUpForm.date} onChange={e => setFollowUpForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></ModalField>
          <ModalField label="Purpose" required><input value={followUpForm.purpose} onChange={e => setFollowUpForm(p => ({ ...p, purpose: e.target.value }))} style={inputStyle} placeholder="e.g. Follow up on proposal" /></ModalField>
          <ModalField label="Assigned To">
            <select value={followUpForm.assigned_to} onChange={e => setFollowUpForm(p => ({ ...p, assigned_to: e.target.value }))} style={inputStyle}>
              <option value="">— Select —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
          </ModalField>
          {editingFollowUpId && (
            <ModalField label="Outcome Remark">
              <textarea value={followUpForm.outcome_remark} onChange={e => setFollowUpForm(p => ({ ...p, outcome_remark: e.target.value }))} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} placeholder="Outcome of follow-up" />
            </ModalField>
          )}
        </Modal>
      )}
    </div>
  )
}

function ChangeLogsTab({ client, loadDetail }) {
  const { addToast } = useToast()
  const [approving, setApproving] = useState(null)

  const approve = async (lid) => {
    setApproving(lid)
    try {
      await clientApi.approveClientChangeLog(client.id, lid)
      addToast('Change approved', 'success')
      loadDetail()
    } catch (e) { addToast('Failed to approve', 'error') } finally { setApproving(null) }
  }

  if (!client.change_logs || client.change_logs.length === 0) return <EmptyState icon={History} text="No change logs" />

  return (
    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: '#F8FAFC', fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase' }}>
        <div style={{ flex: 1.5 }}>Field</div>
        <div style={{ flex: 2 }}>Old Value</div>
        <div style={{ flex: 2 }}>New Value</div>
        <div style={{ flex: 1 }}>Changed By</div>
        <div style={{ flex: 1 }}>Date</div>
        <div style={{ flex: 1, textAlign: 'center' }}>Status</div>
      </div>
      {client.change_logs.map(log => (
        <div key={log.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
          <div style={{ flex: 1.5, fontWeight: 600, color: C.text }}>{log.field_name}</div>
          <div style={{ flex: 2, color: '#DC2626', fontSize: 11 }}>{log.old_value || '—'}</div>
          <div style={{ flex: 2, color: '#16A34A', fontSize: 11 }}>{log.new_value || '—'}</div>
          <div style={{ flex: 1, color: C.secondary }}>{log.changed_by_name || '—'}</div>
          <div style={{ flex: 1, color: C.secondary }}>{log.changed_at ? new Date(log.changed_at).toLocaleDateString() : '—'}</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {log.needs_approval && !log.approved_by ? (
              <button onClick={() => approve(log.id)} disabled={approving === log.id} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
                {approving === log.id ? '...' : 'Approve'}
              </button>
            ) : log.approved_by ? (
              <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>Approved</span>
            ) : (
              <span style={{ fontSize: 10, color: C.secondary }}>Auto</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ReferencesTab({ client, loadDetail, showReferenceModal, setShowReferenceModal, refForm, setRefForm, allClients, setAllClients }) {
  const { addToast } = useToast()

  useEffect(() => {
    if (showReferenceModal) {
      clientApi.fetchClients({ per_page: 500 }).then(r => setAllClients(r.clients || [])).catch(() => {})
    }
  }, [showReferenceModal])

  const openAdd = () => {
    setRefForm({ referred_client_id: '' })
    setShowReferenceModal(true)
  }

  const save = async () => {
    if (!refForm.referred_client_id) return addToast('Select a client', 'error')
    try {
      await clientApi.createClientReference(client.id, { referred_client_id: parseInt(refForm.referred_client_id) })
      setShowReferenceModal(false)
      addToast('Reference added', 'success')
      loadDetail()
    } catch (e) { addToast(e.response?.data?.error || 'Failed to add', 'error') }
  }

  const remove = async (rid) => {
    if (!confirm('Remove this reference?')) return
    try {
      await clientApi.deleteClientReference(client.id, rid)
      addToast('Reference removed', 'success')
      loadDetail()
    } catch (e) { addToast('Failed to remove', 'error') }
  }

  const allRefs = [...(client.referrals_given || []), ...(client.referrals_received || [])]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={openAdd} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-3.5 h-3.5" /> Add Reference
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="Referred By This Client">
          {(!client.referrals_given || client.referrals_given.length === 0) ? (
            <div style={{ fontSize: 13, color: C.muted }}>No referrals given</div>
          ) : (
            client.referrals_given.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span>{r.referred_client_name || '—'}</span>
                <button onClick={() => remove(r.id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#FEE2E2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}><Trash2 className="w-3 h-3" /></button>
              </div>
            ))
          )}
        </SectionCard>
        <SectionCard title="Referred To This Client">
          {(!client.referrals_received || client.referrals_received.length === 0) ? (
            <div style={{ fontSize: 13, color: C.muted }}>No referrals received</div>
          ) : (
            client.referrals_received.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span>{r.client_name || '—'}</span>
              </div>
            ))
          )}
        </SectionCard>
      </div>

      {showReferenceModal && (
        <Modal title="Add Reference" onClose={() => setShowReferenceModal(false)} onSave={save}>
          <ModalField label="Referred Client" required>
            <select value={refForm.referred_client_id} onChange={e => setRefForm(p => ({ ...p, referred_client_id: e.target.value }))} style={inputStyle}>
              <option value="">— Select Client —</option>
              {allClients.filter(c => c.id !== client.id).map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.client_code})</option>
              ))}
            </select>
          </ModalField>
        </Modal>
      )}
    </div>
  )
}

/* ─────────── EDIT MODAL ─────────── */

function EditClientModal({ client, editForm, setEditForm, onClose, onSaved, sectors, vendorCategories, users, allClients }) {
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setEditForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await clientApi.updateClient(client.id, editForm)
      addToast('Client updated', 'success')
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Failed to update') } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, width: 680, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadowMd, fontFamily: C.font }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Client</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}><X className="w-4 h-4" /></button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, fontWeight: 500, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle className="w-4 h-4" /> {error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <EditField label="Name" span={2}>
              <input value={editForm.name || ''} onChange={e => set('name', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="Business Type">
              <select value={editForm.business_type || ''} onChange={e => set('business_type', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </EditField>
            <EditField label="Status">
              <select value={editForm.status || ''} onChange={e => set('status', e.target.value)} style={inputStyle}>
                <option value="PROSPECT">Prospect</option>
                <option value="ACTIVE">Active</option>
                <option value="DORMANT">Dormant</option>
                <option value="BLACKLISTED">Blacklisted</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </EditField>
            <EditField label="Client Category">
              <select value={editForm.client_category || ''} onChange={e => set('client_category', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </EditField>
            {editForm.client_type === 'vendor' && (
              <EditField label="Vendor Category">
                <select value={editForm.vendor_category || ''} onChange={e => set('vendor_category', e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {vendorCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </EditField>
            )}
            <EditField label="GST Number">
              <input value={editForm.gst_number || ''} onChange={e => set('gst_number', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="GST Unregistered">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, paddingTop: 4 }}>
                <input type="checkbox" checked={editForm.gst_unregistered || false} onChange={e => set('gst_unregistered', e.target.checked)} style={{ accentColor: C.blue }} />
                Not registered
              </label>
            </EditField>
            <EditField label="PAN Number">
              <input value={editForm.pan_no || ''} onChange={e => set('pan_no', e.target.value.toUpperCase())} style={inputStyle} />
            </EditField>
            <EditField label="Contact Person">
              <input value={editForm.contact_name || ''} onChange={e => set('contact_name', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="Contact Email">
              <input value={editForm.contact_email || ''} onChange={e => set('contact_email', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="Contact Phone">
              <input value={editForm.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="Location">
              <input value={editForm.location || ''} onChange={e => set('location', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="State">
              <input value={editForm.state || ''} onChange={e => set('state', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="State Code">
              <input value={editForm.state_code || ''} onChange={e => set('state_code', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="Website">
              <input value={editForm.website || ''} onChange={e => set('website', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="Industry">
              <input value={editForm.industry || ''} onChange={e => set('industry', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="Payment Terms">
              <select value={editForm.payment_terms || ''} onChange={e => set('payment_terms', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </EditField>
            <EditField label="Credit Limit">
              <input type="number" value={editForm.credit_limit || ''} onChange={e => set('credit_limit', e.target.value)} style={inputStyle} />
            </EditField>
            <EditField label="Account Owner" span={1}>
              <select value={editForm.account_owner_id || ''} onChange={e => set('account_owner_id', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </EditField>
            <EditField label="Reference Source" span={1}>
              <select value={editForm.reference_source || ''} onChange={e => set('reference_source', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {REFERENCE_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </EditField>
            <EditField label="Onboarding Remarks" span={2}>
              <textarea value={editForm.onboarding_remarks || ''} onChange={e => set('onboarding_remarks', e.target.value)} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
            </EditField>
            {editForm.status === 'BLACKLISTED' && (
              <EditField label="Blacklist Reason" span={2}>
                <textarea value={editForm.blacklist_reason || ''} onChange={e => set('blacklist_reason', e.target.value)} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
              </EditField>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: C.font, color: C.text, fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────── REUSABLE COMPONENTS ─────────── */

function SectionCard({ title, children }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: '18px 20px', marginBottom: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 14px', paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>{title}</h3>
      {children}
    </div>
  )
}

function InfoField({ label, value, icon, gridCol }) {
  return (
    <div style={gridCol ? { gridColumn: gridCol } : {}}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{value}</div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', boxShadow: C.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.secondary, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, textAlign: 'center', padding: '48px 20px' }}>
      <Icon className="w-10 h-10" style={{ margin: '0 auto 10px', color: C.secondary, opacity: 0.25 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{text}</div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, background: C.bg }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} />
    </div>
  )
}

function NotFoundState() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, background: C.bg, gap: 12 }}>
      <Building2 className="w-16 h-16" style={{ color: C.secondary, opacity: 0.3 }} />
      <div style={{ fontSize: 18, fontWeight: 700 }}>Client not found</div>
      <button onClick={() => navigate('/clients')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>Back to Clients</button>
    </div>
  )
}

function Modal({ title, children, onClose, onSave }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, width: 500, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadowMd, fontFamily: C.font }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}><X className="w-4 h-4" /></button>
        </div>
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'grid', gap: 14 }}>
          {children}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: C.font, color: C.text, fontWeight: 500 }}>Cancel</button>
          <button onClick={onSave} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>Save</button>
        </div>
      </div>
    </div>
  )
}

function ModalField({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>{label} {required && <span style={{ color: '#EF4444' }}>*</span>}</label>
      {children}
    </div>
  )
}

function EditField({ label, span, children }) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`,
  borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: C.font,
  background: '#fff', boxSizing: 'border-box', color: C.text,
}
