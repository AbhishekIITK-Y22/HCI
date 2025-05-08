const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getUserPayments,
  getOwnerPayments,
  getCoachPayments,
  createPaymentIntent,
  handlePaymentSuccess
} = require('../controllers/paymentController');

const { protect, admin, turfOwner, coachOnly } = require('../middleware/authMiddleware');

router.use(protect); // All routes require login

router.post('/create-payment-intent', createPaymentIntent); 
router.put('/:paymentId/success', handlePaymentSuccess);

router.get('/', admin, getAllPayments);     // Admin-only
router.get('/my', getUserPayments);         // Logged-in user's payments
router.get('/owner', turfOwner, getOwnerPayments);
router.get('/coach', coachOnly, getCoachPayments);

module.exports = router;
