import api from '../services/api'

export async function fetchClients(params = {}) {
  const res = await api.get('/api/clients', { params })
  return res.data
}

export async function fetchClientSummary() {
  const res = await api.get('/api/clients/summary')
  return res.data
}

export async function fetchClient(id) {
  const res = await api.get(`/api/clients/${id}`)
  return res.data
}

export async function createClient(data) {
  const res = await api.post('/api/clients', data)
  return res.data
}

export async function updateClient(id, data) {
  const res = await api.patch(`/api/clients/${id}`, data)
  return res.data
}

export async function deleteClient(id) {
  const res = await api.delete(`/api/clients/${id}`)
  return res.data
}

export async function checkDuplicate(params) {
  const res = await api.get('/api/clients/check-duplicate', { params })
  return res.data
}

export async function exportClients(params = {}) {
  const res = await api.get('/api/clients/export', { params, responseType: 'blob' })
  return res.data
}

export async function exportClient(id) {
  const res = await api.get(`/api/clients/${id}/export`, { responseType: 'blob' })
  return res.data
}

export async function fetchClientContacts(cid) {
  const res = await api.get(`/api/clients/${cid}/contacts`)
  return res.data
}

export async function createClientContact(cid, data) {
  const res = await api.post(`/api/clients/${cid}/contacts`, data)
  return res.data
}

export async function updateClientContact(cid, coid, data) {
  const res = await api.put(`/api/clients/${cid}/contacts/${coid}`, data)
  return res.data
}

export async function deleteClientContact(cid, coid) {
  const res = await api.delete(`/api/clients/${cid}/contacts/${coid}`)
  return res.data
}

export async function fetchClientRemarks(cid) {
  const res = await api.get(`/api/clients/${cid}/remarks`)
  return res.data
}

export async function createClientRemark(cid, data) {
  const res = await api.post(`/api/clients/${cid}/remarks`, data)
  return res.data
}

export async function updateClientRemark(cid, rid, data) {
  const res = await api.put(`/api/clients/${cid}/remarks/${rid}`, data)
  return res.data
}

export async function deleteClientRemark(cid, rid) {
  const res = await api.delete(`/api/clients/${cid}/remarks/${rid}`)
  return res.data
}

export async function fetchClientFollowUps(cid) {
  const res = await api.get(`/api/clients/${cid}/follow-ups`)
  return res.data
}

export async function createClientFollowUp(cid, data) {
  const res = await api.post(`/api/clients/${cid}/follow-ups`, data)
  return res.data
}

export async function updateClientFollowUp(cid, fid, data) {
  const res = await api.put(`/api/clients/${cid}/follow-ups/${fid}`, data)
  return res.data
}

export async function completeClientFollowUp(cid, fid, data = {}) {
  const res = await api.post(`/api/clients/${cid}/follow-ups/${fid}/complete`, data)
  return res.data
}

export async function deleteClientFollowUp(cid, fid) {
  const res = await api.delete(`/api/clients/${cid}/follow-ups/${fid}`)
  return res.data
}

export async function fetchClientChangeLogs(cid) {
  const res = await api.get(`/api/clients/${cid}/change-logs`)
  return res.data
}

export async function approveClientChangeLog(cid, lid) {
  const res = await api.post(`/api/clients/${cid}/change-logs/${lid}/approve`)
  return res.data
}

export async function fetchClientReferences(cid) {
  const res = await api.get(`/api/clients/${cid}/references`)
  return res.data
}

export async function createClientReference(cid, data) {
  const res = await api.post(`/api/clients/${cid}/references`, data)
  return res.data
}

export async function deleteClientReference(cid, rid) {
  const res = await api.delete(`/api/clients/${cid}/references/${rid}`)
  return res.data
}
