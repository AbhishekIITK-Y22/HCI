const express = require('express');
const router = express.Router();
const { getHourlyBookingStats, getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// GET /api/analytics/hourly-bookings?venueId=...
// Access: Admin (or maybe Owner for their own venue? For now, Admin)
router.route('/hourly-bookings')
    .get(protect, admin, getHourlyBookingStats);

// GET /api/analytics/summary
// Access: Admin
router.route('/summary')
    .get(protect, admin, getAnalyticsSummary);

// Add more routes here later for summary etc.

module.exports = router;
