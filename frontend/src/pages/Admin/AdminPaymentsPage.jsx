import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns'; // Using date-fns for formatting
import api from '../../api/axios'; // Import the configured axios instance
import { AuthContext } from '../../context/AuthContext'; // To ensure user is admin (though backend should enforce)

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext); // Get user context

  useEffect(() => {
    const fetchPayments = async () => {
      // Optional: Add a check here if needed, although backend should enforce admin role
      // if (user?.role !== 'admin') {
      //   setError("Access Denied.");
      //   setLoading(false);
      //   return;
      // }

      setLoading(true);
      setError(null);
      try {
        console.log('Fetching payments...');
        const response = await api.get('/payments');
        console.log('Payments response:', response.data);
        
        if (response.data && response.data.success) {
          // Add a unique 'id' based on '_id' for DataGrid compatibility
          const formattedPayments = response.data.data.map(p => {
            console.log('Processing payment:', p);
            return { 
              ...p, 
              id: p._id,
              // Ensure all required fields have default values
              amount: p.amount || 0,
              status: p.status || 'unknown',
              createdAt: p.createdAt || new Date().toISOString(),
              paymentMethod: p.paymentMethod || 'N/A',
              transactionId: p.transactionId || 'N/A'
            };
          });
          console.log('Formatted payments:', formattedPayments);
          setPayments(formattedPayments);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch payments');
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError(err.response?.data?.message || err.message || "An error occurred while fetching payments.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]); // Re-fetch if user context changes (e.g., logout/login)

  const columns = [
    { 
      field: '_id', 
      headerName: 'Payment ID', 
      width: 220,
      valueGetter: (params) => params.row._id || 'N/A'
    },
    { 
      field: 'payerId', 
      headerName: 'Payer', 
      width: 200, 
      valueGetter: (params) => params.row.payerId?.name || 'N/A'
    },
    { 
      field: 'payerEmail', 
      headerName: 'Payer Email', 
      width: 220, 
      valueGetter: (params) => params.row.payerId?.email || 'N/A'
    },
    { 
      field: 'amount', 
      headerName: 'Amount (INR)', 
      type: 'number',
      width: 130,
      valueGetter: (params) => params.row.amount || 0,
      valueFormatter: (params) => {
        try {
          const value = Number(params.value);
          if (isNaN(value)) return 'N/A';
          return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
        } catch (e) {
          console.error('Error formatting amount:', e);
          return 'N/A';
        }
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      valueGetter: (params) => params.row.status || 'unknown',
      renderCell: (params) => {
        try {
          let color = 'default';
          const status = (params.value || '').toLowerCase();
          if (status === 'success') color = 'success';
          else if (status === 'pending') color = 'warning';
          else if (status === 'failed') color = 'error';
          return <Chip label={params.value || 'N/A'} color={color} size="small" />;
        } catch (e) {
          console.error('Error rendering status:', e);
          return <Chip label="Error" color="error" size="small" />;
        }
      }
    },
    { 
      field: 'bookingVenue', 
      headerName: 'Venue', 
      width: 180, 
      valueGetter: (params) => params.row.booking?.venue?.name || 'N/A'
    },
    { 
      field: 'createdAt', 
      headerName: 'Payment Date', 
      width: 180,
      valueGetter: (params) => params.row.createdAt || new Date().toISOString(),
      valueFormatter: (params) => {
        try {
          if (!params.value) return 'N/A';
          const date = new Date(params.value);
          if (isNaN(date.getTime())) return 'Invalid Date';
          return format(date, 'dd MMM yyyy, hh:mm a');
        } catch (e) {
          console.error('Error formatting date:', e);
          return 'Invalid Date';
        }
      }
    },
    { 
      field: 'paymentMethod', 
      headerName: 'Method', 
      width: 100,
      valueGetter: (params) => params.row.paymentMethod || 'N/A'
    },
    { 
      field: 'transactionId', 
      headerName: 'Transaction ID', 
      width: 250,
      valueGetter: (params) => params.row.transactionId || 'N/A'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Payments...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  console.log('Rendering DataGrid with payments:', payments);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Manage Payments (Admin)</Typography>
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={payments}
          columns={columns}
          paginationModel={{ page: 0, pageSize: 10 }}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          error={error}
          loading={loading}
          getRowId={(row) => row._id || row.id}
        />
      </Paper>
    </Box>
  );
} 