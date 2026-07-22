import api from '../services/api'

export async function connectEmail() {
  const res = await api.get('/api/email/connect')
  return res.data
}

export async function fetchEmails() {
  const res = await api.post('/api/email/fetch')
  return res.data
}

export async function listAccounts() {
  const res = await api.get('/api/email/accounts')
  return res.data
}

export async function disconnectAccount(id) {
  const res = await api.delete(`/api/email/accounts/${id}`)
  return res.data
}

export async function listMessages(params = {}) {
  const res = await api.get('/api/email/messages', { params })
  return res.data
}

export async function markRead(id) {
  const res = await api.put(`/api/email/messages/${id}/read`)
  return res.data
}

export async function categorizeMessage(id, category) {
  const res = await api.put(`/api/email/messages/${id}/categorize`, { category })
  return res.data
}

export async function assignMessage(id, assignedToId, createTask = true) {
  const res = await api.put(`/api/email/messages/${id}/assign`, { assigned_to_id: assignedToId, create_task: createTask })
  return res.data
}

export async function updateStatus(id, status) {
  const res = await api.put(`/api/email/messages/${id}/status`, { status })
  return res.data
}

export async function setPriority(id, priority) {
  const res = await api.put(`/api/email/messages/${id}/priority`, { priority })
  return res.data
}

export async function setTags(id, tags) {
  const res = await api.put(`/api/email/messages/${id}/tags`, { tags })
  return res.data
}

export async function snoozeMessage(id, snoozeAt) {
  const res = await api.put(`/api/email/messages/${id}/snooze`, { snooze_at: snoozeAt })
  return res.data
}

export async function listNotes(id) {
  const res = await api.get(`/api/email/messages/${id}/notes`)
  return res.data
}

export async function addNote(id, note) {
  const res = await api.post(`/api/email/messages/${id}/notes`, { note })
  return res.data
}

export async function listActivities(id) {
  const res = await api.get(`/api/email/messages/${id}/activities`)
  return res.data
}

export async function listRules() {
  const res = await api.get('/api/email/rules')
  return res.data
}

export async function createRule(data) {
  const res = await api.post('/api/email/rules', data)
  return res.data
}

export async function updateRule(id, data) {
  const res = await api.put(`/api/email/rules/${id}`, data)
  return res.data
}

export async function deleteRule(id) {
  const res = await api.delete(`/api/email/rules/${id}`)
  return res.data
}

export async function listTags() {
  const res = await api.get('/api/email/tags')
  return res.data
}
