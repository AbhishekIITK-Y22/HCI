const express = require('express');
const {
  // createBooking, // Removed from player flow
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getCalendarBookings,
  getAvailableSlots
} = require('../controllers/bookingController');
// Removed playerOnly import as POST route is removed
const { protect, admin } = require('../middleware/authMiddleware'); 
const router = express.Router();

// REMOVED: Player creation route - Booking is now created via payment confirmation
// router.post('/', protect, playerOnly, createBooking);

// GET routes remain - viewing bookings for different roles
router.get('/', protect, getUserBookings);

router.get('/calendar', protect, getCalendarBookings);

// 🔍 Admin can view any specific booking
router.get('/:id', protect, admin, getBookingById);

// ✅ Admin can update status (confirm/cancel)
router.put('/:id', protect, admin, updateBookingStatus);

// ❌ Admin can delete booking
router.delete('/:id', protect, admin, deleteBooking);

// --- Public route to get available slots for a venue on a specific date ---
// @route GET /api/bookings/slots/:venueId?date=YYYY-MM-DD
// @desc Get available time slots for booking
// @access Public (or protect if only logged-in users can see slots)
router.get('/slots/:venueId', getAvailableSlots);

module.exports = router;
