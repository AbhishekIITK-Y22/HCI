import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import ChatBox from '../components/ChatBox';
import {
  LocationOn,
  PeopleAlt,
  AccessTime,
  PriceChange,
  SportsSoccer as EquipmentIcon,
  Wifi as WifiIcon,
  LocalParking as ParkingIcon,
  Shower as ShowerIcon,
  Lock as LockerIcon,
  Restaurant as CafeIcon,
  LocalHospital as FirstAidIcon,
  Wc as RestroomIcon,
  WaterDrop as WaterIcon,
  Lightbulb as LightsIcon,
  Info as DefaultIcon
} from '@mui/icons-material';

const getAmenityIcon = (iconName = 'default') => {
  const iconMap = {
    wifi: <WifiIcon fontSize="small" aria-hidden="true" />,    
    parking: <ParkingIcon fontSize="small" aria-hidden="true" />,
    shower: <ShowerIcon fontSize="small" aria-hidden="true" />,
    showers: <ShowerIcon fontSize="small" aria-hidden="true" />,
    locker: <LockerIcon fontSize="small" aria-hidden="true" />,
    lockers: <LockerIcon fontSize="small" aria-hidden="true" />,
    cafe: <CafeIcon fontSize="small" aria-hidden="true" />,   
    snacks: <CafeIcon fontSize="small" aria-hidden="true" />,
    food: <CafeIcon fontSize="small" aria-hidden="true" />,
    'first aid': <FirstAidIcon fontSize="small" aria-hidden="true" />,
    restroom: <RestroomIcon fontSize="small" aria-hidden="true" />,
    wc: <RestroomIcon fontSize="small" aria-hidden="true" />,
    toilets: <RestroomIcon fontSize="small" aria-hidden="true" />,
    water: <WaterIcon fontSize="small" aria-hidden="true" />,
    'drinking water': <WaterIcon fontSize="small" aria-hidden="true" />,
    lights: <LightsIcon fontSize="small" aria-hidden="true" />,
    floodlights: <LightsIcon fontSize="small" aria-hidden="true" />
  };
  return iconMap[iconName.toLowerCase()] || <DefaultIcon fontSize="small" aria-hidden="true" />;
};

