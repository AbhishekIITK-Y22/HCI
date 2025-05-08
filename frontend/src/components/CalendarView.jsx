import React from 'react';
import { Box, Typography, Tooltip, CircularProgress } from '@mui/material';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/system';
import dayjs from 'dayjs';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Cell = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  minHeight: 100,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const EventsList = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  overflow: 'hidden',
}));

export default function CalendarView({ events = [] }) {
  const today = dayjs();
  const year = today.year();
  const month = today.month() + 1;

  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  const firstDayIndex = dayjs(`${year}-${month}-01`).day();

  return (
    <Box>
      {/* Weekday headers */}
      <Box display="grid" gridTemplateColumns="repeat(7,1fr)" mb={1}>
        {weekdays.map(day => (
          <Typography key={day} variant="subtitle2" align="center">
            {day}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box display="grid" gridTemplateColumns="repeat(7,1fr)" gap={1}>
        {/* Empty slots before first day */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <Box key={`empty-${idx}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const date = dayjs(`${year}-${month}-${day}`);
          const dailyEvents = events.filter(e =>
            dayjs(e.date).isSame(date, 'day')
          );

          return (
            <Cell key={day}>
              <Typography variant="subtitle2">{day}</Typography>
              <EventsList>
                {dailyEvents.length === 0 && (
                  <Typography variant="caption" color="text.disabled">
                    No events
                  </Typography>
                )}
                {dailyEvents.slice(0, 3).map(event => (
                  <Tooltip key={event._id} title={`${event.title || 'Event'} - ${dayjs(event.date).format('hh:mm A')}`}>
                    <Box display="flex" justifyContent="space-between" gap={1}>
                      <Typography variant="body2" color="primary" noWrap>
                        {event.title || 'Event'}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))}
                {dailyEvents.length > 3 && (
                    <Typography variant="caption" color="text.secondary">... more</Typography>
                )}
              </EventsList>
            </Cell>
          );
        })}
      </Box>
    </Box>
  );
}
