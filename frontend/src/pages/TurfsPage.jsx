// src/pages/TurfsPage.jsx
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import {
    SportsSoccer as EquipmentIcon,
    Wifi as AmenityIcon,
    Search as SearchIcon
} from '@mui/icons-material';

// Helper function to get an icon based on amenity name (can be expanded)
// In a real app, this mapping or the icon name might come from the amenity data itself
const getAmenityIcon = (iconName) => {
    // Add more mappings as needed
    switch (iconName?.toLowerCase()) {
        case 'wifi': return <AmenityIcon fontSize="small" />;
        case 'parking': return <i className="fas fa-parking" style={{ fontSize: '0.9em', marginRight: '4px' }}></i>; // Example using FontAwesome if included
        case 'shower': return <i className="fas fa-shower" style={{ fontSize: '0.9em', marginRight: '4px' }}></i>;
        default: return <AmenityIcon fontSize="small" />; // Default icon
    }
};

export default function TurfsPage() {
  const { user } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVenue, setEditVenue] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVenues = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/venues')
      .then(({ data }) => {
        if (data.success) {
          setVenues(data.data.map(v => ({ ...v, id: v._id })));
        } else {
          throw new Error(data.message || 'Failed to load venues');
        }
      })
      .catch((err) => {
        console.error("Error fetching venues:", err);
        setError(err.response?.data?.message || 'Could not load venues.');
        setVenues([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const showSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });

  const handleOpenDialog = (venue = null) => {
    setEditVenue(venue ? { ...venue } : { name: '', location: '', capacity: '', pricePerHour: '', imageUrl: '' });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditVenue(null);
  };

  const handleFormChange = (e) => {
    setEditVenue(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!editVenue) return;

    if (!editVenue.name || !editVenue.location || !editVenue.pricePerHour) {
        showSnack('Name, Location, and Price Per Hour are required', 'warning');
        return;
    }

    const payload = {
        name: editVenue.name,
        location: editVenue.location,
        capacity: Number(editVenue.capacity) || 0,
        pricePerHour: Number(editVenue.pricePerHour),
        images: editVenue.imageUrl ? [editVenue.imageUrl] : []
    };
    
    const apiCall = editVenue._id
      ? api.put(`/venues/${editVenue._id}`, payload)
      : api.post('/venues', { ...payload, owner: user?._id });

    try {
        const { data } = await apiCall;
        if (data.success || data._id) {
            showSnack(`Venue ${editVenue._id ? 'updated' : 'added'} successfully`);
            handleCloseDialog();
            fetchVenues();
        } else {
             throw new Error(data.message || 'Failed to save venue');
        }
    } catch (err) {
        console.error("Error saving venue:", err);
        showSnack(err.response?.data?.message || 'Could not save venue', 'error');
    }
  };

  // Filter venues based on search term
  const filteredVenues = useMemo(() => {
      if (!searchTerm) return venues;
      return venues.filter(venue => 
          venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venue.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [venues, searchTerm]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems="center" 
          mb={3}
          spacing={2}
      >
        <Typography variant="h4" fontWeight={600}>Available Venues</Typography>
        <TextField
            variant="outlined"
            size="small"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
        />
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
         </Box>
      )}
      
      {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {!loading && !error && filteredVenues.length === 0 && (
        <Typography sx={{ textAlign: 'center', my: 5 }}>
            {searchTerm ? `No venues found matching "${searchTerm}".` : 'No venues available currently.'}
        </Typography>
      )}
      
      {!loading && !error && filteredVenues.length > 0 && (
        <Grid container spacing={3}> 
          {filteredVenues.map(venue => (
            <Grid item xs={12} sm={6} md={4} key={venue.id}>
              <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={venue.images && venue.images[0] ? venue.images[0] : 'https://source.unsplash.com/400x200/?field'}
                  alt={venue.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" noWrap>
                      {venue.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {venue.location}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Capacity: {venue.capacity || 'N/A'}
                  </Typography>
                   <Typography variant="body2" sx={{ mt: 1 }}>
                    Price: ₹{venue.pricePerHour || 'N/A'} / hour
                  </Typography>
                  
                  {venue.amenities && venue.amenities.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                       <Typography variant="caption" color="text.secondary" display="block">Amenities:</Typography>
                       <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {venue.amenities.slice(0, 4).map(am => (
                            <Tooltip title={am.name} key={am._id}>
                                <Chip 
                                    icon={getAmenityIcon(am.icon || am.name)}
                                    label={am.name.length > 10 ? `${am.name.substring(0, 8)}...` : am.name}
                                    size="small" 
                                    variant="outlined"
                                />
                             </Tooltip>
                          ))}
                          {venue.amenities.length > 4 && (
                              <Chip label={`+${venue.amenities.length - 4} more`} size="small"/>
                          )}
                       </Stack>
                    </Box>
                  )}

                  {venue.equipmentList && venue.equipmentList.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                       <Typography variant="caption" color="text.secondary" display="block">Equipment:</Typography>
                       <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {venue.equipmentList.slice(0, 3).map(eq => (
                            <Tooltip title={eq.name} key={eq._id}>
                                <Chip 
                                    icon={<EquipmentIcon fontSize="small" />} 
                                    label={eq.name.length > 10 ? `${eq.name.substring(0, 8)}...` : eq.name}
                                    size="small" 
                                    variant="outlined"
                                />
                             </Tooltip>
                          ))}
                          {venue.equipmentList.length > 3 && (
                              <Chip label={`+${venue.equipmentList.length - 3} more`} size="small"/>
                          )}
                       </Stack>
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ pt: 0 }}>
                  <Button size="small" onClick={() => navigate(`/turfs/${venue.id}`)}>
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {editVenue && (
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editVenue._id ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                name="name"
                label="Venue Name"
                fullWidth
                required
                value={editVenue.name}
                onChange={handleFormChange}
              />
              <TextField
                name="location"
                label="Location"
                fullWidth
                required
                value={editVenue.location}
                onChange={handleFormChange}
              />
              <TextField
                name="capacity"
                label="Capacity"
                type="number"
                fullWidth
                value={editVenue.capacity}
                onChange={handleFormChange}
              />
              <TextField
                name="pricePerHour"
                label="Price Per Hour (₹)"
                type="number"
                fullWidth
                required
                value={editVenue.pricePerHour}
                onChange={handleFormChange}
              />
              <TextField
                name="imageUrl"
                label="Image URL (Optional)"
                fullWidth
                value={editVenue.imageUrl || (editVenue.images && editVenue.images[0]) || ''}
                onChange={handleFormChange}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>
              {editVenue._id ? 'Save Changes' : 'Add Venue'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
