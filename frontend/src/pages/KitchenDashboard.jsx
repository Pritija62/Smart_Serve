import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { CheckCircle, Clock, Trash2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../services/api'

function KitchenDashboard() {
  const { isLoggedIn, user } = useContext(AuthContext)
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is kitchen staff
  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'kitchen') {
      console.log('❌ Access denied: Not kitchen staff')
    }
  }, [isLoggedIn, user])

  // Fetch orders from backend
  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/kitchen/queue')
      setOrders(response.data)
      console.log('📋 Kitchen queue loaded:', response.data)
    } catch (err) {
      console.error('❌ Error loading orders:', err)
      setError('Failed to load orders.')
      // Fallback orders for testing
      setOrders([
        {
          id: 1,
          tableNumber: 5,
          items: [
            { name: 'Burger', quantity: 2 },
            { name: 'Fries', quantity: 1 },
          ],
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          tableNumber: 3,
          items: [
            { name: 'Pizza', quantity: 1 },
            { name: 'Coke', quantity: 1 },
          ],
          status: 'PREPARING',
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Mark order as ready
  const handleMarkReady = async (orderId) => {
    try {
      console.log('✅ Marking order as ready:', orderId)
      await api.patch(`/kitchen/orders/${orderId}/status`, {
        status: 'READY',
      })
      fetchOrders() // Refresh list
      alert('Order marked as ready!')
    } catch (err) {
      console.error('❌ Error updating order:', err)
      alert('Failed to update order')
    }
  }

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      console.log('❌ Cancelling order:', orderId)
      await api.patch(`/kitchen/orders/${orderId}/status`, {
        status: 'CANCELLED',
      })
      fetchOrders() // Refresh list
      alert('Order cancelled!')
    } catch (err) {
      console.error('❌ Error cancelling order:', err)
      alert('Failed to cancel order')
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

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
      case 'CANCELLED':
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#FF8C00] mb-2">👨‍🍳 Kitchen Dashboard</h1>
        <p className="text-gray-600">
          Active Orders: <span className="font-bold text-[#FF8C00]">{orders.length}</span>
        </p>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 text-lg">No pending orders</p>
          <p className="text-gray-400 text-sm">Great! You're all caught up 🎉</p>
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
              {/* Table Number */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-[#FF8C00]">Table {order.tableNumber}</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
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

              {/* Time */}
              <p className="text-sm text-gray-500 mb-4">
                Order time: {new Date(order.createdAt).toLocaleTimeString()}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status !== 'READY' && order.status !== 'CANCELLED' && (
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
                  Cancel
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