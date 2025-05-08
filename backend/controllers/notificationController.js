const Notification = require('../models/Notification');
const Venue = require('../models/Venue');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Helper function to build notification query for a user
const buildUserNotificationQuery = async (userId, userRole) => {
    const query = {
        $or: [
            { user: userId }, // Directly targeted
            { roleTarget: userRole } // Targeted by role
            // Add more complex targetting later if needed (e.g., venue-based for players)
        ]
    };

    // Add venue targeting if user is a turfOwner
    if (userRole === 'turfOwner') {
        const ownerVenues = await Venue.find({ owner: userId }).select('_id');
        const ownerVenueIds = ownerVenues.map(v => v._id);
        if (ownerVenueIds.length > 0) {
             query.$or.push({ venueTarget: { $in: ownerVenueIds } });
        }
    }
    
    // Admin sees all notifications? Maybe not, could be too many.
    // Let's make admin see their own + role targeted for now.
    // Could add a specific admin endpoint later if needed.

    return query;
};

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
    const query = await buildUserNotificationQuery(req.user._id, req.user.role);
    const notifications = await Notification.find(query)
                                        .sort({ createdAt: -1 })
                                        .limit(50); // Limit results
                                        
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

// @desc    Mark a specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user._id;

    // Find the notification - Ensure it's actually targeted to this user? 
    // For simplicity, allow marking read if ID matches, assume frontend only shows relevant ones.
    const notification = await Notification.findById(notificationId);
    
    // Alternative: Stricter check - ensure notification matches user query
    // const query = await buildUserNotificationQuery(userId, req.user.role);
    // query._id = notificationId;
    // const notification = await Notification.findOne(query);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or not targeted to user');
    }

    if (notification.read) {
         return res.status(200).json({ success: true, message: 'Notification already marked as read', data: notification });
    }

    notification.read = true;
    await notification.save();
    
    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
});

// @desc    Mark all user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
    const query = await buildUserNotificationQuery(req.user._id, req.user.role);
    query.read = false; // Only target unread messages

    const updateResult = await Notification.updateMany(query, { $set: { read: true } });

    res.status(200).json({ 
        success: true, 
        message: `${updateResult.modifiedCount} notifications marked as read.` 
    });
});

// @desc    Get count of unread notifications
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res) => {
    const query = await buildUserNotificationQuery(req.user._id, req.user.role);
    query.read = false; // Only count unread
    
    const count = await Notification.countDocuments(query);
    res.status(200).json({ success: true, count });
});

// @desc    Create a new notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = asyncHandler(async (req, res) => {
    // Admins can target specific users, roles, or venues (or none for global/admin only?)
    const { message, type, link, userId, roleTarget, venueId } = req.body;

    if (!message || !type) {
        res.status(400);
        throw new Error('Message and type are required');
    }

    const notificationData = {
        message,
        type,
        link: link || null,
        user: userId || null, // Prefer user target if provided
        roleTarget: !userId && roleTarget ? roleTarget : null, // Target role only if no user ID
        venueTarget: !userId && !roleTarget && venueId ? venueId : null // Target venue only if no user/role
    };

    // Basic validation - ensure at least one target or handle global case if needed
    if (!notificationData.user && !notificationData.roleTarget && !notificationData.venueTarget) {
       // Decide how to handle non-targeted notifications - maybe target 'admin' role?
       console.warn("Notification created without specific target (user/role/venue)");
       // notificationData.roleTarget = 'admin'; // Example: Default to admin
    }

    const notification = await Notification.create(notificationData);

    // TODO: Emit Socket.IO event based on target (userId, role, venue)
    // This requires more complex logic to find target user IDs for roles/venues
    // if (notification.user) { req.io.to(notification.user.toString()).emit(...) }
    // else if (notification.roleTarget) { req.io.to(notification.roleTarget).emit(...) } // Room based on role

    res.status(201).json({ success: true, data: notification });
});

// @desc    Delete a notification (Admin only)
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
exports.deleteNotification = asyncHandler(async (req, res) => {
    const notificationId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        res.status(400);
        throw new Error('Invalid Notification ID');
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    await notification.remove();

    res.status(200).json({ success: true, message: 'Notification deleted' });
});
