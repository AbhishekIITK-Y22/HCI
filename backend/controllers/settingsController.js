const Settings = require('../models/Settings');
const asyncHandler = require('express-async-handler');

// @desc    Get current application settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    // Auto-create default if not exists
    console.log('No settings found, creating default settings...');
    settings = await Settings.create({
      businessHours: '09:00 - 18:00', // Example default
      enableNotifications: true,
      defaultCurrency: 'INR', // Example new default
      bookingPolicyText: 'Standard booking policies apply.' // Example new default
    });
  }
  res.status(200).json({ success: true, data: settings });
});

// @desc    Update application settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = asyncHandler(async (req, res) => {
  // Find the single settings document (there should only be one)
  let settings = await Settings.findOne();
  
  if (!settings) {
     res.status(404);
     throw new Error('Settings document not found. Cannot update.');
  }

  // Update with the request body, run validators, return the new doc
  const updatedSettings = await Settings.findByIdAndUpdate(settings._id, req.body, { 
      new: true, 
      runValidators: true 
  });
  
  res.status(200).json({ success: true, data: updatedSettings });
}); 