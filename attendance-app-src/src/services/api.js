import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
  baseURL: 'http://93.127.194.235:9090',
  timeout: 15000,
})

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('pms_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      AsyncStorage.removeItem('pms_token')
      // Navigate to login handled by AuthContext
    }
    return Promise.reject(err)
  }
)

export default api
