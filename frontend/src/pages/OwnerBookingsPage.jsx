import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  EventAvailable as BookingIcon,
  AttachMoney as RevenueIcon,
  SportsSoccer as VenueIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import DataTable from '../components/DataTable';
import dayjs from 'dayjs';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

// Helper for status chip
const getStatusChip = (status) => {
  const statusConfig = {
    confirmed: { color: 'success', label: 'Confirmed' },
    pending: { color: 'warning', label: 'Pending' },
    cancelled: { color: 'error', label: 'Cancelled' },
    completed: { color: 'info', label: 'Completed' }
  };
  const config = statusConfig[status?.toLowerCase()] || { color: 'default', label: status || 'Unknown' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export default function OwnerBookingsPage() {
  const { user } = useContext(AuthContext);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    activeVenues: 0
  });

  // Fetch venues and bookings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch owner's venues
        const venuesResponse = await api.get('/my-venues');
        if (venuesResponse.data.success) {
          setVenues(venuesResponse.data.data);
          setStats(prev => ({ ...prev, activeVenues: venuesResponse.data.data.length }));
        }

        // Fetch bookings
        const bookingsResponse = await api.get('/bookings/owner');
        if (bookingsResponse.data.success) {
          const bookingsData = bookingsResponse.data.data;
          setBookings(bookingsData);
          
          // Calculate stats
          const totalRevenue = bookingsData.reduce((sum, booking) => 
            booking.status === 'confirmed' ? sum + (booking.totalAmount || 0) : sum, 0);
          const pendingCount = bookingsData.filter(b => b.status === 'pending').length;
          
          setStats(prev => ({
            ...prev,
            totalBookings: bookingsData.length,
            pendingBookings: pendingCount,
            totalRevenue: totalRevenue
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load bookings data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const columns = [
    { field: 'bookingId', headerName: 'Booking ID', width: 150 },
    { field: 'venueName', headerName: 'Venue', width: 200 },
    { field: 'customerName', headerName: 'Customer', width: 180 },
    { 
      field: 'startTime', 
      headerName: 'Date & Time', 
      width: 180,
      valueGetter: (params) => dayjs(params.row.startTime).format('DD/MM/YYYY HH:mm')
    },
    { 
      field: 'duration', 
      headerName: 'Duration', 
      width: 100,
      valueGetter: (params) => `${params.row.duration}h`
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      width: 120,
      valueGetter: (params) => `₹${params.row.totalAmount}`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => getStatusChip(params.row.status)
    }
  ];

  const filteredBookings = selectedVenue === 'all'
    ? bookings
    : bookings.filter(booking => booking.venue?._id === selectedVenue);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Venue Bookings Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <BookingIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h5" fontWeight="bold">{stats.totalBookings}</Typography>
                  <Typography color="text.secondary">Total Bookings</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PendingIcon color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h5" fontWeight="bold">{stats.pendingBookings}</Typography>
                  <Typography color="text.secondary">Pending Bookings</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <RevenueIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h5" fontWeight="bold">₹{stats.totalRevenue}</Typography>
                  <Typography color="text.secondary">Total Revenue</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <VenueIcon color="info" fontSize="large" />
                <Box>
                  <Typography variant="h5" fontWeight="bold">{stats.activeVenues}</Typography>
                  <Typography color="text.secondary">Active Venues</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Venue</InputLabel>
          <Select
            value={selectedVenue}
            label="Filter by Venue"
            onChange={(e) => setSelectedVenue(e.target.value)}
          >
            <MenuItem value="all">All Venues</MenuItem>
            {venues.map((venue) => (
              <MenuItem key={venue._id} value={venue._id}>
                {venue.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: '70vh' }}>
        <DataTable
          rows={filteredBookings.map(booking => ({
            id: booking._id,
            bookingId: booking._id,
            venueName: booking.venue?.name || 'Unknown',
            customerName: booking.user?.name || 'Unknown',
            startTime: booking.startTime,
            duration: booking.duration,
            totalAmount: booking.totalAmount,
            status: booking.status
          }))}
          columns={columns}
          loading={loading}
        />
      </Paper>
    </Box>
  );
}