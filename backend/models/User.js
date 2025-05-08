const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // For token generation

const UserSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password:{ 
    type: String, 
    required: true,
    minlength: 6, // Basic password length requirement
    select: false // Hide password by default
  },
  role:    {
    type: String,
    enum: ['player', 'coach', 'admin', 'turfOwner'], // ✅ added 'turfOwner'
    default: 'player'
  },
  phone:   { type: String }, // ✅ optional contact info
  avatar:  { type: String }, // ✅ optional for user profile picture
  refreshToken: { type: String, select: false }, // For storing refresh token
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  isVerified: { // Email verification status
    type: Boolean,
    default: false
  },
  isActive: { // Account status
    type: Boolean,
    default: true
  },
  // --- User Specific Settings ---
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  notificationPreferences: {
    email: { // Receive email notifications
      type: Boolean,
      default: true
    },
    push: { // Receive push notifications (if implemented)
      type: Boolean,
      default: true
    },
    // Could add more specific notification types here, e.g.:
    // bookingConfirmations: { type: Boolean, default: true },
    // reminders: { type: Boolean, default: true },
    // promotions: { type: Boolean, default: false },
  },
  // ------------------------------
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // If password changes, remove reset tokens
  if (this.isModified('password')) {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
  }
  next();
});

// Add password comparison method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

module.exports = mongoose.model('User', UserSchema);
