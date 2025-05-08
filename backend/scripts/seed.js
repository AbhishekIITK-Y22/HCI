require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Venue = require('../models/Venue');
(async () => {
  await connectDB();
  await Venue.create([
    { name: 'Main Court', location: 'Building A', capacity: 12, equipmentList: ['Racket','Ball'] },
    { name: 'Soccer Field', location: 'Ground Level', capacity: 22, equipmentList: ['Ball','Cones'] },
  ]);
  console.log('Seeded venues');
  process.exit();
})();
