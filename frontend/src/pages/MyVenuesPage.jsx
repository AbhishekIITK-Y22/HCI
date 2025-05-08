import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Paper,
    Divider,
    Button,
    Stack,
    IconButton
} from '@mui/material';
import { Storefront, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import api from '../api/axios';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

export default function MyVenuesPage() {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchMyVenues = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get('/my-venues')
            .then(({ data }) => {
                if (data.success) {
                    setVenues(data.data || []);
                } else {
                    throw new Error(data.message || 'Failed to fetch venues');
                }
            })
            .catch((err) => {
                console.error("Error fetching owned venues:", err);
                setError(err.response?.data?.message || 'Could not load your venues.');
                setVenues([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchMyVenues();
    }, [fetchMyVenues]);

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={600}>My Venues</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => navigate('/my-venues/add')}
                >
                    Add New Venue
                </Button>
            </Stack>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            {!loading && !error && venues.length === 0 && (
                <Typography sx={{ textAlign: 'center', my: 5 }}>
                    You have not registered any venues yet.
                    <Button onClick={() => navigate('/my-venues/add')} sx={{ml: 1}}>Add one now</Button>
                </Typography>
            )}

            {!loading && !error && venues.length > 0 && (
                <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <List disablePadding>
                        {venues.map((venue, index) => (
                            <React.Fragment key={venue._id}>
                                <ListItem
                                    button 
                                    onClick={() => navigate(`/my-venues/manage/${venue._id}`)}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                                            {venue.images && venue.images[0] ? (
                                                <img src={venue.images[0]} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Storefront />
                                            )}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={venue.name}
                                        secondary={`${venue.location} - Price: ₹${venue.pricePerHour}/hr`}
                                    />
                                </ListItem>
                                {index < venues.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
} 