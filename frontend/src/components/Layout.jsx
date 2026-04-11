import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Navbar from './Navbar'
import Footer from './Footer'

function Layout({ children }) {
  const { pathname } = useLocation()
  const isStaffSide =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/kitchen')
  const showHeader = isStaffSide
  const showNavbar = !isStaffSide && pathname !== '/login'

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      {/* Header at top */}
      {showHeader && <Header />}

      {/* Navbar below header */}
      {showNavbar && <Navbar />}

      {/* Main content in middle (grows to fill space) */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Footer at bottom */}
      <Footer />
    </div>
  )
}

export default Layout