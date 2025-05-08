import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Button,
    Tabs,
    Tab,
    TextField,
    Stack,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    FormGroup,
    FormControlLabel
} from '@mui/material';
import api from '../api/axios';

// Example Tab Panels (Replace with actual forms/components later)
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`venue-tabpanel-${index}`} aria-labelledby={`venue-tab-${index}`} {...other}>
      {value === index && (
        <Box sx={{ p: 3 }}>{children}</Box>
      )}
    </div>
  );
}

export default function ManageVenuePage() {
    const { venueId } = useParams();
    const navigate = useNavigate();
    const [venue, setVenue] = useState(null);
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);
    const [allAmenities, setAllAmenities] = useState([]);
    const [loadingAmenities, setLoadingAmenities] = useState(false);
    const [allEquipment, setAllEquipment] = useState([]);
    const [loadingEquipment, setLoadingEquipment] = useState(false);

    const fetchAllAmenities = useCallback(() => {
        setLoadingAmenities(true);
        api.get('/amenities')
            .then(({ data }) => {
                 if (data.success) {
                    setAllAmenities(data.data || []);
                } else {
                     console.error("Failed to fetch all amenities");
                     setAllAmenities([]);
                }
            })
            .catch(err => {
                 console.error("Error fetching all amenities:", err);
                 setAllAmenities([]);
            })
            .finally(() => {
                 setLoadingAmenities(false);
            });
    }, []);

    const fetchAllEquipment = useCallback(() => {
        setLoadingEquipment(true);
        api.get('/equipment')
            .then(({ data }) => {
                 if (data.success) {
                    setAllEquipment(data.data || []);
                } else {
                     console.error("Failed to fetch all equipment");
                     setAllEquipment([]);
                }
            })
            .catch(err => {
                 console.error("Error fetching all equipment:", err);
                 setAllEquipment([]);
            })
            .finally(() => {
                 setLoadingEquipment(false);
            });
    }, []);

    const fetchVenue = useCallback(() => {
        setLoading(true);
        setError(null);
        setSaveError(null);
        setSaveSuccess(false);
        api.get(`/venues/${venueId}`)
            .then(({ data }) => {
                if (data.success) {
                    setVenue(data.data);
                    setFormData({
                        name: data.data.name || '',
                        location: data.data.location || '',
                        capacity: data.data.capacity || 0,
                        pricePerHour: data.data.pricePerHour || 0,
                        openingHours: {
                            start: data.data.openingHours?.start || '09:00',
                            end: data.data.openingHours?.end || '21:00'
                        },
                        amenities: data.data.amenities?.map(a => a._id) || [],
                        equipmentList: data.data.equipmentList?.map(e => e._id) || [],
                        images: data.data.images || [],
                    });
                } else {
                    throw new Error(data.message || 'Venue not found');
                }
            })
            .catch(err => {
                console.error("Error fetching venue details:", err);
                setError(err.response?.data?.message || 'Could not load venue details.');
                setVenue(null);
                setFormData(null);
            })
            .finally(() => setLoading(false));
    }, [venueId]);

    useEffect(() => {
        fetchVenue();
        fetchAllAmenities();
        fetchAllEquipment();
    }, [fetchVenue, fetchAllAmenities, fetchAllEquipment]);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaveSuccess(false);
        setSaveError(null);
    };

    const handleTimeChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            openingHours: { ...prev.openingHours, [name]: value }
        }));
        setSaveSuccess(false);
        setSaveError(null);
    };

    const handleAmenityChange = (event) => {
        const { value, checked } = event.target;
        setFormData(prev => {
            const currentAmenities = prev.amenities || [];
            if (checked) {
                return { ...prev, amenities: [...new Set([...currentAmenities, value])] };
            } else {
                return { ...prev, amenities: currentAmenities.filter(id => id !== value) };
            }
        });
         setSaveSuccess(false);
         setSaveError(null);
    };

    const handleEquipmentChange = (event) => {
        const { value, checked } = event.target;
        setFormData(prev => {
            const currentEquipment = prev.equipmentList || [];
            if (checked) {
                return { ...prev, equipmentList: [...new Set([...currentEquipment, value])] };
            } else {
                return { ...prev, equipmentList: currentEquipment.filter(id => id !== value) };
            }
        });
         setSaveSuccess(false);
         setSaveError(null);
    };

    const handleSaveChanges = async () => {
         setSaving(true);
         setSaveError(null);
         setSaveSuccess(false);

         let payload = {};
         if (currentTab === 0) {
             payload = {
                 name: formData.name,
                 location: formData.location,
                 capacity: formData.capacity ? parseInt(formData.capacity, 10) : 0,
                 pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour) : 0,
                 openingHours: formData.openingHours,
             };
         } else if (currentTab === 1) {
             payload = { amenities: formData.amenities || [] };
         } else if (currentTab === 2) {
             payload = { equipmentList: formData.equipmentList || [] };
         }

         console.log('Saving changes for venue:', venueId, 'Payload:', payload);

         try {
             const { data } = await api.put(`/my-venues/${venueId}`, payload);
             if (data.success) {
                 setVenue(prevVenue => ({ ...prevVenue, ...data.data }));
                 if (currentTab === 1) {
                      setFormData(prev => ({...prev, amenities: payload.amenities }));
                 } else if (currentTab === 2) {
                      setFormData(prev => ({...prev, equipmentList: payload.equipmentList }));
                 } else {
                     setFormData(prev => ({ ...prev, ...payload, openingHours: payload.openingHours || prev.openingHours }));
                 }
                 setSaveSuccess(true);
             } else {
                  throw new Error(data.message || 'Failed to update venue');
             }
         } catch (err) {
              console.error("Error updating venue:", err);
             if (err.response?.data?.errors) {
                 setSaveError(err.response.data.errors.map(e => e.msg).join(', '));
             } else {
                  setSaveError(err.response?.data?.message || 'Could not save changes.');
             }
         } finally {
             setSaving(false);
         }
    }

    if (loading || loadingAmenities || loadingEquipment) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    }

    if (!venue || !formData) {
         return <Alert severity="warning" sx={{ m: 3 }}>Venue data could not be loaded.</Alert>;
    }
   console.log("formData.equipmentList", formData.equipmentList);
