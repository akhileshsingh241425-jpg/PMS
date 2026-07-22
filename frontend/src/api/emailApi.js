import api from '../services/api'

export async function connectEmail() { const r = await api.get('/api/email/connect'); return r.data }
export async function fetchEmails() { const r = await api.post('/api/email/fetch'); return r.data }
export async function listAccounts() { const r = await api.get('/api/email/accounts'); return r.data }
export async function disconnectAccount(id) { const r = await api.delete(`/api/email/accounts/${id}`); return r.data }
export async function listMessages(params = {}) { const r = await api.get('/api/email/messages', { params }); return r.data }
export async function markRead(id) { const r = await api.put(`/api/email/messages/${id}/read`); return r.data }
export async function categorizeMessage(id, category) { const r = await api.put(`/api/email/messages/${id}/categorize`, { category }); return r.data }
export async function assignMessage(id, assignedToId) { const r = await api.put(`/api/email/messages/${id}/assign`, { assigned_to_id: assignedToId }); return r.data }
export async function updateStatus(id, status) { const r = await api.put(`/api/email/messages/${id}/status`, { status }); return r.data }
export async function setPriority(id, priority) { const r = await api.put(`/api/email/messages/${id}/priority`, { priority }); return r.data }
export async function setTags(id, tags) { const r = await api.put(`/api/email/messages/${id}/tags`, { tags }); return r.data }
export async function snoozeMessage(id, snoozeAt) { const r = await api.put(`/api/email/messages/${id}/snooze`, { snooze_at: snoozeAt }); return r.data }
export async function listNotes(id) { const r = await api.get(`/api/email/messages/${id}/notes`); return r.data }
export async function addNote(id, note) { const r = await api.post(`/api/email/messages/${id}/notes`, { note }); return r.data }
export async function listActivities(id) { const r = await api.get(`/api/email/messages/${id}/activities`); return r.data }
export async function listRules() { const r = await api.get('/api/email/rules'); return r.data }
export async function createRule(data) { const r = await api.post('/api/email/rules', data); return r.data }
export async function updateRule(id, data) { const r = await api.put(`/api/email/rules/${id}`, data); return r.data }
export async function deleteRule(id) { const r = await api.delete(`/api/email/rules/${id}`); return r.data }
export async function listTags() { const r = await api.get('/api/email/tags'); return r.data }
export async function getDashboard() { const r = await api.get('/api/email/dashboard'); return r.data }
export async function getKanban() { const r = await api.get('/api/email/kanban'); return r.data }
export async function getCustomerProfile(id) { const r = await api.get(`/api/email/messages/${id}/profile`); return r.data }
export async function checkDuplicate(id) { const r = await api.get(`/api/email/messages/${id}/check-duplicate`); return r.data }
export async function createFollowup(id, followupAt, note) { const r = await api.post(`/api/email/messages/${id}/followup`, { followup_at: followupAt, note }); return r.data }
export async function getFollowups() { const r = await api.get('/api/email/followups'); return r.data }
export async function markFollowupDone(id) { const r = await api.put(`/api/email/followups/${id}/done`); return r.data }
export async function escalate() { const r = await api.post('/api/email/escalate'); return r.data }
export async function listTemplates() { const r = await api.get('/api/email/templates'); return r.data }
export async function createTemplate(data) { const r = await api.post('/api/email/templates', data); return r.data }
export async function updateTemplate(id, data) { const r = await api.put(`/api/email/templates/${id}`, data); return r.data }
export async function deleteTemplate(id) { const r = await api.delete(`/api/email/templates/${id}`); return r.data }
export async function getNotifications() { const r = await api.get('/api/email/notifications'); return r.data }
