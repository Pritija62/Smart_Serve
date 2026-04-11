import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { OrderProvider } from './context/orderContext'
import { SocketProvider } from './context/SocketContext'
import Layout from './components/Layout'
import CustomerTableGuard from './components/CustomerTableGuard'

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
  return (
    <Router>
      <AuthProvider>
        <OrderProvider>
          <SocketProvider>
            <Layout>
              <Routes>
              {/* Customer Entry */}
              <Route path="/" element={<Navigate to="/menu" replace />} />

              {/* Table Required Fallback */}
              <Route
                path="/table-required"
                element={
                  <div className="mx-auto max-w-xl py-20 text-center">
                    <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      Table session is missing. Please scan your table QR code to continue ordering.
                    </p>
                    <a
                      href="/login"
                      className="inline-block bg-[#008080] hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition"
                    >
                      Staff Login
                    </a>
                  </div>
                }
              />

              {/* Customer Pages */}
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/cart" element={<CustomerTableGuard><CartPage /></CustomerTableGuard>} />
              <Route path="/checkout" element={<CustomerTableGuard><CheckoutPage /></CustomerTableGuard>} />
              <Route path="/track" element={<CustomerTableGuard><TrackingPage /></CustomerTableGuard>} />
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