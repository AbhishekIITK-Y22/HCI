const express = require('express');
const { 
    getAllAmenities, 
    createAmenity, 
    updateAmenity, 
    deleteAmenity 
} = require('../controllers/amenityController');
const { protect, admin } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');
const validationHandler = require('../middleware/validationHandler');

const router = express.Router();

// Validation rules
const amenityBodyValidation = [
    body('name', 'Amenity name is required').notEmpty().trim().escape(),
    body('description').optional().trim().escape(),
    body('icon').optional().trim().escape()
];

const amenityIdValidation = [
    param('id', 'Invalid Amenity ID format').isMongoId()
];

// Public route to get all amenities (requires login)
router.get('/', protect, getAllAmenities);

// Admin-only routes for managing amenities
router.post('/', protect, admin, amenityBodyValidation, validationHandler, createAmenity);
router.put('/:id', protect, admin, amenityIdValidation, amenityBodyValidation, validationHandler, updateAmenity);
router.delete('/:id', protect, admin, amenityIdValidation, validationHandler, deleteAmenity);

module.exports = router; 