// src/pages/ExpensesPage.jsx
import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import dayjs from 'dayjs';
import { Delete as DeleteIcon } from '@mui/icons-material';

export default function ExpensesPage() {
  const { user } = useContext(AuthContext) || {};
  const allowedRoles = ['admin', 'turfOwner'];
  if (!allowedRoles.includes(user?.role)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          You do not have permission to view this page.
        </Typography>
      </Box>
    );
  }

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState({ _id: '', date: '', amount: '', category: '', description: '', venueId: '' });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [ownerVenues, setOwnerVenues] = useState([]);
  const [isVenueLoading, setIsVenueLoading] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({ open: false, id: null, description: '' });

  // Fetch expenses and flatten nested objects
  const fetchExpenses = () => {
    setLoading(true);
    api.get('/expenses')
      .then(({ data }) => {
        if (data.success && Array.isArray(data.data)) {
          const formatted = data.data.map(item => ({
            id: item._id,
            date: item.date,
            amount: item.amount,
            category: item.category,
            description: item.description,
            venueName: item.venueId?.name || '-',
            recordedBy: item.userId?.name || '-',
            rawVenueId: item.venueId?._id,
            rawUserId: item.userId?._id,
          }));
          setRows(formatted);
        } else {
          throw new Error(data.message || 'Failed to fetch expenses');
        }
      })
      .catch((err) => {
        showSnack(err.response?.data?.message || 'Could not load expenses', 'error');
        setRows([]);
      })
      .finally(() => setLoading(false));
  };

  // Fetch Owner's Venues if applicable
  const fetchOwnerVenues = () => {
    if (user?.role === 'turfOwner') {
      setIsVenueLoading(true);
      api.get('/my-venues')
        .then(({ data }) => {
          if (data.success) {
            setOwnerVenues(data.data || []);
          } else {
            showSnack('Could not load your venues for selection.', 'warning');
            setOwnerVenues([]);
          }
        })
        .catch(() => {
          showSnack('Error loading your venues.', 'error');
          setOwnerVenues([]);
        })
        .finally(() => setIsVenueLoading(false));
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchOwnerVenues();
  }, []);

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const handleSave = () => {
    if (!edit.date || !edit.amount || !edit.category) {
      return showSnack('Date, Amount, and Category are required', 'warning');
    }
    if (user?.role === 'turfOwner' && !edit.venueId) {
      return showSnack('Please select the venue for this expense.', 'warning');
    }

    const payload = {
      date: edit.date,
      amount: Number(edit.amount),
      category: edit.category,
      description: edit.description,
      ...( (user?.role === 'turfOwner' || user?.role === 'admin') && edit.venueId && { venueId: edit.venueId } )
    };

    const req = edit._id
      ? api.put(`/expenses/${edit._id}`, payload)
      : api.post('/expenses', payload);

    req
      .then((res) => {
        if (res.data?.success) {
          showSnack(`Expense ${edit._id ? 'updated' : 'recorded'} successfully`);
          setDialogOpen(false);
          setEdit({ _id: '', date: '', amount: '', category: '', description: '', venueId: '' });
          fetchExpenses();
        } else {
          throw new Error(res.data?.message || `Failed to ${edit._id ? 'update' : 'record'} expense`);
        }
      })
      .catch((err) => showSnack(err.response?.data?.message || err.message || 'Failed to save expense', 'error'));
  };

  // Delete Handlers
  const handleDeleteClick = (id, description) => {
    setDeleteInfo({ open: true, id, description: description || `Expense on ${edit.date}` });
  };
  const handleCloseConfirmDelete = () => setDeleteInfo({ open: false, id: null, description: '' });
  const handleDeleteConfirm = async () => {
    const idToDelete = deleteInfo.id;
    if (!idToDelete) return;
    try {
      const { data } = await api.delete(`/expenses/${idToDelete}`);
      if (data.success) {
        showSnack('Expense deleted successfully');
        fetchExpenses();
      } else {
        throw new Error(data.message || 'Failed to delete expense');
      }
    } catch (err) {
      showSnack(err.response?.data?.message || 'Could not delete expense', 'error');
    } finally {
      handleCloseConfirmDelete();
    }
  };

  const columns = useMemo(() => [
    {
      field: 'date', headerName: 'Date', width: 130,
      renderCell: params => params.value ? dayjs(params.value).format('YYYY-MM-DD') : ''
    },
    {
      field: 'amount', headerName: 'Amount', width: 120,
      renderCell: params => `₹${params.value}`
    },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'description', headerName: 'Description', width: 250 },
    {
      field: 'venueName', headerName: 'Venue', width: 180,
      hide: user?.role !== 'admin'
    },
    {
      field: 'recordedBy', headerName: 'Recorded By', width: 150,
      hide: user?.role !== 'admin'
    },
    {
      field: 'actions', headerName: 'Actions', width: 180, sortable: false, filterable: false,
      renderCell: params => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => {
            setEdit({
              _id: params.row.id,
              date: params.row.date ? dayjs(params.row.date).format('YYYY-MM-DD') : '',
              amount: params.row.amount,
              category: params.row.category,
              description: params.row.description,
              venueId: params.row.rawVenueId
            });
            setDialogOpen(true);
          }}>
            Edit
          </Button>
          {user?.role === 'admin' && (
            <Button
              size="small"
              color="error"
              onClick={() => handleDeleteClick(params.row.id, params.row.description)}
              startIcon={<DeleteIcon fontSize="small" />}
            >
              Delete
            </Button>
          )}
        </Stack>
      )
    }
  ], [user]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>Expenses</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" color="success" onClick={() => {
          setEdit({ _id: '', date: '', amount: '', category: '', description: '', venueId: '' });
          setDialogOpen(true);
        }}>
          Record Expense
        </Button>
      </Stack>

      {loading ? <CircularProgress /> : <DataTable rows={rows} columns={columns} loading={loading} />}

      <FormDialog open={dialogOpen} title={edit._id ? 'Edit Expense' : 'New Expense'} onClose={() => setDialogOpen(false)} onSave={handleSave}>
        <TextField
          fullWidth
          label="Date"
          type="date"
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={edit.date}
          onChange={e => setEdit(prev => ({ ...prev, date: e.target.value }))}
          required
        />
        <TextField
          fullWidth
          label="Amount"
          type="number"
          margin="normal"
          value={edit.amount}
          onChange={e => setEdit(prev => ({ ...prev, amount: e.target.value }))}
          required
        />
        <TextField fullWidth select label="Category" margin="normal" value={edit.category} onChange={e => setEdit(prev => ({ ...prev, category: e.target.value }))} required>
          <MenuItem value="Maintenance">Maintenance</MenuItem>
          <MenuItem value="Utilities">Utilities</MenuItem>
          <MenuItem value="Salaries">Salaries</MenuItem>
          <MenuItem value="Marketing">Marketing</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
        <TextField
          fullWidth
          label="Description"
          multiline
          rows={3}
          margin="normal"
          value={edit.description}
          onChange={e => setEdit(prev => ({ ...prev, description: e.target.value }))}
        />
        {user?.role === 'turfOwner' && (
          <FormControl fullWidth margin="normal" required disabled={isVenueLoading}>
            <InputLabel id="venue-select-label">Venue</InputLabel>
            <Select
              labelId="venue-select-label"
              name="venueId"
              value={edit.venueId}
              label="Venue"
              onChange={e => setEdit(prev => ({ ...prev, venueId: e.target.value }))}
            >
              <MenuItem value=""><em>Select Venue</em></MenuItem>
              {isVenueLoading ? (
                <MenuItem value="" disabled>Loading venues...</MenuItem>
              ) : ownerVenues.length > 0 ? (
                ownerVenues.map(v => (
                  <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>No venues found</MenuItem>
              )}
            </Select>
          </FormControl>
        )}
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteInfo.open} onClose={handleCloseConfirmDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this expense record?
            <br/>
            <em>{deleteInfo.description}</em>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDelete}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(prev => ({ ...prev, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(prev => ({ ...prev, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
