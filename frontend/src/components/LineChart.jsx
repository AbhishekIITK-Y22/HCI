import React, { useEffect, useState } from 'react';
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Typography, CircularProgress, Box } from '@mui/material';
import api from '../api/axios';

export default function LineChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/analytics/hourly-bookings')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setData(res.data.data);
        } else {
          setError('Unexpected data format.');
        }
      })
      .catch((err) => {
        console.error('Error fetching chart data:', err);
        setError('Error fetching data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading chart data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={300}>
        <Typography variant="body1" color="text.secondary">
          No booking data available
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          label={{ value: 'Number of Bookings', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value) => [`${value} bookings`, 'Bookings']}
          labelFormatter={(label) => `Hour: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="bookings"
          stroke="#2E7D32"
          strokeWidth={2}
          dot={{ fill: '#2E7D32' }}
          activeDot={{ r: 8 }}
        />
      </ReLineChart>
    </ResponsiveContainer>
  );
}
