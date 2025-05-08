const express = require('express');
const { protect, playerOnly } = require('../middleware/authMiddleware');

// Log the entire required object and the specific function
let paymentControllerFuncs;
try {
    paymentControllerFuncs = require('../controllers/paymentController');
    console.log('(Routes) Required paymentController object:', paymentControllerFuncs);
    console.log('(Routes) Value of initiatePayment right after require:', paymentControllerFuncs.initiatePayment);
} catch (err) {
    console.error('ERROR requiring paymentController:', err);
    paymentControllerFuncs = { 
        initiatePayment: (req, res) => res.status(500).send('Error loading controller'), 
    };
}

// Destructure ONLY what's exported by the simplified controller
const { initiatePayment } = paymentControllerFuncs;

// Log again after destructuring
console.log('(Routes) Value of initiatePayment after destructuring:', initiatePayment);

const router = express.Router();

console.log('(Routes) Router initialized'); // Log after router init

// --- Player Booking/Payment Flow --- 

// @route   POST /api/payments/initiate
// @desc    Checks availability, creates pending Payment record, creates Stripe intent
// @access  Private (Player Only)
router.post('/initiate', protect, playerOnly, initiatePayment);

// @route   POST /api/payments/confirm
// @desc    Confirms payment success, creates Booking, updates Payment status
// @access  Private (User who initiated)
router.post('/confirm', protect, paymentControllerFuncs.confirmPaymentAndCreateBooking);

// --- Routes for viewing payments (Restore - adjust access as needed) ---
// Admin get all
// TODO: Add admin middleware if needed
router.get('/', protect, /* admin, */ paymentControllerFuncs.getAllPayments); 

// Player get their own
router.get('/my', protect, paymentControllerFuncs.getUserPayments); 

// Owner get payments related to their venues
// TODO: Add turfOwner middleware if needed
router.get('/owner', protect, /* turfOwner, */ paymentControllerFuncs.getOwnerPayments);

// Coach get payments related to their sessions
// TODO: Add coach middleware if needed
router.get('/coach', protect, /* coachOnly, */ paymentControllerFuncs.getCoachPayments);

console.log('(Routes) Exporting router...');
module.exports = router;
console.log('(Routes) Router exported.');