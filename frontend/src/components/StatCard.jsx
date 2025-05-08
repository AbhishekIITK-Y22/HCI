import React from 'react';
import PropTypes from 'prop-types'; // Prop validation
import { Paper, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/system';

// Styled wrapper with accent bar and hover effect
const CardWrapper = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  borderTop: `4px solid ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
    backgroundColor: theme.palette.action.hover, // Optional hover background color change
  },
}));

export default function StatCard({ title, value, icon }) {
  const theme = useTheme();

  // Ensure value is a valid number
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : 'N/A';

  return (
    <CardWrapper role="region" aria-label={`${title}: ${formattedValue}`}>
      {icon && (
        <div style={{ marginBottom: theme.spacing(1) }}>
          {icon}
        </div>
      )}
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
        {formattedValue}
      </Typography>
    </CardWrapper>
  );
}

// Prop types validation
StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.node,
};

StatCard.defaultProps = {
  icon: null,
};
