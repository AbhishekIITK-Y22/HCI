// src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Paper, useTheme, CircularProgress, Alert } from '@mui/material';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import api from '../api/axios';

const surveyData = [
  { label: 'Availability Info', value: 70 },
  { label: 'Coaching Difficulty', value: 60 },
  { label: 'Long Wait Times', value: 68 },
  { label: 'Real-Time Updates', value: 82 },
  { label: 'Chat Importance', value: 50 },
  { label: 'Equipment Issues', value: 60 },
];

export default function ReportsPage() {
  const theme = useTheme();
  const [summaryData, setSummaryData] = useState({});
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, hourlyRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/hourly-bookings')
        ]);

        if (summaryRes.data.success) {
          setSummaryData(summaryRes.data.data);
        }
        if (hourlyRes.data.success) {
          setHourlyData(hourlyRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError(err.response?.data?.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const mostBookedHour = hourlyData.length > 0
    ? hourlyData.reduce((max, current) => (current.bookings > max.bookings ? current : max), hourlyData[0])
    : { hour: 'N/A', bookings: 0 };

  const metrics = [
    {
      title: 'Total Confirmed Bookings',
      value: summaryData.totalBookings ?? '...',
      icon: <AccessTimeIcon fontSize="large" />, 
    },
    {
      title: 'Total Users',
      value: summaryData.totalUsers ?? '...',
      icon: <PeopleIcon fontSize="large" />, 
    },
    {
      title: 'Most Booked Hour',
      value: mostBookedHour.hour !== 'N/A' ? `${String(mostBookedHour.hour).padStart(2, '0')}:00` : 'N/A',
      icon: <TrendingUpIcon fontSize="large" />, 
    },
    {
      title: 'Total Revenue (INR)',
      value: summaryData.totalRevenue !== undefined 
             ? summaryData.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })
             : '...',
      icon: <AttachMoneyIcon fontSize="large" />, 
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Alert severity="error" sx={{ width: '100%', maxWidth: 'md' }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" fontWeight="bold" mb={4} align="center">
        📊 Insights & Analytics
      </Typography>

      <Grid container spacing={3} justifyContent="center" maxWidth="lg" mb={4}>
        {metrics.map((metric, index) => (
          <Grid key={index} item xs={12} sm={6} md={3}>
            <Paper
              elevation={3}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                borderRadius: 3,
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Box color={theme.palette.primary.main} mb={1}>
                {metric.icon}
              </Box>
              <Typography variant="subtitle1" color="text.secondary">
                {metric.title}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {metric.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4} justifyContent="center" maxWidth="xl">
        <Grid item xs={12} md={6} lg={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Box role="region" aria-label="Survey Pain Points">
              <Typography variant="h6" fontWeight="medium" gutterBottom align="center">
                🧍 Survey Pain Points (Static)
              </Typography>
              <BarChart
                data={surveyData}
                xKey="label"
                yKey="value"
                color={theme.palette.primary.dark}
                label="percentage"
                height={450}
                width={500}
                barCategoryGap={32}
                barGap={12}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Box role="region" aria-label="Booking Frequency by Hour">
              <Typography variant="h6" fontWeight="medium" gutterBottom align="center">
                ⏱️ Booking Frequency (by Start Hour)
              </Typography>
              <LineChart data={hourlyData} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box mt={5} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Analytics based on system data. Survey data is static placeholder.
        </Typography>
      </Box>
    </Box>
  );
}
