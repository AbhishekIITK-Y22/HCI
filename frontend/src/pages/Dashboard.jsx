import React, { useState, useEffect, useContext } from 'react';
import { Box, Grid, Typography, useTheme, CircularProgress, Alert, Paper, Button, Stack, Card, CardContent, CardActionArea, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import StatCard from '../components/StatCard';
import CalendarView from '../components/CalendarView';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios'; // Import configured axios instance
import dayjs from 'dayjs';
import * as Icons from '@mui/icons-material';
import { FaDollarSign, FaMoneyBillWave, FaRegMoneyBillAlt, FaCalendarCheck, FaFutbol, FaUsers } from 'react-icons/fa';

// Currency formatting helper
const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return 'N/A';
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
};

// Helper function to get quick actions based on role
const getQuickActions = (role) => {
  switch (role) {
    case 'admin':
      return [
        { label: 'Manage Users', path: '/users', icon: <Icons.ManageAccounts /> },
        { label: 'Manage Venues', path: '/admin/venues', icon: <Icons.Stadium /> }, // Assuming an admin route
        { label: 'Manage Equipment', path: '/equipment', icon: <Icons.Construction /> },
        { label: 'Manage Amenities', path: '/amenities', icon: <Icons.ListAlt /> },
        { label: 'View Reports', path: '/reports', icon: <Icons.Assessment /> },
      ];
    case 'turfOwner':
      return [
        { label: 'Add New Venue', path: '/my-venues/add', icon: <Icons.AddBusiness /> },
        { label: 'View My Venues', path: '/my-venues', icon: <Icons.Storefront /> },
        { label: 'View Bookings', path: '/bookings', icon: <Icons.EventNote /> }, // Might need owner-specific view
      ];
    case 'player':
      return [
        { label: 'Find a Venue', path: '/turfs', icon: <Icons.Search /> },
        { label: 'View My Bookings', path: '/my-bookings', icon: <Icons.EventAvailable /> }, // Assuming separate route for player bookings
      ];
    case 'coach':
       return [
        { label: 'View My Schedule', path: '/bookings', icon: <Icons.CalendarMonth /> }, // Link to general bookings for now
       ];
    default:
      return [];
  }
};

