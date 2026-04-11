import React, { useState, useEffect, useContext } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import { trackOrder } from '../services/api'
import { buildMenuRoute } from '../utils/menuRoute'
import { getTrackedOrdersForTable, upsertTrackedOrder } from '../utils/orderTracking'
import { formatTimeInAppZone } from '../utils/time'
import { 
  Clock, 
  CheckCircle, 
  RefreshCw,
  MapPin,
  Package,
  ChefHat,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { motion } from 'framer-motion'

function TrackingPage() {
  // ===== STATE MANAGEMENT =====
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // ===== CONTEXT & ROUTING =====
  const socketContext = useContext(SocketContext) || {}
  const { socket = null, isConnected = false } = socketContext
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const tableNumber = searchParams.get('table') || localStorage.getItem('tableNumber')
  const menuRoute = buildMenuRoute(tableNumber)
  const [trackedOrders, setTrackedOrders] = useState([])

  // ===== EFFECTS =====

  // Effect 1: Check if orderId passed via URL params
  useEffect(() => {
    const idFromUrl = searchParams.get('orderId') || location.state?.orderId
    if (idFromUrl) {
      setOrderId(idFromUrl)
      if (!tableNumber) {
        fetchOrder(idFromUrl)
      }
    }
  }, [searchParams, location.state, tableNumber])

  // Effect 2: Listen for real-time order updates via Socket.IO
  useEffect(() => {
  if (!socket || !orderId) return

    socket.emit('join_order_room', { orderId: String(orderId) })

  const onOrderStatusUpdated = (payload) => {
    console.log('📨 Real-time update received:', payload)

    const payloadId = payload?.id ?? payload?.orderId ?? payload?.order_id
    const payloadStatus = payload?.status ?? payload?.newStatus ?? payload?.new_status

    if (payloadId == null) return
    if (String(payloadId) !== String(orderId)) return

    // If backend sends the full order, normalize it
    if (payload?.order_items || payload?.table_number || payload?.created_at) {
      const normalizedOrder = normalizeOrder(payload)
      setOrder(normalizedOrder)
      upsertTrackedOrder(normalizedOrder)
      setTrackedOrders(getTrackedOrdersForTable(normalizedOrder.tableNumber || tableNumber))
    } else if (payloadStatus) {
      // Otherwise just patch status
      setOrder((prev) => {
        if (!prev) return prev

        const updatedOrder = { ...prev, status: String(payloadStatus).toUpperCase() }
        upsertTrackedOrder(updatedOrder)
        setTrackedOrders(getTrackedOrdersForTable(updatedOrder.tableNumber || tableNumber))
        return updatedOrder
      })
    }

    setLastUpdated(new Date())
  }

  socket.on('order_status_updated', onOrderStatusUpdated)

  return () => {
    socket.emit('leave_order_room', { orderId: String(orderId) })
    socket.off('order_status_updated', onOrderStatusUpdated)
  }
}, [socket, orderId])

  // Effect 3: Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected)
  }, [isConnected])

  // ===== FUNCTIONS =====

  const normalizeOrder = (rawOrder) => {
    const normalizedStatus = (rawOrder.status || 'PENDING').toString().toUpperCase()

    return {
      orderId: rawOrder.orderId ?? rawOrder.order_id ?? rawOrder.id,
      tableNumber: rawOrder.tableNumber ?? rawOrder.table_number,
      totalPrice: rawOrder.totalPrice ?? rawOrder.total_price,
      status: normalizedStatus,
      createdAt: rawOrder.createdAt ?? rawOrder.created_at,
      estimatedTime: rawOrder.estimatedTime ?? rawOrder.estimated_wait_time,
      waitedTime: rawOrder.waitedTime,
      items:
        rawOrder.items ||
        (rawOrder.order_items || []).map((orderItem) => ({
          name: orderItem.menu_item?.name || 'Item',
          quantity: orderItem.quantity || 1,
        })),
    }
  }

  // Fetch order from backend API
  const fetchOrder = async (id) => {
    try {
      setIsLoading(true)
      setError(null)
      setSearched(true)

      console.log('🔍 Fetching order:', id)

      // Call API to get order details
      const response = await trackOrder(id)

      console.log('✅ Order fetched:', response.data)

      const normalizedOrder = normalizeOrder(response.data)
      setOrder(normalizedOrder)
      upsertTrackedOrder(normalizedOrder)
      setTrackedOrders(getTrackedOrdersForTable(normalizedOrder.tableNumber || tableNumber))
      setLastUpdated(new Date())
    } catch (err) {
      console.error('❌ Error fetching order:', err)
      setError(
        err.response?.data?.error || err.response?.data?.message || 'Order not found. Please check the ID.'
      )
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!tableNumber) {
      setTrackedOrders([])
      return
    }

    const tableOrders = getTrackedOrdersForTable(tableNumber)
    setTrackedOrders(tableOrders)

    const explicitOrderId = searchParams.get('orderId') || location.state?.orderId
    const latestOrder = tableOrders[0]

    if (explicitOrderId) {
      if (String(explicitOrderId) !== String(orderId)) {
        setOrderId(String(explicitOrderId))
        fetchOrder(String(explicitOrderId))
      }
      return
    }

    if (latestOrder && String(latestOrder.orderId) !== String(orderId)) {
      setOrderId(String(latestOrder.orderId))
      fetchOrder(String(latestOrder.orderId))
    }
  }, [tableNumber, searchParams, location.state])

  // Handle search button click
  const handleSearch = (e) => {
    e.preventDefault()

    if (!orderId.trim()) {
      setError('Please enter an Order ID')
      return
    }

    fetchOrder(orderId)
  }

  // Get progress percentage based on status
  const getProgressPercentage = (status) => {
    switch (status) {
      case 'PENDING':
        return 25
      case 'PREPARING':
        return 50
      case 'READY':
        return 100
      case 'COMPLETED':
        return 100
      default:
        return 0
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600'
      case 'PREPARING':
        return 'text-blue-600'
      case 'READY':
        return 'text-green-600'
      case 'COMPLETED':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  // Get status badge color
  const getStatusBgColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800'
      case 'READY':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PREPARING':
        return 'ORDER STARTED'
      default:
        return status
    }
  }

  // Format time
  const formatTime = (dateString) => {
    return formatTimeInAppZone(dateString)
  }

  // ===== RENDER: NO ORDER SECTION =====
  if (!order) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mt-12"
        >
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="mb-3 text-3xl font-bold text-[#FF8C00]">No Order to Track</h1>
            <p className="text-gray-600 mb-6">
              Place an order first, then this page will show your live order status updates.
            </p>
            {error && <p className="mb-6 text-sm text-red-600">{error}</p>}
            <button
              onClick={() => navigate(menuRoute)}
              className="bg-[#008080] hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Go to Menu
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ===== RENDER: ORDER TRACKING SECTION =====
  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8 mt-6">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-[#FF8C00]">
            <MapPin size={28} />
            Order Status
          </h1>
          <button
            onClick={() => {
              const latestOrder = trackedOrders[0]

              if (latestOrder) {
                setOrderId(String(latestOrder.orderId))
                fetchOrder(String(latestOrder.orderId))
                return
              }

              setOrder(null)
              setOrderId('')
              setSearched(false)
              setError(null)
            }}
            className="bg-[#008080] hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
          >
            Show Latest
          </button>
        </div>

        {trackedOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-5 mb-6"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Table {tableNumber} Orders
                </h2>
                <p className="text-sm text-gray-600">
                  New orders are added here automatically.
                </p>
              </div>
              <span className="rounded-full bg-[#008080]/10 px-3 py-1 text-sm font-semibold text-[#008080]">
                {trackedOrders.length} tracked
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {trackedOrders.map((trackedOrder) => (
                <button
                  key={trackedOrder.orderId}
                  type="button"
                  onClick={() => {
                    setOrderId(String(trackedOrder.orderId))
                    fetchOrder(String(trackedOrder.orderId))
                  }}
                  className={`rounded-lg border px-4 py-3 text-left transition hover:border-[#FF8C00] hover:bg-orange-50 ${
                    String(trackedOrder.orderId) === String(orderId)
                      ? 'border-[#FF8C00] bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-800">Order #{trackedOrder.orderId}</p>
                    <span className="text-xs font-semibold text-gray-600">
                      {getStatusLabel(trackedOrder.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Rs {Number(trackedOrder.totalPrice || 0).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Connection Status */}
        <div
          className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg ${
            connectionStatus
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-50 text-gray-700'
          }`}
        >
          <RefreshCw
            size={16}
            className={connectionStatus ? 'text-green-600' : 'text-gray-600'}
          />
          <span className="text-sm font-semibold">
            {connectionStatus ? 'Connected' : 'Disconnected'} - Real-time updates
            {connectionStatus ? 'enabled' : 'via polling'}
          </span>
          {connectionStatus ? <Wifi size={16} className="text-green-600" /> : <WifiOff size={16} className="text-red-600" />}
        </div>

        {/* Order Info Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Order ID */}
            <div>
              <p className="text-gray-600 text-sm">Order ID</p>
              <p className="text-2xl font-bold text-[#FF8C00]">#{order.orderId}</p>
            </div>

            {/* Table Number */}
            <div>
              <p className="text-gray-600 text-sm">Table Number</p>
              <p className="text-2xl font-bold text-[#008080]">{order.tableNumber}</p>
            </div>

            {/* Total Price */}
            <div>
              <p className="text-gray-600 text-sm">Total Price</p>
              <p className="text-2xl font-bold text-gray-800">
                Rs {order.totalPrice}
              </p>
            </div>
          </div>

          {/* Status Badge and Progress */}
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Status:</span>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusBgColor(
                  order.status
                )}`}
              >
                {order.status === 'PENDING' && <Clock size={16} />}
                {order.status === 'PREPARING' && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <ChefHat size={16} />
                  </motion.span>
                )}
                {(order.status === 'READY' || order.status === 'COMPLETED') && (
                  <CheckCircle size={16} />
                )}
                {getStatusLabel(order.status)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Progress</span>
                <span>{getProgressPercentage(order.status)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage(order.status)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-[#FF8C00] to-[#008080] h-full rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* SPECIAL: Order is READY! */}
        {order.status === 'READY' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-8 mb-6 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mb-4 flex justify-center"
            >
              <CheckCircle size={52} className="text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-bold text-green-700 mb-2">
              Your Order is READY!
            </h2>
            <p className="text-green-600 text-lg mb-6">
              Please pick up your order from the counter
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(menuRoute)}
                className="bg-[#FF8C00] hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg"
              >
                Order More
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-[#008080] hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        )}

        {/* Timeline of Order Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-[#FF8C00]" />
            Order Timeline
          </h3>

          {/* Timeline Items */}
          <div className="space-y-4">
            {/* Item 1: Order Received */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <CheckCircle size={24} className="text-green-600" />
                <div className="w-1 h-12 bg-green-300 mt-2"></div>
              </div>
              <div className="pt-1">
                <p className="font-semibold text-gray-800">Order Received</p>
                <p className="text-sm text-gray-600">
                  {formatTime(order.createdAt)}
                </p>
              </div>
            </motion.div>

            {/* Item 2: Order Started (show if PREPARING or later) */}
            {['PREPARING', 'READY', 'COMPLETED'].includes(order.status) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <CheckCircle size={24} className="text-green-600" />
                  <div className="w-1 h-12 bg-green-300 mt-2"></div>
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-800">
                    Order Started
                  </p>
                  <p className="text-sm text-gray-600">
                    ~{formatTime(order.createdAt)} +3 mins
                  </p>
                </div>
              </motion.div>
            )}

            {/* Item 3: Ready for Pickup (show if READY or COMPLETED) */}
            {['READY', 'COMPLETED'].includes(order.status) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-800">Order Ready</p>
                  <p className="text-sm text-gray-600">
                    ~{formatTime(order.createdAt)} +10 mins
                  </p>
                </div>
              </motion.div>
            )}

            {/* Pending state - not yet ready */}
            {order.status === 'PENDING' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-gray-500">Pending Steps</p>
                  <p className="text-sm text-gray-400">
                    Waiting to start preparation...
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Items Ordered */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={20} className="text-[#FF8C00]" />
            Items Ordered
          </h3>

          <div className="space-y-3">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-[#FF8C00] font-bold">
                    × {item.quantity}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500">No items in this order</p>
            )}
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-2"
        >
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Estimated Time:</span> 
            {order.estimatedTime ? ` ${order.estimatedTime} minutes` : ' Will be ready soon'}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Time Waited:</span> 
            {order.waitedTime ? ` ${order.waitedTime} minutes` : ' Just now'}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Last updated: {formatTimeInAppZone(lastUpdated)}
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default TrackingPage