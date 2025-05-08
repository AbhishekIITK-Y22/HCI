const express = require('express');
const router = express.Router();
const { 
    getMyVenues, 
    getVenueCustomers, 
    createMyVenue,
    updateMyVenue
} = require('../controllers/myVenueController');
const { protect, turfOwner, admin } = require('../middleware/authMiddleware');
const { param, body } = require('express-validator');
const validationHandler = require('../middleware/validationHandler');

// Middleware to check if the user is either Turf Owner or Admin
const isOwnerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'turfOwner' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'User must be a Turf Owner or Admin to access this resource' });
  }
};

// Validation for MongoDB ObjectId in params
const venueIdValidation = [
  param('venueId', 'Invalid Venue ID format').isMongoId()
];

// Validation rules for creating/updating a venue
const venueBodyValidation = [
    body('name', 'Venue name is required').notEmpty().trim().escape(),
    body('location', 'Location is required').notEmpty().trim().escape(),
    body('pricePerHour', 'Price per hour must be a positive number').isFloat({ gt: 0 }),
    body('capacity', 'Capacity must be a non-negative number').optional().isInt({ min: 0 }),
    body('openingHours.start', 'Invalid start time format (HH:MM)').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('openingHours.end', 'Invalid end time format (HH:MM)').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('images', 'Images must be an array of strings').optional().isArray(),
    body('images.*', 'Invalid image URL').optional().isURL(),
    body('amenities', 'Amenities must be an array of IDs').optional().isArray(),
    body('amenities.*', 'Invalid Amenity ID format').optional().isMongoId(),
    body('equipmentList', 'Equipment must be an array of IDs').optional().isArray(),
    body('equipmentList.*', 'Invalid Equipment ID format').optional().isMongoId(),
];

// New validation array for updating a venue (making name, location, and pricePerHour optional)
const updateVenueBodyValidation = [
    body('name', 'Venue name is required').optional().trim().escape(),
    body('location', 'Location is required').optional().trim().escape(),
    body('pricePerHour', 'Price per hour must be a positive number').optional().isFloat({ gt: 0 }),
    body('capacity', 'Capacity must be a non-negative number').optional().isInt({ min: 0 }),
    body('openingHours.start', 'Invalid start time format (HH:MM)').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('openingHours.end', 'Invalid end time format (HH:MM)').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('images', 'Images must be an array of strings').optional().isArray(),
    body('images.*', 'Invalid image URL').optional().isURL(),
    body('amenities', 'Amenities must be an array of IDs').optional().isArray(),
    body('amenities.*', 'Invalid Amenity ID format').optional().isMongoId(),
    body('equipmentList', 'Equipment must be an array of IDs').optional().isArray(),
    body('equipmentList.*', 'Invalid Equipment ID format').optional().isMongoId(),
];

// Apply protect middleware to all subsequent routes in this file
router.use(protect);
// Apply role check middleware (Owner or Admin) to all subsequent routes
router.use(isOwnerOrAdmin);

// Route to get venues owned by the logged-in user
router.get('/', getMyVenues);

// Route to create a new venue
router.post('/', venueBodyValidation, validationHandler, createMyVenue);

// Route to get customers for a specific venue owned by the user
router.get('/:venueId/customers', venueIdValidation, validationHandler, getVenueCustomers);

// Route to update a specific venue owned by the user
router.put('/:venueId', venueIdValidation, updateVenueBodyValidation, validationHandler, updateMyVenue);

// TODO: Add route for DELETING an owned venue (if desired)
// router.delete('/:venueId', venueIdValidation, validationHandler, deleteMyVenue);

module.exports = router; 