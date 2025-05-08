// controllers/bookingController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Venue = require('../models/Venue');
const Equipment = require('../models/Equipment');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone'); // Required for time zone handling
const { createAndNotify } = require('../utils/notificationUtils'); // Import renamed helper
dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to calculate duration in hours
const calculateDuration = (start, end) => {
  const startTime = new Date(`2000-01-01T${start}`);
  const endTime = new Date(`2000-01-01T${end}`);
  return (endTime - startTime) / (1000 * 60 * 60); // hours
};

// REMOVED: Player-initiated createBooking logic is now handled within payment flow
// const createBooking = asyncHandler(async (req, res) => { ... });

// 📌 GET /api/bookings — Get bookings based on user role and optional filters
const getUserBookings = asyncHandler(async (req, res) => {
  const filter = {};
  const { role, _id: userId } = req.user;
  const { status, venueId } = req.query; // Get filters from query params

  // --- Apply Role-Based Filtering --- 
  if (role === 'player') {
    filter.user = userId;
  } else if (role === 'coach') {
    filter.coach = userId;
  } else if (role === 'turfOwner') {
    // Find venues owned by this user
    const ownerVenues = await Venue.find({ owner: userId }).select('_id');
    const ownerVenueIds = ownerVenues.map(v => v._id);
    // If owner owns no venues, they have no bookings to manage
    if (ownerVenueIds.length === 0) {
         return res.status(200).json({ success: true, data: [] });
    }
    filter.venue = { $in: ownerVenueIds };
  } else if (role === 'admin') {
    // Admin sees all - no additional role filter needed initially
  } else {
    // Unknown role or role without booking view permission
    return res.status(403).json({ success: false, message: 'Not authorized to view bookings' });
  }

  // --- Apply Query Parameter Filtering --- 
  if (status) {
     // Allow filtering by multiple statuses if comma-separated
     const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
     // Ensure only valid statuses are used (now only confirmed, cancelled, completed)
     const validStatuses = ['confirmed', 'cancelled', 'completed'];
     const filteredStatuses = statuses.filter(s => validStatuses.includes(s));
     if (filteredStatuses.length > 0) {
       filter.status = { $in: filteredStatuses };
     } else if (statuses.length > 0) {
         // If invalid statuses were provided, maybe return empty or ignore?
         // Here we ignore invalid ones and proceed without status filter if none are valid.
     } // else: no status filter applied
  } 
  if (venueId && mongoose.Types.ObjectId.isValid(venueId)) {
      // If admin or owner is filtering by a specific venue
      // Ensure the venueId filter doesn't conflict with owner's allowed venues
      if (role === 'turfOwner' && filter.venue && !filter.venue.$in.some(id => id.equals(venueId))) {
         // Owner trying to filter by a venue they don't own - return empty
         return res.status(200).json({ success: true, data: [] });
      } 
      // If admin, or owner filtering their own venue, apply the specific venue filter
      filter.venue = new mongoose.Types.ObjectId(venueId); 
  } else if (venueId) {
      res.status(400);
      throw new Error('Invalid venueId format provided for filtering.');
  }

  // --- Fetch and Populate --- 
  // TODO: Add sorting and pagination later if needed
  const bookings = await Booking.find(filter)
    .sort({ startTime: -1 }) // Default sort: newest first
    .populate('user', 'name email') // Populate user details
    .populate('venue', 'name') // Populate venue name
    .populate('coach', 'name') // Populate coach name (assuming coach field links to User model)
    .populate('equipment', 'name');

  res.status(200).json({ success: true, data: bookings });
});

// 📌 GET /api/bookings/calendar — fetch bookings for the month
const getCalendarBookings = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate();
  const endDate = dayjs(startDate).endOf('month').toDate();

  const bookings = await Booking.find({
    'slot.date': { $gte: startDate, $lte: endDate }
  })
  .populate('venue', 'name')
  .populate('coach', 'user');

  const events = bookings.map(b => ({
    _id: b._id,
    title: b.venue.name,
    date: b.slot.date,
    startTime: b.slot.start,
    endTime: b.slot.end,
    coach: b.coach?.user?.name || 'N/A'
  }));

  res.json(events);
});

