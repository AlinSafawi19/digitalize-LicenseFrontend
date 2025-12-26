import { Box, Typography, Paper, Grid, Switch, FormControlLabel, Divider, Button, Alert } from '@mui/material';
import { Save as SaveIcon, Settings as SettingsIcon, People as PeopleIcon, Category as CategoryIcon } from '@mui/icons-material';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGetPreferencesQuery, useUpdatePreferencesMutation } from '../../api/preferencesApi';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';

// Constants
const SUCCESS_TIMEOUT = 3000; // 3 seconds
const SUCCESS_UPDATED = 'Preferences updated successfully!';
const ERROR_UPDATE = 'Failed to update preferences. Please try again.';
const ERROR_NO_CHANGES = 'No changes detected';

// Extract sx props to constants to prevent recreation on every render
const titleTypographySx = { mb: 2.5 };
const paperSx = { p: 1.5 };
const iconBoxSx = { display: 'flex', alignItems: 'center', mb: 1 };
const iconSx = { mr: 1, color: 'primary.main' };
const dividerSx = { mb: 2.5 };
const alertSx = { mt: 1 };
const saveButtonSx = { mt: 2 };

export const PreferencesPage = () => {
  const { data: preferences, isLoading, refetch } = useGetPreferencesQuery();
  const [updatePreferences, { isLoading: isUpdating, error: updateError }] = useUpdatePreferencesMutation();

  // Local state for preferences
  const [generalPrefs, setGeneralPrefs] = useState({
    phoneNumberVerification: true,
  });
  const [customerPrefs, setCustomerPrefs] = useState({});
  const [licenseTypeVersionPrefs, setLicenseTypeVersionPrefs] = useState({});

  // Success/error state
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Timeout ref for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize local state from API data
  useEffect(() => {
    if (preferences) {
      setGeneralPrefs({
        phoneNumberVerification: preferences.general?.phoneNumberVerification ?? true,
      });
      setCustomerPrefs(preferences.customer || {});
      setLicenseTypeVersionPrefs(preferences.licenseTypeVersion || {});
    }
  }, [preferences]);

  // Handle update errors
  useEffect(() => {
    if (updateError) {
      const error = updateError as { data?: { message?: string }; message?: string };
      setErrorMsg(error?.data?.message || error?.message || ERROR_UPDATE);
    } else {
      setErrorMsg('');
    }
  }, [updateError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Check if there are changes
  const hasChanges = useMemo(() => {
    if (!preferences) return false;
    return (
      generalPrefs.phoneNumberVerification !== (preferences.general?.phoneNumberVerification ?? true) ||
      JSON.stringify(customerPrefs) !== JSON.stringify(preferences.customer || {}) ||
      JSON.stringify(licenseTypeVersionPrefs) !== JSON.stringify(preferences.licenseTypeVersion || {})
    );
  }, [preferences, generalPrefs, customerPrefs, licenseTypeVersionPrefs]);

  // Handle save
  const handleSave = useCallback(async () => {
    setErrorMsg('');
    setSaved(false);

    if (!hasChanges) {
      setErrorMsg(ERROR_NO_CHANGES);
      return;
    }

    try {
      const updates: {
        general?: Partial<typeof generalPrefs>;
        customer?: typeof customerPrefs;
        licenseTypeVersion?: typeof licenseTypeVersionPrefs;
      } = {};

      // Only include changed sections
      if (generalPrefs.phoneNumberVerification !== (preferences?.general?.phoneNumberVerification ?? true)) {
        updates.general = { phoneNumberVerification: generalPrefs.phoneNumberVerification };
      }

      if (JSON.stringify(customerPrefs) !== JSON.stringify(preferences?.customer || {})) {
        updates.customer = customerPrefs;
      }

      if (JSON.stringify(licenseTypeVersionPrefs) !== JSON.stringify(preferences?.licenseTypeVersion || {})) {
        updates.licenseTypeVersion = licenseTypeVersionPrefs;
      }

      await updatePreferences(updates).unwrap();
      setSaved(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setSaved(false);
        timeoutRef.current = null;
      }, SUCCESS_TIMEOUT);

      // Refetch preferences to get updated data
      refetch();
    } catch (error: unknown) {
      // Error is handled by useEffect
      console.error('Preferences update error:', error);
    }
  }, [hasChanges, generalPrefs, customerPrefs, licenseTypeVersionPrefs, preferences, updatePreferences, refetch]);

  // Handle phone number verification toggle
  const handlePhoneVerificationChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralPrefs((prev) => ({
      ...prev,
      phoneNumberVerification: event.target.checked,
    }));
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={titleTypographySx}>
        Preferences
      </Typography>

      <Grid container spacing={2.5}>
        {/* General Preferences */}
        <Grid item xs={12}>
          <Paper sx={paperSx}>
            <Box sx={iconBoxSx}>
              <SettingsIcon sx={iconSx} />
              <Typography variant="h6">General Preferences</Typography>
            </Box>
            <Divider sx={dividerSx} />

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={generalPrefs.phoneNumberVerification}
                      onChange={handlePhoneVerificationChange}
                    />
                  }
                  label="Phone Number Verification"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                  When enabled, phone verification UI will be shown but verification is not required. Verification codes are sent via WhatsApp. When disabled, phone verification UI will be hidden and WhatsApp messages will not be sent.
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Customer Preferences */}
        <Grid item xs={12}>
          <Paper sx={paperSx}>
            <Box sx={iconBoxSx}>
              <PeopleIcon sx={iconSx} />
              <Typography variant="h6">Customer Preferences</Typography>
            </Box>
            <Divider sx={dividerSx} />

            <Typography variant="body2" color="text.secondary">
              Customer-related preferences will be added here in the future.
            </Typography>
          </Paper>
        </Grid>

        {/* License Type Version Preferences */}
        <Grid item xs={12}>
          <Paper sx={paperSx}>
            <Box sx={iconBoxSx}>
              <CategoryIcon sx={iconSx} />
              <Typography variant="h6">License Type Version Preferences</Typography>
            </Box>
            <Divider sx={dividerSx} />

            <Typography variant="body2" color="text.secondary">
              License type version preferences (e.g., grocery, etc.) will be added here in the future.
            </Typography>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isUpdating}
              sx={saveButtonSx}
            >
              {isUpdating ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Box>
        </Grid>

        {/* Error Alert */}
        {errorMsg && (
          <Grid item xs={12}>
            <Alert severity="error" sx={alertSx}>
              {errorMsg}
            </Alert>
          </Grid>
        )}

        {/* Success Alert */}
        {saved && (
          <Grid item xs={12}>
            <Alert severity="success" sx={alertSx}>
              {SUCCESS_UPDATED}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

