import React, { createContext, useEffect, useState } from 'react'
import { socket } from '../services/socket'


// Create the context
export const SocketContext = createContext()

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
// Provider component
export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    console.log('🔌 Connecting to Socket.IO server...')

    const handleConnect = () => {
      console.log('✅ Socket connected! ID:', socket.id)
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected')
      setIsConnected(false)
    }

    const handleConnectError = (error) => {
      console.error('⚠️ Connection error:', error)
    }

    const handleReconnectAttempt = () => {
      console.log('🔄 Attempting to reconnect...')
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('reconnect_attempt', handleReconnectAttempt)

    if (socket.connected) {
      setIsConnected(true)
    }

    return () => {
      console.log('🧹 Cleaning up Socket.IO connection listeners')
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('reconnect_attempt', handleReconnectAttempt)
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}