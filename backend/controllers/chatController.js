const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

exports.getChatRoom = async (req, res, next) => {
  try {
    const venueId = req.params.venueId;
    const userId = req.user._id;

    let room = await ChatRoom.findOne({ venue: venueId });

    // Auto-create chat room if not exists
    if (!room) {
      room = await ChatRoom.create({ venue: venueId, participants: [userId] });
    }

    // Ensure current user is part of the room participants
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      await room.save();
    }

    const messages = await Message.find({ chatRoom: room._id })
      .sort({ timestamp: 1 })
      .populate('sender', 'name email');

    res.json({ room, messages });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const venueId = req.params.venueId;
    const userId = req.user._id;
    const { text } = req.body;

    // Find or create the chat room
    let room = await ChatRoom.findOne({ venue: venueId });
    if (!room) {
      room = await ChatRoom.create({ venue: venueId, participants: [userId] });
    }
    // Ensure user is a participant
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      await room.save();
    }

    // Create the message
    const message = await Message.create({
      chatRoom: room._id,
      sender: userId,
      text,
      timestamp: new Date()
    });

    // Populate sender info for response
    await message.populate('sender', 'name email');

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};
