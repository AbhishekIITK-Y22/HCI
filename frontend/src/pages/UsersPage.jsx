import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
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
  Avatar,
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
  FormHelperText,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  PersonAddAlt1 as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon, 
  Block as DeactivateIcon, 
  CheckCircle as ActivateIcon
} from '@mui/icons-material';
import DataTable from '../components/DataTable';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext'; // To check admin role if needed

// Helper to get avatar initials or display image
const getAvatarContent = (user) => {
    if (user.avatar) {
        return <Avatar src={user.avatar} alt={user.name} />;
    }
    // Basic initial generation
    const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    return <Avatar>{initials}</Avatar>;
};

// Helper for Role Chip color
const getRoleChipColor = (role) => {
    switch (role) {
        case 'admin': return 'error';
        case 'turfOwner': return 'warning';
        case 'coach': return 'info';
        case 'player': return 'success';
        default: return 'default';
    }
};

export default function UsersPage() {
  const { user: loggedInUser } = useContext(AuthContext); // Check if needed for permissions
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, userId: null, userName: '' });
  const [editUser, setEditUser] = useState(null); // User object being edited/added
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get('/users') // New backend endpoint
      .then(({ data }) => {
        if (data.success) {
            setUsers(data.users.map(u => ({ ...u, id: u._id }))); // Add id for DataGrid
        } else {
            throw new Error(data.message || 'Failed to fetch users');
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        showSnack(err.response?.data?.message || 'Could not fetch users', 'error');
        setUsers([]); // Clear users on error
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Delete Logic ---
  const handleDeleteClick = (userId, userName) => {
    setConfirmDelete({ open: true, userId, userName });
  };

  const handleCloseConfirmDelete = () => {
    setConfirmDelete({ open: false, userId: null, userName: '' });
  };

  const handleConfirmDelete = async () => {
    const userId = confirmDelete.userId;
    if (!userId) return;
    
    try {
      const { data } = await api.delete(`/users/${userId}`);
      if (data.success) {
        showSnack('User deleted successfully');
        fetchUsers(); // Refresh the list
      } else {
         throw new Error(data.message || 'Failed to delete user');
      }
    } catch (err) {
       console.error("Error deleting user:", err);
       showSnack(err.response?.data?.message || 'Could not delete user', 'error');
    } finally {
      handleCloseConfirmDelete();
    }
  };
  
  // --- Status Toggle Logic ---
  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
        const { data } = await api.put(`/users/${userId}/status`, { isActive: newStatus });
        if (data.success) {
            showSnack(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
            fetchUsers(); // Refresh
        } else {
            throw new Error(data.message || 'Failed to update status');
        }
    } catch (err) {
        console.error("Error toggling user status:", err);
        showSnack(err.response?.data?.message || 'Could not update user status', 'error');
    }
  };
  
  // --- Edit/Add Logic ---
  const handleOpenEditModal = (user = null) => {
    // Reset with default password field empty for Add User
    setEditUser(user ? { ...user } : { 
        name: '', email: '', password: '', role: 'player', phone: '', 
        isActive: true, isVerified: false 
    }); 
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditUser(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditUser(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveUser = async () => {
    const isAdding = !editUser?._id;

    // Validation
    if (!editUser || !editUser.name || !editUser.email || !editUser.role) { 
        showSnack('Name, Email, and Role are required', 'warning');
        return; 
    }
    if (isAdding && (!editUser.password || editUser.password.length < 6)) {
        showSnack('Password is required and must be at least 6 characters when adding a user.', 'warning');
        return;
    }

    let apiCall;
    let payload = { ...editUser };

    if (isAdding) {
        // Use the new Admin endpoint POST /users
        apiCall = api.post('/users', payload); // Send the whole state including password
    } else {
        // Use the existing PUT /users/:id for updates
        // Remove password field if present for updates (shouldn't be sent)
        delete payload.password; 
        apiCall = api.put(`/users/${editUser._id}`, payload); 
    }

    try {
        const { data } = await apiCall;
        if (data.success) {
            showSnack(`User ${isAdding ? 'added' : 'updated'} successfully`);
            handleCloseEditModal();
            fetchUsers(); // Refresh
        } else {
            // Use error message from backend response if available
            throw new Error(data.message || `Failed to ${isAdding ? 'add' : 'update'} user`);
        }
    } catch (err) {
        console.error(`Error ${isAdding ? 'adding' : 'updating'} user:`, err);
        showSnack(err.response?.data?.message || `Could not ${isAdding ? 'add' : 'update'} user`, 'error');
        // Keep modal open on error
    }
  };

  // --- Columns for DataTable ---
  const columns = useMemo(() => [
    { 
        field: 'avatar', 
        headerName: '', 
        width: 60, 
        renderCell: (params) => getAvatarContent(params.row),
        sortable: false, filterable: false
    },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'email', headerName: 'Email', width: 220 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={getRoleChipColor(params.value)} size="small" />
      ),
    },
    { field: 'phone', headerName: 'Phone', width: 130, sortable: false },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value ? 'Active' : 'Inactive'} color={params.value ? 'success' : 'error'} size="small" variant="outlined" />
      ),
    },
    {
      field: 'isVerified',
      headerName: 'Verified',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value ? 'Yes' : 'No'} color={params.value ? 'success' : 'default'} size="small" variant="outlined" />
      ),
    },
    { 
        field: 'createdAt', 
        headerName: 'Created At', 
        width: 150, 
        renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEditModal(params.row)} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.isActive ? "Deactivate" : "Activate"}>
            <IconButton size="small" onClick={() => handleToggleStatus(params.row.id, params.row.isActive)} color={params.row.isActive ? "warning" : "success"}>
              {params.row.isActive ? <DeactivateIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDeleteClick(params.row.id, params.row.name)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [handleOpenEditModal, handleDeleteClick, handleToggleStatus]); // Add dependencies

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>User Management</Typography>
        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenEditModal(null)} // Open modal for adding new user
        >
          Add User
        </Button>
      </Stack>

      {/* TODO: Add Filtering options here (by role, status, search) */}

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DataTable rows={users} columns={columns} loading={loading} />
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack(prev => ({ ...prev, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog for Deletion */}
      <Dialog
        open={confirmDelete.open}
        onClose={handleCloseConfirmDelete}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{confirmDelete.userName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit/Add User Dialog */}
       <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser?._id ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField 
            autoFocus 
            margin="dense" 
            name="name" 
            label="Name" 
            type="text" 
            fullWidth 
            value={editUser?.name || ''} 
            onChange={handleEditFormChange} 
            required
          />
          <TextField 
            margin="dense" 
            name="email" 
            label="Email Address" 
            type="email" 
            fullWidth 
            value={editUser?.email || ''} 
            onChange={handleEditFormChange} 
            required 
            disabled={!!editUser?._id} // Disable email editing for existing users
          />
          {/* Show Password field only when adding */}
          {!editUser?._id && (
             <TextField 
                margin="dense" 
                name="password" 
                label="Initial Password" 
                type="password" 
                fullWidth 
                value={editUser?.password || ''} 
                onChange={handleEditFormChange} 
                required 
                helperText="Minimum 6 characters. User should change this on first login."
             />
          )}
          <TextField 
            margin="dense" 
            name="phone" 
            label="Phone (Optional)" 
            type="tel" 
            fullWidth 
            value={editUser?.phone || ''} 
            onChange={handleEditFormChange} 
          />
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              name="role"
              value={editUser?.role || 'player'}
              label="Role"
              onChange={handleEditFormChange}
            >
              <MenuItem value="player">Player</MenuItem>
              <MenuItem value="coach">Coach</MenuItem>
              <MenuItem value="turfOwner">Turf Owner</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          {/* Add Toggles for isActive and isVerified */}
          <FormControlLabel
            control={<Switch checked={editUser?.isActive ?? true} onChange={handleEditFormChange} name="isActive" />}
            label="Account Active"
            sx={{ mt: 1 }}
          />
          <FormControlLabel
            control={<Switch checked={editUser?.isVerified ?? false} onChange={handleEditFormChange} name="isVerified" />}
            label="Email Verified"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {editUser?._id ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
} 