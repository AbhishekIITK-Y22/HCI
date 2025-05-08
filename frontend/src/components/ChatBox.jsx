import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../api/axios';
import dayjs from 'dayjs';
import { SocketContext } from '../context/SocketContext';

export default function ChatBox({ venueId, user }) {
  const { socket } = useContext(SocketContext);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat room and messages
  useEffect(() => {
    if (!venueId || !user) return;

    const fetchChat = async () => {
      setLoading(true);
      setError(false);

      try {
        const res = await api.get(`/chat/${venueId}`);
        const { room, messages } = res.data;
        setRoom(room);
        setMessages(messages);
        setLoading(false);

        if (socket && room) {
          socket.emit('joinRoom', { roomId: room._id });
        }
      } catch (err) {
        console.error('Failed to fetch chat:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchChat();
  }, [venueId, user, socket]);

  // Listen for new incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket]);

  const handleSend = () => {
    if (!text.trim() || !room || !socket || !user) return;

    socket.emit('sendMessage', {
      roomId: room._id,
      senderId: user._id,
      text,
    });

    setText('');
  };

  return (
    <Paper sx={{ p: 2, mt: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>Chat Room</Typography>

      {/* Messages display */}
      <Box
        sx={{
          maxHeight: 300,
          overflowY: 'auto',
          mb: 2,
          p: 1,
          border: '1px solid #ddd',
          borderRadius: 1,
          bgcolor: 'background.default',
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={100}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error">Failed to load messages.</Typography>
        ) : (
          messages.map((msg, i) => (
            <Box key={i} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {msg.sender?.name || 'User'}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {dayjs(msg.createdAt).format('HH:mm')}
                </Typography>
              </Typography>
              <Typography variant="body2">{msg.text}</Typography>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message input */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <IconButton onClick={handleSend} disabled={!text.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
