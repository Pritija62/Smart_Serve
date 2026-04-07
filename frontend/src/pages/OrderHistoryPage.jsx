import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Search,
  Timer,
  ListTodo,
  X,
  XCircle,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { getAllOrders } from '../services/api'

const PAGE_SIZE = 50

const MOCK_ORDERS = [
  {
    id: 245,
    tableNumber: 12,
    items: [
      { name: 'Burger', quantity: 2 },
      { name: 'Fries', quantity: 1 },
    ],
    status: 'COMPLETED',
    totalPrice: 300,
    createdAt: '2026-04-06T19:45:00Z',
    startedAt: '2026-04-06T19:48:00Z',
    readyAt: '2026-04-06T19:56:00Z',
    completedAt: '2026-04-06T20:00:00Z',
  },
  {
    id: 244,
    tableNumber: 8,
    items: [{ name: 'Pizza', quantity: 1 }],
    status: 'COMPLETED',
    totalPrice: 200,
    createdAt: '2026-04-06T19:30:00Z',
    startedAt: '2026-04-06T19:34:00Z',
    readyAt: '2026-04-06T19:41:00Z',
    completedAt: '2026-04-06T19:45:00Z',
  },
  {
    id: 243,
    tableNumber: 5,
    items: [
      { name: 'Coke', quantity: 2 },
      { name: 'Fries', quantity: 1 },
    ],
    status: 'PREPARING',
    totalPrice: 110,
    createdAt: '2026-04-06T19:20:00Z',
    startedAt: '2026-04-06T19:24:00Z',
    readyAt: null,
    completedAt: null,
  },
]

const statusConfig = {
  COMPLETED: {
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700',
    label: 'COMPLETED',
  },
  PENDING: {
    icon: Clock3,
    className: 'bg-yellow-100 text-yellow-700',
    label: 'PENDING',
  },
  PREPARING: {
    icon: ChefHat,
    className: 'bg-blue-100 text-blue-700',
    label: 'PREPARING',
  },
  READY: {
    icon: Timer,
    className: 'bg-orange-100 text-orange-700',
    label: 'READY',
  },
  CANCELLED: {
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
    label: 'CANCELLED',
  },
}

