import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { OrderProvider } from './context/orderContext'
import Layout from './components/Layout'

// Import pages
import MenuPage from './pages/MenuPage'
import LoginPage from './pages/LoginPage'
import KitchenDashboard from './pages/KitchenDashboard'

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrderProvider>
          <Layout>
            <Routes>
              {/* Home */}
              <Route
                path="/"
                element={
                  <div className="text-center py-20">
                    <h1 className="text-4xl font-bold text-[#FF8C00] mb-4">
                      🍔 Welcome to Our Restaurant!
                    </h1>
                    <p className="text-gray-600 text-lg mb-8">
                      Choose an option from the menu above to get started.
                    </p>
                    <div className="space-y-4">
                      <a
                        href="/menu"
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
              <Route path="/login" element={<LoginPage />} />

              {/* Kitchen Pages */}
              <Route path="/kitchen" element={<KitchenDashboard />} />
            </Routes>
          </Layout>
        </OrderProvider>
      </AuthProvider>
    </Router>
  )
}

export default App