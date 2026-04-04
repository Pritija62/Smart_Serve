import React, { useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Menu, X, Home, UtensilsCrossed, ShoppingCart, Truck, BarChart3, ListTodo } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

function Navbar() {
  const { isLoggedIn, user } = useContext(AuthContext)
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  // Determine which links to show based on role
  const getNavLinks = () => {
    if (!isLoggedIn) {
      // Customer links (not logged in)
      return [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
        { name: 'Cart', href: '/cart', icon: ShoppingCart },
        { name: 'Track Order', href: '/track', icon: Truck },
      ]
    }

    if (user?.role === 'kitchen') {
      // Kitchen staff links
      return [
        { name: 'Dashboard', href: '/kitchen', icon: ListTodo },
      ]
    }

    if (user?.role === 'admin') {
      // Admin links
      return [
        { name: 'Analytics', href: '/admin', icon: BarChart3 },
        { name: 'All Orders', href: '/admin/orders', icon: ListTodo },
      ]
    }

    return []
  }

  const navLinks = getNavLinks()
  const isActive = (href) => location.pathname === href

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="bg-[#F5F5F5] border-b border-gray-300 sticky top-0 z-40 hidden md:block">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-8">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 pb-2 transition font-semibold ${
                    isActive(link.href)
                      ? 'text-[#FF8C00] border-b-2 border-[#FF8C00]'
                      : 'text-gray-700 hover:text-[#FF8C00]'
                  }`}
                >
                  <Icon size={20} />
                  {link.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <div className="md:hidden bg-[#F5F5F5] border-b border-gray-300 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#FF8C00]">Menu</h2>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 hover:text-[#FF8C00]"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border-t border-gray-300 px-4 py-4"
          >
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 py-3 px-2 rounded transition ${
                    isActive(link.href)
                      ? 'bg-[#FF8C00] text-white'
                      : 'text-gray-700 hover:bg-[#F5F5F5]'
                  }`}
                >
                  <Icon size={20} />
                  {link.name}
                </Link>
              )
            })}
          </motion.div>
        )}
      </div>
    </>
  )
}

export default Navbar