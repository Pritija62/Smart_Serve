import React from 'react'
import { Phone, MapPin, Mail, UtensilsCrossed, Heart } from 'lucide-react'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
      
          {/* Copyright */}
          <div className="text-center text-gray-400 text-sm">
            <p>© {currentYear} Restaurant Name. All rights reserved.</p>
            <p className="mt-2 inline-flex items-center gap-1">
              Built with <Heart size={14} className="text-red-400" /> for food lovers
            </p>
          </div>
       

      </div>
    </footer>
  )
}

export default Footer