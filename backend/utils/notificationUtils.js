const Notification = require('../models/Notification');

/**
 * Creates and saves a notification document, then emits a socket event.
 * 
 * @param {object} io - The Socket.IO server instance.
 * @param {object} targetOptions - Object containing target criteria.
 * @param {string} [targetOptions.userId] - Specific user ID to target.
 * @param {string} [targetOptions.roleTarget] - Role to target.
 * @param {string} [targetOptions.venueId] - Venue ID to target.
 * @param {string} message - The notification message.
 * @param {string} type - The notification type (enum from model).
 * @param {string} [link] - Optional link associated with the notification.
 */
const createAndNotify = async (io, { userId, roleTarget, venueId }, message, type, link) => {
    try {
        if (!message || !type) {
            console.error('Notification creation failed: Message and type are required.');
            return null; // Return null to indicate failure
        }

        const notificationData = {
            message,
            type,
            link: link || null,
            // Prioritize targetting
            user: userId || null,
            roleTarget: !userId && roleTarget ? roleTarget : null,
            venueTarget: !userId && !roleTarget && venueId ? venueId : null
        };

        // Basic validation - ensure at least one target is meaningful
        if (!notificationData.user && !notificationData.roleTarget && !notificationData.venueTarget) {
            console.warn("Attempted to create notification without specific target (user/role/venue). Notification not saved.");
            // Or default to admin? For now, just skip saving.
             return null; 
        }
        
        const newNotification = await Notification.create(notificationData);
        console.log(`Notification created: Type=${type}, Target=${userId || roleTarget || venueId}`);

        // --- Socket Emission --- 
        if (io && newNotification.user) {
            // Emit only to the specific user's room if targeted directly
            const targetRoom = newNotification.user.toString(); 
            io.to(targetRoom).emit('new_notification', newNotification);
            console.log(`Emitted notification to room: ${targetRoom}`);
        } else if (io && newNotification.roleTarget) {
            // Emit to a room named after the role (requires clients to join role rooms too - more complex)
            // io.to(newNotification.roleTarget).emit('new_notification', newNotification);
            console.log(`TODO: Emit notification to role room: ${newNotification.roleTarget}`); 
            // For now, we only handle direct user notifications via socket
        } else {
             console.log("Socket instance not provided or notification not targeted to a specific user, skipping socket emission.");
        }
        // ----------------------

        return newNotification; // Return the created notification

    } catch (error) {
        console.error('Error creating and notifying:', error);
        return null;
    }
};

module.exports = {
    createAndNotify
}; 