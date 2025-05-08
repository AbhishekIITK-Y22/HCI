const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Venue = require('../models/Venue');

exports.getReportSummary = async (req, res, next) => {
  try {
    const [bookingCount, venueCount, payments] = await Promise.all([
      Booking.countDocuments(),
      Venue.countDocuments(),
      Payment.find()
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      totalBookings: bookingCount,
      totalVenues: venueCount,
      totalRevenue,
      recentPayments: payments.slice(-5)
    });
  } catch (err) {
    next(err);
  }
};