export default function Dashboard() {
  console.log('--- Dashboard Component Render Start ---');

  // Get user AND loading state from AuthContext
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [events, setEvents] = useState([]);
  // Use a local loading state specific to this component's data fetching
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const today = dayjs();

  useEffect(() => {
    console.log('--- Dashboard useEffect Triggered ---');
    console.log('Auth Loading:', authLoading);
    console.log('User Context:', user);

    // Only proceed if authentication is resolved and we have a user with a role
    if (authLoading) {
      console.log('Dashboard waiting for AuthContext loading to finish...');
      // Keep dashboardLoading true until auth is resolved
      setDashboardLoading(true); 
      return; 
    }

    if (!user || !user.role) {
      console.log('Dashboard: No user or role available after auth check.');
      setError("User not available or role missing.");
      setDashboardLoading(false);
      return;
    }

    console.log(`Dashboard: Fetching data for role: ${user.role}`);
    setDashboardLoading(true); // Start dashboard-specific loading
    setError(null);

    api.get('/dashboard/stats')
      .then(({ data }) => {
        console.log('Dashboard API Success:', data);
        if (data.success) {
          setStats(data.stats || {});
          setEvents(data.events || []);
        } else {
          throw new Error(data.message || 'API returned success:false');
        }
      })
      .catch(err => {
        console.error("Dashboard API Error:", err);
        setError(err.response?.data?.message || err.message || "Could not load dashboard data.");
        setStats({});
        setEvents([]);
      })
      .finally(() => {
        console.log('Dashboard: Fetch completed.');
        setDashboardLoading(false); // Finish dashboard-specific loading
      });

  // Dependency array: run when auth finishes OR user object changes
  }, [user, authLoading]); 

  // Use dashboardLoading for the component's loading indicator
  if (dashboardLoading) {
    console.log('Dashboard showing loading indicator...');
    return (
      <Box sx={{ width: '100%', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  // Error checking remains the same
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  // Add a final check just in case user became null after loading
  if (!user) {
      return (
          <Box sx={{ p: 3 }}>
              <Alert severity="warning">User data is unavailable.</Alert>
          </Box>
      );
  }

  console.log('✅ Rendering dashboard for role:', user.role); // Debug log
  console.log('📊 Current stats:', stats); // Debug log

  // Click handler for StatCards
  const handleCardClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  // --- Define Cards Dynamically Based on Role --- 

  const getCardsForRole = (role, statsData) => {
    const formatCurrency = (value) => {
      if (value == null || isNaN(value)) return 'N/A';
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
    };

    const commonCards = [
      // ... other common cards ...
    ];

    const adminCards = [
      {
        title: 'Revenue This Month',
        value: formatCurrency(statsData?.revenueThisMonth),
        icon: <FaDollarSign className="text-green-500" />,
        link: '/admin/payments',
        description: 'Total successful payments this month'
      },
      {
        title: 'Expense This Month',
        value: formatCurrency(statsData?.expenseThisMonth),
        icon: <FaMoneyBillWave className="text-red-500" />,
        link: '/expenses',
        description: 'Total expenses logged this month'
      },
      {
        title: "Today's Expense",
        value: formatCurrency(statsData?.todayExpense),
        icon: <FaRegMoneyBillAlt className="text-orange-500" />,
        link: '/expenses',
        description: 'Total expenses logged today'
      },
      {
        title: 'This Month Bookings',
        value: statsData?.totalBookingsThisMonth ?? 'N/A',
        icon: <FaCalendarCheck className="text-blue-500" />,
        link: '/admin/bookings',
        description: 'Total bookings created this month'
      },
      {
        title: 'Registered Turfs',
        value: statsData?.totalTurfs ?? 'N/A',
        icon: <FaFutbol className="text-purple-500" />,
        link: '/turfs',
        description: 'Total turfs on the platform'
      },
      {
        title: 'Registered Users',
        value: statsData?.totalUsers ?? 'N/A',
        icon: <FaUsers className="text-yellow-500" />,
        link: '/admin/users',
        description: 'Total users registered'
      },
    ];

    let cardsToShow = [];

    // Cards common to most non-player/coach roles
    if (role === 'admin' || role === 'turfOwner') {
        cardsToShow.push(
            { title: 'This Month Bookings', value: statsData?.bookingsThisMonth ?? 'N/A',  icon: <Icons.EventAvailable  color="primary" />, path: role === 'admin' ? '/admin/bookings' : '/bookings' },
            { title: 'Registered Turfs',    value: statsData?.registeredTurfs ?? 'N/A',    icon: <Icons.SportsTennis    color="primary" />, path: role === 'admin' ? '/turfs' : '/my-venues' },
        );
    }
    
    // Role-specific cards
    switch (role) {
        case 'admin':
            cardsToShow.push(
                { title: 'Registered Customers',value: statsData?.registeredCustomers ?? 'N/A',icon: <Icons.PeopleAlt color="primary" />, path: '/admin/users' },
                { title: 'Total Users',         value: statsData?.totalUsers ?? 'N/A',         icon: <Icons.Group color="primary" />, path: '/admin/users' },
                { title: 'Registered Coaches',  value: statsData?.registeredCoaches ?? 'N/A',  icon: <Icons.Sports color="secondary" />, path: '/admin/users' },
                { title: 'Revenue This Month',  value: formatCurrency(statsData?.revenueThisMonth), icon: <Icons.AccountBalanceWallet color="success" />, path: '/admin/payments' },
                { title: 'Expense This Month',  value: formatCurrency(statsData?.expenseThisMonth), icon: <Icons.ReceiptLong     color="error"   />, path: '/expenses' },
                { title: 'Today Expense',     value: formatCurrency(statsData?.todayExpense),    icon: <Icons.MoneyOff        color="error"   />, path: '/expenses' }
            );
            break;
        case 'turfOwner':
            cardsToShow.push(
                { title: 'My Venues',                value: statsData?.myVenuesCount ?? 'N/A',         icon: <Icons.Stadium color="primary" />, path: '/my-venues' },
                { title: 'My Venue Bookings',        value: statsData?.venueBookings ?? 'N/A',         icon: <Icons.BookmarkAdded color="secondary" />, path: '/bookings' }, // This now counts confirmed
                { title: 'Venue Revenue (Month)',  value: formatCurrency(statsData?.revenueThisMonth), icon: <Icons.AccountBalanceWallet color="success" />, path: '/payments' }, 
                { title: 'Venue Expense (Month)',  value: formatCurrency(statsData?.expenseThisMonth), icon: <Icons.ReceiptLong     color="error"   />, path: '/expenses' }, 
                { title: 'Venue Expense (Today)',  value: formatCurrency(statsData?.todayExpense),    icon: <Icons.MoneyOff        color="error"   />, path: '/expenses' }
            );
            break;
        case 'coach':
              cardsToShow.push(
                 { title: 'My Upcoming Sessions',   value: statsData?.upcomingSessions ?? 'N/A',    icon: <Icons.EventAvailable color="primary" />, path: '/bookings' } 
              );
            break;
        case 'player':
             cardsToShow.push(
                { title: 'Amount Spent (Month)',   value: formatCurrency(statsData?.amountSpentThisMonth), icon: <Icons.Payment color="success" />, path: '/payments' } 
             );
            break;
        default:
            // Maybe show some default cards or nothing
            break;
    }
    return cardsToShow;
  };

  const cardsToDisplay = getCardsForRole(user?.role, stats);
  const quickActions = getQuickActions(user?.role);

  // --- New: Component for Next Booking Details --- 
  const PlayerNextBooking = ({ details }) => {
    if (!details) {
      return (
        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">You have no upcoming bookings.</Typography>
            <Button component={RouterLink} to="/turfs" variant="outlined" sx={{ mt: 1 }}>
                Book a Venue
            </Button>
        </Paper>
      );
    }
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Your Next Booking</Typography>
        <List dense>
            <ListItem>
                <ListItemIcon><Icons.Stadium /></ListItemIcon>
                <ListItemText primary="Venue" secondary={details.venueName} />
            </ListItem>
            <ListItem>
                <ListItemIcon><Icons.CalendarToday /></ListItemIcon>
                <ListItemText primary="Date" secondary={dayjs(details.startTime).format('dddd, MMMM D, YYYY')} />
            </ListItem>
             <ListItem>
                <ListItemIcon><Icons.AccessTime /></ListItemIcon>
                <ListItemText primary="Time" secondary={dayjs(details.startTime).format('h:mm A')} />
            </ListItem>
        </List>
        <Button component={RouterLink} to={`/my-bookings`} sx={{ mt: 1 }} size="small">
            View All Bookings
        </Button>
         {/* Add link to venue detail page if possible? Requires venueId */}
         {/* <Button component={RouterLink} to={`/turfs/${details.venueId}`} sx={{ mt: 1, ml: 1 }} size="small">Venue Details</Button> */} 
      </Paper>
    );
  };
  // --------------------------------------------------

  // --- Component for Recent Confirmed Bookings (Now used by Admin and Owner) --- 
  const RecentBookingsList = ({ bookings, title }) => {
      if (!bookings || bookings.length === 0) {
          return (
              <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
                  <Typography variant="h6" gutterBottom>{title || 'Recent Bookings'}</Typography>
                  <Typography color="text.secondary">No recent bookings found.</Typography>
              </Paper>
          );
      }
      return (
          <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
              <Typography variant="h6" gutterBottom>{title || 'Recent Bookings'}</Typography>
              <List dense>
                  {bookings.map((booking) => (
                      <ListItem key={booking._id} disablePadding>
                          <ListItemText
                              primary={`${booking.user?.name || 'User'} - ${booking.venue?.name || 'Venue'}`}
                              secondary={`Booked: ${dayjs(booking.createdAt).format('MMM D, YYYY h:mm A')} | Status: ${booking.status}`}
                          />
                          <Button component={RouterLink} to={`/bookings/${booking._id}`} size="small" sx={{ ml: 1 }}>
                              View
                          </Button>
                      </ListItem>
                  ))}
              </List>
          </Paper>
      );
  };
  // --------------------------------------------------

  console.log('Dashboard rendering main content...');
  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: theme.palette.background.default, minHeight: 'calc(100vh - 64px)' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.text.primary }}>
        Dashboard
      </Typography>

      {/* --- 1. Stat Cards Grid (Top) --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cardsToDisplay.map((c, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`${user?.role}-card-${i}`}> 
              <Paper 
                elevation={2} 
                onClick={() => handleCardClick(c.path)}
                sx={{
                  p: 0,
                  borderRadius: theme.shape.borderRadius,
                  cursor: c.path ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': c.path ? {
                    transform: 'translateY(-3px)',
                    boxShadow: theme.shadows[4],
                  } : {},
                  height: '100%'
                }}
              >
                <StatCard title={c.title} value={c.value} icon={c.icon} />
              </Paper>
          </Grid>
        ))}
         {cardsToDisplay.length === 0 && !dashboardLoading && user?.role !== 'player' && (
             <Grid item xs={12}>
                 <Typography>No summary cards available for your role.</Typography>
          </Grid>
        )}
      </Grid>

      {/* --- 2. Middle Section (Recent Lists, Player Next) --- */}
       <Grid container spacing={4} sx={{ mb: 4 }}> 
            {/* Main Content Column */}
            <Grid item xs={12}> {/* Let this take full width initially */} 
                {/* Recent Bookings (Admin) */}
                {user.role === 'admin' && stats.recentConfirmedBookings && (
                    <RecentBookingsList bookings={stats.recentConfirmedBookings} title="Recent Confirmed Bookings" />
                )}
                {/* Recent Bookings (TurfOwner) */}
                {user.role === 'turfOwner' && stats.recentBookings && (
                    <RecentBookingsList bookings={stats.recentBookings} title="Recent Venue Bookings" />
                )}
                {/* Player Next Booking */}
                {user.role === 'player' && (
                    <PlayerNextBooking details={stats.nextBookingDetails} />
                )}
                 {(user.role === 'coach' && !stats.upcomingSessions) && (
                     <Typography color="text.secondary">No upcoming sessions.</Typography>
                )}
            </Grid>
       </Grid>

       {/* --- 3. Quick Actions (Full Width Row) --- */} 
        {quickActions.length > 0 && (
             <Box sx={{ mb: 4 }}> {/* Add margin bottom */} 
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Quick Actions</Typography>
                <Grid container spacing={2}> {/* Grid container for the row of buttons */} 
                    {quickActions.map((action) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={action.label}> {/* Responsive items */} 
                            <Button 
                                variant="outlined"
                                fullWidth
                                startIcon={action.icon}
                                component={RouterLink} 
                                to={action.path}
                                sx={{ justifyContent: 'flex-start', py: 1.5, height: '100%' }} // Ensure buttons align height
                            >
                                {action.label}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
             </Box>
        )}

      {/* --- 4. Calendar (Bottom, Full Width) --- */}
      {(user.role === 'admin' || user.role === 'turfOwner' || user.role === 'coach' || user.role === 'player') && (
          <Paper elevation={2} sx={{ p: 2, mt: 4 }}> 
            <Typography variant="h6" gutterBottom>Event Calendar</Typography>
            <CalendarView events={events} />
          </Paper>
      )}

    </Box>
  );
}
