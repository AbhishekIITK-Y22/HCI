const express = require('express');
const router = express.Router();
const {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity
} = require('../controllers/amenityController');

const { protect, admin } = require('../middleware/authMiddleware');

// Amenity management routes (admin only)
router.get('/', protect, getAmenities);
router.post('/', protect, admin, createAmenity);
router.put('/:id', protect, admin, updateAmenity);
router.delete('/:id', protect, admin, deleteAmenity);

module.exports = router;
