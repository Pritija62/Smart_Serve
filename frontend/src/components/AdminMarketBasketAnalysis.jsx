import React, { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, BarChart3, ShoppingCart, TrendingUp } from 'lucide-react'
import { getMarketBasketAnalysis } from '../services/api'
const DEFAULT_FILTERS = {
  days: 30,
  min_support: 0.3,
  min_confidence: 0.7,
}
function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow">
      <div className={`rounded-full p-2 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
function AdminMarketBasketAnalysis() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchAnalysis = useCallback(async (currentFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getMarketBasketAnalysis(currentFilters)
      setResult(response.data)
    } catch (err) {
      console.error('Market basket analysis failed:', err)
      setError(err.response?.data?.error || 'Failed to load market basket analysis.')
    } finally {
      setIsLoading(false)
    }
  }, [])
  useEffect(() => {
     fetchAnalysis(DEFAULT_FILTERS)
  }, [fetchAnalysis])// eslint-disable-line react-hooks/exhaustive-deps
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    fetchAnalysis(filters)
  }
  const topRules = result?.top_rules ?? []
  const frequentItemsets = result?.frequent_itemsets ?? {}
  const summary = result?.summary ?? {}
  return (
    <div className="mt-6 rounded-lg bg-gray-50 p-5 shadow-lg">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
        <ShoppingCart size={22} className="text-[#FF8C00]" />
        Market Basket Analysis
      </h2>
      {/* Filters */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3"
      >
        <div>
          <label htmlFor="days" className="mb-1 block text-xs font-semibold text-gray-600">
            Analysis Period (days)
          </label>
          <input
            id="days"
            name="days"
            type="number"
            min="1"
            max="365"
            value={filters.days}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#008080]"
          />
        </div>
        <div>
          <label htmlFor="min_support" className="mb-1 block text-xs font-semibold text-gray-600">
            Min Support (0–1)
          </label>
          <input
            id="min_support"
            name="min_support"
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={filters.min_support}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#008080]"
          />
        </div>
        <div>
          <label htmlFor="min_confidence" className="mb-1 block text-xs font-semibold text-gray-600">
            Min Confidence (0–1)
          </label>
          <input
            id="min_confidence"
            name="min_confidence"
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={filters.min_confidence}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#008080]"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-[#FF8C00] px-5 py-2 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading ? 'Analyzing…' : 'Run Analysis'}
          </button>
        </div>
      </form>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <svg className="mr-3 h-5 w-5 animate-spin text-[#FF8C00]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Running Apriori analysis…
        </div>
      )}
      {!isLoading && result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={BarChart3}
              label="Total Orders Analysed"
              value={summary.total_orders ?? 0}
              color="bg-[#FF8C00]"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Association Rules Found"
              value={summary.total_rules ?? 0}
              color="bg-[#008080]"
            />
            <SummaryCard
              icon={ShoppingCart}
              label={`Analysis Period`}
              value={`Last ${summary.analysis_period_days ?? filters.days} days`}
              color="bg-blue-500"
            />
          </div>
          {/* Top rules table */}
          <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="font-bold text-gray-800">Top Association Rules</h3>
              <p className="text-xs text-gray-500">Items frequently purchased together</p>
            </div>
            {topRules.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                No rules found. Try lowering the support or confidence thresholds.
              </p>
            ) : (
              <table className="w-full min-w-[600px] border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="border-b p-3">Combination (If… → Then…)</th>
                    <th className="border-b p-3 text-right">Confidence</th>
                    <th className="border-b p-3 text-right">Support</th>
                    <th className="border-b p-3 text-right">Lift</th>
                  </tr>
                </thead>
                <tbody>
                  {topRules.map((rule, idx) => {
                    const antecedent = rule.antecedent.join(' + ')
                    const consequent = rule.consequent.join(' + ')
                    return (
                      <tr
                        key={`${antecedent}-${consequent}`}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="border-b p-3 text-gray-800">
                          <span className="font-medium text-[#FF8C00]">{antecedent}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="font-medium text-[#008080]">{consequent}</span>
                        </td>
                        <td className="border-b p-3 text-right font-semibold text-gray-700">
                          {(rule.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="border-b p-3 text-right text-gray-600">
                          {(rule.support * 100).toFixed(1)}%
                        </td>
                        <td className="border-b p-3 text-right text-gray-600">
                          {rule.lift.toFixed(2)}x
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          {/* Frequent itemsets grouped by size */}
          <div className="rounded-lg border border-gray-200 bg-white shadow">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="font-bold text-gray-800">Frequent Itemsets</h3>
              <p className="text-xs text-gray-500">Items that appear together above the support threshold</p>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.keys(frequentItemsets).length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">
                  No frequent itemsets found. Try lowering the support threshold.
                </p>
              ) : (
                Object.entries(frequentItemsets)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([size, itemsets]) => (
                    <div key={size} className="px-4 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                        {size}-Item Sets ({itemsets.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {itemsets.map((is) => (
                          <span
                            key={is.items.join('|')}
                            className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-800"
                          >
                            {is.items.join(' + ')}
                            <span className="ml-1 rounded-full bg-orange-200 px-1.5 py-0.5 text-orange-900">
                              {(is.support * 100).toFixed(1)}%
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
export default AdminMarketBasketAnalysis