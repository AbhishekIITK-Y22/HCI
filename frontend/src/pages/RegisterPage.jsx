import React, { useState, useContext } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Link as MuiLink,
  useTheme,
  Avatar,
  CircularProgress
} from '@mui/material';
import { PersonAddOutlined } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register, authError, setAuthError } = useContext(AuthContext) || {};
  const isDark = theme.palette.mode === 'dark';
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (setAuthError) {
      setAuthError(null);
    }
  }, [setAuthError]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
    setAuthError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (setAuthError) {
      setAuthError(null);
    }
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      if (!register) {
        throw new Error('Registration service not available');
      }
      const userData = { 
        name: form.name.trim(), 
        email: form.email.trim(), 
        password: form.password 
      };
      await register(userData);
      navigate('/');
    } catch (err) {
      console.error("Register page caught error:", err);
      if (setAuthError) {
        setAuthError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      px={2}
      sx={{
        backgroundColor: isDark ? '#121212' : '#f0f2f5',
        transition: 'background-color 0.3s ease'
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: { xs: 2, sm: 5 },
          borderRadius: 2,
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: 'secondary.main', mb: 1 }}>
                <PersonAddOutlined />
            </Avatar>
            <Typography variant="h5" component="h1" gutterBottom>Create Account</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          Join us by filling out the form below.
        </Typography>

        {authError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof authError === 'string' ? authError : 'An error occurred during registration.'}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            required
            label="Full Name"
            name="name"
            fullWidth
            margin="dense"
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            autoComplete="name"
            disabled={loading}
          />
          <TextField
            required
            label="Email Address"
            name="email"
            type="email"
            fullWidth
            margin="dense"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            autoComplete="email"
            disabled={loading}
          />
          <TextField
            required
            label="Password"
            name="password"
            type="password"
            fullWidth
            margin="dense"
            value={form.password}
            onChange={handleChange}
            error={!!errors.password || (authError && authError.includes('Password'))}
            helperText={errors.password}
            autoComplete="new-password"
            disabled={loading}
          />
          <TextField
            required
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            fullWidth
            margin="dense"
            value={form.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            autoComplete="new-password"
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={24} color="inherit"/> : 'Sign Up'}
          </Button>
        </form>

        <Typography variant="body2" align="center" sx={{ mt: 3 }}>
          Already have an account?{' '}
          <MuiLink component={RouterLink} to="/login" underline="hover">
            Log In Here
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}
