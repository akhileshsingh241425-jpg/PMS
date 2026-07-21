import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/jira/Navbar'
import Sidebar from '../components/jira/Sidebar'
import EpicsList from '../components/jira/EpicsList'
import SprintIssueList from '../components/jira/SprintIssueList'
import IssueModal from '../components/jira/IssueModal'
import { ChevronRight, Filter, Search, ArrowUpDown } from 'lucide-react'

const C = {
  blue: '#0052CC', text: '#172B4D', muted: '#5E6C84', border: '#DFE1E6', bg: '#F4F5F7',
}

export default function Backlog() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [editIssue, setEditIssue] = useState(null)
  const [defaultSprintId, setDefaultSprintId] = useState(null)
  const [showEpicModal, setShowEpicModal] = useState(false)
  const [newEpicName, setNewEpicName] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    try {
      const r = await api.get(`/api/projects/${id}/backlog`)
      setData(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleCreateIssue = (sprintId) => {
    setDefaultSprintId(sprintId)
    setEditIssue(null)
    setShowIssueModal(true)
  }

  const handleEditIssue = async (issueId, updates) => {
    if (!issueId && !updates) return
    if (updates) {
      try {
        await api.put(`/api/issues/${issueId}`, updates)
        load()
      } catch (e) { console.error(e) }
      return
    }
    const issue = data?.sprints?.flatMap(s => s.issues).find(i => i.id === parseInt(issueId))
      || data?.unassigned_issues?.find(i => i.id === parseInt(issueId))
    if (issue) {
      setEditIssue(issue)
      setShowIssueModal(true)
    }
  }

  const handleDeleteIssue = async (issueId) => {
    try {
      await api.delete(`/api/issues/${issueId}`)
      load()
    } catch (e) { console.error(e) }
  }

  const handleCreateEpic = async () => {
    if (!newEpicName.trim()) return
    try {
      await api.post('/api/epics', { project_id: parseInt(id), name: newEpicName })
      setNewEpicName('')
      setShowEpicModal(false)
      load()
    } catch (e) { console.error(e) }
  }

  const handleCompleteSprint = async (sprintId) => {
    if (!confirm('Complete this sprint? Unfinished issues will move to backlog.')) return
    try {
      await api.post(`/api/sprints/${sprintId}/complete`)
      load()
    } catch (e) { console.error(e) }
  }

  // Filter issues client-side
  const filterSprints = (sprints) => {
    if (!searchFilter) return sprints
    const q = searchFilter.toLowerCase()
    return sprints.map(s => ({
      ...s,
      issues: s.issues.filter(i => i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)),
    }))
  }

  const filterUnassigned = (issues) => {
    if (!searchFilter) return issues
    const q = searchFilter.toLowerCase()
    return issues.filter(i => i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q))
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar project={data?.project} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top bar */}
          <div style={{
            padding: '8px 16px', borderBottom: `1px solid ${C.border}`,
            background: '#fff', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <Link to="/projects" style={{ fontSize: 13, color: C.blue, textDecoration: 'none' }}>Projects</Link>
            <ChevronRight className="w-3 h-3" style={{ color: C.muted }} />
            <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{data?.project?.title || 'Project'}</span>
            <div style={{ width: 1, height: 16, background: C.border, margin: '0 4px' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Backlog</span>
            <div style={{ flex: 1 }} />
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Search issues..."
                style={{ width: 200, padding: '5px 8px 5px 28px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#FAFBFC' }} />
            </div>
            <button style={{ padding: '5px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', fontSize: 12, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              <Filter className="w-3 h-3" /> Filters
            </button>
            <button style={{ padding: '5px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', fontSize: 12, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              <ArrowUpDown className="w-3 h-3" /> Sort
            </button>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <EpicsList epics={data?.epics || []} onCreateEpic={() => setShowEpicModal(true)} />
            <SprintIssueList
              sprints={filterSprints(data?.sprints || [])}
              unassignedIssues={filterUnassigned(data?.unassigned_issues || [])}
              projectId={parseInt(id)}
              onIssueClick={(issue) => handleEditIssue(issue.id, null)}
              onCreateIssue={handleCreateIssue}
              onEditIssue={handleEditIssue}
              onDeleteIssue={handleDeleteIssue}
              onCompleteSprint={handleCompleteSprint}
            />
          </div>
        </div>
      </div>

      {/* Create Epic Modal */}
      {showEpicModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEpicModal(false)}>
          <div style={{ background: '#fff', borderRadius: 4, width: 400, padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 16px' }}>Create epic</h3>
            <input value={newEpicName} onChange={e => setNewEpicName(e.target.value)} placeholder="Epic name" autoFocus
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12 }}
              onKeyDown={e => e.key === 'Enter' && handleCreateEpic()} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setShowEpicModal(false)}
                style={{ padding: '7px 16px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleCreateEpic}
                style={{ padding: '7px 16px', borderRadius: 4, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal (create/edit) */}
      {showIssueModal && (
        <IssueModal
          issue={editIssue}
          projectId={parseInt(id)}
          epics={data?.epics || []}
          sprints={data?.sprints || []}
          onClose={() => { setShowIssueModal(false); setEditIssue(null) }}
          onSaved={() => { setShowIssueModal(false); setEditIssue(null); load() }}
        />
      )}
    </div>
  )
}
