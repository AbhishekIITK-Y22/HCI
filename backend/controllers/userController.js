// controllers/userController.js
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get current logged-in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user is populated by the protect middleware
  // We select('-refreshToken') again just in case, though protect already does
  const user = await User.findById(req.user._id).select('-refreshToken'); 
  if (!user) {
    // Should not happen if protect middleware worked, but good practice
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, user });
});

// @desc    Update current logged-in user details (name, phone, avatar)
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, phone, avatar, themePreference, notificationPreferences } = req.body;
  const fieldsToUpdate = {};

  // Basic profile fields
  if (name) fieldsToUpdate.name = name;
  if (phone) fieldsToUpdate.phone = phone;
  if (avatar) fieldsToUpdate.avatar = avatar; // Keep this or remove if avatar is handled only by /avatar route

  // User settings
  if (themePreference && ['light', 'dark', 'system'].includes(themePreference)) {
    fieldsToUpdate.themePreference = themePreference;
  }
  
  // Handle nested notification preferences carefully
  if (notificationPreferences && typeof notificationPreferences === 'object') {
    // Ensure we only update the fields defined in the schema
    if (typeof notificationPreferences.email === 'boolean') {
      fieldsToUpdate['notificationPreferences.email'] = notificationPreferences.email;
    }
    if (typeof notificationPreferences.push === 'boolean') {
      fieldsToUpdate['notificationPreferences.push'] = notificationPreferences.push;
    }
    // Add more specific types if they were added to the model
    // if (typeof notificationPreferences.bookingConfirmations === 'boolean') {
    //   fieldsToUpdate['notificationPreferences.bookingConfirmations'] = notificationPreferences.bookingConfirmations;
    // }
  }

  // Prevent updating sensitive fields like role, isActive, etc. through this route
  delete fieldsToUpdate.role;
  delete fieldsToUpdate.isActive;
  delete fieldsToUpdate.isVerified;
  delete fieldsToUpdate.password; // Just in case

  // Only update if there are fields to update
  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: fieldsToUpdate }, { // Use $set for nested updates
    new: true,
    runValidators: true // Ensure model validations run
  }).select('-refreshToken');

  if (!user) {
      // Should not happen if protect middleware worked
      return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, user });
});

// @desc    Update current logged-in user password
// @route   PUT /api/users/me/password
// @access  Private
exports.updateMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check if current password matches
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
  }

  // Set and save new password (pre-save hook will hash)
  user.password = newPassword;
  await user.save();

  // Password changed, issue new tokens
  // sendTokenResponse(user, 200, res); // Import and use if needed
  res.status(200).json({ success: true, message: 'Password updated successfully. Please log in again with your new password.' }); // Or log them in automatically
});

// @desc    Deactivate current logged-in user account
// @route   PUT /api/users/me/deactivate
// @access  Private
exports.deactivateMe = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  // TODO: Optionally clear refresh token cookie and DB entry immediately
  res.status(200).json({ success: true, message: 'Account deactivated successfully' });
});

// @desc    Update current logged-in user avatar
// @route   POST /api/users/me/avatar
// @access  Private
exports.updateMyAvatar = asyncHandler(async (req, res, next) => {
  // req.file is populated by uploadAvatar middleware
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  // --- Placeholder for actual file upload logic --- 
  // In a real application, you would upload req.file.buffer to a cloud storage 
  // service (e.g., AWS S3, Cloudinary, Google Cloud Storage) or save it to 
  // the server's filesystem (less scalable).
  
  // Example: Upload to a service that returns a URL
  // const storageService = require('../services/storageService'); // Hypothetical service
  // const imageUrl = await storageService.upload(req.file.buffer, `avatars/${req.user._id}-${Date.now()}`);
  
  // For now, we'll just use a placeholder URL or the original filename
  // Note: Using filename directly isn't secure or reliable as a URL.
  const placeholderUrl = `/uploads/avatars/${req.user._id}-${req.file.originalname}`; // Simulate a local path
  console.log('Simulating avatar upload. Placeholder URL:', placeholderUrl); 
  const imageUrl = placeholderUrl; // Use the placeholder
  // --- End Placeholder --- 

  // Update user's avatar field
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: imageUrl },
    { new: true, runValidators: true }
  ).select('-refreshToken');

  if (!updatedUser) {
    // Should not happen if user exists, but good practice
    res.status(404);
    throw new Error('User not found during avatar update');
  }

  res.status(200).json({ 
    success: true, 
    message: 'Avatar updated successfully', 
    // Send back the updated user or just the new avatar URL
    // Sending user ensures frontend context can be updated fully
    user: updatedUser 
  });
});

// --- Admin Only User Management ---

// @desc    Create user by Admin
// @route   POST /api/users
// @access  Private/Admin
exports.createUserByAdmin = asyncHandler(async (req, res, next) => {
    const { name, email, password, role, phone, isActive, isVerified } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
        res.status(400);
        throw new Error('Name, email, password, and role are required');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
        name,
        email,
        password,
        role,
        phone,
        isActive: isActive !== undefined ? isActive : true, // Default to active if not provided
        isVerified: isVerified !== undefined ? isVerified : false // Default to not verified
    });

    if (user) {
        // Exclude sensitive fields from response
        const userResponse = { ...user._doc };
        delete userResponse.password;
        delete userResponse.refreshToken;
        delete userResponse.__v;

        res.status(201).json({ success: true, user: userResponse });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  // Add filtering/pagination later if needed
  const users = await User.find().select('-refreshToken');
  res.status(200).json({ success: true, count: users.length, users });
});

// @desc    Get single user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-refreshToken');
  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id ${req.params.id}` });
  }
  res.status(200).json({ success: true, user });
});

// @desc    Update user details (admin only - can update more fields)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Admin can update role, isActive, isVerified, etc.
  // Be careful about which fields are allowed to be updated
  const fieldsToUpdate = { ...req.body };
  // Prevent password updates through this route for safety
  delete fieldsToUpdate.password; 
  // Maybe delete refreshToken etc. just in case
  delete fieldsToUpdate.refreshToken;
  delete fieldsToUpdate.passwordResetToken; // etc.

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-refreshToken');

  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id ${req.params.id}` });
  }
  res.status(200).json({ success: true, user });
});


// @desc    Update user role (admin only) - Kept for specific role update if needed
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res, next) => {
    const { role } = req.body;
  if (!role || !['player', 'coach', 'admin', 'turfOwner'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-refreshToken');
  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id ${req.params.id}` });
  }
  res.status(200).json({ success: true, user });
});

// @desc    Activate/Deactivate user account (admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.setUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body; // Expecting { isActive: true/false }
  if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Please provide an isActive status (true or false)' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-refreshToken');
  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id ${req.params.id}` });
  }
  res.status(200).json({ success: true, user });
});

// @desc    Delete user (admin only - Use with caution! Consider deactivation instead)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id ${req.params.id}` });
  }

  // Add any cleanup logic here (e.g., remove associated data?)
  await user.remove();

  res.status(200).json({ success: true, message: 'User deleted successfully' });
});
