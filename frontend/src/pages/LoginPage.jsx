// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Avatar,
  Link as MuiLink
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, setError } = useContext(AuthContext);
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  React.useEffect(() => {
    setError(null);
  }, [setError]);

  const handleChange = (e) => {
    setCreds({ ...creds, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (setError) {
      setError(null);
    }
    
    const email = creds.email.trim();
    const password = creds.password;
    
    if (!email || !password) {
      setSnack({ open: true, message: 'Please enter both email and password.', severity: 'warning' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnack({ open: true, message: 'Please enter a valid email address.', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      if (!login) {
        throw new Error("Login service is not available.");
      }
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error("Login page caught error:", err);
      setSnack({ 
        open: true, 
        message: err.message || 'Login failed. Please check your credentials and try again.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnack({ ...snack, open: false });
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
    >
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, width: '100%', maxWidth: 400, borderRadius: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
            <LockOutlined />
          </Avatar>
          <Typography variant="h5" component="h1" gutterBottom>Sign In</Typography>
        </Box>
        
        {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            required
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            margin="normal"
            value={creds.email}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            fullWidth
            required
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            margin="normal"
            value={creds.password}
            onChange={handleChange}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Box display="flex" justifyContent="space-between" alignItems="center">
             <MuiLink component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
            </MuiLink>
             <MuiLink component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign Up
            </MuiLink>
          </Box>
        </form>
      </Paper>
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
