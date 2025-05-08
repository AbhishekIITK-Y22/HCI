const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification,
  deleteNotification
} = require('../controllers/notificationController');

const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);                   // All users can read
router.put('/read-all', markAllAsRead);           // Mark all my notifications as read
router.put('/:id/read', markAsRead);               // Mark a specific notification as read
router.get('/unread-count', getUnreadCount);       // Get my unread notification count
router.post('/', admin, createNotification);         // Only admins can create
router.delete('/:id', admin, deleteNotification);     // Admin: Delete a notification

module.exports = router;
