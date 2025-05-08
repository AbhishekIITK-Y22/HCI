const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  booking: { // Will be linked AFTER successful payment and booking creation
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    // required: true -> Becomes optional initially
  },
  payerId: { // User who is trying to book/pay
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'cash', 'bank_transfer'],
    default: 'card', // Default to card for Stripe flow
    required: true
  },
  transactionId: { // Stripe Payment Intent ID
    type: String,
    index: true
  },
  notes: { type: String },
  
  // --- Temporary Booking Details (Stored during pending state) ---
  tempBookingDetails: {
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    equipmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional coach
    calculatedAmount: { type: Number, required: true } // Store the amount calculated before intent creation
  }
  // --------------------------------------------------------------

}, { timestamps: true });

// Optional: Index for querying pending payments needing cleanup
PaymentSchema.index({ status: 1, createdAt: 1 }); 

module.exports = mongoose.model('Payment', PaymentSchema);
