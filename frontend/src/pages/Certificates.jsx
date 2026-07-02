import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, Award, X, Download, FileText, Calendar, User } from 'lucide-react'

export default function Certificates() {
  const [certificates, setCertificates] = useState([])
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '', project_id: '', issue_date: '', expiry_date: '', type: 'Completion', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const { hasRole } = useAuth()

  useEffect(() => { fetchCertificates(); fetchProjects() }, [])

  const fetchProjects = async () => {
    try { const res = await api.get('/api/projects'); setProjects(res.data.projects) } catch (e) { console.error(e) }
  }

  const fetchCertificates = async () => {
    try {
      const params = { search }
      const res = await api.get('/api/certificates', { params })
      setCertificates(res.data.certificates || [])
    } catch (err) {
      console.error(err)
      setCertificates([])
    } finally { setLoading(false) }
  }

  const saveCertificate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/api/certificates', formData)
      setShowForm(false); fetchCertificates()
    } catch (err) {
      try {
        await api.post('/api/projects/certificates', formData)
        setShowForm(false); fetchCertificates()
      } catch (e2) { console.error(e2) }
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-500 mt-1">Manage project completion certificates</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Certificate
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">New Certificate</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveCertificate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Name *</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_id} - {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="Completion">Completion</option>
                    <option value="Participation">Participation</option>
                    <option value="Training">Training</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
        ) : certificates.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No certificates found</p>
            <p className="text-sm text-gray-400 mt-1">Create certificates for completed projects.</p>
          </div>
        ) : certificates.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{c.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.project_name || '—'}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  {c.issue_date && <span>Issued: {c.issue_date}</span>}
                  {c.expiry_date && <span>Expires: {c.expiry_date}</span>}
                </div>
                <span className="inline-block mt-2 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">{c.type || 'Completion'}</span>
              </div>
              {c.file_path && (
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
