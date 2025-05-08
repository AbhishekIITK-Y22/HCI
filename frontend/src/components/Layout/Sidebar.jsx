import React, { useContext } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  BookOnline as BookOnlineIcon,
  SportsSoccer as SportsSoccerIcon,
  People as PeopleIcon,
  MoneyOff as MoneyOffIcon,
  BarChart as BarChartIcon,
  Payment as PaymentIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Place as PlaceIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

const drawerWidthOpen = 240;
const drawerWidthClosed = 60;

// Define navigation items based on user role
const getNavItems = (role) => {
  const commonItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  const roleBasedItems = {
    admin: [
      { label: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
      { label: 'Turfs', icon: <SportsSoccerIcon />, path: '/turfs' },
      { label: 'Amenities', icon: <BuildIcon />, path: '/amenities' },
      { label: 'Expenses', icon: <MoneyOffIcon />, path: '/expenses' },
      { label: 'Reports', icon: <BarChartIcon />, path: '/reports' },
      { label: 'Payments', icon: <PaymentIcon />, path: '/payments' },
      { label: 'Equipment', icon: <BuildIcon />, path: '/equipment' },
    ],
    turfOwner: [
      { label: 'My Venues', icon: <PlaceIcon />, path: '/my-venues' },
      { label: 'Bookings', icon: <BookOnlineIcon />, path: '/booking' },
      { label: 'Expenses', icon: <MoneyOffIcon />, path: '/owner/expenses' },
      { label: 'Payments', icon: <PaymentIcon />, path: '/owner/payments' },
      { label: 'Equipment', icon: <BuildIcon />, path: '/equipment' },
    ],
    player: [
      { label: 'Book Turf', icon: <BookOnlineIcon />, path: '/booking' },
      { label: 'My Bookings', icon: <EventNoteIcon />, path: '/my-bookings' },
      { label: 'Turfs', icon: <SportsSoccerIcon />, path: '/turfs' },
    ],
    coach: [
      { label: 'My Schedule', icon: <EventNoteIcon />, path: '/my-schedule' },
      { label: 'Bookings', icon: <BookOnlineIcon />, path: '/booking' },
      { label: 'Turfs', icon: <SportsSoccerIcon />, path: '/turfs' },
    ],
  };

  const commonEndItems = [
    { label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return [...commonItems, ...(roleBasedItems[role] || []), ...commonEndItems];
};

export default function Sidebar({ open, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const navItems = getNavItems(user?.role);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidthOpen : drawerWidthClosed,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidthOpen : drawerWidthClosed,
          transition: 'width 0.3s',
          overflowX: 'hidden',
          position: 'fixed',
          height: '100vh',
          zIndex: theme => theme.zIndex.appBar - 1,
          bgcolor: 'background.paper',
          borderRight: '1px solid #e0e0e0',
        },
      }}
    >
      <List disablePadding>
        {/* Toggle Sidebar Button */}
        <ListItem disablePadding>
          <ListItemButton
            sx={{ justifyContent: open ? 'flex-end' : 'center', px: 2 }}
            onClick={toggleSidebar}
          >
            <Tooltip title={open ? 'Collapse' : 'Expand'}>
              <IconButton size="small">
                <MenuIcon />
              </IconButton>
            </Tooltip>
          </ListItemButton>
        </ListItem>

        <Divider />

        {/* Navigation Links */}
        {navItems.map(item => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 2,
                justifyContent: open ? 'initial' : 'center',
                px: 2,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  fontWeight: 500,
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              selected={location.pathname === item.path}
              onClick={() => {
                if (location.pathname !== item.path) {
                  navigate(item.path);
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 0,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.label} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
