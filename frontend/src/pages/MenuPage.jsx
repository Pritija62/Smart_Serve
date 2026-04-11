import React, { useState, useEffect, useContext, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { OrderContext } from '../context/orderContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { UtensilsCrossed } from 'lucide-react'
import { motion } from 'framer-motion'
import { getMenu, getTables } from '../services/api'
import { buildTableRoute } from '../utils/menuRoute'

function MenuPage() {
  const { tableNumber, updateTableNumber } = useContext(OrderContext)
  const [searchParams] = useSearchParams()
  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [validTableNumbers, setValidTableNumbers] = useState([])

  const categoryOrder = ['grill', 'fry', 'drinks', 'salads']
  const categoryLabelMap = {
    grill: 'Grill',
    fry: 'Fry',
    drinks: 'Drinks',
    salads: 'Salads',
  }

  useEffect(() => {
    const loadMenuAndTables = async () => {
      try {
        setIsLoading(true)

        const [menuResponse, tablesResponse] = await Promise.all([
          getMenu(),
          getTables(),
        ])
        setMenuItems(menuResponse.data)
        setValidTableNumbers(
          (tablesResponse.data || []).map((table) => String(table.number ?? table.table_number ?? table.id))
        )
        console.log('📋 Menu loaded:', menuResponse.data)
      } catch (err) {
        console.error('❌ Error loading menu:', err)
        setError('Failed to load menu. Please try again.')
        // Fallback menu for testing
        setMenuItems([
          { id: 1, name: 'Burger', price: 150, description: 'Juicy beef burger with cheese', station: 'grill' },
          { id: 2, name: 'Fries', price: 50, description: 'Crispy golden fries', station: 'fry' },
          { id: 3, name: 'Pizza', price: 200, description: 'Delicious cheese pizza', station: 'grill' },
          { id: 4, name: 'Coke', price: 30, description: 'Cold refreshing drink', station: 'drinks' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadMenuAndTables()
  }, [])

  useEffect(() => {
    const tableParam = searchParams.get('table')

    if (!tableParam) {
      return
    }

    if (validTableNumbers.length === 0) {
      return
    }

    const normalizedTable = String(tableParam).trim()

    if (!/^\d+$/.test(normalizedTable)) {
      setError('Invalid table number in the URL. Use a numeric table id.')
      return
    }

    if (validTableNumbers.length > 0 && !validTableNumbers.includes(normalizedTable)) {
      setError(`Table ${normalizedTable} does not exist.`)
      return
    }

    if (normalizedTable) {
      updateTableNumber(normalizedTable)
    }
  }, [searchParams, updateTableNumber, validTableNumbers])

  const groupedMenuItems = useMemo(() => {
    const groups = menuItems.reduce((acc, item) => {
      const key = String(item.station || 'others').toLowerCase()
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {})

    return Object.entries(groups)
      .sort(([a], [b]) => {
        const indexA = categoryOrder.indexOf(a)
        const indexB = categoryOrder.indexOf(b)
        if (indexA === -1 && indexB === -1) return a.localeCompare(b)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
      .map(([key, items]) => ({
        key,
        label: categoryLabelMap[key] || key.charAt(0).toUpperCase() + key.slice(1),
        items,
      }))
  }, [menuItems])

  const getItemDetailRoute = (itemId) => buildTableRoute(`/menu/item/${itemId}`, tableNumber)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF8C00] text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-[#FF8C00]">
          <UtensilsCrossed size={34} />
          Our Menu
        </h1>
        <p className="text-gray-600">Choose your favorite dishes</p>
        {tableNumber && (
          <p className="mt-2 inline-flex rounded-full bg-[#008080]/10 px-3 py-1 text-sm font-semibold text-[#008080]">
            Table #{tableNumber}
          </p>
        )}
      </div>

      {/* Category Sections */}
      <div className="space-y-7">
        {groupedMenuItems.map((category) => (
          <section key={category.key} className="rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">{category.label}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }}
                  className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-[#008080] hover:shadow-md"
                >
                  <Link to={getItemDetailRoute(item.id)} className="block">
                    <p className="text-lg font-bold text-gray-800">{item.name}</p>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description || 'No description available.'}</p>
                    <p className="mt-3 text-xl font-bold text-[#FF8C00]">Rs {item.price}</p>
                    <p className="mt-3 text-sm font-semibold text-[#008080]">View details</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default MenuPage