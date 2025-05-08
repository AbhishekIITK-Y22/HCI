const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  coach: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Coach' 
  },
  venue: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Venue', 
    required: true 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  equipment: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Equipment' 
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'refunded'],
    default: 'paid',
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
