import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PersonAdd as PersonAddIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useLazyGetLicenseByKeyQuery,
  useIncreaseUserLimitMutation,
} from '../../api/licenseApi';
import { useToastContext } from '../../components/common/Toast/useToastContext';
import { LicenseStatusBadge } from '../../components/license/LicenseStatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { routes } from '../../config/routes';

// Constants
const DEBOUNCE_DELAY = 500; // milliseconds
const COPIED_TIMEOUT = 2000; // milliseconds
const ERROR_FETCH_FIRST = 'Please fetch license information first';
const ERROR_INVALID_USERS = 'Please enter a valid number of additional users';
const ERROR_DEFAULT = 'Failed to increase user limit. Please try again.';
const SUCCESS_COPIED = 'License key copied to clipboard';
const ERROR_COPY_FAILED = 'Failed to copy license key';

// Extract sx props to constants to prevent recreation on every render
const headerBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 3 };
const paperSx = { p: 3, mb: 3 };
const lastPaperSx = { p: 3 };
const licenseKeyTextFieldSx = { mb: 2 };
const errorTypographySx = { mt: 1 };
const dividerSx = { my: 2 };
const licenseKeyBoxSx = { display: 'flex', alignItems: 'center', gap: 1, mb: 2 };
const licenseKeyTypographySx = { fontFamily: 'monospace', flexGrow: 1 };
const statusBoxSx = { mb: 2 };
const bodyTypographySx = { mb: 2 };
const usersBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 2 };
const formBoxSx = { maxWidth: 500 };
const alertSx = { mb: 2 };
const alertListSx = { mt: 1, mb: 1, pl: 2.5 };
const additionalUsersTextFieldSx = { mb: 2 };

