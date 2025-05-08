// routes/equipment.js
const express = require('express');
const router = express.Router();
const {
  listAll,                // Admin
  listAvailable,          // Authenticated User
  listCheckedOut,         // Admin
  myCheckedOut,           // Player specific
  listByVenue,            // Turf Owner/Admin (for specific venue)
  listAvailableByVenue,   // Authenticated User (for specific venue)
  checkout,               // Player specific
  checkin,                // Player specific
  addEquipment,           // Admin/TurfOwner
  updateEquipment,        // Admin/TurfOwner
  deleteEquipment         // Admin/TurfOwner
} = require('../controllers/equipmentController');
const { protect, admin, playerOnly, turfOwner } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');
const validationHandler = require('../middleware/validationHandler');

// Middleware to check if user is Admin or TurfOwner
// TODO: For PUT/DELETE/POST (add), need to verify the user owns the venue associated with the equipment
const isAdminOrOwner = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'turfOwner')) {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Requires Admin or Turf Owner role.' });
    }
};

// Validation Rules
const equipmentIdParamValidation = [
    param('equipmentId', 'Invalid Equipment ID').isMongoId()
];
const venueIdParamValidation = [
    param('venueId', 'Invalid Venue ID').isMongoId()
];
const equipmentBodyValidation = [
    body('equipmentId', 'Valid equipmentId is required').isMongoId()
];
const addEquipmentBodyValidation = [
    body('name', 'Name is required').not().isEmpty(),
    body('venueId', 'Venue ID is required').isMongoId(),
    body('rentalPrice', 'Rental price must be a non-negative number').isFloat({ min: 0 }),
    body('description').optional().isString(),
    body('condition').optional().isIn(['new', 'good', 'fair', 'poor'])
];
const updateEquipmentBodyValidation = [
    body('name').optional().not().isEmpty(),
    body('rentalPrice').optional().isFloat({ min: 0 }),
    body('description').optional().isString(),
    body('condition').optional().isIn(['new', 'good', 'fair', 'poor']),
    body('status').optional().isIn(['available', 'checkedout', 'maintenance']) // Add maintenance?
];

// --- Public / Authenticated User Routes --- 
router.get('/available', protect, listAvailable); // All available equipment (across all venues)
router.get('/venue/:venueId/available', protect, venueIdParamValidation, validationHandler, listAvailableByVenue); // Available for specific venue

// --- Player Specific Routes ---
router.get('/my', protect, playerOnly, myCheckedOut); // Equipment checked out by me
router.post('/checkout', protect, playerOnly, equipmentBodyValidation, validationHandler, checkout); // Checkout requires equipmentId in body
router.post('/checkin', protect, playerOnly, equipmentBodyValidation, validationHandler, checkin); // Checkin requires equipmentId in body

// --- Admin / Turf Owner Routes --- 
router.get('/', protect, isAdminOrOwner, listAll); // Changed from admin to isAdminOrOwner
router.get('/checkedout', protect, admin, listCheckedOut); // Admin: List all checked out equipment
router.get('/venue/:venueId', protect, isAdminOrOwner, venueIdParamValidation, validationHandler, listByVenue); // Admin/Owner: List all for a specific venue

// CRUD for Equipment (Admin/Owner)
router.post('/', protect, isAdminOrOwner, addEquipmentBodyValidation, validationHandler, addEquipment);
router.put('/:equipmentId', protect, isAdminOrOwner, equipmentIdParamValidation, updateEquipmentBodyValidation, validationHandler, updateEquipment);
router.delete('/:equipmentId', protect, isAdminOrOwner, equipmentIdParamValidation, validationHandler, deleteEquipment);

module.exports = router;
