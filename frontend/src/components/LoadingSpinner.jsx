import React from 'react'
import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#F5F5F5]">
      {/* Rotating spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader size={50} color="#FF8C00" strokeWidth={2} />
      </motion.div>

      {/* Loading text */}
      <p className="mt-5 text-lg font-bold text-gray-800">Loading...</p>
    </div>
  )
}

export default LoadingSpinner