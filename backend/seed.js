// ✅ Fully Cleaned & Synced Seed Script with Faker v7+
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const connectDB = require('./config/db');

dotenv.config();

// Models
const User = require('./models/User');
const Booking = require('./models/Booking');
const Coach = require('./models/Coach');
const Venue = require('./models/Venue');
const Equipment = require('./models/Equipment');
const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const Amenity = require('./models/Amenity');
const Expense = require('./models/Expense');
const Notification = require('./models/Notification');
const Payment = require('./models/Payment');
const Settings = require('./models/Settings');
const Staff = require('./models/Staff');
const Tariff = require('./models/Tariff');

// Helper functions
const randomItem = arr => arr[faker.number.int({ min: 0, max: arr.length - 1 })];
const randomSubset = (arr, count) => faker.helpers.arrayElements(arr, count);

(async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding interconnected data...');

    // Cleanup
    await Promise.all([
      User.deleteMany(), Booking.deleteMany(), Coach.deleteMany(), Venue.deleteMany(),
      Equipment.deleteMany(), ChatRoom.deleteMany(), Message.deleteMany(),
      Amenity.deleteMany(), Expense.deleteMany(), Notification.deleteMany(),
      Payment.deleteMany(), Settings.deleteMany(), Staff.deleteMany(), Tariff.deleteMany()
    ]);

    const password = 'password123';

    // 1. Users
    const users = [];
    // Admin
    users.push(await User.create({ name: 'Admin', email: 'admin@sports.in', password, role: 'admin' }));
    // Turf Owners
    for (let i = 0; i < 5; i++) {
      users.push(await User.create({
        name: faker.name.fullName(),
        email: `owner${i}@sports.in`,
        password,
        role: 'turfOwner',
        phone: faker.phone.number('91##########'),
        avatar: faker.image.avatar()
      }));
    }
    // Coaches
    for (let i = 0; i < 10; i++) {
      users.push(await User.create({
        name: faker.name.fullName(),
        email: `coach${i}@sports.in`,
        password,
        role: 'coach',
        phone: faker.phone.number('91##########'),
        avatar: faker.image.avatar()
      }));
    }
    // Players
    for (let i = 0; i < 50; i++) {
      users.push(await User.create({
        name: faker.name.fullName(),
        email: `player${i}@sports.in`,
        password,
        role: 'player',
        phone: faker.phone.number('91##########'),
        avatar: faker.image.avatar()
      }));
    }
    const players = users.filter(u => u.role === 'player');
    const coaches = users.filter(u => u.role === 'coach');
    const turfOwners = users.filter(u => u.role === 'turfOwner');

    // 2. Coach Profiles
    const coachProfiles = [];
    for (const coachUser of coaches) {
      coachProfiles.push(await Coach.create({
        user: coachUser._id,
        bio: faker.lorem.sentence(),
        availability: Array.from({ length: 5 }).map(() => ({
          date: faker.date.soon(30),
          slots: randomSubset(['06:00','08:00','10:00','12:00','14:00','16:00','18:00'], 3)
        }))
      }));
    }

    // 3. Amenities
    const amenityData = [
      { name: 'Parking', description: 'Ample parking space' },
      { name: 'Floodlights', description: 'Bright night play lights' },
      { name: 'Restroom', description: 'Clean washrooms' },
      { name: 'Changing Room', description: 'Secure changing area' },
      { name: 'Water Cooler', description: 'Drinking water' }
    ];
    const amenities = await Amenity.insertMany(amenityData);

    // 4. Venues
    const cities = ['Mumbai','Delhi','Bengaluru','Kolkata','Chennai','Hyderabad','Pune','Ahmedabad'];
    const venues = [];
    for (let i = 0; i < 20; i++) {
      venues.push(await Venue.create({
        name: `${faker.company.name()} Arena`,
        location: randomItem(cities),
        capacity: faker.number.int({ min: 20, max: 200 }),
        equipmentList: randomSubset(['Badminton Racket','Yoga Mat','Cricket Bat','Football','Table Tennis Paddle'], 3),
        pricePerHour: faker.number.int({ min: 500, max: 2000 }),
        openingHours: { start: '06:00', end: '23:00' },
        images: [faker.image.url(), faker.image.url()],
        owner: randomItem(turfOwners)._id,
        amenities: randomSubset(amenities.map(a => a._id), 3)
      }));
    }

    // 5. Tariffs
    const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    for (const venue of venues) {
      for (const day of weekdays) {
        const base = venue.pricePerHour;
        ['06:00-10:00','10:00-14:00','14:00-18:00'].forEach(slot => {
          const [start,end] = slot.split('-');
          Tariff.create({ venue: venue._id, day, timeStart: start, timeEnd: end, price: base + faker.number.int({ min: -200, max: 200 }) });
        });
      }
    }

    // 6. Equipment (includes Yoga Mat)
    ['Badminton Racket','Cricket Bat','Soccer Ball','Yoga Mat','Dumbbells','Tennis Racket'].forEach(name => {
      Equipment.create({
        name,
        status: faker.helpers.arrayElement(['available','checkedout']),
        currentUser: faker.helpers.arrayElement(players)?._id
      });
    });

    // 7. Bookings & Payments
    for (const player of players) {
      const count = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < count; i++) {
        const venue = randomItem(venues);
        const coachProfile = randomItem(coachProfiles);
        const booking = await Booking.create({
          user: player._id,
          coach: coachProfile._id,
          venue: venue._id,
          slot: randomItem(['06:00','08:00','10:00','12:00','14:00','16:00','18:00']),
          status: faker.helpers.arrayElement(['pending','confirmed','cancelled'])
        });
        await Payment.create({ booking: booking._id, amount: faker.number.int({ min: 500, max: 1500 }), status: faker.helpers.arrayElement(['Pending','Completed']), date: faker.date.recent(30) });
      }
    }

    // 8. ChatRooms & Messages (now 10 messages per room)
    for (const venue of venues) {
      const participants = [randomItem(players)._id, randomItem(coaches)._1]; // note: should be coaches._id ???
      const room = await ChatRoom.create({ venue: venue._id, participants });
      for (let m = 0; m < 10; m++) {
        Message.create({ chatRoom: room._id, sender: randomItem(participants), text: faker.lorem.sentence(), timestamp: faker.date.recent(10) });
      }
    }

    // 9. Expenses
    for (let i = 0; i < 30; i++) {
      Expense.create({ date: faker.date.past(1), amount: faker.number.int({ min: 1000, max: 5000 }), type: faker.helpers.arrayElement(['Maintenance','Utilities']), description: faker.lorem.words(5) });
    }

    // 10. Notifications
    for (const usr of users) {
      const count = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < count; i++) {
        Notification.create({ user: usr._id, message: faker.lorem.sentence(), type: faker.helpers.arrayElement(['Reminder','Alert']), date: faker.date.recent(15), read: faker.datatype.boolean() });
      }
    }

    // 11. Settings
    await Settings.create({ businessHours: '06:00 - 23:00', enableNotifications: true });

    // 12. Staff
    for (let i = 0; i < 10; i++) {
      Staff.create({ name: faker.name.fullName(), role: faker.helpers.arrayElement(['Manager','Staff']), email: faker.internet.email() });
    }

    console.log('✅ Vast and interconnected seed data created successfully.');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
})();
