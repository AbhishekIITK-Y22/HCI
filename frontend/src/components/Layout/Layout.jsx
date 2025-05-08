import React, { useState, useContext } from 'react';
import { Box, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthContext } from '../../context/AuthContext';

// Sidebar dimensions (ensure these match or are imported)
const drawerWidthOpen = 240;
const drawerWidthClosed = 60;

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useContext(AuthContext);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const theme = useTheme();

  // --- MODIFIED: Always use 60px padding --- 
  const mainPaddingLeft = `${drawerWidthClosed}px`; // Always 60px
  // const mainPaddingLeft = sidebarOpen ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`; // Original logic commented out
  
  console.log('--- Layout Component Render Start ---'); 
  console.log('Layout: User:', user);
  console.log('Layout: sidebarOpen:', sidebarOpen);
  console.log('Layout: mainPaddingLeft (Set to 60px):', mainPaddingLeft); // Updated log

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar always rendered within the layout */}
      {console.log('Layout: Rendering Sidebar...')} 
      <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content area that includes Topbar and Outlet */}
      <Box
        component="main"
        sx={{
          flexGrow: 1, // Let flexbox handle the width based on remaining space
          paddingLeft: mainPaddingLeft, // Apply padding (now always 60px)
          transition: theme.transitions.create(['padding-left'], { // Transition padding
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen, // Use consistent duration
          }),
          boxSizing: 'border-box', // Ensure padding is included correctly
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          overflow: 'hidden' // Prevent potential horizontal overflow issues
        }}
      >
        {console.log('Layout: Rendering Topbar...')} 
        <Topbar onToggleSidebar={toggleSidebar} />

        {/* Box for the actual page content rendered by Outlet */}
        <Box sx={{
          p: 3, // Standard padding for page content
          mt: `64px`, // Fixed margin top for Topbar height
          flexGrow: 1,
          overflowY: 'auto', // Allow vertical scroll
          overflowX: 'hidden', // Prevent horizontal scroll within content area
          display: 'flex',
          flexDirection: 'column'
        }}>
          {console.log('Layout: Rendering Outlet...')} 
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
} 