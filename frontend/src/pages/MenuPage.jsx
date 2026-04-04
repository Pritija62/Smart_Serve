import React, { useState, useEffect, useContext } from 'react'
import { OrderContext } from '../context/orderContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { getMenu } from '../services/api'

function MenuPage() {
  const { addToCart } = useContext(OrderContext)
  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantities, setQuantities] = useState({})

  // Fetch menu items from backend
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true)
        const response = await getMenu()
        setMenuItems(response.data)
        console.log('📋 Menu loaded:', response.data)
      } catch (err) {
        console.error('❌ Error loading menu:', err)
        setError('Failed to load menu. Please try again.')
        // Fallback menu for testing
        setMenuItems([
          { id: 1, name: 'Burger', price: 150, description: 'Juicy beef burger with cheese' },
          { id: 2, name: 'Fries', price: 50, description: 'Crispy golden fries' },
          { id: 3, name: 'Pizza', price: 200, description: 'Delicious cheese pizza' },
          { id: 4, name: 'Coke', price: 30, description: 'Cold refreshing drink' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  // Handle quantity changes
  const handleQuantityChange = (itemId, change) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + change),
    }))
  }

  // Add to cart
  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1
    console.log('🛒 Adding to cart:', { ...item, quantity })
    
    addToCart({
      ...item,
      quantity,
    })

    // Reset quantity after adding
    setQuantities((prev) => ({
      ...prev,
      [item.id]: 1,
    }))

    alert(`${item.name} added to cart!`)
  }

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
        <h1 className="text-4xl font-bold text-[#FF8C00] mb-2">🍽️ Our Menu</h1>
        <p className="text-gray-600">Choose your favorite dishes</p>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
          >
            {/* Item Image Placeholder */}
            <div className="bg-gradient-to-r from-[#FF8C00] to-[#008080] h-40 flex items-center justify-center">
              <span className="text-5xl">🍔</span>
            </div>

            {/* Item Details */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>

              {/* Price */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-[#FF8C00]">Rs {item.price}</span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-2 mb-4 bg-gray-100 rounded-lg p-2">
                <button
                  onClick={() => handleQuantityChange(item.id, -1)}
                  className="text-[#008080] hover:text-teal-700 p-1"
                >
                  <Minus size={18} />
                </button>
                <span className="flex-1 text-center font-semibold">
                  {quantities[item.id] || 1}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.id, 1)}
                  className="text-[#008080] hover:text-teal-700 p-1"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(item)}
                className="w-full bg-[#008080] hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default MenuPage