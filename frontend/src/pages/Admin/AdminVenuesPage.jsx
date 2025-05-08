import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function AdminVenuesPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Manage Venues (Admin)</Typography>
      <Paper sx={{ p: 2 }}>
        <Typography>
          Placeholder page for viewing and managing all venues.
          {/* TODO: Add table/list to display venue data fetched from API */}
        </Typography>
      </Paper>
    </Box>
  );
} 