// 📌 GET /api/bookings/:id — Admin fetches a booking by ID
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email')
    .populate('coach')
    .populate('venue')
    .populate('equipment');

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  res.json(booking);
});

// 📌 PUT /api/bookings/:id — Admin updates booking status
const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  booking.status = req.body.status || booking.status;
  await booking.save();

  res.json(booking);
});

// 📌 DELETE /api/bookings/:id — Admin deletes a booking
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  res.json({ message: 'Booking deleted successfully' });
});

// @desc    Get available time slots for a venue on a given date
// @route   GET /api/bookings/slots/:venueId
// @access  Public
const getAvailableSlots = asyncHandler(async (req, res) => {
    const { venueId } = req.params;
    const { date } = req.query;

    if (!date || !dayjs(date, 'YYYY-MM-DD', true).isValid()) {
        res.status(400);
        throw new Error('Please provide a valid date in YYYY-MM-DD format.');
    }

    const venue = await Venue.findById(venueId);
    if (!venue) {
        res.status(404);
        throw new Error('Venue not found');
    }

    const requestedDate = dayjs(date).tz(dayjs.tz.guess()); // Use server's local timezone guess
    const startOfDay = requestedDate.startOf('day');
    const endOfDay = requestedDate.endOf('day');

    // Fetch existing bookings for this venue on the requested date
    const existingBookings = await Booking.find({
        venue: venueId,
        // Query bookings that *overlap* with the requested date.
        // Using startTime for simplicity, assuming bookings don't span across midnight.
        // A more robust check would compare start/end times with the date range.
        startTime: {
            $gte: startOfDay.toDate(),
            $lte: endOfDay.toDate(),
        },
        status: { $in: ['pending', 'confirmed'] } // Only consider active bookings
    }).select('startTime endTime'); // Select only necessary fields

    const bookedSlots = existingBookings.map(b => ({
        start: dayjs(b.startTime).tz(dayjs.tz.guess()),
        end: dayjs(b.endTime).tz(dayjs.tz.guess())
    }));

    // Generate potential slots (assuming 1-hour duration)
    const availableSlots = [];
    const openHour = parseInt(venue.openingHours.start.split(':')[0], 10);
    const closeHour = parseInt(venue.openingHours.end.split(':')[0], 10);
    const slotDurationHours = 1; // Assuming 1 hour slots

    for (let hour = openHour; hour < closeHour; hour += slotDurationHours) {
        const slotStart = startOfDay.hour(hour).minute(0).second(0);
        const slotEnd = slotStart.add(slotDurationHours, 'hour');

        // Check if this potential slot overlaps with any existing booking
        const isBooked = bookedSlots.some(booked => 
            slotStart.isBefore(booked.end) && slotEnd.isAfter(booked.start)
        );

        if (!isBooked) {
            availableSlots.push({
                //_id: `slot-${hour}`, // Generate a temporary ID if needed frontend
                date: slotStart.format('YYYY-MM-DD'),
                startTime: slotStart.toDate(), // Store as full Date object
                endTime: slotEnd.toDate(),     // Store as full Date object
                timeString: `${slotStart.format('HH:mm')} - ${slotEnd.format('HH:mm')}`, // User-friendly string
                price: venue.pricePerHour * slotDurationHours, // Calculate price
                available: true // Redundant here, but good practice
            });
        }
    }

    res.status(200).json({ 
        success: true, 
        count: availableSlots.length, 
        slots: availableSlots 
    });
});

module.exports = {
  // createBooking, // Removed from exports
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getCalendarBookings,
  getAvailableSlots
};

