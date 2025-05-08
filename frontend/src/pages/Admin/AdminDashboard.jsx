// ... existing code ...
import Grid from '@mui/material/Grid'; // Make sure you're importing the new Grid
// If you were importing from '@mui/material/GridLegacy', change it.
// ... existing code ...

const AdminDashboard = () => {
  // ... existing code ...
  const navigate = useNavigate(); // Ensure useNavigate is imported and used

  // ... existing code ...

  // Example of updating a Grid container and items
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : stats ? (
        <Grid container spacing={3}>
          {/* Example Update 1: Simple item */}
          {/* Remove item prop, combine xs/sm/md/lg into size */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}> {/* Was <Grid item xs={12} sm={6} md={3}> */}
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Total Users</Typography>
              <Typography variant="h4">{stats.totalUsers}</Typography>
              <AccountCircleIcon sx={{ fontSize: 40, mt: 1 }} />
            </Paper>
          </Grid>

          {/* Example Update 2: Clickable Revenue Item */}
          {/* Remove item prop, combine xs/sm/md/lg into size */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}> {/* Was <Grid item xs={12} sm={6} md={3}> */}
             {/* Make sure the Paper or a button inside handles the navigation */}
            <Paper
              sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/admin/payments')} // Ensure this onClick navigates
            >
              <Typography variant="h6">Revenue (This Month)</Typography>
              <Typography variant="h4">${stats.monthlyRevenue?.toFixed(2) || '0.00'}</Typography>
              <AttachMoneyIcon sx={{ fontSize: 40, mt: 1 }} />
            </Paper>
          </Grid>

          {/* Apply similar updates to other Grid items */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}> {/* Was <Grid item xs={12} sm={6} md={3}> */}
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Total Bookings</Typography>
              <Typography variant="h4">{stats.totalBookings}</Typography>
              <EventAvailableIcon sx={{ fontSize: 40, mt: 1 }} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}> {/* Was <Grid item xs={12} sm={6} md={3}> */}
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6">Active Venues</Typography>
              <Typography variant="h4">{stats.totalVenues}</Typography>
              <StadiumIcon sx={{ fontSize: 40, mt: 1 }} />
            </Paper>
          </Grid>

          {/* Example Update 3: Grid for charts/tables */}
          {/* Remove item prop, combine xs/md into size */}
          <Grid size={{ xs: 12, md: 8 }}> {/* Was <Grid item xs={12} md={8}> */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Revenue Overview</Typography>
              {/* Chart component */}
              {stats.revenueData && <RevenueChart data={stats.revenueData} />}
            </Paper>
          </Grid>

          {/* Remove item prop, combine xs/md into size */}
          <Grid size={{ xs: 12, md: 4 }}> {/* Was <Grid item xs={12} md={4}> */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recent Bookings</Typography>
              {/* Recent bookings list/component */}
              {stats.recentBookings && <RecentBookingsList bookings={stats.recentBookings} />}
            </Paper>
          </Grid>

          {/* ... other grids ... */}
        </Grid>
      ) : (
        <Typography>No dashboard data available.</Typography>
      )}
    </Box>
  );
};
// ... existing code ...