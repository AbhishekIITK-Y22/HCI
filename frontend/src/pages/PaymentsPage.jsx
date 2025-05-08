import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use different endpoint based on user role
        const endpoint = user?.role === 'admin' ? '/payments' : '/payments/owner';
        const { data: payload } = await api.get(endpoint);
        
        if (payload.success) {
          const formattedPayments = payload.data.map(p => ({
            id: p._id,
            paymentId: p._id,
            payerName: p.payerId?.name ?? 'Unknown',
            payerEmail: p.payerId?.email ?? 'Unknown',
            amount: typeof p.amount === 'number' ? p.amount : p.booking?.totalAmount ?? 0,
            status: p.status ?? 'N/A',
            venueName: p.booking?.venue?.name ?? 'Unknown',
            createdAt: format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm'),
            paymentMethod: p.paymentMethod ?? 'N/A',
            transactionId: p.transactionId ?? 'N/A'
          }));
          setPayments(formattedPayments);
        } else {
          throw new Error(payload.message || 'Failed to fetch payments');
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError(err.response?.data?.message || 'Could not load payments data');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const columns = [
    { field: 'paymentId', headerName: 'Payment ID', width: 150 },
    { field: 'payerName', headerName: 'Payer', width: 150 },
    { field: 'payerEmail', headerName: 'Payer Email', width: 180 },
    {
      field: 'amount',
      headerName: 'Amount (INR)',
      width: 140,
      renderCell: params => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
          ₹{params.value}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: params => {
        const status = String(params.value || '').toLowerCase();
        let color = 'default';
        let icon = null;
        if (status === 'success' || status === 'paid') {
          color = 'success';
          icon = '✔️';
        } else if (status === 'pending') {
          color = 'warning';
          icon = '⏳';
        } else if (status === 'failed') {
          color = 'error';
          icon = '❌';
        }
        return (
          <Chip
            label={
              <span>
                {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
                {params.value || 'N/A'}
              </span>
            }
            color={color}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        );
      }
    },
    { field: 'venueName', headerName: 'Venue', width: 170 },
    { field: 'createdAt', headerName: 'Payment Date', width: 180 },
    { field: 'paymentMethod', headerName: 'Method', width: 110 },
    { field: 'transactionId', headerName: 'Transaction ID', width: 180 }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="primary" size={48} />
        <Typography sx={{ mt: 3, fontWeight: 500, color: '#1976d2' }}>Loading Payments...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 500 }}>{error}</Alert>
        <Typography variant="body2" color="text.secondary">Please try refreshing the page or check your connection.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 600, width: '100%', p: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1976d2' }}>
        {user?.role === 'admin' ? 'All Payments' : 'Venue Payments'}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Paper
        elevation={3}
        sx={{
          height: 'calc(100% - 60px)',
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          background: '#fafbfc'
        }}
      >
        <DataGrid
          rows={payments}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
            sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] }
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#e3f2fd'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#e0e7ef',
              fontWeight: 700,
              fontSize: 16
            },
            '& .MuiDataGrid-cell': {
              fontSize: 15
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default PaymentsPage;
