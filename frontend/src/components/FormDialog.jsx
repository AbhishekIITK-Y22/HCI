import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
  Typography,
  CircularProgress,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled, useTheme } from '@mui/system';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Styled Dialog
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
  },
}));

// Validation schema with Yup
const schema = yup.object({
  name: yup.string().required('Name is required'),
  location: yup.string().required('Location is required'),
}).required();

export default function FormDialogWithForm({
  open,
  title,
  defaultValues = { name: '', location: '' },
  onClose,
  onSubmit,
  loading = false,
}) {
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });

  // Reset form on open/close
  useEffect(() => {
    if (open) reset(defaultValues);
    // Reset form when dialog is closed
    return () => reset();
  }, [open, defaultValues, reset]);

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data); // Assuming onSubmit is an async function
    } catch (error) {
      console.error('Form submission failed:', error);
      // Optionally handle the error state here
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="form-dialog-title"
      aria-describedby="form-dialog-description"
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="form-dialog-title">
        <Typography variant="h6" component="span">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          edge="end"
          sx={{
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <DialogContent sx={{ p: 2 }} dividers>
          <TextField
            label="Venue Name"
            fullWidth
            margin="normal"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="Location"
            fullWidth
            margin="normal"
            {...register('location')}
            error={!!errors.location}
            helperText={errors.location?.message}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  );
}
