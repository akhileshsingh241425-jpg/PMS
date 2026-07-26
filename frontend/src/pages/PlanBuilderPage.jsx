import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function PlanBuilderPage() {
  const { id: pid } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState(null)
  const [phases, setPhases] = useState([])
  const [planGenerated, setPlanGenerated] = useState(false)
  const [planVersion, setPlanVersion] = useState(1)
  const [projectType, setProjectType] = useState('')
  const [templates, setTemplates] = useState([])
  const [users, setUsers] = useState([])
  const [versions, setVersions] = useState([])
  const [showVersions, setShowVersions] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [changeLog, setChangeLog] = useState('')
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [baselineView, setBaselineView] = useState(null)
  const [expandedModules, setExpandedModules] = useState({})

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${pid}`, { withCredentials: true }),
      api.get(`/plan-builder/projects/${pid}/plan`, { withCredentials: true }),
      api.get(`/admin/users`, { withCredentials: true }),
    ]).then(([projRes, planRes, usersRes]) => {
      const proj = projRes.data.project || projRes.data
      setProject(proj)
      setPlanGenerated(planRes.data.plan_generated)
      setPlanVersion(planRes.data.plan_version || 1)
      setProjectType(planRes.data.project_type || proj.project_type || '')
      setTemplates(planRes.data.templates || [])
      setVersions(planRes.data.versions || [])

      const phasesData = planRes.data.phases || []
      if (phasesData.length > 0) {
        const mapped = phasesData.map((p) => mapPhaseFromApi(p))
        setPhases(mapped)
      } else {
        setPhases([])
      }

      setUsers(usersRes.data.users || [])
    }).catch((e) => {
      console.error(e)
      toast.error('Failed to load plan data')
    }).finally(() => setLoading(false))
  }, [pid])

  function mapPhaseFromApi(p) {
    const subs = (p.submodules || []).map((s) => ({
      ...s,
      key: s.id || `new_${Math.random().toString(36).slice(2, 8)}`,
    }))
    return {
      ...p,
      key: p.id || `new_${Math.random().toString(36).slice(2, 8)}`,
      submodules: subs,
    }
  }

  function addPhase() {
    setPhases([...phases, {
      key: `new_${Math.random().toString(36).slice(2, 8)}`,
      name: '', order: phases.length, status: 'Pending',
      deliverable: '', start_date: null, end_date: null,
      owner_id: null, owner_name: null, weight: 0, milestone_flag: false,
      plan_version: planVersion, progress: 0,
      tasks: [], submodules: [],
    }])
  }

  function addSubmodule(phaseIdx) {
    const updated = [...phases]
    const sm = {
      key: `new_${Math.random().toString(36).slice(2, 8)}`,
      name: '', order: updated[phaseIdx].submodules.length,
      deliverable: updated[phaseIdx].deliverable || '',
      start_date: null, end_date: null, owner_id: null,
      support_ids: [], effort_days: null, dependency_id: null,
      milestone_flag: false, status: 'Pending', progress: 0,
    }
    updated[phaseIdx] = { ...updated[phaseIdx], submodules: [...updated[phaseIdx].submodules, sm] }
    setPhases(updated)
  }

  function updatePhase(i, field, value) {
    const updated = [...phases]
    updated[i] = { ...updated[i], [field]: value }
    setPhases(updated)
  }

  function updateSubmodule(pi, si, field, value) {
    const updated = [...phases]
    const subs = [...updated[pi].submodules]
    subs[si] = { ...subs[si], [field]: value }
    updated[pi] = { ...updated[pi], submodules: subs }
    setPhases(updated)
  }

  function removePhase(i) {
    if (!window.confirm('Remove this module and all its submodules?')) return
    setPhases(phases.filter((_, idx) => idx !== i))
  }

  function removeSubmodule(pi, si) {
    const updated = [...phases]
    updated[pi] = { ...updated[pi], submodules: updated[pi].submodules.filter((_, idx) => idx !== si) }
    setPhases(updated)
  }

  function loadTemplate(tmpl) {
    const mapped = (tmpl.modules || []).map((m, i) => ({
      key: `tmpl_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name: m.name, order: i, status: 'Pending',
      deliverable: m.deliverable || '',
      start_date: null, end_date: null, owner_id: null, owner_name: null,
      weight: 0, milestone_flag: false, plan_version: planVersion, progress: 0,
      tasks: [], submodules: (m.submodules || []).map((sm, j) => ({
        key: `tmpl_sm_${i}_${j}_${Math.random().toString(36).slice(2, 6)}`,
        name: sm.name, order: j,
        deliverable: sm.default_deliverable || m.deliverable || '',
        start_date: null, end_date: null, owner_id: null, support_ids: [],
        effort_days: null, dependency_id: null, milestone_flag: false,
        status: 'Pending', progress: 0,
      })),
    }))
    setPhases(mapped)
    toast.success(`Loaded ${tmpl.name}`)
  }

  function getPhasePayload() {
    return phases.map((p) => ({
      name: p.name, deliverable: p.deliverable,
      start_date: p.start_date || null, end_date: p.end_date || null,
      owner_id: p.owner_id, weight: p.weight, milestone_flag: p.milestone_flag,
      submodules: p.submodules.map((s) => ({
        name: s.name, deliverable: s.deliverable,
        start_date: s.start_date || null, end_date: s.end_date || null,
        owner_id: s.owner_id, support_ids: s.support_ids || [],
        effort_days: s.effort_days, dependency_id: s.dependency_id,
        milestone_flag: s.milestone_flag,
      })),
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.post(`/plan-builder/projects/${pid}/plan/save`, { phases: getPhasePayload() })
      toast.success('Plan saved as draft')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleValidate() {
    try {
      setShowValidation(true)
      const res = await api.post(`/plan-builder/projects/${pid}/plan/validate`, { phases: getPhasePayload() })
      setValidationResult(res.data)
    } catch (e) {
      toast.error('Validation failed')
    }
  }

  async function handlePublish() {
    setSaving(true)
    try {
      const res = await api.post(`/plan-builder/projects/${pid}/plan/publish`, {
        phases: getPhasePayload(),
        change_summary: changeLog || `Plan v${planVersion + 1} published`,
      })
      toast.success(res.data.message)
      setPlanVersion(res.data.version)
      setPlanGenerated(true)
      setPhases(res.data.phases.map(mapPhaseFromApi))
      setShowPublishConfirm(false)
      setChangeLog('')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  async function loadBaseline() {
    try {
      const res = await api.get(`/plan-builder/projects/${pid}/plan/baseline`)
      setBaselineView(res.data)
    } catch (e) {
      toast.error('Failed to load baseline')
    }
  }

  function toggleModule(key) {
    setExpandedModules((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const totalWeight = phases.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/projects/${pid}`} className="text-blue-600 hover:underline text-sm">&larr; Back to Project</Link>
          <h1 className="text-2xl font-bold mt-1">Project Plan Builder</h1>
          {project && <p className="text-gray-500 text-sm">{project.proj_id} &mdash; {project.title}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${planGenerated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {planGenerated ? `v${planVersion} Generated` : 'Not Generated'}
          </span>
          <button onClick={() => setShowVersions(!showVersions)} className="text-sm text-blue-600 hover:underline">
            {showVersions ? 'Hide' : 'Show'} Versions ({versions.length})
          </button>
        </div>
      </div>

      {/* Versions Panel */}
      {showVersions && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border max-h-64 overflow-y-auto">
          <h3 className="font-semibold mb-2">Plan Versions</h3>
          {versions.length === 0 ? <p className="text-gray-400 text-sm">No versions yet</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th className="pb-2">Version</th><th className="pb-2">Summary</th><th className="pb-2">Baseline</th><th className="pb-2">Date</th></tr></thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="py-1 font-mono">v{v.version_number}</td>
                    <td className="py-1">{v.change_summary}</td>
                    <td className="py-1">{v.is_baseline ? <span className="text-green-600 font-semibold">&check; Baseline</span> : ''}</td>
                    <td className="py-1 text-gray-400">{v.created_at ? new Date(v.created_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Template Selector */}
      {!planGenerated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <label className="font-semibold block mb-2">Load Template:</label>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button key={t.id} onClick={() => loadTemplate(t)}
                className="px-4 py-2 bg-white border rounded-lg hover:bg-blue-100 text-sm font-medium">
                {t.name}
              </button>
            ))}
            {phases.length === 0 && (
              <button onClick={addPhase}
                className="px-4 py-2 bg-white border border-dashed rounded-lg hover:bg-gray-100 text-sm text-gray-500">
                + Start from Scratch
              </button>
            )}
          </div>
        </div>
      )}

      {/* Baseline Comparison */}
      <div className="mb-4">
        <button onClick={loadBaseline} className="text-sm text-blue-600 hover:underline">
          View Baseline vs Actual
        </button>
      </div>
      {baselineView && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Baseline vs Actual (Baseline v{baselineView.baseline_version})</h3>
            <button onClick={() => setBaselineView(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          {!baselineView.has_baseline ? <p className="text-gray-400 text-sm">{baselineView.message}</p> : (
            <div className="space-y-4">
              {(baselineView.comparison || []).map((mod, i) => (
                <div key={i} className="border-b pb-3">
                  <div className="font-medium">{mod.name}</div>
                  <div className="text-xs text-gray-500">
                    Baseline: {mod.baseline_start || '?'} &rarr; {mod.baseline_end || '?'}
                    {mod.variance_days !== null && <span className={`ml-2 ${mod.variance_days > 0 ? 'text-red-500' : 'text-green-500'}`}>({mod.variance_days > 0 ? '+' : ''}{mod.variance_days}d)</span>}
                  </div>
                  {(mod.submodules || []).map((sm, j) => (
                    <div key={j} className="ml-4 text-xs text-gray-600 flex gap-4">
                      <span>{sm.name}</span>
                      <span>Baseline end: {sm.baseline_end || '?'}</span>
                      <span>Actual end: {sm.actual_end || 'N/A'}</span>
                      {sm.variance_days !== null && <span className={sm.variance_days > 0 ? 'text-red-500' : 'text-green-500'}>{sm.variance_days > 0 ? '+' : ''}{sm.variance_days}d</span>}
                      <span className={sm.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}>{sm.status}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={addPhase} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Add Module
        </button>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button onClick={handleValidate}
          className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 text-sm font-medium">
          Validate Plan
        </button>
        <button onClick={() => setShowPublishConfirm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
          Publish Plan
        </button>
      </div>

      {/* Validation Panel */}
      {showValidation && validationResult && (
        <div className={`rounded-lg p-4 mb-4 border ${validationResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex justify-between items-center">
            <span className="font-semibold">{validationResult.valid ? 'Validation Passed' : 'Validation Failed'}</span>
            <button onClick={() => setShowValidation(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <p className="text-sm mt-1">Total weight: {validationResult.total_weight}%</p>
          {validationResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 list-disc pl-5">
              {validationResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          {validationResult.warnings.length > 0 && (
            <ul className="mt-2 text-sm text-amber-600 list-disc pl-5">
              {validationResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Modules Grid */}
      {phases.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No modules defined yet.</p>
          <p className="text-sm mt-1">Load a template or click "+ Add Module" to start building your plan.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {phases.map((phase, pi) => {
            const isExpanded = expandedModules[phase.key] ?? true
            return (
              <div key={phase.key} className="bg-white border rounded-xl shadow-sm">
                {/* Module Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-gray-50 rounded-t-xl">
                  <button onClick={() => toggleModule(phase.key)} className="text-gray-400 hover:text-gray-600">
                    {isExpanded ? '\u25BC' : '\u25B6'}
                  </button>
                  <span className="text-xs text-gray-400 font-mono w-6">M{pi + 1}</span>
                  <input
                    type="text" placeholder="Module Name" value={phase.name}
                    onChange={(e) => updatePhase(pi, 'name', e.target.value)}
                    className="flex-1 font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-2 py-1"
                  />
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-gray-500">Weight:</label>
                    <input
                      type="number" min="0" max="100" step="0.5"
                      value={phase.weight || ''}
                      onChange={(e) => updatePhase(pi, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-16 border rounded px-2 py-1 text-center"
                    />%
                  </div>
                  <label className="flex items-center gap-1 text-sm text-gray-500">
                    <input type="checkbox" checked={phase.milestone_flag || false} onChange={(e) => updatePhase(pi, 'milestone_flag', e.target.checked)} />
                    Milestone
                  </label>
                  <button onClick={() => removePhase(pi)} className="text-red-400 hover:text-red-600 text-xl leading-none">&times;</button>
                </div>

                {isExpanded && (
                  <div className="p-4">
                    {/* Module metadata row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Deliverable</label>
                        <input type="text" value={phase.deliverable || ''}
                          onChange={(e) => updatePhase(pi, 'deliverable', e.target.value)}
                          className="w-full border rounded px-2 py-1" placeholder="Deliverable" />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Start Date</label>
                        <input type="date" value={phase.start_date || ''}
                          onChange={(e) => updatePhase(pi, 'start_date', e.target.value)}
                          className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">End Date</label>
                        <input type="date" value={phase.end_date || ''}
                          onChange={(e) => updatePhase(pi, 'end_date', e.target.value)}
                          className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Owner</label>
                        <select value={phase.owner_id || ''}
                          onChange={(e) => updatePhase(pi, 'owner_id', parseInt(e.target.value) || null)}
                          className="w-full border rounded px-2 py-1">
                          <option value="">Unassigned</option>
                          {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Submodules Grid */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-left text-gray-500 text-xs">
                            <th className="p-2 font-medium">#</th>
                            <th className="p-2 font-medium min-w-[180px]">Submodule</th>
                            <th className="p-2 font-medium min-w-[150px]">Deliverable</th>
                            <th className="p-2 font-medium">Start</th>
                            <th className="p-2 font-medium">End</th>
                            <th className="p-2 font-medium">Owner</th>
                            <th className="p-2 font-medium">Support</th>
                            <th className="p-2 font-medium">Effort (days)</th>
                            <th className="p-2 font-medium">Dependency</th>
                            <th className="p-2 font-medium">Milestone</th>
                            <th className="p-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {phase.submodules.map((sm, si) => (
                            <tr key={sm.key} className="border-t hover:bg-gray-50">
                              <td className="p-2 text-gray-400 font-mono text-xs">{si + 1}</td>
                              <td className="p-2">
                                <input type="text" value={sm.name}
                                  onChange={(e) => updateSubmodule(pi, si, 'name', e.target.value)}
                                  className="w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5 bg-transparent"
                                  placeholder="Submodule name" />
                              </td>
                              <td className="p-2">
                                <input type="text" value={sm.deliverable || ''}
                                  onChange={(e) => updateSubmodule(pi, si, 'deliverable', e.target.value)}
                                  className="w-full border rounded px-1 py-0.5 text-xs" />
                              </td>
                              <td className="p-2">
                                <input type="date" value={sm.start_date || ''}
                                  onChange={(e) => updateSubmodule(pi, si, 'start_date', e.target.value)}
                                  className="w-full border rounded px-1 py-0.5 text-xs" />
                              </td>
                              <td className="p-2">
                                <input type="date" value={sm.end_date || ''}
                                  onChange={(e) => updateSubmodule(pi, si, 'end_date', e.target.value)}
                                  className="w-full border rounded px-1 py-0.5 text-xs" />
                              </td>
                              <td className="p-2">
                                <select value={sm.owner_id || ''}
                                  onChange={(e) => updateSubmodule(pi, si, 'owner_id', parseInt(e.target.value) || null)}
                                  className="w-full border rounded px-1 py-0.5 text-xs">
                                  <option value="">Unassigned</option>
                                  {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </select>
                              </td>
                              <td className="p-2">
                                <select multiple value={sm.support_ids || []}
                                  onChange={(e) => updateSubmodule(pi, si, 'support_ids',
                                    Array.from(e.target.selectedOptions, (o) => parseInt(o.value)))}
                                  className="w-full border rounded px-1 py-0.5 text-xs max-h-[60px]">
                                  {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </select>
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" step="0.5" value={sm.effort_days ?? ''}
                                  onChange={(e) => updateSubmodule(pi, si, 'effort_days', parseFloat(e.target.value) || null)}
                                  className="w-16 border rounded px-1 py-0.5 text-xs" />
                              </td>
                              <td className="p-2">
                                <select value={sm.dependency_id || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    updateSubmodule(pi, si, 'dependency_id', val ? parseInt(val) : null)
                                  }}
                                  className="w-full border rounded px-1 py-0.5 text-xs max-w-[100px]">
                                  <option value="">None</option>
                                  {phase.submodules.map((s, sj) => (
                                    sj !== si ? <option key={s.key} value={sj}>{sj + 1}. {s.name}</option> : null
                                  ))}
                                </select>
                              </td>
                              <td className="p-2 text-center">
                                <input type="checkbox" checked={sm.milestone_flag || false}
                                  onChange={(e) => updateSubmodule(pi, si, 'milestone_flag', e.target.checked)} />
                              </td>
                              <td className="p-2">
                                <button onClick={() => removeSubmodule(pi, si)} className="text-red-400 hover:text-red-600">&times;</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={() => addSubmodule(pi)}
                      className="mt-2 px-3 py-1 text-sm text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50">
                      + Add Submodule
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Weight Summary */}
      {phases.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-sm flex items-center justify-between">
          <span>Total Module Weight: <strong className={Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}>{totalWeight.toFixed(1)}%</strong> {Math.abs(totalWeight - 100) >= 0.01 && '(should be 100%)'}</span>
          <span>{phases.length} module(s), {phases.reduce((s, p) => s + p.submodules.length, 0)} submodule(s)</span>
        </div>
      )}

      {/* Publish Confirmation Dialog */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-3">Publish Plan v{planVersion + 1}</h3>
            <p className="text-sm text-gray-600 mb-3">This will save the plan and auto-create tasks for all submodules. Team members will be notified.</p>
            <label className="block text-sm font-medium mb-1">Change Summary</label>
            <textarea value={changeLog} onChange={(e) => setChangeLog(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4" rows={3} placeholder="Describe what changed in this version..." />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowPublishConfirm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handlePublish} disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