const formatTime = (iso) => {
  if (!iso) return '--'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const isInDateFilter = (iso, dateFilter) => {
  if (dateFilter === 'All') return true
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  if (dateFilter === 'Today') {
    return date >= startOfToday
  }

  if (dateFilter === 'Yesterday') {
    return date >= startOfYesterday && date < startOfToday
  }

  if (dateFilter === 'This Week') {
    return date >= startOfWeek
  }

  if (dateFilter === 'This Month') {
    return date >= startOfMonth
  }

  // Custom placeholder while keeping the UI option available.
  return true
}

function OrderHistoryPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('Today')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const response = await getAllOrders({
          status: statusFilter,
          date: dateFilter,
          q: searchTerm,
          page: currentPage,
          limit: PAGE_SIZE,
        })

        const payload = Array.isArray(response?.data) ? response.data : []
        const normalized = payload.map((order) => ({
          id: order.id,
          tableNumber: order.tableNumber || order.table_number || '-',
          items:
            (order.order_items || order.items || []).map((item) => ({
              name: item.menu_item?.name || item.name || 'Item',
              quantity: item.quantity || 1,
            })) || [],
          status: (order.status || 'PENDING').toString().toUpperCase(),
          totalPrice: Number(order.totalPrice || order.total_price || 0),
          createdAt: order.createdAt || order.created_at,
          startedAt: order.startedAt || order.started_at || null,
          readyAt: order.readyAt || order.ready_at || null,
          completedAt: order.completedAt || order.completed_at || null,
        }))

        setOrders(normalized.length > 0 ? normalized : MOCK_ORDERS)
        setError(null)
      } catch (err) {
        console.error('Failed to load order history:', err)
        setOrders(MOCK_ORDERS)
        setError('Unable to load live order history. Showing sample data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [statusFilter, dateFilter, searchTerm, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, dateFilter, searchTerm])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter
      const matchesDate = isInDateFilter(order.createdAt, dateFilter)
      const brief = order.items.map((item) => `${item.name}x${item.quantity}`).join(' ')
      const query = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !query ||
        `${order.id}`.includes(query) ||
        `${order.tableNumber}`.toLowerCase().includes(query) ||
        brief.toLowerCase().includes(query)

      return matchesStatus && matchesDate && matchesSearch
    })
  }, [orders, statusFilter, dateFilter, searchTerm])

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders]
    sorted.sort((a, b) => {
      const { key, direction } = sortConfig
      const directionValue = direction === 'asc' ? 1 : -1

      const aVal = a[key]
      const bVal = b[key]

      if (key === 'createdAt') {
        return (new Date(aVal).getTime() - new Date(bVal).getTime()) * directionValue
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * directionValue
      }

      return String(aVal).localeCompare(String(bVal)) * directionValue
    })
    return sorted
  }, [filteredOrders, sortConfig])

  const totalOrders = sortedOrders.length
  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalOrders)
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex)

  const pageNumbers = useMemo(() => {
    const pages = []
    const maxButtons = 5
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + maxButtons - 1)

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1)
    }

    for (let p = start; p <= end; p += 1) {
      pages.push(p)
    }
    return pages
  }, [currentPage, totalPages])

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return ''
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const handleSearch = () => {
    setSearchTerm(searchInput)
  }

  const handleExportCSV = () => {
    const header = 'Order ID,Table Number,Items,Status,Total Price,Time\n'
    const rows = sortedOrders
      .map((order) => {
        const itemsText = order.items.map((item) => `${item.name}x${item.quantity}`).join('; ')
        return `${order.id},${order.tableNumber},"${itemsText}",${order.status},${order.totalPrice},${formatTime(
          order.createdAt
        )}`
      })
      .join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'orders-history.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setSuccessMessage('CSV export completed successfully.')
  }

  const handleExportPDF = () => {
    window.print()
    setSuccessMessage('PDF export started (print dialog opened).')
  }

  useEffect(() => {
    if (!successMessage) return undefined
    const timeout = setTimeout(() => setSuccessMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [successMessage])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 rounded-lg bg-white p-5 shadow-lg">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-[#FF8C00] md:text-4xl">
            <ListTodo size={32} />
            Order History
          </h1>
        </div>

        <div className="mb-4 rounded-lg bg-white p-4 shadow-lg">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#FF8C00]"
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#FF8C00]"
            >
              <option>Today</option>
              <option>Yesterday</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Custom</option>
            </select>

            <input
              type="text"
              placeholder="Search by Order ID or Table"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch()
                }
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#008080] lg:col-span-2"
            />

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center justify-center rounded-lg bg-[#008080] px-4 py-2 text-white transition hover:bg-teal-700"
            >
              <Search size={18} />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Total Orders: {totalOrders} | Showing: {totalOrders === 0 ? 0 : startIndex + 1}-{endIndex}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF8C00] px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                <Download size={16} />
                Export as CSV
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 rounded-lg bg-[#008080] px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                <Download size={16} />
                Export as PDF
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg bg-[#F5F5F5] shadow-lg">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200 text-left text-gray-700">
                <th className="border p-3 cursor-pointer" onClick={() => toggleSort('id')}>
                  Order ID {getSortIndicator('id')}
                </th>
                <th className="border p-3 cursor-pointer" onClick={() => toggleSort('tableNumber')}>
                  Table {getSortIndicator('tableNumber')}
                </th>
                <th className="border p-3 hidden md:table-cell">Items</th>
                <th className="border p-3 cursor-pointer" onClick={() => toggleSort('status')}>
                  Status {getSortIndicator('status')}
                </th>
                <th className="border p-3 cursor-pointer" onClick={() => toggleSort('totalPrice')}>
                  Total (Rs) {getSortIndicator('totalPrice')}
                </th>
                <th className="border p-3 cursor-pointer" onClick={() => toggleSort('createdAt')}>
                  Time {getSortIndicator('createdAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border bg-white p-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => {
                  const badge = statusConfig[order.status] || statusConfig.PENDING
                  const BadgeIcon = badge.icon
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`cursor-pointer transition hover:bg-orange-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="border p-3 font-semibold text-gray-800">#{order.id}</td>
                      <td className="border p-3 text-gray-700">{order.tableNumber}</td>
                      <td className="border p-3 text-gray-700 hidden md:table-cell">
                        {order.items.map((item) => `${item.name}x${item.quantity}`).join(', ')}
                      </td>
                      <td className="border p-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                          <BadgeIcon size={14} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="border p-3 text-gray-700">Rs {order.totalPrice.toFixed(2)}</td>
                      <td className="border p-3 text-gray-700">{formatTime(order.createdAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="inline-flex items-center gap-1 rounded-lg bg-[#008080] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <ChevronLeft size={16} />
            Prev
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                page === currentPage
                  ? 'bg-[#FF8C00] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="inline-flex items-center gap-1 rounded-lg bg-[#008080] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>

        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-2xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#FF8C00]">Order Details</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4">
                  <p className="rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                    <span className="font-semibold">Order ID:</span> #{selectedOrder.id}
                  </p>
                  <p className="rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                    <span className="font-semibold">Table:</span> {selectedOrder.tableNumber}
                  </p>
                  <p className="rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                    <span className="font-semibold">Total:</span> Rs {selectedOrder.totalPrice.toFixed(2)}
                  </p>
                </div>

                <div className="mb-4 rounded-lg border border-gray-200 p-3">
                  <h3 className="mb-2 font-semibold text-gray-800">Timeline</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>Received at: {formatTime(selectedOrder.createdAt)}</li>
                    <li>
                      Started at: {selectedOrder.startedAt ? formatTime(selectedOrder.startedAt) : '--'}
                    </li>
                    <li>Ready at: {selectedOrder.readyAt ? formatTime(selectedOrder.readyAt) : '--'}</li>
                    <li>
                      Completed at: {selectedOrder.completedAt ? formatTime(selectedOrder.completedAt) : '--'}
                    </li>
                  </ul>
                </div>

                <div className="mb-5 rounded-lg border border-gray-200 p-3">
                  <h3 className="mb-2 font-semibold text-gray-800">Items</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {selectedOrder.items.map((item, index) => (
                      <li key={`${item.name}-${index}`}>
                        {item.name} x {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg bg-[#008080] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default OrderHistoryPage