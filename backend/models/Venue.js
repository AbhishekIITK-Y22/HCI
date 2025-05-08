// ✅ Updated 
const mongoose = require('mongoose');
const VenueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, default: 0 },
  equipmentList: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Equipment' 
  }],
  pricePerHour: { type: Number, required: true },
  openingHours: {
    start: { type: String, default: '06:00' }, // e.g., "06:00"
    end: { type: String, default: '23:00' }    // e.g., "23:00"
  },
  images: [String], // Optional - useful for frontend
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amenities: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Amenity' 
  }],
  coaches: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Coach' 
  }],
  coachCommission: {
    type: Number,
    default: 0 // percentage commission for coaches
  }
}, { timestamps: true });

module.exports = mongoose.model('Venue', VenueSchema);
