import React from 'react'
import { Phone, MapPin, Mail } from 'lucide-react'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Restaurant Info */}
          <div>
            <h3 className="text-2xl font-bold text-[#FF8C00] mb-4">🍔 Restaurant Name</h3>
            <p className="text-gray-300 text-sm">
              Serving delicious food with love and care. Your satisfaction is our priority!
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-[#FF8C00] mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone size={18} color="#008080" />
                <p className="text-gray-300 text-sm">+1-800-FOOD-123</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} color="#008080" />
                <p className="text-gray-300 text-sm">123 Main Street, Food City</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} color="#008080" />
                <p className="text-gray-300 text-sm">info@restaurant.com</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-[#FF8C00] mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-gray-300 hover:text-[#FF8C00] transition text-sm">
                  Home
                </a>
              </li>
              <li>
                <a href="#menu" className="text-gray-300 hover:text-[#FF8C00] transition text-sm">
                  Menu
                </a>
              </li>
              <li>
                <a href="#track" className="text-gray-300 hover:text-[#FF8C00] transition text-sm">
                  Track Order
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-300 hover:text-[#FF8C00] transition text-sm">
                  About Us
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          {/* Copyright */}
          <div className="text-center text-gray-400 text-sm">
            <p>© {currentYear} Restaurant Name. All rights reserved.</p>
            <p className="mt-2">
              Built with ❤️ for food lovers
            </p>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer