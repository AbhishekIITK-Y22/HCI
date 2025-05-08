// controllers/analyticsController.js
const AnalyticsMetric = require('../models/AnalyticsMetric');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

exports.getAllMetrics = asyncHandler(async (req, res) => {
  try {
    const data = await AnalyticsMetric.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

exports.getHourlyBookingStats = asyncHandler(async (req, res) => {
  const { venueId } = req.query;

  const matchStage = {
    status: 'confirmed'
  };

  if (venueId && mongoose.Types.ObjectId.isValid(venueId)) {
    matchStage.venue = new mongoose.Types.ObjectId(venueId);
  } else if (venueId) {
    res.status(400);
    throw new Error('Invalid venueId format');
  }

  const hourlyBookings = await Booking.aggregate([
    {
      $match: matchStage
    },
    {
      $project: {
        hour: { $hour: { date: "$startTime", timezone: "UTC" } }
      }
    },
    {
      $group: {
        _id: '$hour',
        bookings: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    },
    {
      $project: {
        hour: '$_id',
        bookings: 1,
        _id: 0
      }
    }
  ]);

  const hourlyMap = new Map(hourlyBookings.map(item => [item.hour, item.bookings]));
  const fullHourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    bookings: hourlyMap.get(i) || 0,
    name: `${String(i).padStart(2, '0')}:00`
  }));

  res.status(200).json({ success: true, data: fullHourlyData });
});

exports.getAnalyticsSummary = asyncHandler(async (req, res) => {
  const [totalBookings, totalUsers, totalRevenueResult] = await Promise.all([
    Booking.countDocuments({ status: 'confirmed' }),
    User.countDocuments(),
    Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ])
  ]);

  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

  res.status(200).json({
    success: true,
    data: {
      totalBookings,
      totalUsers,
      totalRevenue,
    }
  });
});
