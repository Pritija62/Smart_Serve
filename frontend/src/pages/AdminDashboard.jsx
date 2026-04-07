import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  BarChart3,
  Clock3,
  DollarSign,
  LogOut,
  Package,
  TrendingUp,
} from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { getAdminStats, getAllOrders, getTopItems } from '../services/api'

const MOCK_STATS = {
  totalSales: 22500,
  salesChange: 20,
  totalOrders: 78,
  ordersChange: 15,
  avgOrderValue: 288,
  avgChange: -5,
  busiestHour: '7:00 PM',
  busiestOrderCount: 32,
}

const MOCK_RECENT_ORDERS = [
  {
    id: 245,
    tableNumber: 12,
    items: 'Burger×2, Fries×1',
    status: 'COMPLETED',
    totalPrice: 300,
    time: '7:45 PM',
  },
  {
    id: 244,
    tableNumber: 5,
    items: 'Pizza×1, Coke×2',
    status: 'PREPARING',
    totalPrice: 260,
    time: '7:30 PM',
  },
  {
    id: 243,
    tableNumber: 2,
    items: 'Pasta×1',
    status: 'PENDING',
    totalPrice: 180,
    time: '7:15 PM',
  },
]

const formatTime = (isoTime) => {
  if (!isoTime) return 'N/A'
  const parsed = new Date(isoTime)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useContext(AuthContext)
  const [stats, setStats] = useState(MOCK_STATS)
  const [recentOrders, setRecentOrders] = useState(MOCK_RECENT_ORDERS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const parseHourlyTrendsToStats = (trendsResponse = []) => {
    if (!Array.isArray(trendsResponse) || trendsResponse.length === 0) {
      return {}
    }

    const currentHour = new Date().getHours()
    const currentHourCount = trendsResponse.find((entry) => Number(entry.hour) === currentHour)?.order_count || 0
    const previousHourCount = trendsResponse.find((entry) => Number(entry.hour) === currentHour - 1)?.order_count || 0

    const busiestEntry = trendsResponse.reduce((max, current) => {
      if ((current.order_count || 0) > (max.order_count || 0)) {
        return current
      }
      return max
    }, trendsResponse[0])

    const busiestHourLabel = (() => {
      const hour = Number(busiestEntry.hour)
      const hour12 = hour % 12 || 12
      const suffix = hour >= 12 ? 'PM' : 'AM'
      return `${hour12}:00 ${suffix}`
    })()

    return {
      totalOrders: trendsResponse.reduce((sum, row) => sum + (row.order_count || 0), 0),
      ordersChange:
        previousHourCount > 0
          ? Math.round(((currentHourCount - previousHourCount) / previousHourCount) * 100)
          : 0,
      busiestHour: busiestHourLabel,
      busiestOrderCount: busiestEntry.order_count || 0,
    }
  }

  const normalizeOrder = (order) => {
    const orderItems = order.order_items || order.items || []
    const itemsText =
      orderItems.length > 0
        ? orderItems
            .map((item) => `${item.menu_item?.name || item.name || 'Item'}×${item.quantity || 1}`)
            .join(', ')
        : 'No items'

    return {
      id: order.id,
      tableNumber: order.tableNumber || order.table_number || '-',
      items: itemsText,
      status: (order.status || 'PENDING').toString().toUpperCase(),
      totalPrice: order.totalPrice || order.total_price || 0,
      time: formatTime(order.createdAt || order.created_at),
    }
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsResponse, ordersResponse, topItemsResponse] = await Promise.all([
        getAdminStats(),
        getAllOrders(),
        getTopItems(),
      ])

      const statsData = statsResponse?.data || {}
      const topItemsData = topItemsResponse?.data || []
      const normalizedOrders = Array.isArray(ordersResponse?.data)
        ? ordersResponse.data.map(normalizeOrder).slice(0, 3)
        : []

      const computedStats = {
        totalSales: Number(statsData.totalSales || statsData.total_sales || MOCK_STATS.totalSales),
        salesChange: Number(statsData.salesChange || statsData.sales_change || MOCK_STATS.salesChange),
        totalOrders: Number(statsData.totalOrders || statsData.total_orders || MOCK_STATS.totalOrders),
        ordersChange: Number(statsData.ordersChange || statsData.orders_change || MOCK_STATS.ordersChange),
        avgOrderValue: Number(
          statsData.avgOrderValue || statsData.avg_order_value || MOCK_STATS.avgOrderValue
        ),
        avgChange: Number(statsData.avgChange || statsData.avg_change || MOCK_STATS.avgChange),
        busiestHour: statsData.busiestHour || statsData.busiest_hour || MOCK_STATS.busiestHour,
        busiestOrderCount: Number(
          statsData.busiestOrderCount || statsData.busiest_order_count || MOCK_STATS.busiestOrderCount
        ),
      }

      // If /admin/stats is unavailable, infer a few values from available analytics response.
      const inferredFromTrends = parseHourlyTrendsToStats(topItemsData)

      setStats({ ...computedStats, ...inferredFromTrends })
      setRecentOrders(normalizedOrders.length > 0 ? normalizedOrders : MOCK_RECENT_ORDERS)
      setError(null)
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)
      setError('Live admin data unavailable. Showing sample dashboard data.')
      setStats(MOCK_STATS)
      setRecentOrders(MOCK_RECENT_ORDERS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => clearInterval(intervalId)
  }, [fetchDashboardData])

  const statCards = useMemo(
    () => [
      {
        key: 'sales',
        icon: DollarSign,
        label: 'Total Sales (Today)',
        value: `Rs ${stats.totalSales.toLocaleString()}`,
        change: stats.salesChange,
      },
      {
        key: 'orders',
        icon: Package,
        label: 'Total Orders (Today)',
        value: stats.totalOrders,
        change: stats.ordersChange,
      },
      {
        key: 'avg',
        icon: TrendingUp,
        label: 'Average Order Value',
        value: `Rs ${stats.avgOrderValue.toLocaleString()}`,
        change: stats.avgChange,
      },
      {
        key: 'busiest',
        icon: Clock3,
        label: 'Busiest Hour',
        value: stats.busiestHour,
        secondary: `${stats.busiestOrderCount} orders`,
      },
    ],
    [stats]
  )

  const getStatusBadgeClass = (status) => {
    if (status === 'COMPLETED' || status === 'READY') {
      return 'bg-green-100 text-green-700'
    }
    if (status === 'PREPARING') {
      return 'bg-orange-100 text-orange-700'
    }
    if (status === 'PENDING') {
      return 'bg-yellow-100 text-yellow-700'
    }
    return 'bg-gray-100 text-gray-700'
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-lg bg-white p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-[#FF8C00] md:text-4xl">
              <BarChart3 size={32} />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              Welcome, <span className="font-semibold text-gray-800">{user?.username || 'Admin'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008080] px-4 py-2.5 font-semibold text-white transition hover:bg-teal-700"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {statCards.map((card) => {
            const Icon = card.icon
            const isPositive = typeof card.change === 'number' ? card.change >= 0 : null

            return (
              <motion.div
                key={card.key}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0 },
                }}
                className="rounded-lg bg-white p-5 shadow-lg"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="text-[#FF8C00]" size={20} />
                  </div>
                  <p className="text-xs text-gray-500">vs yesterday</p>
                </div>

                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">{card.value}</p>

                {typeof card.change === 'number' ? (
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isPositive ? '↑' : '↓'} {Math.abs(card.change)}%
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-gray-600">{card.secondary}</p>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        <div className="mt-6 rounded-lg bg-white p-5 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/analytics"
              className="rounded-lg bg-[#FF8C00] px-4 py-2.5 text-center font-semibold text-white transition hover:bg-orange-600"
            >
              View Analytics
            </Link>
            <Link
              to="/admin/orders"
              className="rounded-lg bg-[#008080] px-4 py-2.5 text-center font-semibold text-white transition hover:bg-teal-700"
            >
              All Orders
            </Link>
            <button
              type="button"
              className="rounded-lg bg-gray-100 px-4 py-2.5 text-center font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Inventory
            </button>
            <button
              type="button"
              className="rounded-lg bg-gray-100 px-4 py-2.5 text-center font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Staff Management
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-[#008080] hover:text-teal-700">
              View All Orders
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm sm:grid-cols-5 sm:items-center"
              >
                <p className="font-semibold text-gray-800">#{order.id}</p>
                <p className="text-gray-700">Table {order.tableNumber}</p>
                <p className="text-gray-700 sm:col-span-2">{order.items}</p>
                <div className="flex items-center justify-between sm:justify-end sm:gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-gray-500">{order.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard