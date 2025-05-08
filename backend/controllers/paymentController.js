const Payment = require('../models/Payment');
const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const Equipment = require('../models/Equipment'); // Needed for price calculation/validation
const mongoose = require('mongoose');
const { createAndNotify } = require('../utils/notificationUtils');
const dayjs = require('dayjs');

// --- HELPER: Conflict Checking Logic (Moved BEFORE usage) ---
const checkBookingConflict = async (venueId, startTime, endTime, coachId, equipmentIds) => {
    const bookingStartTime = new Date(startTime);
    const bookingEndTime = new Date(endTime);

    if (isNaN(bookingStartTime) || isNaN(bookingEndTime) || bookingStartTime >= bookingEndTime) {
        throw new Error('Invalid start or end time provided.');
    }
    
    // IMPORTANT: Only check for CONFIRMED bookings now
    const clashQuery = {
        venue: venueId,
        status: 'confirmed', 
        $or: [
            { startTime: { $gte: bookingStartTime, $lt: bookingEndTime } },
            { endTime: { $gt: bookingStartTime, $lte: bookingEndTime } },
            { startTime: { $lte: bookingStartTime }, endTime: { $gte: bookingEndTime } }
        ]
    };

    // 1. Check Venue Clash
    const venueClash = await Booking.findOne({ ...clashQuery });
    if (venueClash) {
        throw new Error('This time slot is unavailable for the selected venue.');
    }

    // 2. Check Coach Clash
    if (coachId) {
        const coachClash = await Booking.findOne({ ...clashQuery, coach: coachId });
        if (coachClash) {
            throw new Error('The selected coach is unavailable during this time slot.');
        }
    }

    // 3. Equipment Clash (using provided equipment IDs)
    if (equipmentIds && equipmentIds.length > 0) {
        const equipmentClash = await Booking.findOne({
            ...clashQuery,
            equipment: { $in: equipmentIds }
        }).populate('equipment', 'name'); // Populate to get names for error

        if (equipmentClash) {
            const conflictingItems = equipmentClash.equipment.filter(eq => 
                equipmentIds.includes(eq._id.toString())
            );
            const conflictingNames = conflictingItems.map(eq => eq.name).join(', ');
            throw new Error(`Equipment unavailable during this time slot: ${conflictingNames}`);
        }
    }
    // If no error is thrown, the slot is considered available
};
// --- END HELPER ---


// --- Existing Payment Functions (Keep for potential admin use or reporting) ---
// @desc    Get all payments
const getAllPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find()
        .sort({ createdAt: -1 })
        .populate('payerId', 'name email') 
        .populate({ 
            path: 'booking', // Populate booking if linked
            populate: { path: 'venue', select: 'name' } 
        }); 
    res.status(200).json({ success: true, count: payments.length, data: payments });
});

// @desc    Create a payment (NOTE: Should likely be removed/restricted - use initiate/confirm flow)
const createPayment = asyncHandler(async (req, res) => {
    const { booking, amount, status, date } = req.body;
    // Basic validation - refine based on actual use case if kept
    if (!booking || !amount || !status) {
        return res.status(400).json({ message: 'Required fields missing for manual payment creation' });
    }
    const payment = await Payment.create({ booking, amount, status, date, paymentMethod: 'manual' }); // Example method
    res.status(201).json(payment);
});

// @desc    Update payment (NOTE: Should likely be removed/restricted)
const updatePayment = asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
    }
    const { status, amount, date, notes } = req.body;
    if (status) payment.status = status;
    if (amount) payment.amount = amount;
    if (date) payment.date = date;
    if (notes) payment.notes = notes;
    const updated = await payment.save();
    res.json(updated);
});

// @desc    Get current user's (payer's) payments
const getUserPayments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const payments = await Payment.find({ payerId: userId })
        .sort({ createdAt: -1 })
        .populate({ 
            path: 'booking', 
            select: 'venue startTime endTime totalAmount status',
            populate: { path: 'venue', select: 'name location' }
         });
    res.status(200).json({ success: true, count: payments.length, data: payments });
});

// @desc    Get payments related to venues owned by the current user
const getOwnerPayments = asyncHandler(async (req, res) => {
    const ownerId = req.user._id;
    const ownerVenues = await Venue.find({ owner: ownerId }).select('_id');
    const ownerVenueIds = ownerVenues.map(v => v._id);
    if (ownerVenueIds.length === 0) return res.status(200).json({ success: true, count: 0, data: [] });
    
    const payments = await Payment.find()
        .populate({
            path: 'booking',
            match: { venue: { $in: ownerVenueIds } },
            populate: { path: 'venue', select: 'name' } 
        })
        .populate('payerId', 'name')
        .sort({ createdAt: -1 });
    const ownerRelatedPayments = payments.filter(p => p.booking); 
    res.status(200).json({ success: true, count: ownerRelatedPayments.length, data: ownerRelatedPayments });
});

// @desc    Get payments related to bookings coached by the current user
const getCoachPayments = asyncHandler(async (req, res) => {
    const coachUserId = req.user._id;
     const payments = await Payment.find()
        .populate({
            path: 'booking',
            match: { coach: coachUserId },
            populate: [ 
                 { path: 'venue', select: 'name' },
                 { path: 'user', select: 'name' } 
            ]
        })
        .populate('payerId', 'name')
        .sort({ createdAt: -1 });
    const coachRelatedPayments = payments.filter(p => p.booking); 
    res.status(200).json({ success: true, count: coachRelatedPayments.length, data: coachRelatedPayments });
});
// --- END Existing Payment Functions ---


// @desc    Initiate payment process: Check availability, create Payment record, create Stripe intent
// @route   POST /api/payments/initiate
// @access  Private (Player Only)
const initiatePayment = asyncHandler(async (req, res) => {
    const { 
        venueId, 
        startTime, 
        endTime, 
        equipmentIds = [], 
        coachId = null, 
        calculatedAmount 
    } = req.body;
    const userId = req.user._id;

    // --- Basic Validation ---
    if (!venueId || !startTime || !endTime || calculatedAmount === undefined || calculatedAmount === null) {
        res.status(400);
        throw new Error('Venue ID, start time, end time, and calculated amount are required');
    }
    const bookingStartTime = new Date(startTime);
    const bookingEndTime = new Date(endTime);
    if (isNaN(bookingStartTime) || isNaN(bookingEndTime) || bookingStartTime >= bookingEndTime) {
        res.status(400); throw new Error('Invalid start or end time format.');
    }

    // --- Perform Conflict Check BEFORE creating anything ---
    try {
        await checkBookingConflict(venueId, startTime, endTime, coachId, equipmentIds);
    } catch (conflictError) {
        res.status(409); 
        throw new Error(conflictError.message);
    }

    // --- Recalculate amount on backend for security/accuracy ---
    const venue = await Venue.findById(venueId).select('pricePerHour equipmentList'); 
    if (!venue) {
        res.status(404); throw new Error('Venue not found'); 
    }
    if (equipmentIds.length > 0) {
        const validEquipmentIds = venue.equipmentList.map(id => id.toString());
        const invalidRequested = equipmentIds.filter(reqId => !validEquipmentIds.includes(reqId));
        if (invalidRequested.length > 0) {
            res.status(400); 
            throw new Error(`Requested equipment IDs are not valid for this venue: ${invalidRequested.join(', ')}`);
        }
    }
    const durationHours = (bookingEndTime - bookingStartTime) / (1000 * 60 * 60);
    let backendCalculatedAmount = (venue.pricePerHour || 0) * durationHours;
    if (equipmentIds.length > 0) {
        const equipmentList = await Equipment.find({ '_id': { $in: equipmentIds } }).select('rentalPrice');
        const equipmentCost = equipmentList.reduce((sum, eq) => sum + (eq.rentalPrice || 0), 0);
        backendCalculatedAmount += (equipmentCost * durationHours);
    }
    if (Math.round(backendCalculatedAmount * 100) !== Math.round(calculatedAmount * 100)) {
         console.warn(`Amount mismatch: FE (${calculatedAmount}), BE (${backendCalculatedAmount}) for venue ${venueId}. Using BE amount.`);
    }
    const finalAmount = backendCalculatedAmount;
    const amountInCents = Math.round(finalAmount * 100);
    if (amountInCents <= 0) {
        res.status(400); throw new Error('Calculated amount must be positive.');
    }

    // --- Create Pending Payment Record ---
    const paymentRecord = await Payment.create({
        payerId: userId,
        amount: finalAmount, 
        status: 'pending',
        paymentMethod: 'card', 
        tempBookingDetails: {
            venueId,
            startTime: bookingStartTime,
            endTime: bookingEndTime,
            equipmentIds,
            coachId,
            calculatedAmount: finalAmount 
        }
    });

    // --- Create Stripe Payment Intent ---
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'inr',
        metadata: { paymentId: paymentRecord._id.toString(), userId: userId.toString(), venueId: venueId.toString() },
        payment_method_types: ['card'],
    });

    // --- Save Stripe Intent ID ---
    paymentRecord.transactionId = paymentIntent.id;
    await paymentRecord.save();

    // --- Respond to Frontend ---
    res.status(200).json({
        success: true,
        message: 'Payment initiated successfully. Please complete payment.',
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentRecord._id 
    });
});


// @desc    Confirm payment, create booking, update payment status
// @route   POST /api/payments/confirm
// @access  Private (User who initiated payment)
const confirmPaymentAndCreateBooking = asyncHandler(async (req, res) => {
    const io = req.app.get('socketio'); 
    const { paymentId } = req.body;
    const userId = req.user._id;
    if (!paymentId) {
        res.status(400); throw new Error('Payment ID is required for confirmation.');
    }

    // --- Find Pending Payment ---
    const paymentRecord = await Payment.findById(paymentId);
    if (!paymentRecord) { res.status(404); throw new Error('Payment initiation record not found.'); }
    if (paymentRecord.status !== 'pending') { res.status(400); throw new Error(`Payment cannot be confirmed (status: ${paymentRecord.status}).`); }
    if (paymentRecord.payerId.toString() !== userId.toString()) { res.status(403); throw new Error('Not authorized to confirm this payment.'); }
    if (!paymentRecord.tempBookingDetails) { res.status(500); throw new Error('Internal Server Error: Missing booking details on payment record.'); }
    if (!paymentRecord.transactionId) { res.status(500); throw new Error('Internal Server Error: Missing transaction ID.'); }

    // --- Verify Stripe Payment ---
    try {
        const stripeIntent = await stripe.paymentIntents.retrieve(paymentRecord.transactionId);
        if (stripeIntent.status !== 'succeeded') {
             paymentRecord.status = 'failed'; 
             await paymentRecord.save();
             res.status(400); throw new Error(`Payment not successful according to Stripe (Status: ${stripeIntent.status}).`);
        }
        if (stripeIntent.amount !== Math.round(paymentRecord.amount * 100)) {
             console.error(`CRITICAL: Amount mismatch! PaymentID: ${paymentId}`);
             res.status(400); throw new Error('Payment amount mismatch detected.');
        }
    } catch (stripeError) {
        console.error(`Error verifying Stripe Payment Intent ${paymentRecord.transactionId}:`, stripeError);
        res.status(502); throw new Error('Could not verify payment status with Stripe.');
    }
    
    // --- Final Conflict Check ---
    const { venueId, startTime, endTime, coachId, equipmentIds } = paymentRecord.tempBookingDetails;
    try {
        await checkBookingConflict(venueId, startTime, endTime, coachId, equipmentIds);
    } catch (conflictError) {
        paymentRecord.status = 'failed'; 
        paymentRecord.notes = `Booking conflict detected after successful payment: ${conflictError.message}`;
        await paymentRecord.save();
        console.error(`CRITICAL: Booking conflict after successful payment! PaymentID: ${paymentId}. REFUND NEEDED.`);
        res.status(409); throw new Error(`Payment successful, but the time slot became unavailable (${conflictError.message}). Contact support for refund.`);
    }
    
    // --- Create Booking ---
    const booking = await Booking.create({
        user: userId,
        venue: venueId,
        startTime: startTime,
        endTime: endTime,
        equipment: equipmentIds || [],
        coach: coachId || null,
        totalAmount: paymentRecord.amount,
        status: 'confirmed',
        paymentStatus: 'paid' 
    });
    if (!booking) {
        paymentRecord.status = 'failed'; 
        paymentRecord.notes = 'Booking creation failed after payment success.';
        await paymentRecord.save();
        console.error(`CRITICAL: Booking creation failed post-payment! PaymentID: ${paymentId}. REFUND MAY BE NEEDED.`);
        res.status(500); throw new Error('Payment successful, but failed to finalize booking. Contact support.');
    }

    // --- Update Payment & Link ---
    paymentRecord.booking = booking._id; 
    paymentRecord.status = 'success';
    paymentRecord.tempBookingDetails = undefined; 
    await paymentRecord.save();

    // --- Notifications ---
    const venue = await Venue.findById(venueId).select('owner name');
    if (venue && venue.owner) { 
        createAndNotify(
            io, { userId: venue.owner }, 
            `New booking confirmed for ${venue.name} on ${dayjs(booking.startTime).format('MMM D, YYYY HH:mm')}`,
            'success', `/admin/bookings/${booking._id}`
        );
    }
    createAndNotify(
        io, { userId: userId },
        `Your booking for ${venue?.name || 'Venue'} on ${dayjs(booking.startTime).format('MMM D, YYYY HH:mm')} is confirmed!`,
        'booking_confirmed', `/my-bookings`
    );
    
    // --- Respond ---
    res.status(200).json({
        success: true,
        message: 'Payment confirmed and booking created successfully.',
        bookingId: booking._id,
        bookingDetails: booking 
    });
});


module.exports = {
    getAllPayments,
    createPayment, // Keep for now, but evaluate if needed
    updatePayment, // Keep for now, but evaluate if needed
    getUserPayments,
    getOwnerPayments,
    getCoachPayments,
    initiatePayment,
    confirmPaymentAndCreateBooking
};
  