import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import io from 'socket.io-client'; // Import socket client
import { toast } from 'react-hot-toast';

// Access .env flag
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";

// Create context
export const AuthContext = createContext();

const DEV_USER = {
  _id: "devUserId",
  name: "Dev User",
  email: "dev@example.com",
  avatar: "",
  role: "admin",
  isActive: true,
  isVerified: true,
};

// Define Socket.IO server URL (should be in .env ideally)
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'; 

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null); // Socket instance state
  const [unreadCount, setUnreadCount] = useState(0); // Unread count state
  const [showNotificationSnack, setShowNotificationSnack] = useState({ open: false, message: '' }); // State for snackbar trigger

  // Function to fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
      try {
          const { data } = await api.get('/notifications/unread-count');
          if (data.success) {
              setUnreadCount(data.count);
          }
      } catch (err) {
          console.error("Failed to fetch unread notification count:", err);
      }
  }, []);

  // --- Socket Connection Effect ---
  useEffect(() => {
    let newSocket = null;
    const token = localStorage.getItem("accessToken");

    if (user && token && !SKIP_AUTH) {
      // Connect only if user is logged in and we have a token
      newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        // Optional: Add transports if needed, e.g., ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setSocket(newSocket);
        fetchUnreadCount(); // Fetch count on connect
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setSocket(null);
        setUnreadCount(0); // Reset count on disconnect
        // Handle potential reconnection logic if needed
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setSocket(null);
        setError('Real-time connection failed. Please refresh.'); // Inform user
      });

      // Listen for new notifications from the server
      newSocket.on('new_notification', (notification) => {
        console.log('New notification received:', notification);
        setUnreadCount(prevCount => prevCount + 1);
        // Trigger snackbar display
        setShowNotificationSnack({ open: true, message: notification.message });
        // TODO: Optionally add logic to update notification list if page is open
      });

    } else if (socket) {
        // If user logs out or token disappears, disconnect existing socket
        console.log('Disconnecting socket due to logout or missing token...');
        socket.disconnect();
        setSocket(null);
        setUnreadCount(0);
    }

    // Cleanup function to disconnect socket when component unmounts or user changes
    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection...');
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('new_notification');
        newSocket.disconnect();
      }
    };
  }, [user, fetchUnreadCount]); // Rerun when user state changes

  // Function to fetch user data, used on initial load and after login/register
  const fetchUser = useCallback(async () => {
    console.log('🔄 Fetching user data...'); // Updated debug log
    if (SKIP_AUTH) {
      console.log('⚠️ Skip auth enabled, using dev user'); // Updated debug log
      setUser(DEV_USER);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("accessToken");
    console.log('🔑 Token status:', token ? 'exists' : 'missing'); // Updated debug log
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    try {
      // Axios interceptor handles token attachment
      const { data } = await api.get("/users/me");
      console.log('👤 User data received:', data); // Updated debug log
      if (data.success && data.user && data.user.role) {
        // Store the entire user object
        const userData = {
          ...data.user,
          isAuthenticated: true
        };
        console.log('✅ Setting user data:', userData); // Updated debug log
        setUser(userData);
        await fetchUnreadCount();
      } else {
        console.error('❌ Invalid user data response:', data);
        localStorage.removeItem("accessToken");
        setUser(null);
        throw new Error(data.message || 'Invalid user data received');
      }
    } catch (err) {
      console.error("❌ Error fetching user:", err);
      localStorage.removeItem("accessToken");
      setUser(null);
      setError("Session expired or invalid. Please log in again.");
    } finally {
      setLoading(false);
    }
  }, []); // Remove socket dependency

  // Initial load: check for token and fetch user
  useEffect(() => {
    console.log('🔄 Initial auth check...'); // Debug log
    fetchUser();
  }, [fetchUser]);

  // Login function
  const login = useCallback(async (email, password) => {
    console.log('🔐 Attempting login...'); // Updated debug log
    setError(null);
    if (SKIP_AUTH) {
      console.log('⚠️ Skip auth enabled, using dev user for login'); // Updated debug log
      setUser(DEV_USER);
      return true;
    }
    try {
      const response = await api.post("/auth/login", { email, password }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('✅ Login response:', response.data); // Updated debug log

      if (response.data.success && response.data.user && response.data.user.role) {
        localStorage.setItem("accessToken", response.data.accessToken);
        // Store the entire user object with authentication flag
        const userData = {
          ...response.data.user,
          isAuthenticated: true
        };
        console.log('✅ Setting user after login:', userData); // Updated debug log
        setUser(userData);
        await fetchUnreadCount();
        toast.success('Welcome back, ' + userData.name);
        return true;
      } else {
        console.error('❌ Invalid login response:', response.data);
        throw new Error(response.data.message || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      const message = err.response?.data?.message || err.message || "Invalid credentials";
      setError(message);
      // Don't toast here, let the component handle UI feedback
      // toast.error(message); 
      localStorage.removeItem("accessToken");
      setUser(null);
      throw err; // <-- Re-throw the error
    } finally {
      // setLoading(false); // setLoading is handled in the component calling login
    }
  }, []); // Remove socket dependency

  // Register function
  const register = useCallback(async (userData) => {
    setError(null);
    if (SKIP_AUTH) {
      setUser(DEV_USER);
      return true;
    }
    try {
      // API expects name, email, password, optionally role, phone, avatar
      const { data } = await api.post("/auth/register", userData);
      if (data.success) {
        localStorage.setItem("accessToken", data.accessToken);
        setUser(data.user); // Login user directly after registration
        await fetchUnreadCount();
        toast.success('Registration successful! Welcome, ' + data.user.name);
        return true;
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      const message = err.response?.data?.message || err.message || "Registration failed";
      setError(message);
      toast.error(message);
      localStorage.removeItem("accessToken");
      setUser(null);
      throw err; // Re-throw for component handling
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setError(null);
    if (SKIP_AUTH) {
      setUser(null);
      return;
    }
    try {
      await api.post("/auth/logout", {}, { withCredentials: true }); // Call backend logout with credentials
    } catch (err) {
      console.error("Logout API call failed:", err);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
      if (socket?.connected) {
        socket.disconnect(); // Disconnect socket on logout
      }
      setUnreadCount(0);
      toast.success('Logged out successfully');
    }
  }, [socket]);

  // Function to manually trigger refetch of count (e.g., after marking read)
  const refreshUnreadCount = useCallback(() => {
       if (user && socket?.connected) { // Check if connected
            fetchUnreadCount();
       }
  }, [user, socket, fetchUnreadCount]);

  // Context value
  const contextValue = {
    user,
    setUser,
    login,
    register,
    logout,
    loading,
    error,
    setError,
    socket, // Provide socket instance
    unreadCount, // Provide unread count
    refreshUnreadCount, // Provide function to refetch count
    showNotificationSnack, // Provide state to trigger snackbar
    setShowNotificationSnack // Provide setter to close snackbar
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
