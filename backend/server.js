require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/error');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // For socket auth
const User = require('./models/User'); // For socket auth

// Connect Database
connectDB();

const app = express();

// HTTP request logger middleware
app.use(morgan('dev'));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(cookieParser());

// Rate Limiting for Auth Routes
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgotpassword', authLimiter);
app.use('/api/auth/resetpassword', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/my-venues', require('./routes/myVenues'));
app.use('/api/coaches', require('./routes/coaches'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/users', require('./routes/users'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/tariffs', require('./routes/tarrif'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/coach-venue', require('./routes/coachVenue'));

// Error handling middleware
app.use(errorHandler);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
     origin: "*", // Restrict in production
     methods: ["GET", "POST"]
   }
});

// Middleware for Socket.IO authentication
io.use(async (socket, next) => {
    // Extract token from handshake query or auth header (adjust based on client implementation)
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('_id role'); // Attach user info to socket
            if (!user) {
                 return next(new Error('Authentication error: User not found'));
            }
            socket.user = user; // Make user info available on the socket object
            next();
        } catch (err) {
             console.error('Socket Auth Error:', err.message);
             next(new Error('Authentication error: Invalid token'));
        }
    } else {
        next(new Error('Authentication error: No token provided'));
    }
});

// Store mapping of userId to socketId (basic example, consider Redis for scalability)
const userSockets = {}; 

io.on('connection', socket => {
    console.log('Client connected:', socket.id, 'User:', socket.user._id);

    // Join a room based on the user ID
    socket.join(socket.user._id.toString());
    userSockets[socket.user._id.toString()] = socket.id; // Store mapping
    console.log(`User ${socket.user._id} joined room ${socket.user._id.toString()}`);

    // Handle Chat (Keep existing)
    socket.on('joinRoom', ({ roomId }) => { 
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined chat room ${roomId}`);
    });
    socket.on('sendMessage', async ({ roomId, senderId, text }) => {
        const Message = require('./models/Message');
        try {
            const msg = await Message.create({ chatRoom: roomId, sender: senderId, text });
            // Populate sender info before emitting
            await msg.populate('sender', 'name avatar'); 
            io.to(roomId).emit('newMessage', msg);
        } catch (err) {
             console.error("Error saving/sending message:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id, 'User:', socket.user._id);
        delete userSockets[socket.user._id.toString()]; // Clean up mapping
    });
});

// Make io accessible to routes/controllers
app.set('socketio', io); // Option 1: Set on app instance
/* Option 2: Middleware to attach to req
app.use((req, res, next) => {
    req.io = io;
    next();
});
*/

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
