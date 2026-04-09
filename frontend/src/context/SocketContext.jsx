import React, { createContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

// Create the context
export const SocketContext = createContext()

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
// Provider component
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // ===== CONNECT TO BACKEND =====
    console.log('🔌 Connecting to Socket.IO server...')

    const newSocket = io(socketUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
})

    // ===== SOCKET EVENTS =====

    // When connection is established
    newSocket.on('connect', () => {
      console.log('✅ Socket connected! ID:', newSocket.id)
      setIsConnected(true)
    })

    // When disconnected
    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
      setIsConnected(false)
    })

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('⚠️ Connection error:', error)
    })

    // Reconnection attempt
    newSocket.on('reconnect_attempt', () => {
      console.log('🔄 Attempting to reconnect...')
    })

    // Save socket to state
    setSocket(newSocket)

    // ===== CLEANUP =====
    return () => {
      console.log('🧹 Cleaning up Socket.IO connection')
      newSocket.close()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}