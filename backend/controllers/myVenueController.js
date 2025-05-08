const asyncHandler = require('express-async-handler');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get venues owned by the logged-in user
// @route   GET /api/my-venues
// @access  Private (TurfOwner or Admin)
exports.getMyVenues = asyncHandler(async (req, res) => {
  const venues = await Venue.find({ owner: req.user._id })
      .populate('amenities', 'name icon') // Populate necessary fields
      .populate('equipmentList', 'name status rentalPrice') // Populate necessary fields
      .sort({ createdAt: -1 }); // Sort by newest first

  res.status(200).json({
    success: true,
    count: venues.length,
    data: venues
  });
});

// @desc    Create a new venue owned by the logged-in user
// @route   POST /api/my-venues
// @access  Private (TurfOwner or Admin)
exports.createMyVenue = asyncHandler(async (req, res) => {
    // Destructure all expected fields from Venue model
    const {
        name,
        location,
        capacity,
        pricePerHour,
        openingHours, // Expecting { start: "HH:MM", end: "HH:MM" }
        images, // Array of strings
        amenities, // Array of Amenity IDs
        // equipmentList will be managed separately, not usually set on creation
        // coaches, coachCommission handled elsewhere probably
    } = req.body;
    
    // Basic validation
    if (!name || !location || !pricePerHour) {
        res.status(400);
        throw new Error('Name, location, and price per hour are required.');
    }

    const venueData = {
        name,
        location,
        pricePerHour,
        owner: req.user._id, // Set owner to the logged-in user
        capacity: capacity || 0,
        openingHours: openingHours || { start: '09:00', end: '21:00' }, // Default hours if not provided
        images: images || [],
        amenities: amenities || []
        // Initialize other fields as needed
    };

    const venue = await Venue.create(venueData);

    if (venue) {
        res.status(201).json({
            success: true,
            message: 'Venue created successfully',
            data: venue
        });
    } else {
        res.status(400);
        throw new Error('Invalid venue data');
    }
});

// @desc    Update a venue owned by the logged-in user
// @route   PUT /api/my-venues/:venueId
// @access  Private (Owner of venueId or Admin)
exports.updateMyVenue = asyncHandler(async (req, res) => {
    const { venueId } = req.params;
    const venue = await Venue.findById(venueId);

    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    // Check if the logged-in user is the owner or an admin
    if (venue.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403); // Forbidden
        throw new Error('User not authorized to update this venue');
    }

    // Update allowed fields (prevent owner field change)
    const { 
        name, 
        location, 
        capacity, 
        pricePerHour, 
        openingHours, 
        images, 
        amenities, 
        equipmentList // Allow updating equipment/amenities list refs
    } = req.body;

    // Update fields if they exist in the request body
    if (name) venue.name = name;
    if (location) venue.location = location;
    if (capacity !== undefined) venue.capacity = capacity;
    if (pricePerHour !== undefined) venue.pricePerHour = pricePerHour;
    if (openingHours) {
        if (openingHours.start) venue.openingHours.start = openingHours.start;
        if (openingHours.end) venue.openingHours.end = openingHours.end;
    }
    if (images) venue.images = images;
    if (amenities) venue.amenities = amenities; // Assuming array of IDs
    if (equipmentList) venue.equipmentList = equipmentList; // Assuming array of IDs

    const updatedVenue = await venue.save();

    res.status(200).json({
        success: true,
        message: 'Venue updated successfully',
        data: updatedVenue
    });
});

// @desc    Get customers (users who booked) for a specific venue owned by the logged-in user
// @route   GET /api/my-venues/:venueId/customers
// @access  Private (Owner of venueId or Admin)
exports.getVenueCustomers = asyncHandler(async (req, res) => {
  const venueId = req.params.venueId;

  // 1. Verify Venue exists and user owns it (or is admin)
  const venue = await Venue.findById(venueId);
  if (!venue) {
    return res.status(404).json({ success: false, message: 'Venue not found' });
  }

  // Check ownership (allow admin override)
  if (venue.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'User not authorized to access this venue\'s customers' });
  }

  // 2. Find bookings for this venue
  const bookings = await Booking.find({ venue: venueId }).select('user');

  // 3. Get unique user IDs
  const userIds = [...new Set(bookings.map(b => b.user.toString()))];

  // 4. Fetch user details for these IDs
  const customers = await User.find({ '_id': { $in: userIds } })
      .select('name email phone avatar createdAt'); // Select desired fields

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers
  });
}); 