const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');
const validationHandler = require('../middleware/validationHandler');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

const {
  getMe,
  updateMe,
  updateMyPassword,
  deactivateMe,
  updateMyAvatar,
  getAllUsers,       // Optional
  getUserById,       // Optional
  updateUser,
  updateUserRole,
  setUserStatus,
  deleteUser,
  createUserByAdmin
} = require('../controllers/userController');

// Validation Rules
const mongoIdValidation = [
  param('id', 'Invalid User ID').isMongoId()
];

const updateMeValidation = [
  body('name').optional().not().isEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isString(), // Add more specific phone validation if needed
];

const updatePasswordValidation = [
  body('currentPassword', 'Current password is required').not().isEmpty(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
];

const updateUserValidation = [ // Admin update
  param('id', 'Invalid User ID').isMongoId(),
  body('name').optional().not().isEmpty(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['player', 'coach', 'admin', 'turfOwner']),
  body('phone').optional().isString(),
  body('avatar').optional().isURL(),
  body('isActive').optional().isBoolean(),
  body('isVerified').optional().isBoolean()
];

const updateUserRoleValidation = [
  param('id', 'Invalid User ID').isMongoId(),
  body('role', 'Role is required and must be valid').isIn(['player', 'coach', 'admin', 'turfOwner'])
];

const setUserStatusValidation = [
  param('id', 'Invalid User ID').isMongoId(),
  body('isActive', 'isActive status is required and must be boolean').isBoolean()
];

// Validation for Admin User Creation
const createUserValidation = [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('role', 'Role is required and must be valid').isIn(['player', 'coach', 'admin', 'turfOwner']),
    body('phone').optional().isString(),
    body('isActive').optional().isBoolean(),
    body('isVerified').optional().isBoolean()
];

// --- Routes ---

// Apply protect middleware to all routes below
router.use(protect);

// Routes for the currently logged-in user
router.get('/me', getMe);
router.put('/me', updateMeValidation, validationHandler, updateMe);
router.put('/me/password', updatePasswordValidation, validationHandler, updateMyPassword);
router.put('/me/deactivate', deactivateMe);

// Route for avatar upload
router.post('/me/avatar', uploadAvatar, updateMyAvatar);

// Admin-only routes (apply admin middleware)
router.use(admin);

router.post('/', createUserValidation, validationHandler, createUserByAdmin);
router.get('/', getAllUsers);
router.get('/:id', mongoIdValidation, validationHandler, getUserById);
router.put('/:id', updateUserValidation, validationHandler, updateUser);
router.put('/:id/role', updateUserRoleValidation, validationHandler, updateUserRole);
router.put('/:id/status', setUserStatusValidation, validationHandler, setUserStatus);
router.delete('/:id', mongoIdValidation, validationHandler, deleteUser);

module.exports = router;
