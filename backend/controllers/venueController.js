const Venue = require('../models/Venue');
const Booking = require('../models/Booking');

// Get all venues
exports.getVenues = async (req, res, next) => {
  try {
    // Populate both amenities and the equipmentList (selecting only name)
    const venues = await Venue.find()
        .populate('amenities', 'name icon') // Select fields for amenities
        .populate('equipmentList', 'name'); // Select only name for equipment
        
    res.status(200).json({ success: true, count: venues.length, data: venues }); // Standardize response
  } catch (err) {
    next(err);
  }
};

// Get single venue
exports.getVenueById = async (req, res, next) => {
  try {
    // Update population for equipmentList to include currentUser name 
    // and populate owner name
    // Also explicitly include openingHours
    const venue = await Venue.findById(req.params.id)
        .select('+openingHours') // Explicitly include if needed, or just ensure it's not deselected
        .populate('amenities', 'name icon')
        .populate({
            path: 'equipmentList',
            select: 'name rentalPrice status currentUser condition description', // Select fields needed in frontend
            populate: {
                path: 'currentUser',
                select: 'name' // Select only the name of the user who checked out
            }
        })
        .populate('owner', 'name email') // Keep existing populates
        .populate('amenities')          // Keep existing populates
        .populate('equipmentList');     // <<< ADD THIS LINE TO POPULATE EQUIPMENT DETAILS
    if (!venue) {
        // Use standardized error response
        res.status(404);
        throw new Error('Venue not found');
    }
    res.status(200).json({ success: true, data: venue });
  } catch (err) {
    // Pass error to the error handler middleware
    next(err); 
  }
};

// Create a venue
exports.createVenue = async (req, res, next) => {
  try {
    const { name, location, capacity, equipmentList } = req.body;

    if (!name || !location || !capacity) {
      return res.status(400).json({ message: 'Name, location and capacity are required' });
    }

    const venue = await Venue.create({
      name,
      location,
      capacity,
      equipmentList: equipmentList || []
    });

    res.status(201).json(venue);
  } catch (err) {
    next(err);
  }
};

// Update a venue
exports.updateVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json(venue);
  } catch (err) {
    next(err);
  }
};

// Delete a venue
exports.deleteVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json({ message: 'Venue deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get availability - REMOVED as redundant
/*
exports.getVenueAvailability = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    const today = new Date();
    const bookings = await Booking.find({
      venue: venue._id,
      createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
    });

    const bookedSlots = bookings.map(b => b.slot);

    res.json({
      venueId: venue._id,
      venueName: venue.name,
      bookedSlots
    });
  } catch (err) {
    next(err);
  }
};
*/

// Update Venue Amenities - REMOVED as redundant / better handled elsewhere
/*
exports.updateVenueAmenities = async (req, res) => {
  try {
    const { amenities } = req.body;
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      { amenities },
      { new: true }
    ).populate('amenities');

    res.json(venue);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update venue amenities' });
  }
};
*/