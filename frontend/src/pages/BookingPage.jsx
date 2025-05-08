import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
    Typography,
    Paper,
    Grid,
  Button,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
  Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Divider,
    TextField, // For date selection
    Snackbar
} from '@mui/material';
import { CheckCircleOutline, ErrorOutline, EventSeat, SportsSoccer, CalendarMonth, AddShoppingCart } from '@mui/icons-material';
import dayjs from 'dayjs';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { loadStripe } from '@stripe/stripe-js'; // Import Stripe
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'; // Import Stripe Elements

// Load Stripe outside component to avoid recreating on renders
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Example steps for booking
const steps = ['Select Date & Slot', 'Confirm Details', 'Payment'];

// Internal component for the payment form
function CheckoutForm({ clientSecret, paymentId, bookingAmount, onPaymentSuccess, onPaymentError }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements || !paymentId) {
            console.error("Stripe.js not loaded or missing paymentId");
            setPaymentError('Payment system not ready or missing details.');
            return;
        }

        setIsProcessing(true);
        setPaymentError(null);

        const cardElement = elements.getElement(CardElement);

        // 1. Confirm payment with Stripe
        const { error: stripePaymentError, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: { card: cardElement } }
        );

        if (stripePaymentError) {
            console.error("[stripe error]", stripePaymentError);
            setPaymentError(stripePaymentError.message || "An unexpected error occurred during payment.");
            setIsProcessing(false);
            onPaymentError(stripePaymentError.message);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
             console.log("[PaymentIntent Succeeded]", paymentIntent);
             // 2. Call backend to CONFIRM payment and CREATE booking
             try {
                 // Use the new endpoint and send only paymentId
                 const confirmRes = await api.post(`/payments/confirm`, { paymentId }); 
                 if (confirmRes.data && confirmRes.data.success) {
                     onPaymentSuccess(confirmRes.data); // Pass backend response (contains booking details)
                 } else {
                      throw new Error(confirmRes.data?.message || 'Backend confirmation failed after successful payment.');
                 }
             } catch (backendError) {
                  console.error("Error confirming payment/creating booking on backend:", backendError);
                  const errMsg = backendError.response?.data?.message || backendError.message || 'Booking confirmation failed after payment.';
                  // Critical error: Payment succeeded, but booking failed (e.g., race condition)
                  setPaymentError(`Payment OK, but booking failed: ${errMsg}. Contact support.`);
                  onPaymentError(errMsg, true); // Pass flag indicating critical error
                  // DO NOT set processing false here - user needs support
                  return; // Stop processing
             }
        } else {
             // Handle other payment intent statuses if needed
             console.warn("[PaymentIntent Status]", paymentIntent?.status);
             setPaymentError(`Payment status: ${paymentIntent?.status || 'unknown'}`);
             onPaymentError(`Payment status: ${paymentIntent?.status || 'unknown'}`);
        }
        // Only set processing false if it wasn't a critical backend error
        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Typography variant="subtitle1" gutterBottom>Enter Card Details</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
            </Paper>
            {paymentError && <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>}
            <Button 
                type="submit" 
                variant="contained" 
                fullWidth
                disabled={!stripe || !clientSecret || !paymentId || isProcessing}
            >
                {isProcessing ? <CircularProgress size={24} color="inherit"/> : `Pay ${formatCurrency(bookingAmount)}`}
            </Button>
        </form>
    );
}

