const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

// GET: Fetch current settings (any logged-in user)
router.get('/', protect, getSettings);

// PUT: Update settings (admin only)
router.put('/', protect, admin, updateSettings);

module.exports = router;
