import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as EquipmentIcon,
  Construction as MaintenanceIcon,
  EventAvailable as AvailableIcon,
  EventBusy as CheckedOutIcon
} from '@mui/icons-material';
import DataTable from '../components/DataTable';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

// Status chip helper
const getStatusChip = (status) => {
  switch (status) {
    case 'available':
      return <Chip icon={<AvailableIcon />} label="Available" variant="outlined" size="small" />;
    case 'checkedout':
      return <Chip icon={<CheckedOutIcon />} label="Checked Out" variant="outlined" size="small" />;
    case 'maintenance':
      return <Chip icon={<MaintenanceIcon />} label="Maintenance" variant="outlined" size="small" />;
    default:
      return <Chip label={status || 'Unknown'} size="small" />;
  }
};

export default function EquipmentDashboard() {
  const { user } = useContext(AuthContext);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [confirm, setConfirm] = useState({ open: false, id: null, name: '' });
  const [editItem, setEditItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [venues, setVenues] = useState([]);

  // Load venues for form dropdown
  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/venues')
        .then(res => res.data.success ? setVenues(res.data.data) : setVenues([]))
        .catch(() => setVenues([]));
    }
  }, [user]);

  // Fetch equipment list
  const fetchEquipment = () => {
    if (user?.role !== 'admin') return;
    setLoading(true);
    api.get('/equipment')
      .then(res => {
        if (res.data.success) {
          const list = res.data.data.map(eq => ({
            id: eq._id,
            name: eq.name,
            description: eq.description,
            venueName: eq.venue?.name || 'N/A',
            venueLocation: eq.venue?.location || '',
            rentalPrice: eq.rentalPrice,
            condition: eq.condition,
            status: eq.status,
            currentUserName: eq.currentUser?.name || '-'
          }));
          setEquipment(list);
        } else {
          setEquipment([]);
        }
      })
      .catch(err => {
        console.error(err);
        setEquipment([]);
        setSnack({ open: true, message: 'Failed to fetch equipment', severity: 'error' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchEquipment, [user]);

  // Delete
  const handleDelete = (id, name) => setConfirm({ open: true, id, name });
  const doDelete = () => {
    api.delete(`/equipment/${confirm.id}`)
      .then(() => {
        setSnack({ open: true, message: 'Deleted successfully', severity: 'success' });
        fetchEquipment();
      })
      .catch(() => setSnack({ open: true, message: 'Delete failed', severity: 'error' }))
      .finally(() => setConfirm({ open: false, id: null, name: '' }));
  };

  // Open add/edit modal
  const openModal = (item = null) => {
    setEditItem(item ? { ...item, venue: venues.find(v => `${v.name} (${v.location})` === item.venueName)?. _id || '' } : { name: '', venue: '', rentalPrice: 0, description: '', condition: 'good', status: 'available' });
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const saveItem = () => {
    const payload = { ...editItem, venue: editItem.venue };
    const req = editItem.id ? api.put(`/equipment/${editItem.id}`, payload) : api.post('/equipment', payload);
    req.then(() => {
      setSnack({ open: true, message: `Saved successfully`, severity: 'success' });
      closeModal();
      fetchEquipment();
    }).catch(() => setSnack({ open: true, message: 'Save failed', severity: 'error' }));
  };

  const columns = [
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'venueName', headerName: 'Venue', width: 200 },
    { field: 'rentalPrice', headerName: 'Price (₹)', width: 120 },
    { field: 'condition', headerName: 'Condition', width: 100 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: params => getStatusChip(params.value) },
    { field: 'currentUserName', headerName: 'Checked Out By', width: 160 },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false, renderCell: params => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" onClick={() => openModal(params.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id, params.row.name)}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      )
    }
  ];

  if (user?.role !== 'admin') return <Box p={3}><Alert severity="warning">Admins only</Alert></Box>;

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Equipment</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openModal()}>Add</Button>
      </Stack>
      <Paper><DataTable rows={equipment} columns={columns} loading={loading} /></Paper>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
      <Dialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open: false }))}>
        <DialogTitle>Delete "{confirm.name}"?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirm(c => ({ ...c, open: false }))}>Cancel</Button>
          <Button onClick={doDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      {modalOpen && (
        <Dialog open onClose={closeModal} maxWidth="sm" fullWidth>
          <DialogTitle>{editItem.id ? 'Edit' : 'Add'} Equipment</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField label="Name" name="name" value={editItem.name} onChange={e => setEditItem(i => ({ ...i, name: e.target.value }))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Venue</InputLabel>
                <Select name="venue" value={editItem.venue} label="Venue" onChange={e => setEditItem(i => ({ ...i, venue: e.target.value }))}>
                  {venues.map(v => <MenuItem key={v._id} value={v._id}>{v.name} ({v.location})</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Price (₹)" type="number" name="rentalPrice" value={editItem.rentalPrice} onChange={e => setEditItem(i => ({ ...i, rentalPrice: Number(e.target.value) }))} fullWidth />
              <TextField label="Description" name="description" value={editItem.description} onChange={e => setEditItem(i => ({ ...i, description: e.target.value }))} multiline rows={2} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select name="condition" value={editItem.condition} label="Condition" onChange={e => setEditItem(i => ({ ...i, condition: e.target.value }))}>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={editItem.status} label="Status" onChange={e => setEditItem(i => ({ ...i, status: e.target.value }))}>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="checkedout">Checked Out</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal}>Cancel</Button>
            <Button onClick={saveItem} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
