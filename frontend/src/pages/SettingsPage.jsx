import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Paper,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../api/axios';

export default function SettingsPage() {
  const [cfg, setCfg] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    setFetching(true);
    setError(null);
    api.get('/settings')
      .then(({ data }) => { 
          if(data.success) {
            setCfg(data.data || {});
          } else {
             throw new Error(data.message || 'Failed to fetch settings');
          }
       })
      .catch(err => {
          console.error("Error fetching settings:", err);
          setError(err.response?.data?.message || 'Could not load settings.');
      })
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setCfg(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/settings', cfg);
      if (data.success) {
           setSnackbar({ open: true, message: 'Settings updated successfully.', severity: 'success' });
           setCfg(data.data);
      } else {
           throw new Error(data.message || 'Failed to save settings');
      }
     
    } catch (err) {
      console.error("Error saving settings:", err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error saving settings.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
       return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;
  }
  if (error) {
       return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 700 }}>
        <Grid container spacing={2} alignItems="center" mb={3}>
          <Grid item>
            <SettingsIcon fontSize="large" color="primary" />
          </Grid>
          <Grid item>
            <Typography variant="h4" fontWeight={600}>
              Application Settings
            </Typography>
          </Grid>
        </Grid>

        <TextField
          fullWidth
          label="Business Hours"
          name="businessHours"
          margin="normal"
          value={cfg.businessHours || ''}
          onChange={handleChange}
          placeholder="e.g. 09:00 - 18:00"
          helperText="Enter the general operating hours."
        />
        
        <TextField
          fullWidth
          label="Default Currency Code"
          name="defaultCurrency"
          margin="normal"
          value={cfg.defaultCurrency || ''}
          onChange={handleChange}
          placeholder="e.g. INR"
          helperText="3-letter ISO currency code (e.g., INR, USD)."
        />
        
        <Divider sx={{ my: 3 }} />
        
        <TextField
          fullWidth
          label="Booking Policy / Terms"
          name="bookingPolicyText"
          margin="normal"
          multiline
          rows={4}
          value={cfg.bookingPolicyText || ''}
          onChange={handleChange}
          placeholder="Enter your standard booking terms and conditions..."
          helperText="This text might be displayed during the booking process."
        />
        
        <Divider sx={{ my: 3 }} />

        <FormControlLabel
          control={
            <Switch
              name="enableNotifications"
              checked={cfg.enableNotifications ?? false}
              onChange={handleChange}
              color="primary"
            />
          }
          label="Enable Global Notifications"
          sx={{ mt: 1 }}
          helperText="Master switch for system-wide notifications (user preferences may override)."
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