export default function TurfDetailPage() {
  const { id: venueId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [chatVisible, setChatVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const chatButtonRef = useRef(null);

  const fetchVenueData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/venues/${venueId}`),
      api.get(`/equipment/venue/${venueId}/available`)
    ])
      .then(([vRes, eRes]) => {
        if (vRes.data.success) {
          setVenue({ ...vRes.data.data, equipment: eRes.data.data || [] });
        } else throw new Error(vRes.data.message || 'Venue not found');
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.message || 'Could not load venue details.');
        setVenue(null);
      })
      .finally(() => setLoading(false));
  }, [venueId]);

  useEffect(() => { fetchVenueData(); }, [fetchVenueData]);
  useEffect(() => { if (venue?.images?.length) setCurrentImage(0); }, [venue]);

  const handleImageKey = (e, idx) => {
    if (e.key === 'Enter' || e.key === ' ') setCurrentImage(idx);
  };

  const handleContainerKey = e => {
    if (e.key === 'ArrowRight') setCurrentImage(i => (i + 1) % venue.images.length);
    if (e.key === 'ArrowLeft') setCurrentImage(i => (i - 1 + venue.images.length) % venue.images.length);
  };

  const isOwnerOrAdmin = user && (user.role === 'admin' || (venue?.owner && user._id === venue.owner._id));
  const isAdmin = user && user.role === 'admin';
  if (loading) return (
    <Box role="status" aria-live="polite" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress aria-label="Loading venue details" />
    </Box>
  );
  if (error) return (
    <Box role="alert" sx={{ p: 3 }}>
      <Alert severity="error">{error}</Alert>
    </Box>
  );
  if (!venue) return (
    <Box sx={{ p: 3 }}>
      <Typography role="status">Venue details could not be loaded.</Typography>
    </Box>
  );

  return (
    <main>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }} component="section" aria-labelledby="venue-header">
        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={5}>
            <figure>
              <Box
                tabIndex={0}
                role="region"
                aria-roledescription="carousel"
                aria-label={`Image ${currentImage + 1} of ${venue.images.length}`}
                onKeyDown={handleContainerKey}
                sx={{ width: '100%', height: { xs: 200, sm: 250, md: 300 }, overflow: 'hidden', borderRadius: 1, bgcolor: 'grey.200', mb: venue.images.length>1?1:0, outline: 'none', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}
              >
                <img
                  src={venue.images[currentImage] || 'https://source.unsplash.com/600x400/?field'}
                  alt={`Image ${currentImage + 1} of ${venue.name}`}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <figcaption className="sr-only">Carousel of venue images</figcaption>
            </figure>
            {venue.images.length>1 && (
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }} role="group" aria-label="Image thumbnails">
                {venue.images.map((imgUrl, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    loading="lazy"
                    role="button"
                    tabIndex={0}
                    aria-label={`View image ${idx + 1}`}
                    onClick={() => setCurrentImage(idx)}
                    onKeyDown={e => handleImageKey(e, idx)}
                    sx={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 0.5, cursor: 'pointer', border: idx===currentImage?'2px solid':'2px solid transparent', borderColor: idx===currentImage?'primary.main':'transparent', transition: 'border-color 0.2s', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}
                  />
                ))}
              </Stack>
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={7}>
            <Typography id="venue-header" variant="h4" fontWeight={600} gutterBottom tabIndex={-1}>{venue.name}</Typography>
            <Stack component="section" aria-labelledby="location-heading" direction="row" alignItems="center" spacing={1} mb={1}>
              <LocationOn fontSize="small" aria-hidden="true"/>
              <Typography id="location-heading" color="text.secondary">{venue.location}</Typography>
            </Stack>
            <Stack component="section" aria-labelledby="capacity-heading" direction="row" alignItems="center" spacing={1} mb={1}>
              <PeopleAlt fontSize="small" aria-hidden="true"/>
              <Typography id="capacity-heading" color="text.secondary">Capacity: {venue.capacity||'N/A'}</Typography>
            </Stack>
            <Stack component="section" aria-labelledby="hours-heading" direction="row" alignItems="center" spacing={1} mb={2}>
              <AccessTime fontSize="small" aria-hidden="true"/>
              <Typography id="hours-heading" color="text.secondary">Hours: {venue.openingHours?.start||'N/A'} - {venue.openingHours?.end||'N/A'}</Typography>
            </Stack>
            <Typography color="text.secondary" mb={2}>
              Price: ₹{venue.pricePerHour}/hour
            </Typography>
            <Stack direction="row" spacing={2} mt={2}>
            {!isAdmin && (
                <Button variant="contained" onClick={() => navigate(`/booking?venueId=${venueId}`)} aria-label="Book a slot for this venue">Book Slot</Button>
               )} 
              {isOwnerOrAdmin && (
                <Button variant="outlined" onClick={() => navigate(`/my-venues/manage/${venueId}`)} aria-label="Manage this venue">Manage Venue</Button>
              )}
              <Button
                variant="outlined"
                onClick={() => setChatVisible(v=>!v)}
                aria-label="Toggle chat about this venue"
                aria-expanded={chatVisible}
                ref={chatButtonRef}
              >
                Chat About Venue
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Side-by-side panels for Amenities & Equipment */}
      <Grid container spacing={3} sx={{ mb: 3 }} alignItems="stretch">
        <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Accordion defaultExpanded component="section" aria-labelledby="amenities-heading" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography id="amenities-heading" variant="h6">Amenities</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ flex: '1 1 auto', overflowY: 'auto' }}>
              {venue.amenities.length > 0 ? (
                <List dense aria-label="List of amenities">
                  {venue.amenities.map(a => (
                    <ListItem key={a._id} button aria-labelledby={`amenity-${a._id}`}> 
                      <Tooltip title={a.name}>
                        <ListItemIcon>{getAmenityIcon(a.icon || a.name)}</ListItemIcon>
                      </Tooltip>
                      <ListItemText id={`amenity-${a._id}`} primary={a.name} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">No amenities listed.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Accordion defaultExpanded component="section" aria-labelledby="equipment-heading" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography id="equipment-heading" variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <EquipmentIcon aria-hidden="true" sx={{ mr: 1 }} /> Available Equipment
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ flex: '1 1 auto', overflowY: 'auto' }}>
              {venue.equipment.length > 0 ? (
                <Grid container spacing={2}>
                  {venue.equipment.map(eq => (
                    <Grid item xs={12} sm={6} key={eq._id} component="article" aria-labelledby={`equipment-${eq._id}`}>                        
                      <Card variant="outlined">
                        <CardContent>
                          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <EquipmentIcon fontSize="small" aria-hidden="true" />
                            <Typography id={`equipment-${eq._id}`} variant="subtitle1" fontWeight={500}>{eq.name}</Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" gutterBottom>{eq.description}</Typography>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="primary">Price: ₹{eq.rentalPrice}</Typography>
                            <Chip size="small" label={eq.condition.toUpperCase()} variant="outlined" sx={{ fontWeight: 600 }} />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Status: {eq.status}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary">No equipment available.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {chatVisible && <ChatBox venueId={venueId} user={user} />}

      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        action={
          <IconButton size="small" aria-label="close notification" color="inherit" onClick={() => setSnack(s => ({ ...s, open: false }))}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        role="status"
        aria-live="polite"
      >
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </main>
  );
}
