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

export async function assignMessage(id, assignedToId) {
  const res = await api.put(`/api/email/messages/${id}/assign`, { assigned_to_id: assignedToId })
  return res.data
}
