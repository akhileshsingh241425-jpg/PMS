import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Building2, Phone, Mail, MapPin, Globe, FileText, Shield,
  UserPlus, MessageSquare, Calendar, History, Link2, ChevronRight,
  Plus, Pencil, Trash2, CheckCircle, X, Save, AlertCircle, Pin,
  PinOff, Loader2, Clock, Ban, UserCheck, Users, ChevronDown,
  MoreVertical, Play, Pause, Archive, AlertTriangle, Download, Briefcase,
  FolderOpen, ShoppingCart
} from 'lucide-react'
import { C } from '../components/styleConstants'
import Breadcrumb from '../components/Breadcrumb'
import * as clientApi from '../api/clientsApi'
import { useToast } from '../contexts/ToastContext'

const STATUS_COLORS = {
  PROSPECT: { bg: '#DBEAFE', text: '#1E40AF' },
  ACTIVE: { bg: '#DCFCE7', text: '#166534' },
  DORMANT: { bg: '#FEF3C7', text: '#92400E' },
  HOLD: { bg: '#F3E8FF', text: '#7C3AED' },
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
  const [showActions, setShowActions] = useState(false)
  const [exporting, setExporting] = useState(false)
  const actionsRef = useRef(null)

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
        clientApi.fetchClients({ per_page: 500, filter: 'main' }).then(r => r.clients || []).catch(() => []),
        fetch('/api/users').then(r => r.json()).catch(() => ({ users: [] })),
        fetch('/api/masters/sectors').then(r => r.json()).catch(() => ({ sectors: [] })),
        fetch('/api/masters/vendor-categories').then(r => r.json()).catch(() => ({ categories: [] })),
      ]).then(([moreClients, u, s, v]) => {
        setAllClients(prev => [...prev, ...(moreClients || [])])
        setUsers(u.users || [])
        setSectors(s.sectors || [])
        setVendorCategories(v.categories || [])
      }).catch(() => {})
    }
  }, [showEditModal])

  useEffect(() => {
    const handleClick = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowActions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const changeStatus = async (status) => {
    try {
      await clientApi.updateClient(client.id, { status })
      addToast(`Status changed to ${status}`, 'success')
      loadDetail()
    } catch (e) { addToast(e?.response?.data?.error || e?.message || 'Failed to update status', 'error') }
    setShowActions(false)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await clientApi.exportClient(client.id)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${client.client_code}-${client.name}.csv`.replace(/\s+/g, '_')
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) { addToast('Failed to export', 'error') } finally { setExporting(false) }
  }

  const deleteClient = async () => {
    if (!confirm(`Delete client "${client.name}" (${client.client_code})? This cannot be undone.`)) return
    try {
      await clientApi.deleteClient(client.id)
      addToast('Client deleted', 'success')
      navigate('/clients', { replace: true })
    } catch (e) { addToast(e?.response?.data?.error || e?.message || 'Failed to delete', 'error') }
    setShowActions(false)
  }

  if (loading) return <LoadingState />
  if (notFound || !client) return <NotFoundState />

  const isVendor = client.client_type === 'vendor'
  const isBoth = client.client_type === 'both'
  const tabs = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'contacts', label: `Contacts (${client.contacts?.length || 0})`, icon: UserPlus },
    ...(!isVendor ? [{ key: 'workorders', label: `Work Orders (${client.po_in_list?.length || 0})`, icon: Briefcase }] : []),
    ...(!isVendor ? [{ key: 'projects', label: `Projects (${client.projects?.length || 0})`, icon: FolderOpen }] : []),
    ...(isVendor || isBoth ? [{ key: 'purchaseorders', label: `Purchase Orders (${client.po_out_list?.length || 0})`, icon: ShoppingCart }] : []),
    { key: 'remarks', label: `Remarks (${client.remark_count || 0})`, icon: MessageSquare },
    { key: 'followups', label: `Follow-ups (${client.follow_up_count || 0})`, icon: Calendar },
    { key: 'changelogs', label: `Change Logs (${client.change_logs?.length || 0})`, icon: History },
    { key: 'references', label: 'References', icon: Link2 },
  ]

  const sc = STATUS_COLORS[client.status] || { bg: '#F1F5F9', text: '#475569' }

  return (
    <div style={{ minHeight: '100vh', fontFamily: C.font, color: C.text, WebkitFontSmoothing: 'antialiased', background: C.bg, padding: '14px 20px 24px' }}>
      <div>
        <Breadcrumb items={[
          { label: 'Clients', to: '/clients' },
          { label: client.name },
        ]} />
        {/* Compact Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 className="w-4 h-4" style={{ color: C.blue }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</h1>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 10, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>{client.status}</span>
                <span style={{ fontSize: 10, color: C.muted, background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{client.client_code}</span>
                <span style={{ fontSize: 10, color: C.secondary }}>{client.client_type === 'vendor' ? 'Vendor' : client.business_type || ''}{client.client_category && ` · ${client.client_category}`}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, position: 'relative' }} ref={actionsRef}>
            <button onClick={handleExport} disabled={exporting} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 4, color: C.text, opacity: exporting ? 0.6 : 1 }}>
              <Download className="w-3 h-3" /> {exporting ? 'Exporting...' : 'Export'}
            </button>
            <button onClick={() => { setEditForm(client); setShowEditModal(true) }} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 4, color: C.text }}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button onClick={() => setShowActions(!showActions)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}>
              <MoreVertical className="w-4 h-4" />
            </button>
            {showActions && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, boxShadow: C.shadowMd, zIndex: 100, minWidth: 180, padding: 4, fontSize: 12 }}>
                <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Change Status</div>
                {['ACTIVE', 'HOLD', 'DORMANT', 'PROSPECT', 'ARCHIVED', 'BLACKLISTED'].filter(s => s !== client.status).map(s => (
                  <button key={s} onClick={() => changeStatus(s)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, fontSize: 12, fontFamily: C.font, color: C.text, textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s]?.bg || '#F1F5F9', border: `2px solid ${STATUS_COLORS[s]?.text || '#475569'}` }} />
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}`, margin: '4px 0' }} />
                <button onClick={deleteClient} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, fontSize: 12, fontFamily: C.font, color: '#DC2626', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete Client
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Compact KPI row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <CompactKpi label="Projects" value={client.project_count || 0} color={C.blue} />
          <CompactKpi label="Contacts" value={client.contacts?.length || 0} color="#7C3AED" />
          <CompactKpi label="Remarks" value={client.remark_count || 0} color="#D97706" />
          <CompactKpi label="Follow-ups" value={client.follow_up_count || 0} color="#16A34A" />
          <CompactKpi label="Changes" value={client.change_logs?.length || 0} color="#DC2626" />
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
        <div style={{ marginTop: 12 }}>
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
          {activeTab === 'workorders' && <WorkOrdersTab client={client} navigate={navigate} />}
          {activeTab === 'projects' && <ProjectsTab client={client} navigate={navigate} />}
          {activeTab === 'purchaseorders' && <PurchaseOrdersTab client={client} navigate={navigate} />}
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
  const label = { fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 1 }
  const val = { fontSize: 12, fontWeight: 500, color: C.text }
  const sec = { padding: '6px 0', borderBottom: `1px solid ${C.border}` }
  const g = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '3px 12px' }
  const g4 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '3px 12px' }
  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }

  return (
    <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden', fontSize: 12 }}>
      {/* Row 1: Company */}
      <div style={sec}>
        <div style={{ padding: '0 14px', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Company</span>
        </div>
        <div style={{ padding: '0 14px', ...g }}>
          <div><div style={label}>Code</div><div style={val}>{client.client_code}</div></div>
          <div><div style={label}>Type</div><div style={val}>{client.client_type === 'vendor' ? 'Vendor' : client.business_type || '—'}</div></div>
          <div><div style={label}>Category</div><div style={val}>{client.client_category || '—'}</div></div>
          <div><div style={label}>Vendor Cat</div><div style={val}>{client.vendor_category || '—'}</div></div>
          <div><div style={label}>Industry</div><div style={val}>{client.industry || '—'}</div></div>
          <div><div style={label}>Status</div><div style={val}>{client.status}</div></div>
        </div>
      </div>

      {/* Row 2: Contact */}
      <div style={sec}>
        <div style={{ padding: '0 14px', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Contact</span>
        </div>
        <div style={{ padding: '0 14px', ...g }}>
          <div><div style={label}>Person</div><div style={val}>{client.contact_name || '—'}</div></div>
          <div><div style={label}>Email</div><div style={val}>{client.contact_email || '—'}</div></div>
          <div><div style={label}>Phone</div><div style={val}>{client.contact_phone || '—'}</div></div>
          <div><div style={label}>Location</div><div style={val}>{client.location || '—'}</div></div>
          <div><div style={label}>State</div><div style={val}>{client.state || '—'}</div></div>
          <div><div style={label}>State Code</div><div style={val}>{client.state_code || '—'}</div></div>
        </div>
        <div style={{ padding: '4px 14px 0', ...g2 }}>
          <div style={{ gridColumn: 'span 2' }}><div style={label}>Address</div><div style={val}>{client.registered_address || '—'}</div></div>
          <div><div style={label}>Website</div><div style={val}>{client.website || '—'}</div></div>
        </div>
      </div>

      {/* Row 3: Tax */}
      <div style={sec}>
        <div style={{ padding: '0 14px', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tax &amp; Registration</span>
        </div>
        <div style={{ padding: '0 14px', ...g }}>
          <div><div style={label}>GST</div><div style={val}>{client.gst_number || (client.gst_unregistered ? 'Unregistered' : '—')}</div></div>
          <div><div style={label}>PAN</div><div style={val}>{client.pan_no || '—'}</div></div>
          <div><div style={label}>CIN</div><div style={val}>{client.cin_number || '—'}</div></div>
          <div><div style={label}>MSME</div><div style={val}>{client.msme_status || '—'}</div></div>
          <div><div style={label}>TDS Section</div><div style={val}>{client.default_tds_section || '—'}</div></div>
        </div>
      </div>

      {/* Row 4: Financial */}
      <div style={sec}>
        <div style={{ padding: '0 14px', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>NDA &amp; Financial</span>
        </div>
        <div style={{ padding: '0 14px', ...g }}>
          <div><div style={label}>NDA File</div><div style={val}>{client.nda_file_path || '—'}</div></div>
          <div><div style={label}>NDA Valid Till</div><div style={val}>{client.nda_validity || '—'}</div></div>
          <div><div style={label}>Payment Terms</div><div style={val}>{client.payment_terms || '—'}</div></div>
          <div><div style={label}>Credit Limit</div><div style={val}>{client.credit_limit ? `₹${Number(client.credit_limit).toLocaleString()}` : '—'}</div></div>
          <div><div style={label}>Bank A/c</div><div style={val}>{client.bank_account_no || '—'}</div></div>
          <div><div style={label}>IFSC</div><div style={val}>{client.bank_ifsc || '—'}</div></div>
        </div>
      </div>

      {/* Row 5: Reference */}
      <div style={sec}>
        <div style={{ padding: '0 14px', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Reference &amp; Business</span>
        </div>
        <div style={{ padding: '0 14px', ...g }}>
          <div><div style={label}>Source</div><div style={val}>{client.reference_source || '—'}</div></div>
          <div><div style={label}>Referring Client</div><div style={val}>{client.referring_client_name || '—'}</div></div>
          <div><div style={label}>Account Owner</div><div style={val}>{client.account_owner_name || '—'}</div></div>
          <div><div style={label}>First Follow-up</div><div style={val}>{client.first_follow_up_date || '—'}</div></div>
          <div><div style={label}>Business Value</div><div style={val}>{client.business_value ? `₹${Number(client.business_value).toLocaleString()}` : '—'}</div></div>
          <div><div style={label}>Last Business</div><div style={val}>{client.last_business_date || '—'}</div></div>
        </div>
      </div>

      {/* Remarks row if present */}
      {(client.onboarding_remarks || client.status === 'BLACKLISTED') && (
        <div style={sec}>
          <div style={{ padding: '0 14px', ...g2 }}>
            {client.onboarding_remarks && <div style={{ gridColumn: 'span 2' }}><div style={label}>Onboarding Remarks</div><div style={val}>{client.onboarding_remarks}</div></div>}
            {client.status === 'BLACKLISTED' && client.blacklist_reason && <div style={{ gridColumn: 'span 2' }}><div style={label}>Blacklist Reason</div><div style={val}>{client.blacklist_reason}</div></div>}
          </div>
        </div>
      )}

      {/* Sub-clients inline */}
      {client.sub_clients?.length > 0 && (
        <div style={sec}>
          <div style={{ padding: '0 14px', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Sub-Clients ({client.sub_clients.length})</span>
          </div>
          <div style={{ padding: '0 14px' }}>
            {client.sub_clients.map(sub => (
              <span key={sub.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '2px 8px 2px 0', padding: '2px 8px', background: '#F1F5F9', borderRadius: 6, fontSize: 11 }}>
                {sub.name} <span style={{ fontSize: 9, color: C.muted }}>{sub.client_code}</span>
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: STATUS_COLORS[sub.status]?.bg || '#F1F5F9', color: STATUS_COLORS[sub.status]?.text || '#475569' }}>{sub.status}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects inline */}
      <div style={{ padding: '8px 0 4px' }}>
        <div style={{ padding: '0 14px', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Projects ({client.projects?.length || 0})</span>
        </div>
        <div style={{ padding: '0 14px' }}>
          {client.projects?.length > 0 ? client.projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '2px 8px 2px 0', padding: '2px 8px', background: '#F1F5F9', borderRadius: 6, fontSize: 11, color: C.text, textDecoration: 'none' }}>
              {p.title || p.proj_id} <span style={{ fontSize: 9, color: C.muted }}>{p.stage}</span>
            </Link>
          )) : <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>No projects yet</span>}
        </div>
      </div>
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

function WorkOrdersTab({ client, navigate }) {
  return (
    <div>
      {(!client.po_in_list || client.po_in_list.length === 0) ? (
        <EmptyState icon={Briefcase} text="No work orders yet" />
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: '#F8FAFC', fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase' }}>
            <div style={{ flex: 1 }}>ID</div>
            <div style={{ flex: 2 }}>Title</div>
            <div style={{ flex: 1 }}>PO No.</div>
            <div style={{ flex: 1 }}>Amount</div>
            <div style={{ flex: 1 }}>Status</div>
            <div style={{ width: 60, textAlign: 'center' }}>Action</div>
          </div>
          {client.po_in_list.map(wo => (
            <div key={wo.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13, cursor: 'pointer' }} onClick={() => navigate(`/po-in/${wo.id}`)}>
              <div style={{ flex: 1, fontWeight: 600, color: C.blue }}>{wo.proj_id}</div>
              <div style={{ flex: 2, fontWeight: 500 }}>{wo.title || '—'}</div>
              <div style={{ flex: 1, color: C.secondary }}>{wo.po_number || '—'}</div>
              <div style={{ flex: 1, fontWeight: 600 }}>₹{(wo.net_amount || 0).toLocaleString('en-IN')}</div>
              <div style={{ flex: 1 }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#DBEAFE', color: '#1E40AF' }}>{wo.po_in_status || '—'}</span></div>
              <div style={{ width: 60, textAlign: 'center' }}>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/po-in/${wo.id}`) }} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectsTab({ client, navigate }) {
  return (
    <div>
      {(!client.projects || client.projects.length === 0) ? (
        <EmptyState icon={FolderOpen} text="No projects yet" />
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: '#F8FAFC', fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase' }}>
            <div style={{ flex: 1 }}>ID</div>
            <div style={{ flex: 2 }}>Title</div>
            <div style={{ flex: 1 }}>Stage</div>
            <div style={{ flex: 1 }}>PM</div>
            <div style={{ flex: 1, textAlign: 'right' }}>Value</div>
            <div style={{ width: 60, textAlign: 'center' }}>Action</div>
          </div>
          {client.projects.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13, cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ flex: 1, fontWeight: 600, color: C.blue }}>{p.proj_id}</div>
              <div style={{ flex: 2, fontWeight: 500 }}>{p.title || '—'}</div>
              <div style={{ flex: 1 }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#D1FAE5', color: '#065F46' }}>{p.stage || '—'}</span></div>
              <div style={{ flex: 1, color: C.secondary }}>{p.pm_name || '—'}</div>
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>₹{(p.total_value || 0).toLocaleString('en-IN')}</div>
              <div style={{ width: 60, textAlign: 'center' }}>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}`) }} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PurchaseOrdersTab({ client, navigate }) {
  return (
    <div>
      {(!client.po_out_list || client.po_out_list.length === 0) ? (
        <EmptyState icon={ShoppingCart} text="No purchase orders yet" />
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: '#F8FAFC', fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase' }}>
            <div style={{ flex: 1 }}>PO No.</div>
            <div style={{ flex: 2 }}>Title</div>
            <div style={{ flex: 1 }}>Amount</div>
            <div style={{ flex: 1 }}>Status</div>
            <div style={{ width: 60, textAlign: 'center' }}>Action</div>
          </div>
          {client.po_out_list.map(po => (
            <div key={po.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13, cursor: 'pointer' }} onClick={() => navigate(`/po-out/${po.id}`)}>
              <div style={{ flex: 1, fontWeight: 600, color: C.blue }}>{po.po_number || po.proj_id}</div>
              <div style={{ flex: 2, fontWeight: 500 }}>{po.title || '—'}</div>
              <div style={{ flex: 1, fontWeight: 600 }}>₹{(po.net_amount || 0).toLocaleString('en-IN')}</div>
              <div style={{ flex: 1 }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#FEF3C7', color: '#92400E' }}>{po.po_out_status || '—'}</span></div>
              <div style={{ width: 60, textAlign: 'center' }}>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/po-out/${po.id}`) }} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>View</button>
              </div>
            </div>
          ))}
        </div>
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

/* ─────────── EDIT MODAL (ALL FIELDS) ─────────── */

function EditClientModal({ client, editForm, setEditForm, onClose, onSaved, sectors, vendorCategories, users, allClients }) {
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setEditForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const payload = { ...editForm }
    if (payload.parent_client_id) payload.parent_client_id = parseInt(payload.parent_client_id)
    if (payload.referring_client_id) payload.referring_client_id = parseInt(payload.referring_client_id)
    if (payload.account_owner_id) payload.account_owner_id = parseInt(payload.account_owner_id)
    if (payload.credit_limit) payload.credit_limit = parseFloat(payload.credit_limit)
    if (payload.business_value) payload.business_value = parseFloat(payload.business_value)
    try {
      await clientApi.updateClient(client.id, payload)
      addToast('Client updated', 'success')
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Failed to update') } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, width: 760, maxWidth: '100%', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: C.shadowMd, fontFamily: C.font }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Client — {client.client_code}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.secondary }}><X className="w-4 h-4" /></button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, fontWeight: 500, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle className="w-4 h-4" /> {error}</div>}

          <SectionTitle>Basic</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
            <EditField label="Name" span={2}><input value={editForm.name || ''} onChange={e => set('name', e.target.value)} style={inputStyle} /></EditField>
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
                <option value="HOLD">Hold</option>
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
            <EditField label="Vendor Category">
              <select value={editForm.vendor_category || ''} onChange={e => set('vendor_category', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {vendorCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </EditField>
            {editForm.business_type === 'B2B' && editForm.client_type !== 'vendor' && (
              <EditField label="Parent Client" span={2}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={editForm.parent_client_id || ''} onChange={e => set('parent_client_id', e.target.value)} style={{ ...inputStyle, flex: 1 }} disabled={editForm.is_independent}>
                    <option value="">— Select Parent —</option>
                    {allClients.filter(c => c.client_type === 'main' && c.id !== client.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.client_code})</option>
                    ))}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.is_independent || false} onChange={e => { set('is_independent', e.target.checked); if (e.target.checked) set('parent_client_id', '') }} style={{ accentColor: C.blue }} />
                    Independent
                  </label>
                </div>
              </EditField>
            )}
          </div>

          <SectionTitle>Contact</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
            <EditField label="Contact Person"><input value={editForm.contact_name || ''} onChange={e => set('contact_name', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Contact Email"><input type="email" value={editForm.contact_email || ''} onChange={e => set('contact_email', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Contact Phone"><input value={editForm.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Location"><input value={editForm.location || ''} onChange={e => set('location', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Registered Address" span={2}><textarea value={editForm.registered_address || ''} onChange={e => set('registered_address', e.target.value)} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} /></EditField>
            <EditField label="State"><input value={editForm.state || ''} onChange={e => set('state', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="City"><input value={editForm.city || ''} onChange={e => set('city', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Country"><input value={editForm.country || ''} onChange={e => set('country', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="State Code"><input value={editForm.state_code || ''} onChange={e => set('state_code', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Website"><input value={editForm.website || ''} onChange={e => set('website', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Industry"><input value={editForm.industry || ''} onChange={e => set('industry', e.target.value)} style={inputStyle} /></EditField>
          </div>

          <SectionTitle>Tax & Registration</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
            <EditField label="GST Number"><input value={editForm.gst_number || ''} onChange={e => set('gst_number', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="GST Unregistered">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, paddingTop: 4 }}>
                <input type="checkbox" checked={editForm.gst_unregistered || false} onChange={e => set('gst_unregistered', e.target.checked)} style={{ accentColor: C.blue }} />
                Not registered
              </label>
            </EditField>
            <EditField label="PAN Number"><input value={editForm.pan_no || ''} onChange={e => set('pan_no', e.target.value.toUpperCase())} style={inputStyle} /></EditField>
            <EditField label="CIN Number"><input value={editForm.cin_number || ''} onChange={e => set('cin_number', e.target.value.toUpperCase())} style={inputStyle} /></EditField>
            <EditField label="MSME / UDYAM"><input value={editForm.msme_status || ''} onChange={e => set('msme_status', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Default TDS Section">
              <select value={editForm.default_tds_section || ''} onChange={e => set('default_tds_section', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                <option value="194J">194J — Professional / Technical (10%)</option>
                <option value="194C">194C — Contract (1% / 2%)</option>
                <option value="194H">194H — Commission (5%)</option>
                <option value="194I">194I — Rent (10% / 24%)</option>
                <option value="194IA">194IA — Property (1%)</option>
                <option value="195">195 — NRO Payment</option>
                <option value="other">Other</option>
              </select>
            </EditField>
          </div>

          {editForm.business_type === 'B2C' && (
            <>
              <SectionTitle>Individual Details (B2C)</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
                <EditField label="Mobile Number"><input value={editForm.b2c_mobile || ''} onChange={e => set('b2c_mobile', e.target.value)} style={inputStyle} /></EditField>
                <EditField label="ID Proof Type">
                  <select value={editForm.b2c_id_proof_type || ''} onChange={e => set('b2c_id_proof_type', e.target.value)} style={inputStyle}>
                    <option value="">—</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="PAN">PAN</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                  </select>
                </EditField>
                <EditField label="ID Proof Number"><input value={editForm.b2c_id_proof_number || ''} onChange={e => set('b2c_id_proof_number', e.target.value)} style={inputStyle} /></EditField>
              </div>
            </>
          )}

          <SectionTitle>NDA & Financial</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
            <EditField label="NDA File Path"><input value={editForm.nda_file_path || ''} onChange={e => set('nda_file_path', e.target.value)} style={inputStyle} placeholder="File path or URL" /></EditField>
            <EditField label="NDA Validity"><input type="date" value={editForm.nda_validity || ''} onChange={e => set('nda_validity', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Payment Terms">
              <select value={editForm.payment_terms || ''} onChange={e => set('payment_terms', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </EditField>
            <EditField label="Credit Limit (INR)"><input type="number" value={editForm.credit_limit || ''} onChange={e => set('credit_limit', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Bank Account No."><input value={editForm.bank_account_no || ''} onChange={e => set('bank_account_no', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="IFSC Code"><input value={editForm.bank_ifsc || ''} onChange={e => set('bank_ifsc', e.target.value.toUpperCase())} style={inputStyle} /></EditField>
            <EditField label="Bank Cheque Path"><input value={editForm.bank_cheque_path || ''} onChange={e => set('bank_cheque_path', e.target.value)} style={inputStyle} placeholder="File path or URL" /></EditField>
          </div>

          <SectionTitle>Business Value</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
            <EditField label="Business Value (INR)"><input type="number" value={editForm.business_value || ''} onChange={e => set('business_value', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Last Business Date"><input type="date" value={editForm.last_business_date || ''} onChange={e => set('last_business_date', e.target.value)} style={inputStyle} /></EditField>
          </div>

          <SectionTitle>Reference & Assignment</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
            <EditField label="Reference Source">
              <select value={editForm.reference_source || ''} onChange={e => set('reference_source', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {REFERENCE_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </EditField>
            <EditField label="Referring Client">
              <select value={editForm.referring_client_id || ''} onChange={e => set('referring_client_id', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {allClients.filter(c => c.id !== client.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.client_code})</option>
                ))}
              </select>
            </EditField>
            <EditField label="Account Owner">
              <select value={editForm.account_owner_id || ''} onChange={e => set('account_owner_id', e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </EditField>
            <EditField label="First Follow-up Date"><input type="date" value={editForm.first_follow_up_date || ''} onChange={e => set('first_follow_up_date', e.target.value)} style={inputStyle} /></EditField>
            <EditField label="Onboarding Remarks" span={2}><textarea value={editForm.onboarding_remarks || ''} onChange={e => set('onboarding_remarks', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} /></EditField>
            {editForm.status === 'BLACKLISTED' && (
              <EditField label="Blacklist Reason" span={2}><textarea value={editForm.blacklist_reason || ''} onChange={e => set('blacklist_reason', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} /></EditField>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: C.font, color: C.text, fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h4 style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>{children}</h4>
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

function CompactKpi({ label, value, color }) {
  return (
    <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: '6px 12px', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.secondary, whiteSpace: 'nowrap' }}>{label}</div>
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
