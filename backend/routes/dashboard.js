// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware'); // Protect routes with authentication middleware

// Route for getting dashboard stats
router.get('/stats', protect, getDashboardStats);

// Route for getting events (used in calendar) - REMOVED
// router.get('/events', protect, getEvents);

module.exports = router;
