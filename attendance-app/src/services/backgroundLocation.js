import {Platform, PermissionsAndroid, Alert} from 'react-native'
import BackgroundService from 'react-native-background-actions'
import Geolocation from '@react-native-community/geolocation'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from './api'

const INTERVAL = 300000 // 5 min
const LOCATION_CACHE_KEY = 'bg_locations'

const options = {
  taskName: 'Location Tracking',
  taskTitle: 'PMS Attendance',
  taskDesc: 'Tracking location for attendance',
  taskIcon: {name: 'ic_launcher', type: 'mipmap'},
  color: '#5B21B6',
  linkingURI: 'pmsapp://',
  parameters: {delay: INTERVAL},
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function bgTask(taskData) {
  const {delay} = taskData
  await sleep(5000)
  while (BackgroundService.isRunning()) {
    try {
      const pos = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000, maximumAge: delay,
        })
      })
      await cacheLocation({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: new Date().toISOString(),
      })
    } catch {}
    await sleep(delay)
  }
}

async function cacheLocation(loc) {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY)
    const list = raw ? JSON.parse(raw) : []
    list.push(loc)
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(list.slice(-500)))
  } catch {}
}

export async function startTracking() {
  if (Platform.OS === 'android' && Platform.Version >= 23) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      {title: 'Background Location', message: 'We need location access for attendance tracking', buttonPositive: 'Allow'},
    )
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('Permission Denied', 'Background location tracking will not work')
      return false
    }
  }
  await BackgroundService.start(bgTask, options)
  return true
}

export async function stopTracking() {
  await BackgroundService.stop()
}

export async function isTracking() {
  return BackgroundService.isRunning()
}

export async function syncLocations() {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY)
    if (!raw) return
    const list = JSON.parse(raw)
    if (list.length === 0) return
    await api.post('/api/attendance/locations', {locations: list})
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY)
  } catch {}
}

export async function getCachedLocations() {
  const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY)
  return raw ? JSON.parse(raw) : []
}
