import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import io from 'socket.io-client';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const useSocket = import.meta.env.VITE_USE_SOCKET === 'true';
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('accessToken');

    // Clear any existing socket connection
    if (socket?.connected) {
      console.log('🔌 Disconnecting existing socket connection');
      socket.disconnect();
      setSocket(null);
    }

    // Early return if socket is disabled or no user/token
    if (!useSocket) {
      console.log('🔌 Socket connection disabled in config');
      return;
    }

    if (skipAuth) {
      console.log('🔌 Socket connection skipped due to skipAuth');
      return;
    }

    if (!user || !user.role || !token) {
      console.log('🔌 Socket connection waiting for user data and token');
      return;
    }

    console.log('🔌 Attempting socket connection...', { userId: user._id, role: user.role });
    setLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');

    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      path: '/socket.io'
    });

    newSocket.on('connect', () => {
      if (isMounted) {
        console.log('✅ Socket connected:', newSocket.id, 'User:', user.name);
        setSocket(newSocket);
        setLoading(false);
        setError(null);
      }
    });

    newSocket.on('connect_error', (err) => {
      if (isMounted) {
        console.error('❌ Socket connection error:', err.message);
        setError(err.message || 'Socket connection failed');
        setLoading(false);
        setSocket(null);
      }
    });

    newSocket.on('disconnect', (reason) => {
      if (isMounted) {
        console.log('⚠️ Socket disconnected:', reason);
        setSocket(null);
      }
    });

    return () => {
      isMounted = false;
      if (newSocket) {
        console.log('🔌 Cleaning up socket connection...', newSocket.id);
        newSocket.disconnect();
        setSocket(null);
      }
    };
  }, [user?._id, useSocket, skipAuth]); // Changed dependency to user._id for more precise updates

  return (
    <SocketContext.Provider value={{ socket, loading, error }}>
      {children}
    </SocketContext.Provider>
  );
}
