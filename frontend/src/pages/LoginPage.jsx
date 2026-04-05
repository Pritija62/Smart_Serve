import React, { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

function LoginPage() {
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const [role, setRole] = useState('kitchen')
  const [email, setEmail] = useState('john@restaurant.com')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setIsLoading(true)
      console.log('📝 Login attempt:', { email, role })

      // Call login from AuthContext
      await login(email, password, role)

      console.log('✅ Login successful!')

      // Redirect based on role
      if (role === 'kitchen') {
        navigate('/kitchen')
      } else if (role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error('❌ Login error:', err)
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (e) => {
    const nextRole = e.target.value
    setRole(nextRole)

    if (nextRole === 'kitchen') {
      setEmail('john@restaurant.com')
      setPassword('password123')
    } else if (nextRole === 'admin') {
      setEmail('admin@restaurant.com')
      setPassword('admin123')
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-[#FF8C00] mb-2">Login</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3"
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Role
            </label>
            <select
              value={role}
              onChange={handleRoleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF8C00] bg-white"
            >
              <option value="kitchen">👨‍🍳 Kitchen Staff</option>
              <option value="admin">👨‍💼 Admin</option>
              <option value="customer">👤 Customer</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF8C00]"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Demo: john@restaurant.com, admin@restaurant.com</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF8C00]"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Demo: password123</p>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF8C00] hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition mt-6"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Login
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Back to Home */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full bg-[#008080] hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Back to Home
        </button>

        {/* Footer Text */}
        <p className="text-center text-gray-600 text-xs mt-6">
          This is a demo login page. Use provided credentials to test.
        </p>
      </motion.div>
    </div>
  )
}

export default LoginPage