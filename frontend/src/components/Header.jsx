import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function Header() {
  const { isLoggedIn, user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-[#FF8C00] text-white py-4 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        
        {/* Logo and Restaurant Name */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">🍔</div>
          <div>
            <h1 className="text-2xl font-bold">Restaurant Name</h1>
            <p className="text-xs text-orange-100">Order with Ease</p>
          </div>
        </div>

        {/* Right Side: User Info or Login */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {/* User logged in */}
              <div className="flex items-center gap-2 bg-orange-600 px-4 py-2 rounded-lg">
                <User size={20} />
                <div>
                  <p className="text-sm font-semibold">{user?.username}</p>
                  <p className="text-xs text-orange-100 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-[#008080] hover:bg-teal-700 px-4 py-2 rounded-lg transition font-semibold"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Not logged in - Login link */}
              <a
                href="/login"
                className="flex items-center gap-2 bg-[#008080] hover:bg-teal-700 px-4 py-2 rounded-lg transition font-semibold"
              >
                <User size={18} />
                Login
              </a>
            </>
          )}
        </div>

      </div>
    </header>
  )
}

export default Header