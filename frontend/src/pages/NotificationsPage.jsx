// src/pages/NotificationsPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    MarkChatRead as MarkReadIcon, 
    DoneAll as MarkAllReadIcon,
    Info as InfoIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    CheckCircle as SuccessIcon,
    Celebration as AnnouncementIcon,
    Event as ReminderIcon,
} from '@mui/icons-material';
import api from '../api/axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AuthContext } from '../context/AuthContext';
dayjs.extend(relativeTime);

// Helper to get appropriate icon based on notification type
const getNotificationIcon = (type) => {
    switch (type) {
        case 'booking_confirmed': return <SuccessIcon color="success" />;
        case 'payment_success': return <SuccessIcon color="success" />;
        case 'booking_cancelled': return <ErrorIcon color="error" />;
        case 'payment_failed': return <ErrorIcon color="error" />;
        case 'reminder': return <ReminderIcon color="info" />;
        case 'announcement': return <AnnouncementIcon color="primary" />;
        case 'alert': return <WarningIcon color="warning" />;
        default: return <InfoIcon color="action" />;
    }
};

export default function NotificationsPage() {
  const { user, refreshUnreadCount } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const fetchNotifications = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    api.get('/notifications')
      .then(({ data }) => {
        if (data.success) {
            setNotifications(data.data || []);
        } else {
             throw new Error(data.message || 'Failed to fetch notifications');
        }
      })
      .catch(err => {
        console.error("Error fetching notifications:", err);
        setError(err.response?.data?.message || 'Could not fetch notifications');
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handler to mark a single notification as read
  const handleMarkRead = async (id) => {
      // Optimistically update UI
      setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      try {
          await api.put(`/notifications/${id}/read`);
          // Update global unread count
          if (refreshUnreadCount) {
              refreshUnreadCount();
          }
      } catch (err) {
          console.error("Error marking notification as read:", err);
          showSnack('Failed to mark as read', 'error');
          // Revert UI on error
          setNotifications(prev => 
              prev.map(n => n._id === id ? { ...n, read: false } : n)
          );
      }
  };

  // Handler to mark all notifications as read
  const handleMarkAllRead = async () => {
      // Optimistically update UI
      const originallyUnread = notifications.filter(n => !n.read).map(n => n._id);
      if (originallyUnread.length === 0) return; // Nothing to mark

      setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
      );
      try {
          const { data } = await api.put('/notifications/read-all');
          showSnack(data.message || 'All marked as read', 'info');
          // Update global unread count
          if (refreshUnreadCount) {
              refreshUnreadCount();
          }
      } catch (err) {
          console.error("Error marking all as read:", err);
          showSnack('Failed to mark all as read', 'error');
          // Revert UI on error
          setNotifications(prev => 
              prev.map(n => originallyUnread.includes(n._id) ? { ...n, read: false } : n)
          );
      }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight={600}>
            <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Notifications
          </Typography>
          {unreadCount > 0 && (
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<MarkAllReadIcon />} 
                onClick={handleMarkAllRead}
              >
                Mark All as Read ({unreadCount})
              </Button>
          )}
      </Stack>

      <Paper elevation={2} sx={{ p: 1, borderRadius: 2 }}>
          {loading && <Box sx={{ textAlign: 'center', p: 3 }}><CircularProgress /></Box>}
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
          {!loading && !error && notifications.length === 0 && (
              <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>No notifications found.</Typography>
          )}
          {!loading && !error && notifications.length > 0 && (
              <List disablePadding>
                  {notifications.map((notification, index) => (
                    <React.Fragment key={notification._id}>
                      <ListItem 
                        sx={{ 
                            bgcolor: notification.read ? 'background.paper' : 'action.hover',
                            alignItems: 'flex-start',
                            py: 1.5
                        }}
                        secondaryAction={!notification.read ? (
                            <Tooltip title="Mark as Read">
                                <IconButton edge="end" aria-label="mark as read" onClick={() => handleMarkRead(notification._id)} size="small">
                                    <MarkReadIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                      >
                        <ListItemIcon sx={{ mt: 0.5, minWidth: 40 }}>
                            {getNotificationIcon(notification.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={notification.message}
                          secondary={dayjs(notification.createdAt).fromNow()}
                          primaryTypographyProps={{ 
                              fontWeight: notification.read ? 'normal' : 'medium', 
                              fontSize: '0.95rem'
                          }}
                          secondaryTypographyProps={{ 
                              fontSize: '0.75rem', 
                              color: 'text.secondary' 
                          }}
                          // TODO: Handle link if present - wrap primary text in Link component?
                        />
                      </ListItem>
                      {index < notifications.length - 1 && <Divider component="li" variant="inset" />}
                    </React.Fragment>
                  ))}
              </List>
          )}
      </Paper>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
