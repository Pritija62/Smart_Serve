import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Printer, TrendingUp, AlertCircle } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner'
import { getHourlyTrends, getTopItems, getWeeklySales } from '../services/api'

const MOCK_ANALYTICS = {
  weeklySales: {
    Monday: 5000,
    Tuesday: 6500,
    Wednesday: 4800,
    Thursday: 7200,
    Friday: 8900,
    Saturday: 10500,
    Sunday: 6200,
  },
  hourlyTrends: {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 1,
    6: 2,
    7: 4,
    8: 6,
    9: 9,
    10: 12,
    11: 14,
    12: 15,
    13: 18,
    14: 16,
    15: 14,
    16: 17,
    17: 20,
    18: 23,
    19: 24,
    20: 25,
    21: 19,
    22: 10,
    23: 4,
  },
  topItems: [
    { name: 'Burger', sold: 145, revenue: 21750, percent: 32 },
    { name: 'Fries', sold: 120, revenue: 6000, percent: 9 },
    { name: 'Pizza', sold: 95, revenue: 19000, percent: 28 },
    { name: 'Coke', sold: 180, revenue: 5400, percent: 8 },
    { name: 'Ice Cream', sold: 67, revenue: 2700, percent: 4 },
  ],
}

const TOP_ITEM_ROW_COLORS = [
  'bg-orange-50',
  'bg-teal-50',
  'bg-blue-50',
  'bg-green-50',
  'bg-red-50',
]

const DATE_RANGE_OPTIONS = ['This Week', 'This Month', 'Last Month', 'Custom Range']

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('This Week')
  const [analytics, setAnalytics] = useState(MOCK_ANALYTICS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const weeklySalesData = useMemo(() => {
    return WEEK_DAYS.map((day) => ({
      day: day.slice(0, 3),
      revenue: analytics.weeklySales[day] || 0,
    }))
  }, [analytics])

  const hourlyTrendData = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: analytics.hourlyTrends[String(hour)] || 0,
    }))
  }, [analytics])

  const topItemsData = useMemo(() => analytics.topItems.slice(0, 5), [analytics])

  const handleExportCSV = () => {
    const header = 'Item Name,Quantity Sold,Revenue,Percent of Total\n'
    const rows = topItemsData
      .map((item) => `${item.name},${item.sold},${item.revenue},${item.percent}%`)
      .join('\n')
    const csv = `${header}${rows}`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'analytics-report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)

        const [weeklySalesRes, hourlyTrendsRes, topItemsRes] = await Promise.all([
          getWeeklySales(),
          getHourlyTrends(),
          getTopItems(),
        ])

        const weeklySalesArray = Array.isArray(weeklySalesRes?.data) ? weeklySalesRes.data : []
        const hourlyTrendsArray = Array.isArray(hourlyTrendsRes?.data) ? hourlyTrendsRes.data : []
        const topItemsArray = Array.isArray(topItemsRes?.data) ? topItemsRes.data : []

        const weeklySalesObject = WEEK_DAYS.reduce((acc, day) => {
          acc[day] = 0
          return acc
        }, {})

        // Supports API responses with day-based fields when available.
        weeklySalesArray.forEach((entry) => {
          const dayName = entry.day || entry.weekday
          const normalizedDay = dayName ? `${dayName}` : ''
          if (WEEK_DAYS.includes(normalizedDay)) {
            weeklySalesObject[normalizedDay] = Number(entry.revenue || entry.sales || 0)
          }
        })

        const hasUsableWeeklyData = Object.values(weeklySalesObject).some((value) => value > 0)

        const hourlyTrendsObject = {}
        for (let hour = 0; hour < 24; hour += 1) {
          hourlyTrendsObject[String(hour)] = 0
        }
        hourlyTrendsArray.forEach((entry) => {
          const hourKey = String(entry.hour)
          hourlyTrendsObject[hourKey] = Number(entry.order_count || entry.orders || 0)
        })

        const totalRevenueFromTop = topItemsArray.reduce(
          (sum, item) => sum + Number(item.revenue || item.total_revenue || 0),
          0
        )

        const normalizedTopItems = topItemsArray.slice(0, 5).map((item) => {
          const revenue = Number(item.revenue || item.total_revenue || 0)
          const sold = Number(item.sold || item.quantity_sold || 0)
          return {
            name: item.name || item.item_name || 'Item',
            sold,
            revenue,
            percent:
              totalRevenueFromTop > 0
                ? Math.round((revenue / totalRevenueFromTop) * 100)
                : 0,
          }
        })

        setAnalytics({
          weeklySales: hasUsableWeeklyData ? weeklySalesObject : MOCK_ANALYTICS.weeklySales,
          hourlyTrends:
            Object.values(hourlyTrendsObject).some((count) => count > 0)
              ? hourlyTrendsObject
              : MOCK_ANALYTICS.hourlyTrends,
          topItems: normalizedTopItems.length > 0 ? normalizedTopItems : MOCK_ANALYTICS.topItems,
        })
        setError(null)
      } catch (err) {
        console.error('Analytics fetch failed:', err)
        setError('Failed to load live analytics. Showing sample data.')
        setAnalytics(MOCK_ANALYTICS)
      } finally {
        setLastUpdated(new Date())
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [dateRange])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 rounded-lg bg-white p-5 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-[#FF8C00] md:text-4xl">
                <TrendingUp size={32} />
                Analytics & Reports
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Data updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="w-full lg:w-64">
              <label htmlFor="dateRange" className="mb-1 block text-sm font-semibold text-gray-700">
                Date Range
              </label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#008080]"
              >
                {DATE_RANGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-lg bg-white p-5 shadow-lg"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              <TrendingUp size={20} className="text-[#FF8C00]" />
              Weekly Sales
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#FF8C00" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-lg bg-white p-5 shadow-lg"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              <TrendingUp size={20} className="text-[#008080]" />
              Hourly Trends
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#008080"
                    strokeWidth={3}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="mt-6 rounded-lg bg-white p-5 shadow-lg"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <TrendingUp size={20} className="text-[#FF8C00]" />
            Top Selling Items
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700">
                  <th className="border p-3">Item Name</th>
                  <th className="border p-3">Quantity Sold</th>
                  <th className="border p-3">Revenue</th>
                  <th className="border p-3">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {topItemsData.map((item, index) => (
                  <tr key={item.name} className={TOP_ITEM_ROW_COLORS[index % TOP_ITEM_ROW_COLORS.length]}>
                    <td className="border p-3 font-semibold text-gray-800">{item.name}</td>
                    <td className="border p-3 text-gray-700">{item.sold}</td>
                    <td className="border p-3 text-gray-700">Rs {item.revenue.toLocaleString()}</td>
                    <td className="border p-3 text-gray-700">{item.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF8C00] px-4 py-2.5 font-semibold text-white transition hover:bg-orange-600"
            >
              <Download size={18} />
              Export as PDF
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008080] px-4 py-2.5 font-semibold text-white transition hover:bg-teal-700"
            >
              <Download size={18} />
              Export as CSV
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-gray-800 transition hover:bg-gray-300"
            >
              <Printer size={18} />
              Print
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AnalyticsPage