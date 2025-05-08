import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  Paper,
  Divider,
  Stack,
  Snackbar,
  Dialog, // For confirmation
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl, // Added
  FormLabel, // Added
  RadioGroup, // Added
  FormControlLabel, // Added
  Radio, // Added
  Switch, // Added
  FormGroup // <-- Import FormGroup
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import NoAccountsIcon from '@mui/icons-material/NoAccounts';
import md5 from 'blueimp-md5'; // Consider if still needed or use backend avatar
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Gravatar fallback (can be removed if backend always provides avatar URL or initials)
const getGravatarUrl = (email, size = 120, def = 'identicon') => {
  if (!email) return '';
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${def}`;
};

export default function ProfilePage() {
  const { user, setUser, logout, setAuthError } = useContext(AuthContext);
  
  // State for profile form
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatar: '' });
  // State for password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  // State for preferences form
  const [preferencesForm, setPreferencesForm] = useState({
    themePreference: 'system', // Default
    notificationPreferences: { email: true, push: false } // Defaults
  });
  
  // General states
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false); // Added
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // Populate forms when user data is available
  useEffect(() => {
    // Check if setAuthError is available from context before calling
    if (typeof setAuthError === 'function') { 
      setAuthError(null); // Clear global auth errors on page load
    }
    
    if (user) {
      console.log("ProfilePage: Populating forms with user data:", user);
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
      setAvatarPreview(user.avatar || getGravatarUrl(user.email));
      
      // Safely populate preferences form
      const currentNotifPrefs = user.notificationPreferences || {}; // Default to empty object if undefined/null
      setPreferencesForm({
        themePreference: user.themePreference || 'system', // Safe: uses default if undefined
        notificationPreferences: {
          // Access properties on the defaulted object
          email: currentNotifPrefs.email !== undefined ? currentNotifPrefs.email : true,
          push: currentNotifPrefs.push !== undefined ? currentNotifPrefs.push : false,
        }
      });
    } else {
        console.log("ProfilePage: User data not yet available for form population.");
    }
  // Ensure setAuthError is included in dependency array if used
  }, [user, setAuthError]); 

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  // --- Profile Update Logic ---
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle avatar file selection and upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatarPreview(imageUrl); // Update preview immediately
      setLoadingAvatar(true); // Start loading indicator

      const formData = new FormData();
      formData.append('avatar', file); // Key must match upload.single('avatar') in backend

      try {
        const { data } = await api.post('/users/me/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (data.success) {
          showSnack('Avatar updated successfully.');
          setUser(data.user);
          setProfileForm(prev => ({ ...prev, avatar: data.user.avatar }));
          setAvatarPreview(data.user.avatar); // Update preview to the saved URL
        } else {
            throw new Error(data.message || 'Failed to upload avatar.');
        }
      } catch (err) {
          console.error("Avatar upload error:", err);
          showSnack(err.response?.data?.message || 'Failed to upload avatar.', 'error');
          setAvatarPreview(profileForm.avatar || getGravatarUrl(user?.email)); 
      } finally {
          setLoadingAvatar(false); // Stop loading indicator
      }
    }
  };

  const handleProfileSave = async () => {
    setLoadingProfile(true);
    try {
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone,
      };
      const { data } = await api.put('/users/me', payload);
      if (data.success) {
        showSnack('Profile details updated successfully.');
        setUser(data.user); // Update user in context
      } else {
         throw new Error(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error("Profile update error:", err);
      showSnack(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- Preferences Update Logic --- Added Section
  const handlePreferencesChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'themePreference') {
      setPreferencesForm(prev => ({ ...prev, themePreference: value }));
    } else if (name.startsWith('notification_')) { // e.g., name="notification_email"
      const key = name.split('_')[1]; // 'email' or 'push'
      setPreferencesForm(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [key]: type === 'checkbox' ? checked : value // Use checked for Switches/Checkboxes
        }
      }));
    }
  };

  const handlePreferencesSave = async () => {
    setLoadingPreferences(true);
    try {
      // Construct payload with only preferences
      const payload = {
          themePreference: preferencesForm.themePreference,
          notificationPreferences: preferencesForm.notificationPreferences,
      };
      
      const { data } = await api.put('/users/me', payload);
      if (data.success) {
        showSnack('Preferences updated successfully.');
        setUser(data.user); // Update user in context, which will re-trigger useEffect
      } else {
         throw new Error(data.message || 'Failed to update preferences.');
      }
    } catch (err) {
      console.error("Preferences update error:", err);
      showSnack(err.response?.data?.message || 'Failed to update preferences.', 'error');
    } finally {
      setLoadingPreferences(false);
    }
  };

  // --- Password Change Logic ---
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showSnack('New passwords do not match.', 'warning');
        return;
    }
    if (passwordForm.newPassword.length < 6) {
        showSnack('New password must be at least 6 characters.', 'warning');
        return;
    }
    setLoadingPassword(true);
    try {
        const payload = { 
            currentPassword: passwordForm.currentPassword, 
            newPassword: passwordForm.newPassword 
        };
        const { data } = await api.put('/users/me/password', payload);
        if (data.success) {
            showSnack('Password updated successfully. You might need to log in again.', 'success');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Clear form
            // Consider logging out or forcing re-login for security
            // logout(); 
        } else {
            throw new Error(data.message || 'Failed to update password.');
        }
    } catch (err) {
        console.error("Password update error:", err);
        showSnack(err.response?.data?.message || 'Failed to update password.', 'error');
    } finally {
        setLoadingPassword(false);
    }
  };
  
  // --- Deactivation Logic ---
  const handleDeactivate = async () => {
      setConfirmDeactivate(false); // Close dialog first
      showSnack('Deactivating account...', 'info');
      try {
          const { data } = await api.put('/users/me/deactivate');
          if (data.success) {
              // Don't show snackbar here, logout will handle redirect/clearing
              logout(); // Log the user out after deactivation
          } else {
              throw new Error(data.message || 'Failed to deactivate account.');
          }
      } catch (err) {
          console.error("Deactivation error:", err);
          showSnack(err.response?.data?.message || 'Failed to deactivate account.', 'error');
      }
  };

  // --- Close Snackbar ---
  const handleSnackClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnack((prev) => ({ ...prev, open: false }));
  };

  if (!user) {
    // Handle case where user data might still be loading or failed
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        My Profile
      </Typography>
      
      <Grid container spacing={4}> 
        {/* Profile Information Section */}
        <Grid item xs={12} md={6}>
           <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Account Information</Typography>
              <Stack direction="row" spacing={3} alignItems="center" mb={3}>
                  <Box sx={{ position: 'relative' }}>
                     {loadingAvatar && (
                        <CircularProgress 
                            size={100} 
                            sx={{ 
                                position: 'absolute', 
                                top: 0,
                                left: 0,
                                zIndex: 1, 
                                color: 'rgba(0, 0, 0, 0.5)'
                            }} 
                        />
                     )}
                    <Avatar
                      src={avatarPreview || ''}
                      alt={profileForm.name}
                      sx={{ width: 100, height: 100 }}
                    />
                    <IconButton
                      color="primary"
                      component="label"
                      size="small"
                      disabled={loadingAvatar}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                      title="Change Avatar"
                    >
                      <PhotoCameraIcon fontSize="inherit" />
                      <VisuallyHiddenInput
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={loadingAvatar}
                      />
                    </IconButton>
                  </Box>
                  <Box>
                      <Typography variant="h5">{user.name}</Typography>
                      <Typography color="text.secondary">{user.email}</Typography>
                      <Typography color="text.secondary">Role: {user.role}</Typography>
                  </Box>
              </Stack>
              
              <TextField
                fullWidth
                label="Display Name"
                name="name"
                margin="normal"
                value={profileForm.name}
                onChange={handleProfileInputChange}
                disabled={loadingProfile}
              />
              <TextField
                fullWidth
                label="Phone Number (Optional)"
                name="phone"
                margin="normal"
                value={profileForm.phone}
                onChange={handleProfileInputChange}
                disabled={loadingProfile}
              />
              <Button
                variant="contained"
                onClick={handleProfileSave}
                disabled={loadingProfile}
                sx={{ mt: 2 }}
              >
                {loadingProfile ? <CircularProgress size={24} /> : 'Save Profile Changes'}
              </Button>
           </Paper>
        </Grid>

        {/* Preferences Section */}
        <Grid item xs={12} md={6}>
           <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Preferences</Typography>
               <FormControl component="fieldset">
                 <FormLabel component="legend">Theme</FormLabel>
                 <RadioGroup
                   row
                   aria-label="theme preference"
                   name="themePreference"
                   value={preferencesForm.themePreference}
                   onChange={handlePreferencesChange}
                 >
                   <FormControlLabel value="light" control={<Radio />} label="Light" />
                   <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                   <FormControlLabel value="system" control={<Radio />} label="System Default" />
                 </RadioGroup>
               </FormControl>

               {/* Notification Preferences */}
               <FormControl component="fieldset">
                  <FormLabel component="legend">Notifications</FormLabel>
                  <FormGroup>
                      <FormControlLabel
                          control={
                              <Switch
                                  checked={preferencesForm.notificationPreferences.email}
                                  onChange={handlePreferencesChange}
                                  name="notification_email" // Use prefix for easy handling
                              />
                          }
                          label="Receive Email Notifications"
                      />
                      <FormControlLabel
                          control={
                              <Switch
                                  checked={preferencesForm.notificationPreferences.push}
                                  onChange={handlePreferencesChange}
                                  name="notification_push" // Use prefix
                                  // disabled // Example: Disable if push is not implemented
                              />
                          }
                          label="Receive Push Notifications (App/Browser)"
                      />
                      {/* Add more toggles here as needed */}
                  </FormGroup>
               </FormControl>

               <Button
                   variant="contained"
                   onClick={handlePreferencesSave}
                   disabled={loadingPreferences}
                   startIcon={loadingPreferences ? <CircularProgress size={20} color="inherit" /> : null}
                   sx={{ alignSelf: 'flex-start', mt: 2 }} // Align button
                 >
                   Save Preferences
               </Button>
           </Paper>
           
           {/* Security Section */}
           <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Change Password</Typography>
               <TextField
                    fullWidth
                    required
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    margin="dense"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    disabled={loadingPassword}
                />
               <TextField
                    fullWidth
                    required
                    label="New Password"
                    name="newPassword"
                    type="password"
                    margin="dense"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    disabled={loadingPassword}
                />
                <TextField
                    fullWidth
                    required
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    margin="dense"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    disabled={loadingPassword}
                />
              <Button
                variant="contained"
                color="secondary"
                startIcon={<VpnKeyIcon />}
                onClick={handlePasswordSave}
                disabled={loadingPassword}
                sx={{ mt: 2 }}
              >
                {loadingPassword ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
              </Button>
           </Paper>
           
           {/* Deactivate Account Section */}
           <Paper elevation={2} sx={{ p: 3, borderRadius: 2, backgroundColor: 'error.lighter' }}> 
              <Typography variant="h6" gutterBottom color="error.dark">Deactivate Account</Typography>
              <Typography variant="body2" color="error.dark" sx={{ mb: 2}}>
                 Deactivating your account will disable access. This action can potentially be reversed by an administrator.
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<NoAccountsIcon />}
                onClick={() => setConfirmDeactivate(true)} // Open confirmation dialog
              >
                Deactivate My Account
              </Button>
           </Paper>
        </Grid>
      </Grid>
      
      {/* Snackbar for feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
            onClose={handleSnackClose} 
            severity={snack.severity} 
            sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
      
       {/* Confirmation Dialog for Deactivation */}
       <Dialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
      >
        <DialogTitle>Confirm Account Deactivation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate your account? You will be logged out and will need an administrator to reactivate it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeactivate(false)}>Cancel</Button>
          <Button onClick={handleDeactivate} color="error" autoFocus>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
      
    </Box>
  );
}
