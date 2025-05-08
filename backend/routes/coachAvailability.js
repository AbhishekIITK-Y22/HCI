const express = require('express');
const router = express.Router();
const { getAvailability, setAvailability } = require('../controllers/coachAvailabilityController');
const { protect, coachOnly } = require('../middleware/authMiddleware');

router.get('/:id/availability', protect, getAvailability);
router.post('/:id/availability', protect, coachOnly, setAvailability);

module.exports = router;
