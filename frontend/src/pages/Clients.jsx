import { useState, useEffect, Fragment } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  Plus, Search, Building2, MapPin, User, Phone, Mail, FileText,
  Activity, GitBranch, X, ChevronRight, ChevronLeft, ChevronDown, Globe, Tag, CheckCircle, XCircle, Building, Briefcase, ArrowRight
} from 'lucide-react'

const SECTORS = ['Govt', 'PSU', 'Pvt', 'BFSI', 'Co-op Bank', 'Individual']
const STATUSES = ['Active', 'Inactive', 'Prospect']
const ACTIVITY_TYPES = ['Call', 'Email', 'Visit', 'Meeting', 'Note']
const DOCUMENT_TYPES = ['Agreement', 'NDA', 'PO Copy', 'KYC', 'Other']

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [formData, setFormData] = useState({ company_name: '', client_type: 'B2B', sector: '', gst_no: '', pan_no: '', address: '', city: '', state: '', country: '', pincode: '', website: '', reference_source: '' })
  const [saving, setSaving] = useState(false)
  const [expandedClients, setExpandedClients] = useState(new Set())
  const [subClientsMap, setSubClientsMap] = useState({})
  const [loadingSubClients, setLoadingSubClients] = useState({})
  const { hasRole } = useAuth()

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    try {
      const params = { search }
      if (typeFilter) params.client_type = typeFilter
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/api/clients', { params })
      setClients(res.data.clients)
    } catch (err) {
      console.error('Failed to load clients', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [typeFilter, statusFilter])

  const handleSearch = () => { fetchClients() }

  const toggleSubClients = async (clientId, e) => {
    e.stopPropagation()
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId)
      setExpandedClients(newExpanded)
      return
    }
    newExpanded.add(clientId)
    setExpandedClients(newExpanded)
    if (!subClientsMap[clientId]) {
      setLoadingSubClients(prev => ({ ...prev, [clientId]: true }))
      try {
        const res = await api.get(`/api/clients/${clientId}/sub-clients`)
        setSubClientsMap(prev => ({ ...prev, [clientId]: res.data.sub_clients }))
      } catch (err) {
        console.error('Failed to load sub-clients', err)
      } finally {
        setLoadingSubClients(prev => ({ ...prev, [clientId]: false }))
      }
    }
  }

  const openCreate = () => {
    setEditClient(null)
    setFormData({ company_name: '', client_type: 'B2B', sector: '', gst_no: '', pan_no: '', address: '', city: '', state: '', country: '', pincode: '', website: '', reference_source: '' })
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditClient(c)
    setFormData({
      company_name: c.company_name, client_type: c.client_type, sector: c.sector || '',
      gst_no: c.gst_no || '', pan_no: c.pan_no || '', address: c.address || '',
      city: c.city || '', state: c.state || '', country: c.country || '',
      pincode: c.pincode || '', website: c.website || '', reference_source: c.reference_source || ''
    })
    setShowForm(true)
  }

  const saveClient = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editClient) {
        await api.put(`/api/clients/${editClient.id}`, formData)
      } else {
        await api.post('/api/clients', formData)
      }
      setShowForm(false)
      setEditClient(null)
      fetchClients()
    } catch (err) {
      console.error('Failed to save client', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage B2B & B2C client records</p>
        </div>
        {hasRole('super_admin') && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editClient ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Type *</label>
                  <select value={formData.client_type} onChange={e => setFormData({...formData, client_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <select value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST No</label>
                  <input value={formData.gst_no} onChange={e => setFormData({...formData, gst_no: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
                  <input value={formData.pan_no} onChange={e => setFormData({...formData, pan_no: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Source</label>
                  <input value={formData.reference_source} onChange={e => setFormData({...formData, reference_source: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editClient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClient ? (
        <ClientDetail key={selectedClient.id} client={selectedClient} onBack={() => setSelectedClient(null)} onUpdated={fetchClients} onSelectClient={(c) => setSelectedClient(c)} />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Search by name, ID, GST, city..." />
              </div>
              <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">All Types</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                    <th className="px-6 py-3">Client ID</th>
                    <th className="px-6 py-3">Company</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">GST</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Sub-Clients</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">Loading...</td></tr>
                  ) : clients.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">No clients found</td></tr>
                  ) : clients.map(c => (
                    <Fragment key={c.id}>
                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedClient(c)}>
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{c.client_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{c.company_name}</p>
                              <p className="text-xs text-gray-500">{c.sector || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.client_type === 'B2B' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{c.client_type}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{c.city || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{c.gst_no || '—'}</td>
                        <td className="px-6 py-4">
                          {c.status === 'Active'
                            ? <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" /> Active</span>
                            : c.status === 'Prospect'
                            ? <span className="flex items-center gap-1 text-yellow-600 text-sm"><Tag className="w-4 h-4" /> Prospect</span>
                            : <span className="flex items-center gap-1 text-red-600 text-sm"><XCircle className="w-4 h-4" /> Inactive</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={(e) => toggleSubClients(c.id, e)}
                            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800 hover:underline">
                            <GitBranch className="w-3.5 h-3.5" />
                            {c.sub_client_count ?? 0}
                            {expandedClients.has(c.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(c)} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">Edit</button>
                        </td>
                      </tr>
                      {expandedClients.has(c.id) && (
                        <tr>
                          <td colSpan={8} className="px-6 py-3 bg-orange-50">
                            {loadingSubClients[c.id] ? (
                              <p className="text-sm text-gray-500">Loading sub-clients...</p>
                            ) : subClientsMap[c.id]?.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {subClientsMap[c.id].map(s => (
                                  <div key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedClient({ id: s.child_client_id }) }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-orange-200 text-sm cursor-pointer hover:bg-orange-100 transition-colors">
                                    <GitBranch className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                    <span className="font-medium text-gray-900">{s.child_name}</span>
                                    {s.relationship && <span className="text-xs text-gray-500">({s.relationship})</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No sub-clients mapped</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ClientDetail({ client, onBack, onUpdated, onSelectClient }) {
  const [tab, setTab] = useState('overview')
  const [contacts, setContacts] = useState([])
  const [documents, setDocuments] = useState([])
  const [activity, setActivity] = useState([])
  const [subClients, setSubClients] = useState([])
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', designation: '', email: '', phone: '', is_primary: false, notes: '' })
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityForm, setActivityForm] = useState({ activity_type: 'Call', subject: '', description: '' })
  const [showSubClientForm, setShowSubClientForm] = useState(false)
  const [subClientForm, setSubClientForm] = useState({ child_client_id: '', relationship: '' })
  const [saving, setSaving] = useState(false)
  const [relatedData, setRelatedData] = useState(null)
  const [loadingRelated, setLoadingRelated] = useState(false)

  useEffect(() => {
    setContacts([])
    setDocuments([])
    setActivity([])
    setSubClients([])
    if (tab === 'contacts') fetchContacts()
    if (tab === 'documents') fetchDocuments()
    if (tab === 'activity') fetchActivity()
    if (tab === 'sub-clients') fetchSubClients()
    if (tab === 'overview') fetchSubClients()
    if (tab === 'leads' || tab === 'projects') fetchRelatedData()
  }, [tab, client.id])

  const fetchContacts = async () => {
    try { const res = await api.get(`/api/clients/${client.id}/all-contacts`); setContacts(res.data.contacts) } catch (e) { console.error(e) }
  }
  const fetchDocuments = async () => {
    try { const res = await api.get(`/api/clients/${client.id}/documents`); setDocuments(res.data.documents) } catch (e) { console.error(e) }
  }
  const fetchActivity = async () => {
    try { const res = await api.get(`/api/clients/${client.id}/activity`); setActivity(res.data.activity) } catch (e) { console.error(e) }
  }
  const fetchSubClients = async () => {
    try { const res = await api.get(`/api/clients/${client.id}/sub-clients`); setSubClients(res.data.sub_clients) } catch (e) { console.error(e) }
  }
  const fetchRelatedData = async () => {
    setLoadingRelated(true)
    try { const res = await api.get(`/api/clients/${client.id}/related-data`); setRelatedData(res.data) } catch (e) { console.error(e) } finally { setLoadingRelated(false) }
  }

  const addContact = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await api.post(`/api/clients/${client.id}/contacts`, contactForm); setShowContactForm(false); setContactForm({ name: '', designation: '', email: '', phone: '', is_primary: false, notes: '' }); fetchContacts() } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const addActivity = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await api.post(`/api/clients/${client.id}/activity`, activityForm); setShowActivityForm(false); setActivityForm({ activity_type: 'Call', subject: '', description: '' }); fetchActivity() } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const addSubClient = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await api.post(`/api/clients/${client.id}/sub-clients`, { ...subClientForm, child_client_id: parseInt(subClientForm.child_client_id) }); setShowSubClientForm(false); setSubClientForm({ child_client_id: '', relationship: '' }); fetchSubClients() } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const deleteContact = async (id) => {
    if (!confirm('Delete this contact?')) return
    try { await api.delete(`/api/clients/contacts/${id}`); fetchContacts() } catch (e) { console.error(e) }
  }

  const removeSubClient = async (id) => {
    if (!confirm('Remove this sub-client mapping?')) return
    try { await api.delete(`/api/clients/sub-clients/${id}`); fetchSubClients() } catch (e) { console.error(e) }
  }

  const viewSubClient = async (childId) => {
    try {
      const res = await api.get(`/api/clients/${childId}`)
      onSelectClient(res.data.client)
    } catch (e) {
      console.error(e)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: User },
    { id: 'leads', label: 'Leads', icon: Activity },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'sub-clients', label: 'Sub-Clients', icon: GitBranch },
  ]

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to Clients
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{client.company_name}</h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${client.client_type === 'B2B' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{client.client_type}</span>
                </div>
                <p className="text-sm text-gray-500">{client.client_id} · {client.sector || 'No sector'} · Since {client.created_at?.slice(0, 4)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {client.status === 'Active' ? <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> Active</span>
                : <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium"><Tag className="w-4 h-4" /> {client.status}</span>}
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">GST No</p>
                <p className="text-sm font-mono">{client.gst_no || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">PAN No</p>
                <p className="text-sm font-mono">{client.pan_no || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Website</p>
                <p className="text-sm">{client.website ? <a href={client.website} target="_blank" className="text-blue-600 hover:underline">{client.website}</a> : '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                <p className="text-sm">{client.address ? `${client.address}${client.city ? ', ' + client.city : ''}${client.state ? ', ' + client.state : ''}` : '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Country / Pincode</p>
                <p className="text-sm">{client.country || '—'} {client.pincode ? `· ${client.pincode}` : ''}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Reference Source</p>
                <p className="text-sm">{client.reference_source || '—'}</p>
              </div>
            </div>

            {subClients.length > 0 && (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Sub-Clients ({subClients.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subClients.map(s => (
                      <div key={s.id} onClick={() => viewSubClient(s.child_client_id)}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                          <GitBranch className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.child_name}</p>
                          {s.relationship && <p className="text-xs text-gray-500 truncate">{s.relationship}</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'leads' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Related Leads ({relatedData?.leads?.length || 0})</p>
            </div>
            {loadingRelated ? (
              <p className="text-sm text-gray-400 text-center py-4">Loading leads...</p>
            ) : relatedData?.leads?.length > 0 ? (
              <div className="space-y-2">
                {relatedData.leads.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${l.status === 'Won' ? 'bg-green-500' : l.status === 'Lost' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{l.company_name}</p>
                        <p className="text-xs text-gray-500">
                          {l.lead_id} · {l.service_type || '—'} · <span className={`font-medium ${l.status === 'Won' ? 'text-green-600' : l.status === 'Lost' ? 'text-red-600' : 'text-blue-600'}`}>{l.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 shrink-0">
                      {l.estimated_value && <p className="font-medium">{l.estimated_value.toLocaleString()}</p>}
                      <p>{l.assigned_name || 'Unassigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No related leads found</p>
            )}
          </div>
        )}

        {tab === 'projects' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Running Projects ({relatedData?.projects?.length || 0})</p>
            </div>
            {loadingRelated ? (
              <p className="text-sm text-gray-400 text-center py-4">Loading projects...</p>
            ) : relatedData?.projects?.length > 0 ? (
              <div className="space-y-3">
                {relatedData.projects.map(p => (
                  <div key={p.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            p.status === 'Open' ? 'bg-green-50 text-green-700' :
                            p.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>{p.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.project_id} · {p.lead_source || '—'}</p>
                      </div>
                      {p.total_value && <p className="text-sm font-semibold text-green-600">{p.total_value.toLocaleString()}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
                      {p.pm_name && <div><span className="font-medium text-gray-600">PM:</span> {p.pm_name}</div>}
                      {p.start_date && <div><span className="font-medium text-gray-600">Start:</span> {p.start_date}</div>}
                      {p.target_date && <div><span className="font-medium text-gray-600">Target:</span> {p.target_date}</div>}
                      {p.scopes?.length > 0 && <div><span className="font-medium text-gray-600">Scope:</span> {p.scopes.map(s => s.scope_type).join(', ')}</div>}
                    </div>
                    {p.team?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">Team ({p.team.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {p.team.map(t => (
                            <span key={t.user_id} className="px-2 py-0.5 bg-white rounded border border-gray-200 text-xs text-gray-700">
                              {t.user_name} {t.role ? `(${t.role})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No projects found for this client</p>
            )}
          </div>
        )}

        {tab === 'contacts' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">All Contacts ({contacts.length})</p>
              <button onClick={() => setShowContactForm(true)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                <Plus className="w-4 h-4" /> Add Contact
              </button>
            </div>
            {showContactForm && (
              <form onSubmit={addContact} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><input value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} placeholder="Name *" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required /></div>
                  <input value={contactForm.designation} onChange={e => setContactForm({...contactForm, designation: e.target.value})} placeholder="Designation" className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                  <input value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} placeholder="Email" className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                  <input value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} placeholder="Phone" className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm({...contactForm, is_primary: e.target.checked})} className="rounded" />
                    Primary contact
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowContactForm(false)} className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            )}
            {contacts.length > 0 && (
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{contacts.filter(c => !c.sub_client_name).length} Main</span>
                <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded font-medium">{contacts.filter(c => c.sub_client_name).length} Sub-Client</span>
              </div>
            )}
            <div className="space-y-2">
              {contacts.map(co => (
                <div key={co.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{co.name}</p>
                        {co.is_primary && <span className="text-xs text-blue-600 font-medium">(Primary)</span>}
                        {co.sub_client_name && <span className="flex items-center gap-1 text-xs text-orange-600 font-medium"><Building className="w-3 h-3" />{co.sub_client_name}</span>}
                      </div>
                      <p className="text-xs text-gray-500">{co.designation || ''}{co.email ? ` · ${co.email}` : ''}{co.phone ? ` · ${co.phone}` : ''}</p>
                    </div>
                  </div>
                  {!co.sub_client_name && (
                    <button onClick={() => deleteContact(co.id)} className="text-xs text-red-600 hover:text-red-800 shrink-0">Remove</button>
                  )}
                </div>
              ))}
              {contacts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No contacts added yet</p>}
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <div className="p-6">
            <p className="text-sm font-medium text-gray-700 mb-4">Documents ({documents.length})</p>
            <div className="space-y-2">
              {documents.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{d.file_name}</p>
                      <p className="text-xs text-gray-500">{d.document_type} · {d.uploaded_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {documents.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No documents uploaded</p>}
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Activity Log ({activity.length})</p>
              <button onClick={() => setShowActivityForm(true)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                <Plus className="w-4 h-4" /> Log Activity
              </button>
            </div>
            {showActivityForm && (
              <form onSubmit={addActivity} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <select value={activityForm.activity_type} onChange={e => setActivityForm({...activityForm, activity_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={activityForm.subject} onChange={e => setActivityForm({...activityForm, subject: e.target.value})} placeholder="Subject" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                <textarea value={activityForm.description} onChange={e => setActivityForm({...activityForm, description: e.target.value})} placeholder="Description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowActivityForm(false)} className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Log'}</button>
                </div>
              </form>
            )}
            <div className="space-y-2">
              {activity.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${
                    a.activity_type === 'Call' ? 'bg-blue-50 text-blue-700' :
                    a.activity_type === 'Email' ? 'bg-purple-50 text-purple-700' :
                    a.activity_type === 'Visit' ? 'bg-green-50 text-green-700' :
                    a.activity_type === 'Meeting' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>{a.activity_type}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.subject || '—'}</p>
                    {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">{a.performed_at?.slice(0, 16).replace('T', ' ')}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No activity logged</p>}
            </div>
          </div>
        )}

        {tab === 'sub-clients' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Sub-Client Mappings ({subClients.length})</p>
              <button onClick={() => setShowSubClientForm(true)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                <Plus className="w-4 h-4" /> Map Sub-Client
              </button>
            </div>
            {showSubClientForm && (
              <form onSubmit={addSubClient} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <input value={subClientForm.child_client_id} onChange={e => setSubClientForm({...subClientForm, child_client_id: e.target.value})} placeholder="Child Client ID (number)" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
                <input value={subClientForm.relationship} onChange={e => setSubClientForm({...subClientForm, relationship: e.target.value})} placeholder="Relationship (e.g. Branch office)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowSubClientForm(false)} className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Map'}</button>
                </div>
              </form>
            )}
            <div className="space-y-2">
              {subClients.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div onClick={() => viewSubClient(s.child_client_id)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:text-orange-600">
                    <GitBranch className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.child_name} <span className="text-xs text-gray-500">(ID: {s.child_client_id})</span></p>
                      {s.relationship && <p className="text-xs text-gray-500 truncate">{s.relationship}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-auto" />
                  </div>
                  <button onClick={() => removeSubClient(s.id)} className="text-xs text-red-600 hover:text-red-800 shrink-0 ml-2">Remove</button>
                </div>
              ))}
              {subClients.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No sub-client mappings</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
