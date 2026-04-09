import axios from 'axios'

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor to add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// auth endpoints

export const loginUser = (email, password) => {
  return api.post('/auth/login', { email, password })
}

export const loginKitchen = (email, password) => {
  return api.post('/auth/kitchen-login', { email, password })
}

export const loginAdmin = (email, password) => {
  return api.post('/auth/admin-login', { email, password })
}

export const getCurrentUser = () => {
  return api.get('/auth/me')
}

// menu endpoints

export const getMenu = () => {
  return api.get('/menu/')
}

export const getTables = () => {
  return api.get('/tables/')
}

export const getMenuItemById = (id) => {
  return api.get(`/menu/${id}`)
}

export const getRecommendations = () => {
  return api.get('/menu/recommendations')
}

// order endpoints

export const createOrder = (orderData) => {
  return api.post('/orders/', orderData)
}

export const trackOrder = (orderId) => {
  return api.get(`/orders/${orderId}/track`)
}

// kitchen endpoints

export const getKitchenQueue = () => {
  return api.get('/kitchen/queue')
}

export const getKitchenQueueByStation = (station) => {
  return api.get(`/kitchen/queue/${station}`)
}

export const updateOrderStatus = (orderId, status) => {
  return api.patch(`/kitchen/orders/${orderId}/status`, { status })
}

// admin endpoints

export const getWeeklySales = () => {
  return api.get('/admin/analytics/weekly-sales')
}

export const getHourlyTrends = () => {
  return api.get('/admin/analytics/hourly-trends')
}

export const getAllOrders = (params = {}) => {
  return api.get('/admin/orders/all', { params })
}

export const getAdminStats = () => {
  return api.get('/admin/stats')
}

export const getTopItems = () => {
  return api.get('/admin/analytics/top-items')
}

// Export the api instance for any custom calls
export default api
