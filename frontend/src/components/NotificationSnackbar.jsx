import React from 'react';
import {
  Snackbar,
  Alert as MuiAlert,
  Slide,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled, useTheme } from '@mui/system';

// Transition function for slide-down effect with custom duration
function SlideTransition(props) {
  return <Slide {...props} direction="down" timeout={500} />;
}

// Styled Snackbar container with top-right positioning
const StyledSnackbar = styled(Snackbar)(({ theme }) => ({
  top: theme.spacing(9),
  right: theme.spacing(3),
  '& .MuiPaper-root': {
    boxShadow: theme.shadows[3],
    borderRadius: theme.shape.borderRadius,
  },
}));

export default function NotificationSnackbar({
  open,
  message = 'Notification', // default message if none is passed
  severity = 'info',
  onClose,
  autoHideDuration = 3000,
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
}) {
  const theme = useTheme();

  return (
    <StyledSnackbar
      open={open}
      onClose={onClose}
      autoHideDuration={autoHideDuration}
      TransitionComponent={SlideTransition}
      anchorOrigin={anchorOrigin}
      aria-describedby="notification-snackbar"
    >
      <MuiAlert
        id="notification-snackbar"
        severity={severity}
        variant="filled"
        elevation={2}
        action={
          <IconButton
            aria-label="close"
            size="small"
            onClick={onClose}
            sx={{ color: theme.palette.grey[100] }}
            title="Close Notification"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          alignItems: 'center',
          '& .MuiAlert-message': { display: 'flex', alignItems: 'center' },
        }}
      >
        {message}
      </MuiAlert>
    </StyledSnackbar>
  );
}
