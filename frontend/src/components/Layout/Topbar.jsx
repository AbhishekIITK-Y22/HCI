import React, { useContext, useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Avatar, Menu, MenuItem, Tooltip,
  Badge, Box
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/system';
import { AuthContext } from '../../context/AuthContext';
import ThemeToggleButton from '../ThemeToggleButton';
import { useNavigate } from 'react-router-dom';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[1],
}));

const Title = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
  fontWeight: theme.typography.fontWeightBold,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export default function Topbar({ onToggleSidebar }) {
  const { user, logout, unreadNotifications } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        <IconButton onClick={onToggleSidebar} color="inherit" edge="start" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>

        <Title variant="h6" noWrap>
          LsDesign
        </Title>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Notifications">
            <IconButton aria-label="notifications" color="inherit" onClick={handleNotificationsClick}>
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <ThemeToggleButton />

          <Tooltip title="Account settings" arrow>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar
                src={user?.avatar}
                sx={{ width: 32, height: 32 }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{ elevation: 2, sx: { mt: 1.5, minWidth: 160 } }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled>
            Signed in as <Typography ml={1} fontWeight="medium">{user?.name}</Typography>
          </MenuItem>
          <MenuItem onClick={handleProfile}>My Profile</MenuItem>
          <MenuItem onClick={logout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
}
