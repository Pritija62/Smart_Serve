import React, { useState, useEffect, useContext, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { CheckCircle, Clock, Trash2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../services/api'


// ✅ add this (you must create socket client file as shown below)
import { socket } from '../services/socket'

function KitchenDashboard() {
  const { isLoggedIn, user } = useContext(AuthContext)
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is kitchen staff
  useEffect(() => {
    if (!isLoggedIn || !['kitchen_staff', 'admin'].includes(user?.role)) {
      console.log('❌ Access denied: Not kitchen staff')
    }
  }, [isLoggedIn, user])

  const mapOrder = (o) => ({
    id: o.id,
    tableNumber: o.table_number,
    status: (o.status || '').toUpperCase(), // pending -> PENDING
    createdAt: o.created_at,
    items: (o.order_items || []).map((oi) => ({
      name: oi.menu_item?.name,
      quantity: oi.quantity,
    })),
  })

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await api.get('/kitchen/queue')
      const mapped = (response.data || []).map(mapOrder)

      setOrders(mapped)
      console.log('📋 Kitchen queue loaded:', mapped)
    } catch (err) {
      console.error('❌ Error loading orders:', err)
      setError('Failed to load orders.')
      // Optional fallback for UI testing only
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch once when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders()
    }
  }, [isLoggedIn, fetchOrders])

useEffect(() => {
  if (!isLoggedIn) return

  const onNewOrder = () => {
    fetchOrders()
  }

  const onOrderStatusUpdated = () => {
    fetchOrders()
  }

  socket.on('new_order', onNewOrder)
  socket.on('order_status_updated', onOrderStatusUpdated)

  return () => {
    socket.off('new_order', onNewOrder)
    socket.off('order_status_updated', onOrderStatusUpdated)
  }
}, [isLoggedIn, fetchOrders])

  // Mark order as ready
  const handleMarkReady = async (orderId) => {
    try {
      console.log('✅ Marking order as ready:', orderId)
      await api.patch(`/kitchen/orders/${orderId}/status`, { status: 'ready' })
      // No need to fetchOrders() because realtime will update,
      // but keep it if you want:
      // fetchOrders()
      alert('Order marked as ready!')
    } catch (err) {
      console.error('❌ Error updating order:', err)
      alert('Failed to update order')
    }
  }

  // Cancel order (MVP backend doesn’t support "cancelled")
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return

    try {
      console.log('❌ Cancelling order:', orderId)

      // ✅ MVP workaround: mark as completed (or remove cancel button)
      await api.patch(`/kitchen/orders/${orderId}/status`, { status: 'completed' })

      alert('Order completed!')
    } catch (err) {
      console.error('❌ Error cancelling/completing order:', err)
      alert('Failed to update order')
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-[#FF8C00] text-white px-6 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-red-100 text-red-800'
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800'
      case 'READY':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
      case 'PREPARING':
        return <Clock size={20} className="text-yellow-600" />
      case 'READY':
        return <CheckCircle size={20} className="text-green-600" />
      default:
        return <Clock size={20} />
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FF8C00] mb-2">Kitchen Dashboard</h1>
        <p className="text-gray-600">
          Active Orders: <span className="font-bold text-[#FF8C00]">{orders.length}</span>
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 text-lg">No pending orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-[#FF8C00]">
                  Table {order.tableNumber}
                </h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Items:</h4>
                <ul className="space-y-2">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-gray-700">
                      <span>{item.name}</span>
                      <span className="font-semibold">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Order time: {new Date(order.createdAt).toLocaleTimeString()}
              </p>

              <div className="flex gap-2">
                {order.status !== 'READY' && order.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleMarkReady(order.id)}
                    className="flex-1 bg-[#008080] hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle size={18} />
                    Ready
                  </button>
                )}
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Trash2 size={18} />
                  Complete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default KitchenDashboard