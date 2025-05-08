const mongoose = require('mongoose');

const TariffSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  timeStart: { type: String, required: true },  // e.g., "06:00"
  timeEnd:   { type: String, required: true },  // e.g., "10:00"
  price:     { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Tariff', TariffSchema);
