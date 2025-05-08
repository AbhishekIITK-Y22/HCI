const mongoose = require('mongoose');
const CoachSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  venues: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Venue' 
  }],
  bio: String,
  specialties: [String],
  rating: {
    type: Number,
    default: 0
  },
  experience: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    required: true
  },
  availability: [{
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [{
      start: String,
      end: String
    }]
  }],
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Coach', CoachSchema);