export const IncreaseUserLimitPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToastContext();
  const urlLicenseKey = searchParams.get('licenseKey') || '';
  const [licenseKey, setLicenseKey] = useState(urlLicenseKey);
  const [additionalUsers, setAdditionalUsers] = useState('1');
  const [fetchLicense, { data: license, isLoading: isLoadingLicense }] =
    useLazyGetLicenseByKeyQuery();
  const [increaseUserLimit, { isLoading: isIncreasingLimit }] = useIncreaseUserLimitMutation();
  const [copied, setCopied] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Copy timeout ref for cleanup
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLicenseKeyChange = useCallback(
    (value: string) => {
      setLicenseKey(value);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // If empty, don't fetch
      if (!value.trim()) {
        return;
      }

      // Set new timer to fetch after debounce delay
      debounceTimerRef.current = setTimeout(async () => {
        try {
          await fetchLicense(value.trim()).unwrap();
        } catch (err: unknown) {
          // License not found or error - handled by error state
          console.error('Error fetching license:', err);
        }
      }, DEBOUNCE_DELAY);
    },
    [fetchLicense]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Auto-fetch license when component mounts with initial license key from URL
  useEffect(() => {
    if (urlLicenseKey.trim()) {
      // Fetch immediately without debounce when license key comes from URL
      const fetchInitialLicense = async () => {
        try {
          await fetchLicense(urlLicenseKey.trim()).unwrap();
        } catch (err: unknown) {
          // License not found or error
          console.error('Error fetching license:', err);
        }
      };
      fetchInitialLicense();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Memoize handleIncreaseLimit to prevent recreation on every render
  const handleIncreaseLimit = useCallback(async () => {
    if (!license) {
      showToast(ERROR_FETCH_FIRST, 'error');
      return;
    }

    const users = parseInt(additionalUsers);
    if (isNaN(users) || users <= 0) {
      showToast(ERROR_INVALID_USERS, 'error');
      return;
    }

    try {
      const result = await increaseUserLimit({
        id: license.id,
        additionalUsers: users,
      }).unwrap();

      showToast(`User limit increased by ${users}. New limit: ${result.userLimit}`, 'success');

      // Refresh license data
      await fetchLicense(licenseKey.trim()).unwrap();
      setAdditionalUsers('');
    } catch (err: unknown) {
      console.error('Failed to increase user limit:', err);
      const error = err as { data?: { message?: string } };
      showToast(error?.data?.message || ERROR_DEFAULT, 'error');
    }
  }, [license, additionalUsers, increaseUserLimit, showToast, fetchLicense, licenseKey]);

  // Memoize handleCopyLicenseKey to prevent recreation on every render
  const handleCopyLicenseKey = useCallback(async () => {
    if (!license) return;

    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(license.licenseKey);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, COPIED_TIMEOUT);
      showToast(SUCCESS_COPIED, 'success');
    } catch (err) {
      console.error('Failed to copy license key:', err);
      showToast(ERROR_COPY_FAILED, 'error');
    }
  }, [license, showToast]);

  // Memoize navigation handlers to prevent recreation on every render
  const handleBack = useCallback(() => {
    navigate(routes.licenses.list);
  }, [navigate]);

  // Memoize onChange handler for additionalUsers
  const handleAdditionalUsersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalUsers(e.target.value);
  }, []);

  // Memoize parsed additional users value to avoid repeated parsing
  const parsedAdditionalUsers = useMemo(() => {
    const parsed = parseInt(additionalUsers);
    return isNaN(parsed) ? null : parsed;
  }, [additionalUsers]);

  // Memoize calculated values to avoid repeated calculations
  const newUserLimit = useMemo(() => {
    if (!license || !parsedAdditionalUsers || parsedAdditionalUsers <= 0) {
      return null;
    }
    return (license.userLimit || 0) + parsedAdditionalUsers;
  }, [license, parsedAdditionalUsers]);

  // Memoize disabled condition to avoid recalculation on every render
  const isIncreaseDisabled = useMemo(() => {
    return (
      !additionalUsers ||
      !parsedAdditionalUsers ||
      parsedAdditionalUsers <= 0 ||
      isIncreasingLimit
    );
  }, [additionalUsers, parsedAdditionalUsers, isIncreasingLimit]);

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <IconButton onClick={handleBack}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Increase User Limit</Typography>
      </Box>

      <Paper sx={paperSx}>
        <TextField
          fullWidth
          label="License Key"
          value={licenseKey}
          onChange={(e) => handleLicenseKeyChange(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          helperText="Enter the license key to fetch license information"
          sx={licenseKeyTextFieldSx}
        />

        {licenseKey.trim() && !license && !isLoadingLicense && (
          <Typography variant="body2" color="error" sx={errorTypographySx}>
            License not found. Please check the license key and try again.
          </Typography>
        )}
      </Paper>

      {license && (
        <>
          <Paper sx={paperSx}>
            <Typography variant="h6" gutterBottom>
              License Information
            </Typography>
            <Divider sx={dividerSx} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  License Key
                </Typography>
                <Box sx={licenseKeyBoxSx}>
                  <Typography variant="body1" sx={licenseKeyTypographySx}>
                    {license.licenseKey}
                  </Typography>
                  <Tooltip title="Copy license key to clipboard. The customer needs this key to activate the license in the desktop application.">
                    <IconButton onClick={handleCopyLicenseKey} color="primary" size="small">
                      {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Box sx={statusBoxSx}>
                  <LicenseStatusBadge status={license.status} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Free Trial
                </Typography>
                <Box sx={statusBoxSx}>
                  <Chip
                    label={license.isFreeTrial ? 'Yes' : 'No'}
                    color={license.isFreeTrial ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Customer Name
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {license.customerName || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Customer Email
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {license.customerEmail || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Location Name
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {license.locationName || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Purchase Date
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {formatDate(license.purchaseDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Initial Price
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {formatCurrency(license.initialPrice)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Users
                </Typography>
                <Box sx={usersBoxSx}>
                  <Typography variant="body1">
                    {license.userCount || 0} / {license.userLimit || 0}
                  </Typography>
                  <Chip
                    label={
                      (license.userCount || 0) >= (license.userLimit || 0)
                        ? 'Limit Reached'
                        : `${(license.userLimit || 0) - (license.userCount || 0)} available`
                    }
                    color={(license.userCount || 0) >= (license.userLimit || 0) ? 'error' : 'success'}
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={lastPaperSx}>
            <Typography variant="h6" gutterBottom>
              Increase User Limit
            </Typography>
            <Divider sx={dividerSx} />
            <Box sx={formBoxSx}>
              <Alert severity="info" sx={alertSx}>
                <Typography variant="body2" component="div">
                  <strong>What happens when you increase the user limit:</strong>
                  <Box component="ul" sx={alertListSx}>
                    <li>The user limit will be increased immediately</li>
                    <li>The change takes effect right away - no reactivation needed</li>
                    <li>Additional users can be created in the desktop application immediately</li>
                    <li>This does not create a payment record automatically - you should add a user payment separately if needed</li>
                    <li>The current user count remains unchanged - only the limit increases</li>
                  </Box>
                </Typography>
              </Alert>
              <Alert severity="info" sx={alertSx}>
                Current limit: <strong>{license.userLimit || 0}</strong> users
                {license.userCount !== undefined && (
                  <> (Currently using: <strong>{license.userCount}</strong>)</>
                )}
              </Alert>
              <TextField
                fullWidth
                label="Additional Users"
                type="number"
                value={additionalUsers}
                onChange={handleAdditionalUsersChange}
                helperText="Enter the number of additional users to add to the limit. The new limit will be the current limit plus this number."
                inputProps={{ min: 1 }}
                sx={additionalUsersTextFieldSx}
              />
              {newUserLimit !== null && (
                <Alert severity="success" sx={alertSx}>
                  New limit will be: <strong>{newUserLimit} users</strong> (
                  {license.userLimit || 0} + {parsedAdditionalUsers})
                </Alert>
              )}
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleIncreaseLimit}
                disabled={isIncreaseDisabled}
                fullWidth
              >
                {isIncreasingLimit ? 'Increasing Limit...' : 'Increase User Limit'}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};