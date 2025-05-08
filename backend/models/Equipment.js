const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },            // e.g. "Football"
  status: { type: String, enum: ['available', 'checkedout'], default: 'available' },
  currentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },  // 🔗 Link to Turf
  rentalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  description: String,
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);