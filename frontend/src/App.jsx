import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { OrderProvider } from './context/orderContext'
import LoginPage from './pages/LoginPage'
import MenuPage from './pages/MenuPage'
import Header from './components/Header'

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrderProvider>
          <Header />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/" element={
              <div>
                <h1>Test Pages</h1>
                <p><a href="/login">Go to Test Login</a></p>
                <p><a href="/menu">Go to Test Menu</a></p>
              </div>
            } />
          </Routes>
        </OrderProvider>
      </AuthProvider>
    </Router>
  )
}

export default App