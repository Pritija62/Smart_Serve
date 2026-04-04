import React from 'react'
import Header from './Header'
import Navbar from './Navbar'
import Footer from './Footer'

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      {/* Header at top */}
      <Header />

      {/* Navbar below header */}
      <Navbar />

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