const mongoose = require('mongoose');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Equipment = require('../models/Equipment');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const Amenity = require('../models/Amenity');
const Expense = require('../models/Expense');
const Coach = require('../models/Coach');
const Tariff = require('../models/Tariff');
const Event = require('../models/Event');
const AnalyticsMetric = require('../models/AnalyticsMetric');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const connectDB = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB using existing connectDB function
connectDB()
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Seed data
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Venue.deleteMany({});
    await Equipment.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Settings.deleteMany({});
    await Notification.deleteMany({});
    await Amenity.deleteMany({});
    await Expense.deleteMany({});
    await Coach.deleteMany({});
    await Tariff.deleteMany({});
    await Event.deleteMany({});
    await AnalyticsMetric.deleteMany({});
    await Message.deleteMany({});
    await ChatRoom.deleteMany({});

    console.log('Cleared existing data');

    // Create users with proper password hashing
    const users = [
      // Admin
      new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        phone: '9876543210',
        isVerified: true
      }),
      // Turf Owners
      new User({
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        password: 'owner123',
        role: 'turfOwner',
        phone: '9876543211',
        isVerified: true
      }),
      new User({
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'owner123',
        role: 'turfOwner',
        phone: '9876543212',
        isVerified: true
      }),
      // Coaches
      new User({
        name: 'Coach Ravi',
        email: 'ravi@example.com',
        password: 'coach123',
        role: 'coach',
        phone: '9876543213',
        isVerified: true
      }),
      new User({
        name: 'Coach Anita',
        email: 'anita@example.com',
        password: 'coach123',
        role: 'coach',
        phone: '9876543214',
        isVerified: true
      }),
      // Players
      new User({
        name: 'Player Mohan',
        email: 'mohan@example.com',
        password: 'player123',
        role: 'player',
        phone: '9876543215',
        isVerified: true
      }),
      new User({
        name: 'Player Sneha',
        email: 'sneha@example.com',
        password: 'player123',
        role: 'player',
        phone: '9876543216',
        isVerified: true
      })
    ];

    // Save users individually to trigger password hashing middleware
    const createdUsers = [];
    for (const user of users) {
      const savedUser = await user.save();
      createdUsers.push(savedUser);
    }
    console.log('Created users');

    // Create amenities
    const amenities = [
      {
        name: 'Parking',
        description: 'Free parking available',
        icon: 'local_parking'
      },
      {
        name: 'Shower',
        description: 'Shower facilities available',
        icon: 'shower'
      },
      {
        name: 'WiFi',
        description: 'Free WiFi access',
        icon: 'wifi'
      },
      {
        name: 'Cafeteria',
        description: 'Food and drinks available',
        icon: 'restaurant'
      }
    ];

    const createdAmenities = await Amenity.insertMany(amenities);
    console.log('Created amenities');

    // Create venues
    const venues = [
      {
        name: 'Downtown Sports Arena',
        location: '123 Main Street, City Center',
        capacity: 50,
        pricePerHour: 2000,
        openingHours: {
          start: '06:00',
          end: '23:00'
        },
        images: ['venue1.jpg', 'venue2.jpg'],
        owner: createdUsers[1]._id, // Rajesh Kumar
        coachCommission: 10,
        amenities: [createdAmenities[0]._id, createdAmenities[1]._id]
      },
      {
        name: 'Uptown Football Ground',
        location: '456 Park Avenue, Uptown',
        capacity: 40,
        pricePerHour: 1800,
        openingHours: {
          start: '07:00',
          end: '22:00'
        },
        images: ['venue3.jpg', 'venue4.jpg'],
        owner: createdUsers[2]._id, // Priya Sharma
        coachCommission: 15,
        amenities: [createdAmenities[2]._id, createdAmenities[3]._id]
      }
    ];

    const createdVenues = await Venue.insertMany(venues);
    console.log('Created venues');

    // Create equipment
    const equipment = [
      // Equipment for Downtown Sports Arena
      {
        name: 'Football Set',
        status: 'available',
        venue: createdVenues[0]._id,
        rentalPrice: 500,
        description: 'Professional football set with 5 balls',
        condition: 'good'
      },
      {
        name: 'Goal Posts',
        status: 'available',
        venue: createdVenues[0]._id,
        rentalPrice: 300,
        description: 'Portable goal posts',
        condition: 'new'
      },
      // Equipment for Uptown Football Ground
      {
        name: 'Football Set',
        status: 'available',
        venue: createdVenues[1]._id,
        rentalPrice: 400,
        description: 'Standard football set with 3 balls',
        condition: 'fair'
      },
      {
        name: 'Training Cones',
        status: 'available',
        venue: createdVenues[1]._id,
        rentalPrice: 200,
        description: 'Set of 20 training cones',
        condition: 'good'
      }
    ];

    const createdEquipment = await Equipment.insertMany(equipment);
    console.log('Created equipment');

    // Create coaches
    const coaches = [
      {
        user: createdUsers[3]._id, // Coach Ravi
        venues: [createdVenues[0]._id],
        bio: 'Professional football coach with 10 years of experience',
        specialties: ['Football', 'Fitness Training'],
        rating: 4.5,
        experience: 10,
        hourlyRate: 1000,
        availability: [
          {
            venue: createdVenues[0]._id,
            day: 'Monday',
            slots: [
              { start: '09:00', end: '12:00' },
              { start: '15:00', end: '18:00' }
            ]
          }
        ],
        isVerified: true
      },
      {
        user: createdUsers[4]._id, // Coach Anita
        venues: [createdVenues[1]._id],
        bio: 'Certified fitness trainer and football coach',
        specialties: ['Football', 'Strength Training'],
        rating: 4.8,
        experience: 8,
        hourlyRate: 1200,
        availability: [
          {
            venue: createdVenues[1]._id,
            day: 'Tuesday',
            slots: [
              { start: '10:00', end: '13:00' },
              { start: '16:00', end: '19:00' }
            ]
          }
        ],
        isVerified: true
      }
    ];

    const createdCoaches = await Coach.insertMany(coaches);
    console.log('Created coaches');

    // Create tariffs
    const tariffs = [
      {
        venue: createdVenues[0]._id,
        day: 'Monday',
        timeStart: '06:00',
        timeEnd: '10:00',
        price: 1500
      },
      {
        venue: createdVenues[0]._id,
        day: 'Monday',
        timeStart: '10:00',
        timeEnd: '18:00',
        price: 2000
      },
      {
        venue: createdVenues[1]._id,
        day: 'Tuesday',
        timeStart: '07:00',
        timeEnd: '12:00',
        price: 1800
      }
    ];

    await Tariff.insertMany(tariffs);
    console.log('Created tariffs');

    // Create bookings
    const bookings = [
      {
        user: createdUsers[5]._id, // Player Mohan
        venue: createdVenues[0]._id,
        startTime: new Date('2024-04-20T10:00:00Z'),
        endTime: new Date('2024-04-20T12:00:00Z'),
        equipment: [createdEquipment[0]._id],
        totalAmount: 2500,
        paymentStatus: 'paid',
        status: 'confirmed'
      },
      {
        user: createdUsers[6]._id, // Player Sneha
        venue: createdVenues[1]._id,
        startTime: new Date('2024-04-21T15:00:00Z'),
        endTime: new Date('2024-04-21T17:00:00Z'),
        equipment: [createdEquipment[2]._id],
        totalAmount: 2200,
        paymentStatus: 'pending',
        status: 'pending'
      }
    ];

    const createdBookings = await Booking.insertMany(bookings);
    console.log('Created bookings');

    // Create payments
    const payments = [
      {
        booking: createdBookings[0]._id,
        payerId: createdUsers[5]._id, // Player Mohan
        amount: 2500,
        status: 'success',
        paymentMethod: 'card',
        transactionId: 'txn_123456789'
      },
      {
        booking: createdBookings[1]._id,
        payerId: createdUsers[6]._id, // Player Sneha
        amount: 2200,
        status: 'pending',
        paymentMethod: 'upi',
        transactionId: 'txn_987654321'
      }
    ];

    await Payment.insertMany(payments);
    console.log('Created payments');

    // Create expenses
    const expenses = [
      {
        userId: createdUsers[1]._id, // Rajesh Kumar
        venueId: createdVenues[0]._id,
        date: new Date('2024-04-01'),
        amount: 5000,
        category: 'Maintenance',
        description: 'Turf maintenance and repair'
      },
      {
        userId: createdUsers[2]._id, // Priya Sharma
        venueId: createdVenues[1]._id,
        date: new Date('2024-04-05'),
        amount: 3000,
        category: 'Equipment',
        description: 'New football set purchase'
      }
    ];

    await Expense.insertMany(expenses);
    console.log('Created expenses');

    // Create events
    const events = [
      {
        title: 'Football Training Camp',
        date: new Date('2024-04-25'),
        startTime: '09:00',
        endTime: '12:00',
        venue: createdVenues[0]._id,
        coach: createdUsers[3]._id, // Coach Ravi
        participants: [createdUsers[5]._id, createdUsers[6]._id] // Players
      },
      {
        title: 'Fitness Workshop',
        date: new Date('2024-04-26'),
        startTime: '15:00',
        endTime: '17:00',
        venue: createdVenues[1]._id,
        coach: createdUsers[4]._id, // Coach Anita
        participants: [createdUsers[5]._id] // Player Mohan
      }
    ];

    await Event.insertMany(events);
    console.log('Created events');

    // Create notifications
    const notifications = [
      {
        user: createdUsers[5]._id, // Player Mohan
        message: 'Your booking has been confirmed',
        type: 'booking_confirmed',
        link: `/bookings/${createdBookings[0]._id}`
      },
      {
        roleTarget: 'turfOwner',
        venueTarget: createdVenues[0]._id,
        message: 'New booking request received',
        type: 'booking_confirmed'
      }
    ];

    await Notification.insertMany(notifications);
    console.log('Created notifications');

    // Create chat rooms
    const chatRooms = [
      {
        venue: createdVenues[0]._id,
        participants: [createdUsers[1]._id, createdUsers[5]._id] // Owner and Player
      },
      {
        venue: createdVenues[1]._id,
        participants: [createdUsers[2]._id, createdUsers[6]._id] // Owner and Player
      }
    ];

    const createdChatRooms = await ChatRoom.insertMany(chatRooms);
    console.log('Created chat rooms');

    // Create messages
    const messages = [
      {
        chatRoom: createdChatRooms[0]._id,
        sender: createdUsers[5]._id, // Player Mohan
        text: 'Hi, I have a question about the booking'
      },
      {
        chatRoom: createdChatRooms[0]._id,
        sender: createdUsers[1]._id, // Rajesh Kumar
        text: 'Sure, how can I help you?'
      }
    ];

    await Message.insertMany(messages);
    console.log('Created messages');

    // Create analytics metrics
    const analyticsMetrics = [
      {
        metric: 'booking_conversion_rate',
        percentage: 75
      },
      {
        metric: 'venue_occupancy_rate',
        percentage: 60
      }
    ];

    await AnalyticsMetric.insertMany(analyticsMetrics);
    console.log('Created analytics metrics');

    // Create settings
    const settings = {
      businessHours: '09:00 - 18:00',
      enableNotifications: true,
      defaultCurrency: 'INR',
      bookingPolicyText: 'Standard booking terms and conditions apply.'
    };

    await Settings.create(settings);
    console.log('Created settings');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase(); 