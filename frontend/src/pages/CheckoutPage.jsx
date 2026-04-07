import React, { useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react'
import { OrderContext } from '../context/orderContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { createOrder } from '../services/api'

function CheckoutPage() {
  const orderContextValue = useContext(OrderContext)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const [orderedItems, setOrderedItems] = useState([])

  const cartItems = orderContextValue?.cartItems || []
  const tableNumber = orderContextValue?.tableNumber || localStorage.getItem('tableNumber') || '5'
  const hasItems = cartItems.length > 0

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const tax = subtotal * 0.05
  const serviceCharge = subtotal * 0.1
  const total = subtotal + tax + serviceCharge

  const getNormalizedResponse = (responseData) => {
    return {
      orderId: responseData.orderId ?? responseData.order_id,
      status: responseData.status || 'PENDING',
      tableNumber: responseData.tableNumber ?? responseData.table_number ?? tableNumber,
      totalPrice: Number(responseData.totalPrice ?? responseData.total_price ?? total),
      trackingToken: responseData.trackingToken ?? responseData.tracking_token,
    }
  }

  const handlePlaceOrder = async () => {
    if (!hasItems || isSubmitting) {
      return
    }

    try {
      setError(null)
      setIsSubmitting(true)

      const tableNumberValue = String(tableNumber).trim()
      if (!tableNumberValue) {
        throw new Error('Table number is required before placing order.')
      }

      const orderItems = cartItems.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        special_instructions: specialInstructions || undefined,
      }))

      const payload = {
        table_number: tableNumberValue,
        items: orderItems,
      }

      const response = await createOrder(payload)
      const normalizedResponse = getNormalizedResponse(response.data)

      setOrderedItems([...cartItems])
      setConfirmedOrder(normalizedResponse)

      // Keep checkout summary visible after confirmation.
      orderContextValue?.clearCart?.()

    } catch (err) {
      console.error('Checkout failed:', err)
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message
      setError(apiMessage || 'Unable to place order right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrderMore = () => {
    orderContextValue?.clearCart?.()
  }

  if (isSubmitting) {
    return <LoadingSpinner />
  }

  if (confirmedOrder) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen bg-[#F5F5F5]"
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg border border-green-200 bg-white p-6 shadow-lg"
          >
            <h1 className="mb-3 flex items-center gap-2 text-2xl font-bold text-green-700 md:text-3xl">
              <CheckCircle size={28} />
              ORDER CONFIRMED
            </h1>

            <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg bg-green-50 p-4 text-sm text-gray-800 sm:grid-cols-2">
              <p>
                <span className="font-semibold">Order ID:</span> #{confirmedOrder.orderId}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {confirmedOrder.status}
              </p>
              <p>
                <span className="font-semibold">Table Number:</span> {confirmedOrder.tableNumber}
              </p>
              <p>
                <span className="font-semibold">Total Price:</span> Rs {confirmedOrder.totalPrice.toFixed(2)}
              </p>
            </div>

            <h2 className="mb-2 text-lg font-bold text-gray-800">Items Ordered</h2>
            <div className="space-y-2">
              {orderedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2"
                >
                  <p className="font-medium text-gray-800">
                    {item.name} x {item.quantity}
                  </p>
                  <p className="font-semibold text-gray-700">Rs {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                to={`/track?orderId=${confirmedOrder.orderId}`}
                className="rounded-lg bg-[#FF8C00] px-4 py-2.5 text-center font-semibold text-white transition hover:bg-orange-600"
              >
                Track Order
              </Link>
              <Link
                to="/menu"
                onClick={handleOrderMore}
                className="rounded-lg bg-[#008080] px-4 py-2.5 text-center font-semibold text-white transition hover:bg-teal-700"
              >
                Order More
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#F5F5F5]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 rounded-lg bg-white p-5 shadow-lg">
          <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-800 md:text-3xl">
            <ShoppingBag className="text-[#FF8C00]" size={28} />
            Checkout
          </h1>
          <p className="text-gray-600">Review your order and confirm table details.</p>
          <p className="mt-2 text-sm font-semibold text-gray-700">Table Number: {tableNumber}</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasItems ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            <h2 className="text-xl font-bold text-gray-700">Your cart is empty</h2>
            <p className="mt-2 text-gray-500">Add items before proceeding to checkout.</p>
            <Link
              to="/menu"
              className="mt-5 inline-flex rounded-lg bg-[#008080] px-5 py-2.5 font-semibold text-white transition hover:bg-teal-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-5 shadow-lg lg:col-span-2">
              <h2 className="mb-3 text-lg font-bold text-gray-800">Order Items</h2>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800">Rs {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-lg">
              <h2 className="mb-3 text-lg font-bold text-gray-800">Bill Summary</h2>
              <div className="space-y-2 text-sm">
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
                  <span>Total</span>
                  <span>Rs {total.toFixed(2)}</span>
                </div>
              </div>

              <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="specialInstructions">
                Special Instructions (Optional)
              </label>
              <textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(event) => setSpecialInstructions(event.target.value)}
                placeholder="Any allergies, extra preferences, or notes for the kitchen"
                className="mt-2 min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-[#008080]"
              />

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!hasItems || isSubmitting}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white transition ${
                  hasItems && !isSubmitting
                    ? 'bg-[#FF8C00] hover:bg-orange-600'
                    : 'cursor-not-allowed bg-gray-300'
                }`}
              >
                Place Order
              </button>

              <Link
                to="/cart"
                className="mt-3 inline-flex w-full justify-center rounded-lg bg-[#008080] px-4 py-2.5 font-semibold text-white transition hover:bg-teal-700"
              >
                Cancel Order
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default CheckoutPage