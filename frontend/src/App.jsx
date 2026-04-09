import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import { OrderProvider } from './context/orderContext'
import { SocketProvider } from './context/SocketContext'
import Layout from './components/Layout'
import { buildMenuRoute } from './utils/menuRoute'

// Import pages
import MenuPage from './pages/MenuPage'
import LoginPage from './pages/LoginPage'
import KitchenDashboard from './pages/KitchenDashboard'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import TrackingPage from './pages/TrackingPage'
import AdminDashboard from './pages/AdminDashboard'
import AnalyticsPage from './pages/AnalyticsPage'
import OrderHistoryPage from './pages/OrderHistoryPage'

function App() {
  const savedTableNumber = localStorage.getItem('tableNumber')
  const menuRoute = buildMenuRoute(savedTableNumber)

  return (
    <Router>
      <AuthProvider>
        <OrderProvider>
          <SocketProvider>
            <Layout>
              <Routes>
              {/* Home */}
              <Route
                path="/"
                element={
                  <div className="text-center py-20">
                    <h1 className="mb-4 flex items-center justify-center gap-2 text-4xl font-bold text-[#FF8C00]">
                      <UtensilsCrossed size={34} />
                      Welcome to Our Restaurant!
                    </h1>
                    <p className="text-gray-600 text-lg mb-8">
                      Choose an option from the menu above to get started.
                    </p>
                    <div className="space-y-4">
                      <a
                        href={menuRoute}
                        className="inline-block bg-[#FF8C00] hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition"
                      >
                        Browse Menu
                      </a>
                      <a
                        href="/login"
                        className="inline-block bg-[#008080] hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition ml-4"
                      >
                        Staff Login
                      </a>
                    </div>
                  </div>
                }
              />

              {/* Customer Pages */}
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/track" element={<TrackingPage/> } />
              <Route path="/login" element={<LoginPage />} />

              {/* Kitchen Pages */}
              <Route path="/kitchen" element={<KitchenDashboard />} />

              {/* Admin Pages */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/orders" element={<OrderHistoryPage />} />
              </Routes>
            </Layout>
          </SocketProvider>
        </OrderProvider>
      </AuthProvider>
    </Router>
  )
}

export default App