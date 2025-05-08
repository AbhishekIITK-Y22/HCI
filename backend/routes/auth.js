// routes/auth.js
const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator'); // Input validation
const validationHandler = require('../middleware/validationHandler'); // Middleware to handle validation results

const router = express.Router();

// Input Validation Rules
const registerValidation = [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password must be at least 6 characters long').isLength({ min: 6 })
];

const loginValidation = [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
];

const forgotPasswordValidation = [
  body('email', 'Please include a valid email').isEmail()
];

const resetPasswordValidation = [
  body('password', 'Password must be at least 6 characters long').isLength({ min: 6 })
];

// --- Routes ---

router.post('/register', registerValidation, validationHandler, register);
router.post('/login', loginValidation, validationHandler, login);
router.post('/refresh', refreshToken); // Refresh token expected in cookie
router.post('/logout', protect, logout); // Protect logout to ensure user clears their own token
router.post('/forgotpassword', forgotPasswordValidation, validationHandler, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidation, validationHandler, resetPassword);
router.get('/verifyemail/:verifytoken', verifyEmail);

// Keep the /me route from user controller
// router.get('/me', protect, getMe); // Moved to users.js

module.exports = router;
