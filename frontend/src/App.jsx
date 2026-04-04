import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { OrderProvider } from './context/orderContext'
import Layout from './components/Layout'
import MenuPage from './pages/MenuPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrderProvider>
          <Layout>
            <Routes>
              {/* Routes will be added here as pages are created */}
              <Route path='/menu'element={<MenuPage/>}></Route>
              <Route
                path="/"
                element={
                  <div className="text-center py-20">
                    <h1 className="text-4xl font-bold text-[#FF8C00] mb-4">Welcome to Restaurant!</h1>
                    <p className="text-gray-600 text-lg mb-8">Choose an option from the menu above</p>
                  </div>
                }
              />
            </Routes>
          </Layout>
        </OrderProvider>
      </AuthProvider>
    </Router>
  )
}

export default App