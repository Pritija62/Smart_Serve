import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingCart, Sparkles, UtensilsCrossed } from 'lucide-react'
import { OrderContext } from '../context/orderContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { getMenuItemById, getMenuItemRecommendations } from '../services/api'
import { buildTableRoute } from '../utils/menuRoute'

function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToCart, tableNumber } = useContext(OrderContext)

  const [item, setItem] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(true)
  const [error, setError] = useState('')

  const resolvedTable = String(searchParams.get('table') || tableNumber || '').trim()
  const menuRoute = buildTableRoute('/menu', resolvedTable)
  const cartRoute = buildTableRoute('/cart', resolvedTable)

  useEffect(() => {
    const loadItem = async () => {
      try {
        setIsLoading(true)
        setError('')
        const response = await getMenuItemById(id)
        setItem(response.data)
      } catch (err) {
        console.error('Failed to load menu item:', err)
        setError('Could not load this menu item. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadItem()
  }, [id])

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setIsRecommendationLoading(true)
        const response = await getMenuItemRecommendations(id)
        setRecommendations(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        console.error('Failed to load recommendations:', err)
        setRecommendations([])
      } finally {
        setIsRecommendationLoading(false)
      }
    }

    loadRecommendations()
  }, [id])

  const stationLabel = useMemo(() => {
    const station = String(item?.station || '').toLowerCase()
    const labels = {
      grill: 'Grill',
      fry: 'Fry',
      drinks: 'Drinks',
      salads: 'Salads',
    }

    return labels[station] || station || 'Menu'
  }, [item])

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  const handleAddToCart = () => {
    if (!item) {
      return
    }

    addToCart({
      ...item,
      quantity,
    })

    navigate(cartRoute)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow-lg">
          <p className="text-lg font-semibold text-red-600">{error || 'Item not found.'}</p>
          <Link
            to={menuRoute}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#008080] px-5 py-2.5 font-semibold text-white hover:bg-teal-700"
          >
            <ArrowLeft size={16} />
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to={menuRoute}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#008080] hover:text-teal-700"
        >
          <ArrowLeft size={16} />
          Back to Menu
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-5 flex h-52 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#008080]">
              <UtensilsCrossed size={58} className="text-white" />
            </div>

            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-[#008080]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#008080]">
                {stationLabel}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-800">{item.name}</h1>
            <p className="mt-3 text-gray-600">{item.description || 'No description available.'}</p>

            <p className="mt-5 text-3xl font-bold text-[#FF8C00]">Rs {item.price}</p>

            <div className="mt-6 rounded-xl border border-gray-200 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-600">Select quantity</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  className="rounded-lg border border-teal-200 p-2 text-[#008080] hover:bg-teal-50"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-10 rounded-lg bg-gray-100 px-4 py-2 text-center text-lg font-bold text-gray-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  className="rounded-lg border border-teal-200 p-2 text-[#008080] hover:bg-teal-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#008080] px-5 py-3 font-bold text-white transition hover:bg-teal-700"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
              <Sparkles size={18} className="text-[#FF8C00]" />
              Recommended With This Item
            </h2>

            {isRecommendationLoading ? (
              <p className="text-sm text-gray-500">Loading recommendations...</p>
            ) : recommendations.length === 0 ? (
              <p className="text-sm text-gray-500">
                No recommendations yet. As more real orders come in, suggestions will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((recommendedItem) => (
                  <Link
                    key={recommendedItem.id}
                    to={buildTableRoute(`/menu/item/${recommendedItem.id}`, resolvedTable)}
                    className="block rounded-xl border border-gray-200 p-4 transition hover:border-[#008080] hover:bg-[#F8FFFF]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-800">{recommendedItem.name}</p>
                        <p className="mt-1 text-sm text-gray-600">{recommendedItem.description || 'No description'}</p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-bold text-[#FF8C00]">Rs {recommendedItem.price}</p>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#008080]">
                      {(Number(recommendedItem.confidence || 0) * 100).toFixed(0)}% customers also order this
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetailPage
