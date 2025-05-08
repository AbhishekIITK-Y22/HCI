const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');

// Register all models
const User = require('./models/User');
const Coach = require('./models/Coach');
const Venue = require('./models/Venue');
const Equipment = require('./models/Equipment');
const ChatRoom = require('./models/ChatRoom');

(async () => {
  try {
    await connectDB();

    const coaches = await Coach.find().populate('user');
    const venues = await Venue.find();
    const equipment = await Equipment.find();
    const chatRooms = await ChatRoom.find();

    console.log('--- Coaches ---');
    console.log(coaches.map(c => ({ id: c._id, name: c.user.name, userId: c.user._id })));

    console.log('--- Venues ---');
    console.log(venues.map(v => ({ id: v._id, name: v.name })));

    console.log('--- Equipment ---');
    console.log(equipment.map(e => ({ id: e._id, name: e.name })));

    console.log('--- ChatRooms ---');
    console.log(chatRooms.map(cr => ({ id: cr._id, venueId: cr.venue })));

    process.exit();
  } catch (err) {
    console.error('Error fetching seed data:', err);
    process.exit(1);
  }
})();
