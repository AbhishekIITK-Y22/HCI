// src/pages/AmenitiesPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Box,
  TextField,
  Snackbar,
  Alert,
  Stack,
  Dialog,
  DialogActions,
  DialogTitle,
  Paper,
  ListItemIcon
} from '@mui/material';
import { Delete, BuildCircle, Info as DefaultIcon, Wifi as WifiIcon, LocalParking as ParkingIcon, Shower as ShowerIcon, Lock as LockerIcon, Restaurant as CafeIcon, LocalHospital as FirstAidIcon, Wc as RestroomIcon, WaterDrop as WaterIcon, Lightbulb as LightsIcon } from '@mui/icons-material';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';
import api from '../api/axios';

// Helper to get MUI Icon Component based on name
const getAmenityIconComponent = (iconName = 'default') => {
    const lowerIconName = iconName?.toLowerCase();
    switch (lowerIconName) {
        case 'wifi': return <WifiIcon />; 
        case 'parking': return <ParkingIcon />; 
        case 'shower': case 'showers': return <ShowerIcon />; 
        case 'locker': case 'lockers': return <LockerIcon />;
        case 'cafe': case 'snacks': case 'food': return <CafeIcon />;
        case 'first aid': case 'first-aid': return <FirstAidIcon />;
        case 'restroom': case 'toilets': case 'wc': return <RestroomIcon />;
        case 'water': case 'drinking water': return <WaterIcon />;
        case 'lights': case 'floodlights': return <LightsIcon />;
        // Add more mappings as needed
        default: return <DefaultIcon />; // Use Info icon as default
    }
};

export default function AmenitiesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dlgOpen, setDlgOpen] = useState(false);
  // Initialize edit state with icon
  const [edit, setEdit] = useState({ name: '', description: '', icon: '' }); 
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [deleteId, setDeleteId] = useState(null);

  const fetch = () => {
    setLoading(true);
    api.get('/amenities')
      // Ensure response data is mapped correctly if needed (check API response structure)
      .then(({ data }) => { 
        if (data.success && Array.isArray(data.data)) {
          setRows(data.data.map(item => ({ ...item, id: item._id }))); // Ensure `id` field for DataTable
        } else {
          throw new Error('Invalid data format received');
        }
       })
      .catch(() => showSnack('Failed to load amenities', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const handleSave = () => {
    if (!edit.name.trim()) {
      return showSnack('Amenity name is required', 'warning');
    }
    // Include icon in the payload
    const payload = { name: edit.name, description: edit.description, icon: edit.icon }; 

    const req = edit._id
      ? api.put(`/amenities/${edit._id}`, payload)
      : api.post('/amenities', payload);

    req
      .then(() => {
        showSnack(`Amenity ${edit._id ? 'updated' : 'added'} successfully`);
        fetch();
        setDlgOpen(false);
        // Reset edit state including icon
        setEdit({ name: '', description: '', icon: '' }); 
      })
      .catch(() => showSnack('Failed to save amenity', 'error'));
  };

  const handleDelete = () => {
    api.delete(`/amenities/${deleteId}`)
      .then(() => {
        showSnack('Amenity deleted');
        fetch();
      })
      .catch(() => showSnack('Failed to delete amenity', 'error'))
      .finally(() => setDeleteId(null));
  };

  const columns = [
    // Display actual Icon 
    {
      field: 'iconDisplay',
      headerName: 'Icon',
      width: 80,
      renderCell: (params) => (
          <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
              {getAmenityIconComponent(params.row.icon)}
          </ListItemIcon>
      ),
      sortable: false,
      filterable: false
    },
    { field: 'name', headerName: 'Amenity', width: 200 },
    { field: 'description', headerName: 'Description', flex: 1 }, // Use flex for description
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => { 
            // Ensure icon is included when setting edit state
            setEdit({ ...p.row, icon: p.row.icon || '' }); 
            setDlgOpen(true); 
          }}>
            Edit
          </Button>
          <Button size="small" color="error" onClick={() => setDeleteId(p.row._id)}>
            <Delete fontSize="small" />
          </Button>
        </Stack>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>Amenities Management</Typography>
      <Button
        variant="contained"
        color="success"
        sx={{ mb: 2 }}
        onClick={() => {
          // Reset edit state including icon when adding
          setEdit({ name: '', description: '', icon: '' }); 
          setDlgOpen(true);
        }}
      >
        Add Amenity
      </Button>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', height: '70vh' }}>
        {/* Ensure DataTable has proper height/layout */}
        <DataTable rows={rows} columns={columns} loading={loading} />
      </Paper>

      <FormDialog
        open={dlgOpen}
        title={edit._id ? 'Edit Amenity' : 'Add Amenity'}
        onClose={() => setDlgOpen(false)}
        onSave={handleSave}
      >
        <Stack spacing={2} mt={1}>
          <TextField
            label="Amenity Name"
            name="name"
            value={edit.name}
            onChange={e => setEdit(prev => ({ ...prev, name: e.target.value }))}
            required
            fullWidth
            helperText="e.g., WiFi, Parking, Locker"
          />
          <TextField
            label="Description"
            name="description"
            value={edit.description}
            onChange={e => setEdit(prev => ({ ...prev, description: e.target.value }))}
            required
            fullWidth
            helperText="Describe what this amenity offers"
          />
          <TextField
            label="Icon Name"
            name="icon"
            value={edit.icon}
            onChange={e => setEdit(prev => ({ ...prev, icon: e.target.value }))}
            required
            fullWidth
            helperText="Choose an icon name, e.g., wifi, parking"
          />
        </Stack>
      </FormDialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Are you sure you want to delete this amenity?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
