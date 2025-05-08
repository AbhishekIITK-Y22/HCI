// src/App.jsx
import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, Snackbar, Alert, Typography } from "@mui/material";
import { Toaster } from 'react-hot-toast';

import { SocketProvider } from "./context/SocketContext";
import { AuthContext } from "./context/AuthContext";

import Layout from "./components/Layout/Layout";
import RequireAuth from "./components/RequireAuth";

// Import pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import BookingPage from "./pages/BookingPage";
import TurfsPage from "./pages/TurfsPage";
import TurfDetailPage from "./pages/TurfDetailPage";
import AmenitiesPage from "./pages/AmenitiesPage";
import ExpensesPage from "./pages/ExpensesPage";
import ReportsPage from "./pages/ReportsPage";
import PaymentsPage from "./pages/PaymentsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import EquipmentDashboard from "./pages/EquipmentDashboard";
import UsersPage from "./pages/UsersPage";
import MyVenuesPage from "./pages/MyVenuesPage";
import AddVenuePage from "./pages/AddVenuePage";
import ManageVenuePage from "./pages/ManageVenuePage";
import MyBookingsPage from "./pages/MyBookingsPage";

// Import placeholder Admin pages
import AdminBookingsPage from "./pages/Admin/AdminBookingsPage"; 
import AdminVenuesPage from "./pages/Admin/AdminVenuesPage";
import AdminPaymentsPage from "./pages/Admin/AdminPaymentsPage";

export default function App() {
  const { showNotificationSnack, setShowNotificationSnack } = useContext(AuthContext);

  // Snackbar close handler
  const handleSnackClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowNotificationSnack({ open: false, message: '' });
  };

  return (
    <SocketProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      
      <Routes>
        {/* Public routes - No Layout, No Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes - Apply Auth and Layout together */}
        {/* All routes within this element will be protected and use the Layout */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
            {/* Outlet within Layout will render these based on path */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/turfs" element={<TurfsPage />} />
            <Route path="/turfs/:id" element={<TurfDetailPage />} />
            <Route path="/amenities" element={<AmenitiesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/equipment" element={<EquipmentDashboard />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            
            {/* Owner/Admin routes nested further - Auth implicitly handled by parent,
                but specific role check still needed for the elements themselves if Layout allows all authed users */}
            {/* OR: Add specific RequireAuth wrappers if needed */}
            <Route path="/my-venues" element={<RequireAuth allowedRoles={['turfOwner', 'admin']}><MyVenuesPage /></RequireAuth>} />
            <Route path="/my-venues/add" element={<RequireAuth allowedRoles={['turfOwner', 'admin']}><AddVenuePage /></RequireAuth>} />
            <Route path="/my-venues/manage/:venueId" element={<RequireAuth allowedRoles={['turfOwner', 'admin']}><ManageVenuePage /></RequireAuth>} />
            <Route path="/owner/expenses" element={<RequireAuth allowedRoles={['turfOwner', 'admin']}><ExpensesPage /></RequireAuth>} /> 
            <Route path="/owner/payments" element={<RequireAuth allowedRoles={['turfOwner', 'admin']}><PaymentsPage /></RequireAuth>} />
            
            {/* Admin only routes */}
            <Route path="/admin/users" element={<RequireAuth allowedRoles={['admin']}><UsersPage /></RequireAuth>} />
            <Route path="/admin/bookings" element={<RequireAuth allowedRoles={['admin']}><AdminBookingsPage /></RequireAuth>} />
            <Route path="/admin/venues" element={<RequireAuth allowedRoles={['admin']}><AdminVenuesPage /></RequireAuth>} />
            <Route path="/admin/payments" element={<RequireAuth allowedRoles={['admin']}><AdminPaymentsPage /></RequireAuth>} />

        </Route> {/* End Protected Layout Route */}
        
        {/* Catch-all - No Layout, No Auth */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* Global Notification Snackbar */}
      <Snackbar
        open={showNotificationSnack.open}
        autoHideDuration={6000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleSnackClose} 
          severity="info"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {showNotificationSnack.message}
        </Alert>
      </Snackbar>
    </SocketProvider>
  );
}