// Helper to format currency (assuming INR for now)
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export default function BookingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const venueId = searchParams.get('venueId');

    const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [venueDetails, setVenueDetails] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedEquipment, setSelectedEquipment] = useState([]); // IDs of selected equipment
    const [bookingDetails, setBookingDetails] = useState(null); // Store details before payment
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const [bookingResponse, setBookingResponse] = useState(null); // Store response from POST /api/bookings
    const [isCreatingBooking, setIsCreatingBooking] = useState(false); // Loading state for API call
    const [clientSecret, setClientSecret] = useState(null); // For Stripe Payment Intent
    const [paymentId, setPaymentId] = useState(null); // Store our Payment record ID
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [availableEquipment, setAvailableEquipment] = useState([]); // Added: Store venue's equipment
    const [isInitiatingPayment, setIsInitiatingPayment] = useState(false); // Renamed loading state
    const [paymentSuccessData, setPaymentSuccessData] = useState(null); // Store success data

    const showSnack = (message, severity = 'success') =>
        setSnack({ open: true, message, severity });

    // Fetch Venue Details
    useEffect(() => {
        if (!venueId) {
            setError('No venue specified for booking.');
            setLoading(false);
            return;
        }
        setLoading(true);
        api.get(`/venues/${venueId}`)
            .then(({ data }) => {
                if (data.success) {
                    setVenueDetails(data.data);
                } else {
                    throw new Error(data.message || 'Could not load venue details.');
                }
            })
            .catch(err => {
                console.error("Error fetching venue:", err);
                setError(err.response?.data?.message || 'Could not load venue details.');
            })
            .finally(() => setLoading(false)); // Keep loading until slots are fetched too
    }, [venueId]);

    // Set available equipment when venue details load
    useEffect(() => {
        if (venueDetails?.equipmentList) {
            setAvailableEquipment(venueDetails.equipmentList);
        } else {
            setAvailableEquipment([]);
        }
    }, [venueDetails]);

    // Fetch Available Slots when venue or date changes
    const fetchAvailableSlots = useCallback(() => {
        if (!venueId || !selectedDate) return;
        setLoading(true);
        setError(null);
        setAvailableSlots([]); // Clear previous slots
        
        api.get(`/bookings/slots/${venueId}?date=${selectedDate}`)
           .then(({ data }) => { 
               if(data.success) {
                   // Use the data structure returned by the backend
                   const slotsFromApi = data.slots.map(slot => ({ 
                       ...slot, // Includes startTime, endTime, date, price, available
                       _id: slot.startTime, // Use startTime as a temporary unique key for React list
                       time: slot.timeString // Use the user-friendly string for display
                   }));
                   setAvailableSlots(slotsFromApi);
                   setError(null);
               } else {
                   throw new Error(data.message || 'Could not load slots');
               }
            })
           .catch(err => {
                console.error("Error fetching slots:", err);
                setError(err.response?.data?.message || 'Could not load available slots for this date.');
                setAvailableSlots([]);
           })
           .finally(() => setLoading(false));
        
    }, [venueId, selectedDate]); // Remove venueDetails dependency

  useEffect(() => {
        // Fetch slots only when venue details are loaded and valid date/venueId exists
        if (venueDetails && selectedDate && venueId) { 
            fetchAvailableSlots();
        }
        // If venue details haven't loaded yet, the effect in fetchAvailableSlots handles loading state
    }, [venueDetails, selectedDate, venueId, fetchAvailableSlots]);

    const handleDateChange = (event) => {
        const newDate = event.target.value;
        setSelectedDate(newDate);
        setSelectedSlot(null); // Reset selected slot when date changes
        setSelectedEquipment([]); // Reset equipment selection when date changes
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot); 
        // Keep equipment selection even if slot changes on same day
    };

    // Implemented: Toggle equipment selection
    const handleEquipmentToggle = (equipmentId) => {
        setSelectedEquipment((prevSelected) =>
            prevSelected.includes(equipmentId)
                ? prevSelected.filter((id) => id !== equipmentId) // Remove if already selected
                : [...prevSelected, equipmentId] // Add if not selected
        );
    };
    
    // Calculate total estimated cost (including selected equipment)
    const calculatedTotal = useMemo(() => {
        if (!selectedSlot || !venueDetails) return 0;
        
        let total = selectedSlot.price || (venueDetails.pricePerHour || 0); // Use slot price if available, else venue hourly

        if (selectedEquipment.length > 0 && availableEquipment.length > 0) {
            const equipmentCost = selectedEquipment.reduce((sum, eqId) => {
                const equipmentItem = availableEquipment.find(item => item._id === eqId);
                return sum + (equipmentItem?.rentalPrice || 0);
            }, 0);
            // Assuming equipment price is also per hour/slot like the venue
            total += equipmentCost; 
        }
        return total;
    }, [selectedSlot, selectedEquipment, availableEquipment, venueDetails]);

    const handleNext = async () => {
        if (activeStep === 0) { // Moving from Slot Selection to Confirmation
            if (!selectedSlot) {
                showSnack('Please select a time slot.', 'warning');
                return;
            }
            // Prepare booking details for confirmation display
            const selectedEquipmentDetails = availableEquipment.filter(eq => selectedEquipment.includes(eq._id));
            setBookingDetails({
                venueName: venueDetails?.name,
                location: venueDetails?.location,
                date: selectedDate,
                slotTime: selectedSlot.time, // Use the time string
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                equipment: selectedEquipmentDetails, // Store full details for display
                estimatedTotal: calculatedTotal,
            });
            setActiveStep((prevActiveStep) => prevActiveStep + 1);

        } else if (activeStep === 1) { // Moving from Confirmation to Payment
            if (!bookingDetails) {
                showSnack('Booking details missing. Please go back.', 'error');
                return;
            }
            
            setIsInitiatingPayment(true);
            setError(null);
            setPaymentError(null);
            setClientSecret(null);
            setPaymentId(null);

            try {
                // Call the NEW backend endpoint to INITIATE payment
                const initiatePayload = {
                    venueId: venueId,
                    startTime: bookingDetails.startTime,
                    endTime: bookingDetails.endTime,
                    equipmentIds: selectedEquipment, // Send only IDs
                    // coachId: optionalCoachId, // TODO: Add if coach selection is implemented
                    calculatedAmount: bookingDetails.estimatedTotal // Send the amount calculated by frontend
                };
                
                const initiateRes = await api.post('/payments/initiate', initiatePayload);

                if (!initiateRes.data || !initiateRes.data.success) {
                    throw new Error(initiateRes.data?.message || 'Failed to initiate payment process.');
                }
                
                // We receive clientSecret and our paymentId
                setClientSecret(initiateRes.data.clientSecret);
                setPaymentId(initiateRes.data.paymentId);
                
                // Update bookingDetails with potentially corrected amount from backend if needed?
                // For now, we trust the frontend amount sent, backend recalculates/validates
                
                setActiveStep((prevActiveStep) => prevActiveStep + 1);

            } catch (err) {
                console.error("Error initiating payment:", err);
                // Show error specific to this step
                setError(err.response?.data?.message || err.message || 'Could not initiate payment.');
                showSnack(err.response?.data?.message || err.message || 'Could not initiate payment.', 'error');
            } finally {
                setIsInitiatingPayment(false);
            }
        }
    };

    const handleBack = () => {
        if (isInitiatingPayment) return; 
        setError(null); // Clear errors when going back
        setPaymentError(null);
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    // Handle payment success from CheckoutForm
    const handlePaymentSuccess = (backendResponse) => { // Receives full backend response now
        console.log("Payment & Booking Confirmed!", backendResponse);
        setPaymentSuccessData(backendResponse); // Store success data if needed
        showSnack('Payment successful! Booking confirmed.', 'success');
        // Optionally navigate after a delay
        setTimeout(() => navigate('/my-bookings'), 3000);
    };

    // Handle payment error from CheckoutForm
    const handlePaymentError = (errorMessage, isCritical = false) => {
        setPaymentError(errorMessage); // Display error in the payment step UI
        const snackSeverity = isCritical ? 'error' : 'warning';
        showSnack(`Payment failed: ${errorMessage}`, snackSeverity);
        // If critical (e.g., booking failed after payment), user stays on payment page with error
        // If not critical (e.g., card declined), user can potentially retry
    };

    // --- Render Content for Each Step --- 

    const renderStepContent = (step) => {
        switch (step) {
            case 0: // Select Date & Slot & Equipment
                return (
                    <Grid container spacing={3}>
                        {/* Date & Slot Selection */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Select Date and Time</Typography>
                            <TextField
                                type="date"
                                label="Booking Date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: dayjs().format('YYYY-MM-DD') }}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            {loading && <CircularProgress size={24} sx={{display: 'block', margin: 'auto'}}/>}
                            {!loading && availableSlots.length > 0 && (
                                <List dense component={Paper} variant="outlined">
                                    {availableSlots.map((slot) => (
                                        <ListItem
                                            key={slot._id} 
                                            button
                                            selected={selectedSlot?.startTime === slot.startTime}
                                            onClick={() => handleSlotSelect(slot)}
                                            disabled={!slot.available}
                                        >
                                            <ListItemIcon>
                                                <EventSeat color={slot.available ? 'success' : 'disabled'}/>
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={slot.time}
                                                secondary={slot.available ? `${formatCurrency(slot.price)}` : 'Unavailable'}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                            {!loading && availableSlots.length === 0 && !error && (
                                <Typography color="text.secondary">No available slots for the selected date.</Typography>
                            )}
                             {error && !loading && (
                                <Alert severity="warning" sx={{mt: 1}}>{error}</Alert>
                            )}
                        </Grid>
                        {/* Equipment Selection - Added */}
                        <Grid item xs={12} md={6}>
                             <Typography variant="h6" gutterBottom>Rent Equipment (Optional)</Typography>
                             {availableEquipment.length > 0 ? (
                                 <List dense component={Paper} variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                                     {availableEquipment.map((eq) => (
                                         <ListItem
                                             key={eq._id}
                                             button
                                             onClick={() => handleEquipmentToggle(eq._id)}
                                             // Potentially disable if selectedSlot isn't chosen yet?
                                             disabled={!selectedSlot} 
                                         >
                                             <ListItemIcon>
                                                 <Checkbox
                                                     edge="start"
                                                     checked={selectedEquipment.includes(eq._id)}
                                                     tabIndex={-1}
                                                     disableRipple
                                                     disabled={!selectedSlot}
                                                 />
                                             </ListItemIcon>
                                             <ListItemText 
                                                id={`equipment-label-${eq._id}`} 
                                                primary={eq.name} 
                                                secondary={`${formatCurrency(eq.rentalPrice)} / slot`}
                                            />
                                         </ListItem>
                                     ))}
                                 </List>
                             ) : (
                                 <Typography color="text.secondary">No equipment available for rent at this venue.</Typography>
                             )}
                        </Grid>
                    </Grid>
                );
            case 1: // Confirm Details
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Confirm Your Booking</Typography>
                        {bookingDetails ? (
                            <List component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                <ListItem>
                                    <ListItemText primary="Venue" secondary={bookingDetails.venueName} />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemText primary="Date" secondary={dayjs(bookingDetails.date).format('dddd, MMMM D, YYYY')} />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemText primary="Time Slot" secondary={bookingDetails.slotTime} />
                                </ListItem>
                                {bookingDetails.equipment && bookingDetails.equipment.length > 0 && (
                                    <React.Fragment>
                                        <Divider component="li" />
                                        <ListItem>
                                            <ListItemText 
                                                primary="Selected Equipment" 
                                                secondary={
                                                    bookingDetails.equipment.map(eq => 
                                                        `${eq.name} (${formatCurrency(eq.rentalPrice)})`
                                                    ).join(', ')
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                )}
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemText 
                                        primary="Estimated Total"
                                        secondary={formatCurrency(bookingDetails.estimatedTotal)}
                                        primaryTypographyProps={{ fontWeight: 'bold' }}
                                        secondaryTypographyProps={{ fontWeight: 'bold', color: 'primary.main' }}
                                    />
                                </ListItem>
                            </List>
                        ) : (
                            <Alert severity="warning">Booking details are not available. Please go back.</Alert>
                        )}
                        {isInitiatingPayment && <CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }}/>}
                        {error && !isInitiatingPayment && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                    </Box>
                );
            case 2: // Payment
                if (paymentSuccessData) {
                    return (
                        <Box sx={{ textAlign: 'center' }}>
                             <CheckCircleOutline sx={{ fontSize: 60, color: 'success.main' }} />
                             <Typography variant="h5" gutterBottom>Booking Confirmed!</Typography>
                             <Typography>Your payment was successful.</Typography>
                             <Typography sx={{mt: 1}}>Booking ID: {paymentSuccessData.bookingId}</Typography>
                             <Button component={RouterLink} to="/my-bookings" sx={{ mt: 2 }}>
                                 View My Bookings
                             </Button>
                         </Box>
                    );
                }
                
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Complete Payment</Typography>
                         {paymentError && <Alert severity="error" sx={{ my: 2 }}>{paymentError}</Alert>}
                         
                        {clientSecret && paymentId && bookingDetails ? (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <CheckoutForm 
                                    clientSecret={clientSecret} 
                                    paymentId={paymentId}
                                    bookingAmount={bookingDetails.estimatedTotal}
                                    onPaymentSuccess={handlePaymentSuccess}
                                    onPaymentError={handlePaymentError}
                                />
                            </Elements>
                        ) : (
                            <Box sx={{textAlign: 'center', my: 3}}>
                                {isInitiatingPayment ? 
                                     <CircularProgress /> :
                                     <Typography color="error">Payment details not available. Please go back and try again.</Typography>
                                }
                           </Box>
                        )}
                    </Box>
                );
            default:
                return <Typography>Unknown step</Typography>;
        }
    };

    if (!user) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">
                    Please <RouterLink to="/login">log in</RouterLink> to make a booking.
                </Alert>
            </Box>
        );
    }

    if (!venueId) {
         return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Venue ID is missing. Cannot proceed with booking.</Alert>
            </Box>
         );
    }

    return (
        <Box sx={{ maxWidth: 800, margin: 'auto', p: { xs: 2, md: 3 } }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
                <Typography variant="h4" gutterBottom align="center">Book Venue</Typography>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ minHeight: 200, mb: 3 }}> 
                     {renderStepContent(activeStep)}
                 </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0 || isInitiatingPayment || paymentSuccessData }
                        onClick={handleBack}
                    >
                        Back
                    </Button>
                    {activeStep < steps.length - 1 && (
                         <Button
                             variant="contained"
                             onClick={handleNext}
                             disabled={activeStep === 0 && !selectedSlot}
                         >
                             {activeStep === steps.length - 2 ? 'Proceed to Payment' : 'Next'}
                         </Button>
                     )}
                </Box>
            </Paper>
             <Snackbar 
                open={snack.open}
                autoHideDuration={6000}
                onClose={() => setSnack(prev => ({...prev, open: false}))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                 <Alert onClose={() => setSnack(prev => ({...prev, open: false}))} severity={snack.severity} sx={{ width: '100%' }}>
                     {snack.message}
                 </Alert>
             </Snackbar>
        </Box>
    );
}