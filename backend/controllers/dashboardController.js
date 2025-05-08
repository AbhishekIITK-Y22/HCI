// controllers/dashboardController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose'); // Import mongoose for Types.ObjectId
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Venue = require('../models/Venue');
// const Event = require('../models/Event'); // Removed unused model
const AnalyticsMetric = require('../models/AnalyticsMetric');
const Equipment = require('../models/Equipment');
const Payment = require('../models/Payment');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

// Helper function to get date ranges
const getDateRanges = () => {
    const now = dayjs();
    const startOfToday = now.startOf('day').toDate();
    const endOfToday = now.endOf('day').toDate();
    const startOfMonth = now.startOf('month').toDate();
    const endOfMonth = now.endOf('month').toDate();
    return { now: now.toDate(), startOfToday, endOfToday, startOfMonth, endOfMonth };
};

// @desc    Get dashboard statistics based on user role
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { now, startOfToday, endOfToday, startOfMonth, endOfMonth } = getDateRanges();

    let stats = {};
    let events = [];
    let myVenueIds = [];

    if (userRole === 'admin') {
        // --- Admin Stats - Fetch recent CONFIRMED bookings only ---
        const [
            totalUsers,
            registeredTurfs,
            totalBookings, // This will now only count confirmed/completed/cancelled
            bookingsThisMonth,
            registeredCustomers,
            registeredCoaches,
            todayExpensesAgg,
            monthExpensesAgg,
            monthRevenueAgg,
            recentConfirmedBookings // Removed pending counts/fetch
        ] = await Promise.all([
            User.countDocuments({}),
            Venue.countDocuments({}),
            Booking.countDocuments({}), // Counts all non-pending bookings
            Booking.countDocuments({ status: 'confirmed', createdAt: { $gte: startOfMonth, $lte: endOfMonth } }), // Count confirmed this month
            User.countDocuments({ role: 'player' }),
            User.countDocuments({ role: 'coach' }),
            Expense.aggregate([ { $match: { date: { $gte: startOfToday, $lte: endOfToday } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]),
            Expense.aggregate([ { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]),
            Payment.aggregate([ { $match: { status: 'success', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]),
            Booking.find({ status: 'confirmed' })
                   .sort({ createdAt: -1 })
                   .limit(5)
                   .populate('user', 'name')
                   .populate('venue', 'name'),
            // REMOVED: Pending count query
            // REMOVED: Recent pending fetch query
        ]);

        stats = {
            totalUsers,
            registeredTurfs,
            totalBookings,
            bookingsThisMonth,
            registeredCustomers,
            registeredCoaches,
            todayExpense: todayExpensesAgg[0]?.total || 0,
            expenseThisMonth: monthExpensesAgg[0]?.total || 0,
            revenueThisMonth: monthRevenueAgg[0]?.total || 0,
            recentConfirmedBookings // REMOVED: pendingBookingsCount, recentPendingBookings
        };

        // Admin Events: All upcoming confirmed bookings
        const allUpcomingBookings = await Booking.find({ status: 'confirmed', startTime: { $gte: now } }).limit(10).sort({ startTime: 1 }).populate('venue', 'name');
        events = allUpcomingBookings.map(b => ({ _id: b._id, title: `Booking: ${b.venue?.name || 'Venue'}`, date: b.startTime }));

    } else if (userRole === 'turfOwner') {
        // --- Turf Owner Stats - REMOVE pending logic here too? ---
        // Assuming owners also don't need to see pending payments that might never complete
        const myVenues = await Venue.find({ owner: userId }).select('_id');
        myVenueIds = myVenues.map(v => v._id);
        const myVenueObjectIds = myVenueIds.map(id => new mongoose.Types.ObjectId(id));

        const ownerPaymentsPipeline = [
            { $match: { status: 'success', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $lookup: { from: 'bookings', localField: 'booking', foreignField: '_id', as: 'bookingDetails' } },
            { $unwind: '$bookingDetails' },
            { $match: { 'bookingDetails.venue': { $in: myVenueObjectIds } } } 
        ];

        // Removed pendingBookingsCount, recentPendingBookings from owner fetch
        const [registeredTurfs, venueBookingsCount, bookingsThisMonth, todayExpensesAgg, monthExpensesAgg, ownerRevenueAgg, recentVenueBookings] = await Promise.all([
            Venue.countDocuments({ owner: userId }), // Count only owner's venues
            Booking.countDocuments({ venue: { $in: myVenueObjectIds }, status: 'confirmed' }), // Count owner's confirmed bookings
            // Booking.countDocuments({ venue: { $in: myVenueObjectIds }, status: 'pending' }), // REMOVED
            Booking.countDocuments({ venue: { $in: myVenueObjectIds }, status: 'confirmed', createdAt: { $gte: startOfMonth, $lte: endOfMonth } }), // Confirmed this month
            Expense.aggregate([ { $match: { venueId: { $in: myVenueObjectIds }, date: { $gte: startOfToday, $lte: endOfToday } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]), 
            Expense.aggregate([ { $match: { venueId: { $in: myVenueObjectIds }, date: { $gte: startOfMonth, $lte: endOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ]), 
            Payment.aggregate([
                ...ownerPaymentsPipeline,
                { $match: { 'bookingDetails.venue': { $in: myVenueObjectIds } } }, 
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            // Fetch recent CONFIRMED bookings for owner's venues
            Booking.find({ venue: { $in: myVenueObjectIds }, status: 'confirmed' })
                   .sort({ createdAt: -1 })
                   .limit(5)
                   .populate('user', 'name')
                   .populate('venue', 'name')
        ]);
        
        stats = {
            registeredTurfs: registeredTurfs, // Use count of owner's venues
            myVenuesCount: myVenueIds.length,
            venueBookings: venueBookingsCount, // Confirmed bookings count
            // pendingBookings: pendingBookingsCount, // REMOVED
            bookingsThisMonth, // Confirmed this month count
            todayExpense: todayExpensesAgg[0]?.total || 0,
            expenseThisMonth: monthExpensesAgg[0]?.total || 0,
            revenueThisMonth: ownerRevenueAgg[0]?.total || 0,
            recentBookings: recentVenueBookings // Renamed from recentPendingBookings
        };

        // Owner Events: Upcoming confirmed bookings for their venues
        const ownerBookings = await Booking.find({ venue: { $in: myVenueObjectIds }, status: 'confirmed', startTime: { $gte: now } }).limit(10).sort({ startTime: 1 }).populate('venue', 'name');
        events = ownerBookings.map(b => ({ _id: b._id, title: `Booking: ${b.venue?.name || 'Venue'}`, date: b.startTime }));

    } else if (userRole === 'player') {
        // --- Player Stats ---
        // Fetch next upcoming booking and payment total
        const [nextBooking, paymentTotalAgg] = await Promise.all([
            Booking.findOne({ user: userId, status: 'confirmed', startTime: { $gte: now } })
                   .sort({ startTime: 1 })
                   .populate('venue', 'name'), // Populate venue name
            Payment.aggregate([ { $match: { payerId: userId, status: 'success', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } } ])
        ]);

        stats = {
            // Instead of count, provide details of the next booking or null
            nextBookingDetails: nextBooking ? { 
                _id: nextBooking._id,
                venueName: nextBooking.venue?.name || 'Venue',
                startTime: nextBooking.startTime,
                // Add endTime if needed by frontend
             } : null, 
            amountSpentThisMonth: paymentTotalAgg[0]?.total || 0,
        };

        // Player Events: Their upcoming bookings (Keep this for calendar)
        const playerBookings = await Booking.find({ user: userId, startTime: { $gte: now } }).limit(10).sort({ startTime: 1 }).populate('venue', 'name');
        events = playerBookings.map(b => ({ _id: b._id, title: `Booking @ ${b.venue?.name || 'Venue'}`, date: b.startTime }));

    } else if (userRole === 'coach') {
        // --- Coach Stats ---
        const upcomingSessions = await Booking.countDocuments({
             coach: userId, 
             status: 'confirmed', 
             startTime: { $gte: now } 
        });

        stats = {
             upcomingSessions: upcomingSessions || 0, 
        };

         // Coach Events: Their upcoming confirmed bookings/sessions
         const coachBookings = await Booking.find({
             coach: userId, 
             startTime: { $gte: now } 
         }).limit(10).sort({ startTime: 1 }).populate('venue', 'name');
         events = coachBookings.map(b => ({ 
             _id: b._id, 
             title: `Session @ ${b.venue?.name || 'Venue'}`,
             date: b.startTime 
         }));
    }

    // --- ADDED: Log the events array before sending --- 
    console.log('--- [Admin Dashboard Stats] Events being sent: ---');
    console.log(JSON.stringify(events, null, 2)); // Log the events array clearly
    // --------------------------------------------------

    res.status(200).json({
        success: true,
        stats,
        events,
    });
});

// Removed unused getEvents function
/*
exports.getEvents = asyncHandler(async (req, res) => {
  const user = req.user;
  let docs;

  if (user.role === 'admin') {
    docs = await Event.find();
  } else if (user.role === 'turfOwner') {
    docs = await Event.find({ venue: { owner: user._id } });
  } else if (user.role === 'coach') {
    docs = await Event.find({ coach: user._id });
  } else { // player
    docs = await Event.find({ participants: user._id });
  }

  // map to the shape CalendarView expects
  const events = docs.map(e => ({
    _id:       e._id,
    title:     e.title || e.name,
    date:      e.date,
    startTime: e.startTime,
    endTime:   e.endTime
  }));

  res.json(events);
});
*/

// Ensure only getDashboardStats is exported
module.exports = {
    getDashboardStats,
};
