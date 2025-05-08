import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function AdminBookingsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Manage Bookings (Admin)</Typography>
      <Paper sx={{ p: 2 }}>
        <Typography>
          Placeholder page for viewing and managing all bookings.
          {/* TODO: Add table/list to display booking data fetched from API */}
        </Typography>
      </Paper>
    </Box>
  );
} 