import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    CircularProgress,
    Alert,
    Grid
} from '@mui/material';
import api from '../api/axios';

export default function AddVenuePage() {
    const navigate = useNavigate();
    const [venueData, setVenueData] = useState({
        name: '',
        location: '',
        capacity: '',
        pricePerHour: '',
        openingHours: { start: '09:00', end: '21:00' },
        // amenities: [],
        // images: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setVenueData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTimeChange = (e) => {
        const { name, value } = e.target;
        setVenueData(prev => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [name]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Prepare data for API (ensure numbers are numbers)
        const payload = {
            ...venueData,
            capacity: venueData.capacity ? parseInt(venueData.capacity, 10) : 0,
            pricePerHour: venueData.pricePerHour ? parseFloat(venueData.pricePerHour) : 0,
            // Ensure openingHours is included
             openingHours: {
                start: venueData.openingHours.start || '09:00', 
                end: venueData.openingHours.end || '21:00'
             }
        };

        // Basic validation (redundant with backend, but good UX)
        if (!payload.name || !payload.location || payload.pricePerHour <= 0) {
             setError('Name, Location, and a valid Price Per Hour are required.');
             setLoading(false);
             return;
        }

        try {
            console.log('Submitting new venue payload:', payload);
            const { data } = await api.post('/my-venues', payload);
            if (data.success) {
                navigate('/my-venues'); // Redirect back to list on success
            } else {
                throw new Error(data.message || 'Failed to add venue');
            }
        } catch (err) {
            console.error("Error adding venue:", err);
            // Display specific validation errors if backend sends them
            if (err.response?.data?.errors) {
                setError(err.response.data.errors.map(e => e.msg).join(', '));
            } else {
                 setError(err.response?.data?.message || 'Could not add venue. Please check your input.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>Add New Venue</Typography>
            <Paper elevation={3} sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <TextField 
                            label="Venue Name"
                            name="name"
                            value={venueData.name}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <TextField 
                            label="Location"
                            name="location"
                            value={venueData.location}
                            onChange={handleChange}
                            required
                            fullWidth
                            multiline
                            rows={2}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField 
                                    label="Capacity" 
                                    name="capacity"
                                    type="number"
                                    value={venueData.capacity}
                                    onChange={handleChange}
                                    fullWidth
                                    InputProps={{ inputProps: { min: 0 } }}
                                />
                             </Grid>
                             <Grid item xs={12} sm={6}>
                                <TextField 
                                    label="Price Per Hour (INR)" 
                                    name="pricePerHour"
                                    type="number"
                                    value={venueData.pricePerHour}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                     InputProps={{ inputProps: { min: 0.01, step: "0.01" } }}
                                />
                             </Grid>
                        </Grid>

                        <Typography variant="subtitle1" sx={{mt: 1}}>Opening Hours</Typography>
                         <Grid container spacing={2}>
                             <Grid item xs={6}>
                                 <TextField 
                                    label="Opening Time"
                                    name="start"
                                    type="time"
                                    value={venueData.openingHours.start}
                                    onChange={handleTimeChange}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ step: 300 }}
                                    fullWidth
                                />
                            </Grid>
                             <Grid item xs={6}>
                                 <TextField 
                                    label="Closing Time"
                                    name="end"
                                    type="time"
                                    value={venueData.openingHours.end}
                                    onChange={handleTimeChange}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ step: 300 }}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>

                         {/* TODO: Add fields for amenities, equipment, images */} 
                        
                        {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}

                        <Button 
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            fullWidth
                            size="large"
                            sx={{mt: 2}}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Add Venue'}
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Box>
    );
} 