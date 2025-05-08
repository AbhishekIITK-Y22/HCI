// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler'); // Use asyncHandler for consistency

exports.protect = asyncHandler(async (req, res, next) => {
  // --- Development Skip Auth --- 
  if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    console.warn('!!! AUTHENTICATION SKIPPED via SKIP_AUTH=true !!!');
    const devUser = await User.findById(process.env.DEV_USER_ID).select('-refreshToken');
    if (!devUser) {
      console.error('DEV_USER_ID specified in .env not found in database.');
      return res.status(500).json({ message: 'Developer User ID not found' });
    }
    req.user = devUser;
    return next();
  }
  // --- End Development Skip Auth ---

  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // TODO: Optionally check for token in cookies as well

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // Check if account is active
    if (!user.isActive) {
       return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Optional: Check if email is verified (enable if needed)
    /*
    if (!user.isVerified) {
       return res.status(403).json({ message: 'Please verify your email address' });
    }
    */

    req.user = user;
    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authorized, token failed verification' });
    } 
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized, token expired' });
      // TODO: Potentially trigger refresh token logic here if applicable
    }
    // Log unexpected errors
    console.error('Error in protect middleware:', err);
    res.status(501).json({ message: 'Server error during token validation' });
  }
});

// 🔐 Role-based middlewares
exports.admin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin role required' });
  next();
};

exports.coachOnly = (req, res, next) => {
  if (req.user?.role !== 'coach') return res.status(403).json({ message: 'Coach role required' });
  next();
};

exports.playerOnly = (req, res, next) => {
  if (req.user?.role !== 'player') return res.status(403).json({ message: 'Player role required' });
  next();
};

exports.turfOwner = (req, res, next) => {
  // Allow admin OR turfOwner
  if (req.user?.role !== 'turfOwner' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Turf Owner or Admin role required' });
  }
  next();
};
