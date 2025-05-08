import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

/**
 * A route guard component that ensures the user is authenticated and has the required role before rendering children.
 * - Skips auth in development when VITE_SKIP_AUTH=true
 * - Shows a loading indicator while auth status is being determined
 * - Redirects unauthenticated users to /login, preserving intended destination
 * - Redirects unauthorized users to home page
 */
export default function RequireAuth({ children, allowedRoles = ['admin', 'turfOwner', 'player', 'coach'] }) {
  // Allow bypass in development
  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return <>{children}</>;
  }

  const { user, loading, error } = useContext(AuthContext);
  const location = useLocation();

  // While checking auth state, show spinner
  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Checking authentication status...
        </Typography>
      </Box>
    );
  }

  // If there's an authentication error, show a message
  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="error">
          Authentication failed. Please try again.
        </Typography>
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated but not authorized, redirect to home
  if (!allowedRoles.includes(user.role)) {
    console.log(`RequireAuth: Unauthorized access attempt by ${user.role} to route requiring ${allowedRoles}. Redirecting.`);
    return <Navigate to="/" replace />;
  }

  // If authenticated and authorized, render children
  console.log(`RequireAuth: Authorizing access for user ${user?.email} (role: ${user?.role}) to render children.`);
  return <>{children}</>;
}
