import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, Alert, List, ListItem, ListItemText, ListItemIcon, Divider, CircularProgress, Chip, Stack } from '@mui/material';
import { Event as EventIcon, Stadium as StadiumIcon, CheckCircle as ConfirmedIcon, Pending as PendingIcon, Cancel as CancelledIcon, ErrorOutline as ErrorIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

// Helper to format currency
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Helper for status chip
const getStatusChip = (status) => {
    switch (status?.toLowerCase()) {
        case 'confirmed':
            return <Chip label="Confirmed" color="success" size="small" icon={<ConfirmedIcon />} />;
        case 'pending':
            return <Chip label="Pending Payment" color="warning" size="small" icon={<PendingIcon />} />;
        case 'cancelled':
            return <Chip label="Cancelled" color="error" size="small" icon={<CancelledIcon />} />;
        default:
            return <Chip label={status || 'Unknown'} size="small" icon={<ErrorIcon />} />;
    }
};

export default function MyBookingsPage() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    api.get('/bookings') 
      .then(({ data }) => {
        if (data.success && Array.isArray(data.data)) {
            const sortedBookings = data.data.sort((a, b) => dayjs(b.startTime).diff(dayjs(a.startTime)));
            setBookings(sortedBookings);
        } else {
            throw new Error(data.message || 'Failed to load bookings.');
        }
      })
      .catch(err => {
        console.error("Error fetching bookings:", err);
        setError(err.response?.data?.message || 'Could not load your bookings.');
        setBookings([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        My Bookings
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
        </Box>
      )}
      
      {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {!loading && !error && (
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
            {bookings.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">You haven't made any bookings yet.</Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {bookings.map((booking, index) => (
                        <React.Fragment key={booking._id}> 
                            <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                                <ListItemIcon sx={{ mt: 0.5, mr: 1 }}><StadiumIcon /></ListItemIcon>
                                <ListItemText
                                    primary={`Venue: ${booking.venue?.name || 'Unknown Venue'}`}
                                    secondary={`Date: ${dayjs(booking.startTime).format('ddd, MMM D, YYYY')} | Time: ${dayjs(booking.startTime).format('h:mm A')} - ${dayjs(booking.endTime).format('h:mm A')}`}
                                    primaryTypographyProps={{ fontWeight: 'medium' }}
                                />
                                <Stack direction="column" alignItems="flex-end" spacing={0.5} sx={{ ml: 2, textAlign: 'right' }}>
                                    {getStatusChip(booking.status)}
                                    <Typography variant="body2" fontWeight="medium">{formatCurrency(booking.totalAmount)}</Typography>
                                </Stack>
                            </ListItem>
                            {index < bookings.length - 1 && <Divider component="li" variant="inset" />} 
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Paper>
      )}
    </Box>
  );
} 