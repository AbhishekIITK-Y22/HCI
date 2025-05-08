const mongoose = require('mongoose');
const path = require('path');    
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const connectDB = async () => {
  try {
    console.log('MONGO_URI is:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Enable Mongoose query logging
    mongoose.set('debug', true);

    console.log('MongoDB connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
module.exports = connectDB;
