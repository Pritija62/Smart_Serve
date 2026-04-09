import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
})