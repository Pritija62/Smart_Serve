import React, { useState } from 'react'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function LoginPage() {
  const { login, user, isLoggedIn, isLoading, error } = useContext(AuthContext)
  const [username, setUsername] = useState('kitchen_staff')
  const [password, setPassword] = useState('password123')

  const handleLogin = async () => {
    try {
      await login(username, password, 'kitchen')
      console.log('Login successful!')
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <div>
      <h1>Test Login Page</h1>

      <div>
        <h2>Login Form</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin} disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </div>

      <div>
        <h2>Auth State</h2>
        <p>Is Logged In: {isLoggedIn ? 'YES' : 'NO'}</p>
        <p>Is Loading: {isLoading ? 'YES' : 'NO'}</p>
        <p>User: {user ? JSON.stringify(user) : 'None'}</p>
        <p>Error: {error ? error : 'None'}</p>
      </div>

      <hr />
      <p><a href="/menu">Go to Test Menu</a></p>
      <p><a href="/">Back to Home</a></p>
    </div>
  )
}