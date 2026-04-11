import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { OrderContext } from '../context/orderContext'
import { buildMenuRoute, buildTableRoute } from '../utils/menuRoute'

const MOCK_CART_ITEMS = [
  { id: 1, name: 'Burger', quantity: 2, price: 150 },
  { id: 2, name: 'Fries', quantity: 1, price: 50 },
  { id: 3, name: 'Pizza', quantity: 1, price: 200 },
]

const MOCK_TABLE_NUMBER = 5

function CartPage() {
  const orderContextValue = useContext(OrderContext)
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const contextUnavailable = !orderContextValue
  const cartItems = contextUnavailable ? MOCK_CART_ITEMS : orderContextValue.cartItems || []
  const tableNumber = contextUnavailable
    ? MOCK_TABLE_NUMBER
    : orderContextValue.tableNumber || MOCK_TABLE_NUMBER
  const menuRoute = buildMenuRoute(tableNumber)
  const checkoutRoute = buildTableRoute('/checkout', tableNumber)

  useEffect(() => {
    if (contextUnavailable) {
      return
    }

    const tableParam = searchParams.get('table')
    if (!tableParam) {
      return
    }

    const normalizedTable = String(tableParam).trim()
    if (normalizedTable && normalizedTable !== String(orderContextValue.tableNumber || '').trim()) {
      orderContextValue.updateTableNumber(normalizedTable)
    }
  }, [contextUnavailable, orderContextValue, searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (contextUnavailable) {
      setError('Order context is unavailable. Showing mock data for testing.')
      return
    }

    if (!Array.isArray(orderContextValue.cartItems)) {
      setError('Cart data is invalid. Please refresh and try again.')
    }
  }, [contextUnavailable, orderContextValue])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const tax = useMemo(() => subtotal * 0.05, [subtotal])
  const serviceCharge = useMemo(() => subtotal * 0.1, [subtotal])
  const total = useMemo(() => subtotal + tax + serviceCharge, [subtotal, tax, serviceCharge])

  const hasItems = cartItems.length > 0

  const handleQuantityChange = (itemId, newQuantity) => {
    try {
      setError(null)
      orderContextValue.updateQuantity(itemId, newQuantity)
    } catch (err) {
      console.error('Error updating quantity:', err)
      setError('Unable to update item quantity. Please try again.')
    }
  }

  const handleRemove = (itemId) => {
    try {
      setError(null)
      orderContextValue.removeFromCart(itemId)
    } catch (err) {
      console.error('Error removing item:', err)
      setError('Unable to remove item from cart. Please try again.')
    }
  }

  const handleClearCart = () => {
    try {
      setError(null)
      orderContextValue.clearCart()
    } catch (err) {
      console.error('Error clearing cart:', err)
      setError('Unable to clear cart. Please try again.')
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-[#F5F5F5] px-4 py-6 md:px-8"
    >
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-6 flex flex-col gap-3 rounded-lg bg-white p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#FF8C00]/15 p-2 text-[#FF8C00]">
              <ShoppingCart size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">Your Cart</h1>
              <p className="text-sm text-gray-600 md:text-base">Table #{tableNumber}</p>
            </div>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-gray-700">
            {hasItems ? `${cartItems.length} item(s) in cart` : 'No items in cart'}
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!hasItems ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center shadow-lg"
          >
            <ShoppingCart className="mx-auto mb-3 text-gray-400" size={34} />
            <h2 className="mb-2 text-xl font-bold text-gray-700">Empty Cart</h2>
            <p className="mb-5 text-gray-500">Add delicious items from the menu to get started.</p>
            <Link
              to={menuRoute}
              className="inline-flex items-center justify-center rounded-lg bg-[#FF8C00] px-5 py-2.5 font-semibold text-white transition hover:bg-orange-600"
            >
              Continue Shopping
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-lg bg-white shadow-lg"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-center">
                  <thead>
                    <tr className="bg-gray-100 text-sm uppercase tracking-wide text-gray-700">
                      <th className="border p-3">Item Name</th>
                      <th className="border p-3">Quantity</th>
                      <th className="border p-3">Unit Price</th>
                      <th className="border p-3">Subtotal</th>
                      <th className="border p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {cartItems.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.04 }}
                          className="text-sm text-gray-700"
                        >
                          <td className="border p-3 font-semibold text-gray-800">{item.name}</td>
                          <td className="border p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="rounded-md border border-teal-200 p-1.5 text-[#008080] transition hover:bg-teal-50"
                                aria-label={`Decrease quantity for ${item.name}`}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="min-w-7 rounded bg-gray-100 px-2 py-1 font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="rounded-md border border-teal-200 p-1.5 text-[#008080] transition hover:bg-teal-50"
                                aria-label={`Increase quantity for ${item.name}`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="border p-3">Rs {item.price.toFixed(2)}</td>
                          <td className="border p-3 font-semibold">Rs {(item.price * item.quantity).toFixed(2)}</td>
                          <td className="border p-3">
                            <button
                              type="button"
                              onClick={() => handleRemove(item.id)}
                              className="inline-flex items-center justify-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-white transition hover:bg-red-600"
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mt-6 rounded-lg bg-white p-5 shadow-lg"
            >
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex items-center justify-between border-b pb-2 text-gray-700">
                  <span>Subtotal</span>
                  <span>Rs {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2 text-gray-700">
                  <span>Tax (5%)</span>
                  <span>Rs {tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2 text-gray-700">
                  <span>Service Charge (10%)</span>
                  <span>Rs {serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-lg font-bold text-gray-900">
                  <span>TOTAL</span>
                  <span>Rs {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Link
                  to={menuRoute}
                  className="rounded-lg bg-[#008080] px-4 py-2.5 text-center font-semibold text-white transition hover:bg-teal-700"
                >
                  Continue Shopping
                </Link>

                <button
                  type="button"
                  onClick={handleClearCart}
                  className="rounded-lg bg-[#FF8C00] px-4 py-2.5 font-semibold text-white transition hover:bg-orange-600"
                >
                  Clear Cart
                </button>

                <Link
                  to={checkoutRoute}
                  aria-disabled={!hasItems}
                  className={`rounded-lg px-4 py-2.5 text-center font-semibold text-white transition ${
                    hasItems
                      ? 'bg-[#FF8C00] hover:bg-orange-600'
                      : 'cursor-not-allowed bg-gray-300'
                  }`}
                  onClick={(event) => {
                    if (!hasItems) {
                      event.preventDefault()
                    }
                  }}
                >
                  Proceed to Checkout
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default CartPage