const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  businessHours: { 
      type: String,
      default: '09:00 - 18:00' // Provide a default
  },
  enableNotifications: { // Global toggle (could be overridden by user prefs)
      type: Boolean,
      default: true
  },
  defaultCurrency: {
      type: String,
      default: 'INR'
  },
  bookingPolicyText: {
      type: String,
      default: 'Standard booking terms and conditions apply.' // Example default policy
  }
  // Add more global settings as needed
}, { 
    timestamps: true,
    // Ensure only one settings document can exist
    capped: { size: 1024, max: 1 } // Optional: capping might be too restrictive, unique index better?
});

// Optional: Ensure only one settings document via index (alternative to capped collection)
// SettingsSchema.index({ "_id": 1 }, { unique: true }); // This is inherent to _id

module.exports = mongoose.model('Settings', SettingsSchema);
