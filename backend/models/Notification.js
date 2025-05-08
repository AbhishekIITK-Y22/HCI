const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Targeting Fields (At least one should ideally be set)
  user: { // Direct notification to a specific user
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true // Index for faster lookups
  },
  roleTarget: { // Target users with a specific role
    type: String,
    enum: ['player', 'coach', 'admin', 'turfOwner', null], // Allow null if targeting user/venue
    default: null,
    index: true
  },
  venueTarget: { // Target related to a specific venue (e.g., for owner, or users who booked there)
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Venue',
    default: null,
    index: true
  },

  // Notification Content
  message: {
    type: String,
    required: true
  },
  type: { // Category/Type (e.g., for grouping or icons)
    type: String, 
    enum: ['booking_confirmed', 'booking_cancelled', 'payment_success', 'payment_failed', 'reminder', 'announcement', 'alert'], 
    default: 'alert' 
  },
  link: { // Optional: Link to related resource (e.g., /bookings/ID)
    type: String 
  },
  
  // Status
  read: { 
    type: Boolean, 
    default: false, 
    index: true // Index for unread count
  },
}, { timestamps: true }); // Uses createdAt for notification time

module.exports = mongoose.model('Notification', NotificationSchema);
