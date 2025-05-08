const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
// const sendEmail = require('../utils/sendEmail'); // Assuming an email utility

// Token generation function
const generateTokens = async (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'mysecretkey123', { 
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' // Short-lived access token
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'myrefreshsecretkey123', { 
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' // Longer-lived refresh token
  });

  // Store hashed refresh token in DB for security
  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  await User.findByIdAndUpdate(userId, { refreshToken: hashedRefreshToken });
  
  return { accessToken, refreshToken };
};

// Utility to send token response
const sendTokenResponse = async (user, statusCode, res) => {
  const { accessToken, refreshToken } = await generateTokens(user._id);

  // Cookie options
  const options = {
    expires: new Date(Date.now() + (process.env.JWT_REFRESH_EXPIRE_DAYS || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax',
    path: '/'
  };

  // Remove sensitive data before sending user object
  user.password = undefined;
  user.refreshToken = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  res
    .status(statusCode)
    .cookie('refreshToken', refreshToken, options)
    .json({ 
      success: true, 
      accessToken, 
      user 
    });
};

// @desc Register user
// @route POST /api/auth/register
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, avatar } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(409).json({ message: 'User with this email already exists' });
  }

  const user = await User.create({ 
    name, 
    email, 
    password, 
    role: role || 'player', // Default role if not provided
    phone,
    avatar,
    isVerified: false // Start as unverified
  });

  // *** Email Verification Logic (placeholder) ***
  /*
  try {
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false }); // Save token fields

    // Construct verification URL (replace with your frontend URL)
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${verificationToken}`;
    const message = `Please verify your email by clicking this link: ${verifyUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message
    });

    console.log('Verification email sent to:', user.email);
    // Send response without waiting for email potentially?
    // Or inform user email has been sent.

  } catch (err) {
    console.error('Email sending error:', err);
    // Reset verification fields if email fails?
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    // Decide how to respond - maybe still register but warn about verification?
    // return next(new ErrorResponse('Email could not be sent', 500));
  }
  */

  sendTokenResponse(user, 201, res);
});

// @desc Login user
// @route POST /api/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  // Find user and explicitly select password & refreshToken for checks
  const user = await User.findOne({ email }).select('+password +refreshToken +isActive +isVerified');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated' });
  }

  // Optional: Check if email is verified (enable if needed)
  /*
  if (!user.isVerified) {
     return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
  }
  */

  sendTokenResponse(user, 200, res);
});

// Refresh access token
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by ID and matching hashed refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: hashedToken
    }).select('+isActive +isVerified');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    
    // Check if account is active
    if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Issue new tokens (access token only needed in response)
    const { accessToken } = await generateTokens(user._id); 
    // Optionally rotate refresh token by calling sendTokenResponse(user, 200, res);
    // For simplicity, just send new access token here:
    res.status(200).json({ success: true, accessToken });

  } catch (err) {
    console.error('Refresh token error:', err);
    // Clear potentially invalid cookie
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// Logout user
exports.logout = asyncHandler(async (req, res, next) => {
  // On logout, clear the refresh token from DB and the cookie
  // Requires user to be authenticated to logout their own token
  if (req.user?._id) {
     await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined });
  }
  
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Set expiry in past/shortly
    httpOnly: true
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// --- Password Reset & Email Verification (Placeholders - Require Email Setup) ---

// Forgot Password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Don't reveal if user exists
    return res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset email has been sent.' });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // *** Send Email (placeholder) ***
  /*
  try {
    // Construct reset URL (replace with your frontend URL)
    const resetUrl = `${req.protocol}://${req.get('host')}/resetpassword/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message
    });
    console.log('Password reset email sent to:', user.email);
  } catch (err) {
    console.error('Email sending error:', err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    // return next(new ErrorResponse('Email could not be sent', 500));
  }
  */

  res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset email has been sent.' });
});

// Reset Password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+password'); // Need password to save pre-hook

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log the user in automatically after password reset
  sendTokenResponse(user, 200, res);
});

// Verify Email
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.verifytoken)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Optional: Log the user in or redirect to login/success page
  res.status(200).json({ success: true, message: 'Email verified successfully' });
});

