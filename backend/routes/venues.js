const express = require('express');
const router = express.Router();
const {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  // getVenueAvailability, // Removed
  updateVenueAmenities
} = require('../controllers/venueController');

const { protect, admin } = require('../middleware/authMiddleware'); // Corrected path

router.get('/', protect, getVenues);
router.get('/:id', protect, getVenueById);
router.post('/', protect, admin, createVenue);
router.put('/:id', protect, admin, updateVenue);
router.delete('/:id', protect, admin, deleteVenue);
// router.get('/:id/availability', protect, getVenueAvailability); // Removed route

// This route seems specific and might be better handled within PUT /my-venues/:id
// Review if this is still needed or used.
// router.put('/:id/amenities', protect, admin, updateVenueAmenities);

module.exports = router;
