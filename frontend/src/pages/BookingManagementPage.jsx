import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Paper,
  Grid,
  TextField,
  LinearProgress,
  Button,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import DataTable from '../components/DataTable';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

export default function BookingManagementPage() {
  const { user } = useContext(AuthContext);

  // State
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Filters
  const [filters, setFilters] = useState({
    venueId: '',
    searchText: '',
    startDate: null,
    endDate: null
  });
  const [availableVenues, setAvailableVenues] = useState([]);

  // Snackbar helper
  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  // Load venues for admin filter
  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/venues?limit=1000')
        .then(({ data }) => {
          if (data.success) setAvailableVenues(data.data || []);
        })
        .catch(err => console.error('Failed to fetch venues:', err));
    }
  }, [user]);

  // Fetch bookings with filters
  const fetchBookings = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = {};
    if (user?.role === 'admin' && filters.venueId) params.venueId = filters.venueId;
    if (filters.searchText) params.search = filters.searchText;
    if (filters.startDate) params.from = filters.startDate.toISOString();
    if (filters.endDate) params.to = filters.endDate.toISOString();

    api.get('/bookings', { params })
      .then(({ data }) => {
        if (data.success) {
          setRows(
            (data.data || []).map(row => ({
              id: row._id,
              customerName: row.user?.name || '-',
              venueName: row.venue?.name || '-',
              startTime: row.startTime ? dayjs(row.startTime).format('DD/MM/YYYY HH:mm') : '-',
              endTime: row.endTime ? dayjs(row.endTime).format('DD/MM/YYYY HH:mm') : '-',
              totalAmount: typeof row.totalAmount === 'number' ? row.totalAmount : '-'
            }))
          );
        } else {
          throw new Error('Failed to load bookings');
        }
      })
      .catch(err => {
        console.error('Error fetching bookings:', err);
        const msg = err.response?.data?.message || err.message;
        setError(msg);
        showSnack(msg, 'error');
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [user, filters]);

  // Initial & filter change reload
  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  // Handle generic filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle date change
  const handleDateChange = (name, date) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  // Column definitions
  const columns = [
    { field: 'customerName', headerName: 'Customer', width: 180, sortable: true, description: 'Customer name' },
    { field: 'venueName',    headerName: 'Venue',    width: 180, sortable: true, description: 'Venue booked' },
    { field: 'startTime',    headerName: 'Start Time',width: 180, sortable: true, description: 'Booking start time' },
    { field: 'endTime',      headerName: 'End Time',  width: 180, sortable: true, description: 'Booking end time' },
    { field: 'totalAmount',  headerName: 'Amount',    width: 100, sortable: true, description: 'Total booking amount' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Booking Management</Typography>

      {/* Filter Panel */}
      <Paper component="fieldset" sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={2}>
        <legend style={{ padding: '0 8px', fontSize: '1.1rem' }}>Filter Bookings</legend>
        <Grid container spacing={2} alignItems="center">

          {/* Venue Autocomplete for admins */}
          {user?.role === 'admin' && (
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={availableVenues}
                getOptionLabel={option => option.name}
                value={availableVenues.find(v => v._id === filters.venueId) || null}
                onChange={(e, newVal) => setFilters(prev => ({ ...prev, venueId: newVal?._id || '' }))}
                isOptionEqualToValue={(opt, val) => opt._id === val._id}
                loadingText="Loading venues..."
                noOptionsText="No venues"
                ListboxProps={{ style: { maxHeight: 200 } }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Venue"
                    size="small"
                    placeholder="Select venue"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              />
            </Grid>
          )}

          {/* Search Customer */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              name="searchText"
              value={filters.searchText}
              onChange={handleFilterChange}
              placeholder="Search Customer"
              size="small"
              fullWidth
              InputProps={{ 'aria-label': 'Search by customer name' }}
            />
          </Grid>

          {/* Date pickers */}
          <Grid item xs={6} sm={4} md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From"
                value={filters.startDate}
                onChange={date => handleDateChange('startDate', date)}
                renderInput={params => <TextField size="small" fullWidth {...params} />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="To"
                value={filters.endDate}
                onChange={date => handleDateChange('endDate', date)}
                renderInput={params => <TextField size="small" fullWidth {...params} />}
              />
            </LocalizationProvider>
          </Grid>

          {/* Apply & Clear */}
          <Grid item xs={12} sm={4} md={2} container spacing={1}>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={fetchBookings}
                aria-label="Apply filters"
              >
                Apply
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                onClick={() => setFilters({ venueId: '', searchText: '', startDate: null, endDate: null })}
                aria-label="Clear filters"
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 2 }} role="alert">{error}</Alert>}

      {/* Table Container */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative', height: '65vh' }} elevation={2}>
        {loading && <LinearProgress aria-label="Loading bookings" />}

        {!loading && rows.length === 0 && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <EventBusyIcon fontSize="large" color="disabled" />
            <Typography variant="h6" color="textSecondary" sx={{ mt: 1 }}>No bookings found.</Typography>
            <Typography variant="body2" color="textSecondary">Try clearing filters or selecting a different date range.</Typography>
          </Box>
        )}

        {!loading && rows.length > 0 && (
          <DataTable
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={row => row.id}
            aria-label="Booking table"
            disableSelectionOnClick
            autoHeight={false}
            pagination
            pageSize={10}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </Paper>

      {/* Snackbar Notification */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom',
 horizontal: 'center' }}
        aria-live="polite"
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
