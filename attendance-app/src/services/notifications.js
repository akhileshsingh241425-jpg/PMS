import {Platform} from 'react-native'
import api from './api'

let messaging = null
try {
  messaging = require('@react-native-firebase/messaging').default
} catch {}

function isFirebaseAvailable() {
  try {
    return !!messaging && typeof messaging === 'function'
  } catch {
    return false
  }
}

export async function requestPermission() {
  if (!isFirebaseAvailable()) return false
  try {
    const auth = await messaging().requestPermission()
    return auth === 1 || auth === 2
  } catch {
    return false
  }
}

export async function getToken() {
  if (!isFirebaseAvailable()) return null
  try {
    return await messaging().getToken()
  } catch {
    return null
  }
}

export async function registerDeviceToken() {
  const token = await getToken()
  if (!token) return
  try {
    await api.post('/api/push/register-token', {token, platform: Platform.OS})
  } catch {}
}

export async function unregisterDeviceToken() {
  try {
    const token = await getToken()
    if (token) await api.post('/api/push/unregister-token', {token})
  } catch {}
}

export function setupForegroundHandler(handler) {
  if (!isFirebaseAvailable()) return null
  try {
    return messaging().onMessage(async remoteMessage => {
      if (handler) handler(remoteMessage)
    })
  } catch {
    return null
  }
}

export function setupBackgroundHandler() {
  if (!isFirebaseAvailable()) return
  try {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      return Promise.resolve()
    })
  } catch {}
}

export function setupNotificationOpenedHandler(navigationRef) {
  if (!isFirebaseAvailable()) return
  try {
    messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotificationData(remoteMessage.data, navigationRef)
    })
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        setTimeout(() => handleNotificationData(remoteMessage.data, navigationRef), 500)
      }
    })
  } catch {}
}

function handleNotificationData(data, navigationRef) {
  if (!data || !navigationRef?.current) return
  const {module_type, module_id} = data
  if (module_type === 'task' && module_id) {
    navigationRef.current.navigate('Tasks', {screen: 'TaskDetail', params: {taskId: Number(module_id)}})
  } else if (module_type === 'meeting' && module_id) {
    navigationRef.current.navigate('More', {screen: 'Meetings'})
  } else if (module_type === 'attendance') {
    navigationRef.current.navigate('Dashboard')
  }
}
