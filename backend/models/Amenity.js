const mongoose = require('mongoose');

const AmenitySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  icon: { // Optional: Suggested icon name (e.g., 'wifi', 'parking', 'shower')
    type: String, 
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Amenity', AmenitySchema);
