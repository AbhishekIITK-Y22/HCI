const express = require('express');
const router = express.Router();
const { protect, turfOwner } = require('../middleware/authMiddleware');
const Venue = require('../models/Venue');
const Coach = require('../models/Coach');

// Add coach to venue
router.post('/venues/:venueId/coaches/:coachId', protect, turfOwner, async (req, res) => {
  const { venueId, coachId } = req.params;
  
  await Venue.findByIdAndUpdate(venueId, {
    $addToSet: { coaches: coachId }
  });
  
  await Coach.findByIdAndUpdate(coachId, {
    $addToSet: { venues: venueId }
  });

  res.json({ success: true });
});

// Remove coach from venue
router.delete('/venues/:venueId/coaches/:coachId', protect, turfOwner, async (req, res) => {
  const { venueId, coachId } = req.params;
  
  await Venue.findByIdAndUpdate(venueId, {
    $pull: { coaches: coachId }
  });
  
  await Coach.findByIdAndUpdate(coachId, {
    $pull: { venues: venueId }
  });

  res.json({ success: true });
});

// Get venue coaches
router.get('/venues/:venueId/coaches', protect, async (req, res) => {
  const venue = await Venue.findById(req.params.venueId)
    .populate('coaches');
  
  res.json(venue.coaches);
});

module.exports = router; 