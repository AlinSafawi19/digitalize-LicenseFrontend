import { Box, Typography, Paper, Grid, TextField, Button, Divider, Alert } from '@mui/material';
import { Save as SaveIcon, Person as PersonIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  useGetUserInfoQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '../../features/auth/slice/authApi';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';

// Constants
const SUCCESS_TIMEOUT = 3000; // 3 seconds
const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 3;
const SUCCESS_UPDATED = 'Successfully updated';
const ERROR_PROFILE_UPDATE = 'Failed to update profile. Please try again.';
const ERROR_PASSWORD_CHANGE = 'Failed to change password. Please try again.';
const ERROR_NO_CHANGES = 'No changes detected';
const ERROR_INVALID_EMAIL = 'Please enter a valid email address';
const ERROR_ALL_FIELDS_REQUIRED = 'All password fields are required';
const ERROR_PASSWORD_TOO_SHORT = 'New password must be at least 6 characters long';
const ERROR_PASSWORDS_DONT_MATCH = 'New passwords do not match';
const ERROR_SAME_PASSWORD = 'New password must be different from current password';
const SUCCESS_PROFILE_UPDATED = 'Profile updated successfully!';
const SUCCESS_PASSWORD_CHANGED = 'Password changed successfully!';

// Email validation regex - extract to constant to avoid recreation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Extract sx props to constants to prevent recreation on every render
const titleTypographySx = { mb: 2.5 };
const paperSx = { p: 1.5 };
const iconBoxSx = { display: 'flex', alignItems: 'center', mb: 1 };
const iconSx = { mr: 1, color: 'primary.main' };
const dividerSx = { mb: 2.5 };
const alertSx = { mt: 1 };
const apiUrlTypographySx = { fontFamily: 'monospace' };
const appInfoDividerSx = { mb: 2 };

export const SettingsPage = () => {
  const { data: userInfo, isLoading, refetch } = useGetUserInfoQuery();
  const [updateProfile, { isLoading: isUpdatingProfile, error: profileError }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword, error: passwordError }] =
    useChangePasswordMutation();

  // Profile state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Timeout refs for cleanup
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const passwordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userInfo) {
      setEmail(userInfo.email || '');
      setName(userInfo.name || '');
    }
  }, [userInfo]);

  useEffect(() => {
    if (profileError) {
      const error = profileError as { data?: { message?: string }; message?: string };
      setProfileErrorMsg(error?.data?.message || error?.message || ERROR_PROFILE_UPDATE);
    } else {
      setProfileErrorMsg('');
    }
  }, [profileError]);

  useEffect(() => {
    if (passwordError) {
      const error = passwordError as { data?: { message?: string }; message?: string };
      setPasswordErrorMsg(error?.data?.message || error?.message || ERROR_PASSWORD_CHANGE);
    } else {
      setPasswordErrorMsg('');
    }
  }, [passwordError]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
      }
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
      }
    };
  }, []);

  // Memoize handleProfileSave to prevent recreation on every render
  const handleProfileSave = useCallback(async () => {
    setProfileErrorMsg('');
    setProfileSaved(false);

    // Validate that at least one field has changed
    if (name === userInfo?.name && email === userInfo?.email) {
      setProfileErrorMsg(ERROR_NO_CHANGES);
      return;
    }

    // Validate email format
    if (email && !EMAIL_REGEX.test(email)) {
      setProfileErrorMsg(ERROR_INVALID_EMAIL);
      return;
    }

    try {
      const updates: { username?: string; email?: string } = {};
      if (name && name !== userInfo?.name) {
        updates.username = name;
      }
      if (email && email !== userInfo?.email) {
        updates.email = email;
      }

      await updateProfile(updates).unwrap();
      setProfileSaved(true);
      window.alert(SUCCESS_UPDATED);

      // Clear any existing timeout
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
      }

      profileTimeoutRef.current = setTimeout(() => {
        setProfileSaved(false);
        profileTimeoutRef.current = null;
      }, SUCCESS_TIMEOUT);

      // Refetch user info to get updated data
      refetch();
    } catch (error: unknown) {
      // Error is handled by useEffect
      console.error('Profile update error:', error);
    }
  }, [name, email, userInfo, updateProfile, refetch]);

  // Memoize handlePasswordChange to prevent recreation on every render
  const handlePasswordChange = useCallback(async () => {
    setPasswordErrorMsg('');
    setPasswordSaved(false);

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordErrorMsg(ERROR_ALL_FIELDS_REQUIRED);
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordErrorMsg(ERROR_PASSWORD_TOO_SHORT);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg(ERROR_PASSWORDS_DONT_MATCH);
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordErrorMsg(ERROR_SAME_PASSWORD);
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();
      setPasswordSaved(true);
      window.alert(SUCCESS_UPDATED);

      // Clear any existing timeout
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
      }

      passwordTimeoutRef.current = setTimeout(() => {
        setPasswordSaved(false);
        passwordTimeoutRef.current = null;
      }, SUCCESS_TIMEOUT);

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      // Error is handled by useEffect
      console.error('Password change error:', error);
    }
  }, [currentPassword, newPassword, confirmPassword, changePassword]);

  // Memoize onChange handlers to prevent recreation on every render
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
  }, []);

  const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  }, []);

  // Memoize disabled condition for profile save button
  const isProfileSaveDisabled = useMemo(
    () => isUpdatingProfile || (name === userInfo?.name && email === userInfo?.email),
    [isUpdatingProfile, name, email, userInfo?.name, userInfo?.email]
  );

  // Memoize disabled condition for password change button
  const isPasswordChangeDisabled = useMemo(
    () => isChangingPassword || !currentPassword || !newPassword || !confirmPassword,
    [isChangingPassword, currentPassword, newPassword, confirmPassword]
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={titleTypographySx}>
        Settings
      </Typography>

      <Grid container spacing={2.5}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={paperSx}>
            <Box sx={iconBoxSx}>
              <PersonIcon sx={iconSx} />
              <Typography variant="h6">Profile Information</Typography>
            </Box>
            <Divider sx={dividerSx} />

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={name}
                  onChange={handleNameChange}
                  variant="outlined"
                  helperText={`Username (minimum ${MIN_USERNAME_LENGTH} characters)`}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={email}
                  onChange={handleEmailChange}
                  variant="outlined"
                  type="text"
                  helperText="Your email address"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleProfileSave}
                  disabled={isProfileSaveDisabled}
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>

            {profileErrorMsg && (
              <Alert severity="error" sx={alertSx}>
                {profileErrorMsg}
              </Alert>
            )}

            {profileSaved && (
              <Alert severity="success" sx={alertSx}>
                {SUCCESS_PROFILE_UPDATED}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={paperSx}>
            <Box sx={iconBoxSx}>
              <SecurityIcon sx={iconSx} />
              <Typography variant="h6">Security</Typography>
            </Box>
            <Divider sx={dividerSx} />

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  variant="outlined"
                  value={currentPassword}
                  onChange={handleCurrentPasswordChange}
                  helperText="Enter your current password"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  variant="outlined"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  helperText={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  variant="outlined"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  helperText="Re-enter your new password"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handlePasswordChange}
                  disabled={isPasswordChangeDisabled}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </Grid>
            </Grid>

            {passwordErrorMsg && (
              <Alert severity="error" sx={alertSx}>
                {passwordErrorMsg}
              </Alert>
            )}

            {passwordSaved && (
              <Alert severity="success" sx={alertSx}>
                {SUCCESS_PASSWORD_CHANGED}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Application Info */}
        <Grid item xs={12}>
          <Paper sx={paperSx}>
            <Typography variant="h6" gutterBottom>
              Application Information
            </Typography>
            <Divider sx={appInfoDividerSx} />
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body1">1.0.0</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  API Base URL
                </Typography>
                <Typography variant="body1" sx={apiUrlTypographySx}>
                  {import.meta.env.VITE_API_BASE_URL || 'Not configured'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

