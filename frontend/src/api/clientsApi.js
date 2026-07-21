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
