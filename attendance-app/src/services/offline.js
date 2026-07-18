import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import api from './api'

const CACHE_PREFIX = 'offline_'
const QUEUE_KEY = 'offline_queue'

export async function isOnline() {
  const state = await NetInfo.fetch()
  return state.isConnected && state.isInternetReachable !== false
}

export async function cacheData(key, data) {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data, cached_at: new Date().toISOString(),
    }))
  } catch {}
}

export async function getCachedData(key) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export async function addToQueue(action, payload) {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    const queue = raw ? JSON.parse(raw) : []
    queue.push({action, payload, created_at: new Date().toISOString()})
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {}
}

export async function syncQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    if (!raw) return
    const queue = JSON.parse(raw)
    if (queue.length === 0) return
    const remaining = []
    for (const item of queue) {
      try {
        if (item.action === 'clock-in') await api.post('/api/attendance/clock-in', item.payload)
        else if (item.action === 'clock-out') await api.post('/api/attendance/clock-out', item.payload)
        else if (item.action === 'location') await api.post('/api/attendance/locations', item.payload)
      } catch { remaining.push(item) }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  } catch {}
}

export async function getQueueSize() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw).length : 0
  } catch { return 0 }
}
