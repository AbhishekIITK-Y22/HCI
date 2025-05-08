const express = require('express');
const { getChatRoom } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:venueId', protect, getChatRoom);

module.exports = router;
