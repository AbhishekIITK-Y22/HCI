import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Optionally, add an external logging service like Sentry or LogRocket
// import * as Sentry from '@sentry/react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    console.error('💥 Error captured by ErrorBoundary:', error, info);

    // Optional: Send error details to an external service
    // Sentry.captureException(error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, errorInfo } = this.state;
    const { customMessage, children } = this.props;

    if (hasError) {
      return (
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.default',
            color: 'text.primary',
            textAlign: 'center',
            p: 3
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {customMessage || 'An unexpected error occurred. Please try refreshing the page.'}
          </Typography>
          {errorInfo && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              <strong>Error Details:</strong> {errorInfo.componentStack}
            </Typography>
          )}
          <Button variant="contained" onClick={this.handleReload}>
            Reload Page
          </Button>
        </Box>
      );
    }

    return children;
  }
}