console.log("allEquipment", allEquipment);
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Manage Venue: {formData.name}</Typography>
             {saveSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>Changes saved successfully!</Alert>}
             {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}
            
            <Paper elevation={3} sx={{ mt: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="venue management tabs">
                        <Tab label="Details" id="venue-tab-0" aria-controls="venue-tabpanel-0" />
                        <Tab label="Amenities" id="venue-tab-1" aria-controls="venue-tabpanel-1" />
                        <Tab label="Equipment" id="venue-tab-2" aria-controls="venue-tabpanel-2" />
                    </Tabs>
                </Box>
                
                <TabPanel value={currentTab} index={0}>
                    <Stack spacing={3}>
                         <TextField 
                            label="Venue Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <TextField 
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            fullWidth
                            multiline
                            rows={3}
                        />
                         <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField 
                                    label="Capacity" 
                                    name="capacity"
                                    type="number"
                                    value={formData.capacity}
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
                                    value={formData.pricePerHour}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                    InputProps={{ inputProps: { min: 0.01, step: "0.01" } }} 
                                />
                            </Grid>
                        </Grid>
                        <Typography variant="subtitle1" sx={{pt: 1}}>Opening Hours</Typography>
                        <Grid container spacing={2}>
                             <Grid item xs={6}>
                                 <TextField 
                                    label="Opening Time"
                                    name="start"
                                    type="time"
                                    value={formData.openingHours.start}
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
                                    value={formData.openingHours.end}
                                    onChange={handleTimeChange}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ step: 300 }}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                        <Button variant="contained" sx={{mt: 2, alignSelf: 'flex-start' }} onClick={handleSaveChanges} disabled={saving}>
                            {saving ? <CircularProgress size={24} /> : 'Save Details'}
                         </Button>
                    </Stack>
                </TabPanel>
                
                <TabPanel value={currentTab} index={1}>
                    <Typography variant="h6" gutterBottom>Select Venue Amenities</Typography>
                     {loadingAmenities ? <CircularProgress /> : (
                         <FormGroup>
                            {allAmenities.map((amenity) => (
                                 <FormControlLabel
                                    key={amenity._id}
                                    control={
                                        <Checkbox 
                                            checked={formData.amenities?.includes(amenity._id) || false}
                                            onChange={handleAmenityChange}
                                            value={amenity._id}
                                        />
                                    }
                                    label={amenity.name}
                                />
                            ))}
                        </FormGroup>
                     )}
                     {allAmenities.length === 0 && !loadingAmenities && (
                         <Typography>No master amenities found. An Admin needs to add them.</Typography>
                     )}
                     <Button variant="contained" sx={{mt: 3}} onClick={handleSaveChanges} disabled={saving || loadingAmenities}>
                         {saving ? <CircularProgress size={24} /> : 'Save Amenities'}
                     </Button>
                </TabPanel>
                
                <TabPanel value={currentTab} index={2}>
                    <Typography variant="h6" gutterBottom>Select Equipment for this Venue</Typography>
                    {loadingEquipment ? (
                        <CircularProgress />
                    ) : (
                        <FormGroup>
                            {allEquipment.length === 0 ? (
                                <Typography color="text.secondary">No equipment available.</Typography>
                            ) : (
                                allEquipment.map(eq => (
                                    <FormControlLabel
                                        key={eq._id}
                                        control={
                                            <Checkbox
                                                checked={formData.equipmentList?.map(String).includes(String(eq._id))}
                                                onChange={handleEquipmentChange}
                                                value={eq._id}
                                            />
                                        }
                                        label={eq.name}
                                    />
                                ))
                            )}
                        </FormGroup>
                    )}
                    <Button
                        variant="contained"
                        sx={{ mt: 3 }}
                        onClick={handleSaveChanges}
                        disabled={saving || loadingEquipment}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Save Equipment'}
                    </Button>
                </TabPanel>
            </Paper>
        </Box>
    );
}