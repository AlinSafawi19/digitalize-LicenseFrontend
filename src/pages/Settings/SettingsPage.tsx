import { Box, Typography, Paper, Grid, TextField, Button, Divider, Alert } from '@mui/material';
import { Save as SaveIcon, Person as PersonIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  useGetUserInfoQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '../../features/auth/slice/authApi';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';
import { config } from '../../config/env';

// Constants
const SUCCESS_TIMEOUT = 3000; // 3 seconds
const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 3;
const SUCCESS_UPDATED = 'Successfully updated';
const ERROR_PROFILE_UPDATE = 'Failed to update profile. Please try again.';
const ERROR_PASSWORD_CHANGE = 'Failed to change password. Please try again.';
const ERROR_NO_CHANGES = 'No changes detected';
const ERROR_INVALID_PHONE = 'Please enter a valid phone number';
const ERROR_ALL_FIELDS_REQUIRED = 'All password fields are required';
const ERROR_PASSWORD_TOO_SHORT = 'New password must be at least 6 characters long';
const ERROR_PASSWORDS_DONT_MATCH = 'New passwords do not match';
const ERROR_SAME_PASSWORD = 'New password must be different from current password';
const SUCCESS_PROFILE_UPDATED = 'Profile updated successfully!';
const SUCCESS_PASSWORD_CHANGED = 'Password changed successfully!';

// Phone validation regex - extract to constant to avoid recreation
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

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
  const [phone, setPhone] = useState('');
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
      setPhone(userInfo.phone || '');
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
    if (name === userInfo?.name && phone === userInfo?.phone) {
      setProfileErrorMsg(ERROR_NO_CHANGES);
      return;
    }

    // Validate phone format
    if (phone && !PHONE_REGEX.test(phone)) {
      setProfileErrorMsg(ERROR_INVALID_PHONE);
      return;
    }

    try {
      const updates: { username?: string; phone?: string } = {};
      if (name && name !== userInfo?.name) {
        updates.username = name;
      }
      if (phone && phone !== userInfo?.phone) {
        updates.phone = phone;
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
  }, [name, phone, userInfo, updateProfile, refetch]);

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

  const handlePhoneChange = useCallback((value: string | undefined) => {
    setPhone(value || '');
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
    () => isUpdatingProfile || (name === userInfo?.name && phone === userInfo?.phone),
    [isUpdatingProfile, name, phone, userInfo?.name, userInfo?.phone]
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
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: '14px', color: 'text.secondary' }}>
                    Phone Number
                  </Typography>
                  <PhoneInput
                    international
                    defaultCountry="LB"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="mui-phone-input"
                    style={{
                      '--PhoneInputInput-height': '56px',
                      '--PhoneInputInput-fontSize': '16px',
                    } as React.CSSProperties}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px', mt: 0.5, display: 'block' }}>
                    Your phone number
                  </Typography>
                  <style>{`
                    .mui-phone-input {
                      width: 100%;
                    }
                    .mui-phone-input .PhoneInputInput {
                      width: 100%;
                      height: 56px;
                      padding: 16px 14px;
                      font-size: 16px;
                      border: 1px solid rgba(0, 0, 0, 0.23);
                      border-radius: 4px;
                      font-family: inherit;
                    }
                    .mui-phone-input .PhoneInputInput:focus {
                      border-color: #1976d2;
                      border-width: 2px;
                      outline: none;
                    }
                    .mui-phone-input .PhoneInputCountry {
                      margin-right: 8px;
                    }
                  `}</style>
                </Box>
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
                <Typography variant="body1">{config.appVersion}</Typography>
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

