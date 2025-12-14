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
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useLazyGetLicenseByKeyQuery,
  useReactivateLicenseMutation,
} from '../../api/licenseApi';
import { useToastContext } from '../../components/common/Toast/useToastContext';
import { LicenseStatusBadge } from '../../components/license/LicenseStatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { routes } from '../../config/routes';

// Constants
const DEBOUNCE_DELAY = 500; // milliseconds
const COPIED_TIMEOUT = 2000; // 2 seconds
const ERROR_FETCH_FIRST = 'Please fetch license information first';
const ERROR_DEFAULT = 'Failed to reset license reactivation. Please try again.';
const SUCCESS_COPIED = 'License key copied to clipboard';
const ERROR_COPY_FAILED = 'Failed to copy license key';
const SUCCESS_REACTIVATED = 'License reactivation reset successfully. Customer can now re-enter license key.';
const LICENSE_NOT_FOUND_MESSAGE = 'License not found. Please check the license key and try again.';

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
const formBoxSx = { maxWidth: 500 };
const alertSx = { mb: 2 };
const alertListSx = { mt: 1, mb: 1, pl: 2.5 };

export const ReactivateLicensePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToastContext();
  const urlLicenseKey = searchParams.get('licenseKey') || '';
  const [licenseKey, setLicenseKey] = useState(urlLicenseKey);
  const [fetchLicense, { data: license, isLoading: isLoadingLicense }] =
    useLazyGetLicenseByKeyQuery();
  const [reactivateLicense, { isLoading: isReactivating }] = useReactivateLicenseMutation();
  const [copied, setCopied] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Copy timeout ref
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

      // Set new timer to fetch after DEBOUNCE_DELAY of no typing
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

  // Memoize handleReactivate to prevent recreation on every render
  const handleReactivate = useCallback(async () => {
    if (!license) {
      showToast(ERROR_FETCH_FIRST, 'error');
      return;
    }

    try {
      const result = await reactivateLicense(license.id).unwrap();

      showToast(result.message || SUCCESS_REACTIVATED, 'success');

      // Refresh license data
      await fetchLicense(licenseKey.trim()).unwrap();
    } catch (err: unknown) {
      console.error('Failed to reactivate license:', err);
      const error = err as { data?: { message?: string } };
      showToast(error?.data?.message || ERROR_DEFAULT, 'error');
    }
  }, [license, reactivateLicense, showToast, fetchLicense, licenseKey]);

  // Memoize activeActivationsCount to prevent recalculation on every render
  const activeActivationsCount = useMemo(
    () => license?.activations?.filter((a) => a.isActive).length || 0,
    [license?.activations]
  );

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

  // Memoize navigation handler to prevent recreation on every render
  const handleBack = useCallback(() => {
    navigate(routes.licenses.list);
  }, [navigate]);

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <IconButton onClick={handleBack}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Reactivate License</Typography>
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
            {LICENSE_NOT_FOUND_MESSAGE}
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
                  Customer Phone
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {license.customerPhone || '-'}
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
                  Active Activations
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {activeActivationsCount}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={lastPaperSx}>
            <Typography variant="h6" gutterBottom>
              Reactivate License
            </Typography>
            <Divider sx={dividerSx} />
            <Box sx={formBoxSx}>
              <Alert severity="warning" sx={alertSx}>
                <Typography variant="body2" component="div">
                  <strong>What happens when you reactivate a license:</strong>
                  <Box component="ul" sx={alertListSx}>
                    <li>All existing activations will be deactivated</li>
                    <li>The customer will need to re-enter their license key in the desktop application</li>
                    <li>All license data (subscriptions, payments, deadlines) will be preserved</li>
                    <li>The license status and user limits remain unchanged</li>
                    <li>This is useful when a customer needs to move the license to a new computer or reset their activation</li>
                  </Box>
                </Typography>
              </Alert>
              <Alert severity="info" sx={alertSx}>
                All license data (subscriptions, payments, deadlines) will be preserved. Only activations will be reset.
              </Alert>
              {activeActivationsCount > 0 && (
                <Alert severity="warning" sx={alertSx}>
                  Currently {activeActivationsCount} active activation(s) will be deactivated. The customer will need to reactivate the license in the desktop application.
                </Alert>
              )}
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleReactivate}
                disabled={isReactivating}
                fullWidth
              >
                {isReactivating ? 'Reactivating...' : 'Reactivate License'}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};