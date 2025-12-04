import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RenewIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useGetSubscriptionByIdQuery, useRenewSubscriptionMutation } from '../../api/subscriptionApi';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';
import { ErrorMessage } from '../../components/common/Error/ErrorMessage';
import { ConfirmDialog } from '../../components/common/Modals/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getDaysRemaining } from '../../utils/dateUtils';
import { routes } from '../../config/routes';
import { useToastContext } from '../../components/common/Toast/useToastContext';

// Constants
const COPIED_TIMEOUT = 2000; // 2 seconds
const SUCCESS_TIMEOUT = 3000; // 3 seconds
const WARNING_THRESHOLD_DAYS = 30;
const SUCCESS_COPIED = 'License key copied to clipboard';
const ERROR_COPY_FAILED = 'Failed to copy license key';
const SUCCESS_RENEWED = 'Subscription renewed successfully!';
const ERROR_LOADING_SUBSCRIPTION_MESSAGE = 'Failed to load subscription details. Please try again.';
const ERROR_LOADING_SUBSCRIPTION_TITLE = 'Error Loading Subscription';

// Status color map constant to avoid function recreation
const STATUS_COLOR_MAP: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  grace_period: 'warning',
  expired: 'default',
};

// Extract sx props to constants to prevent recreation on every render
const headerBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 };
const successAlertSx = { mb: 2.5 };
const paperSx = { p: 1.5, mb: 2.5 };
const statusBoxSx = { mb: 1 };
const bodyTypographySx = { mb: 1 };
const daysRemainingTypographySx = { mb: 1 };
const licenseTitleSx = { mb: 1, mt: 1 };
const licenseKeyBoxSx = { display: 'flex', alignItems: 'center', gap: 1, mb: 1 };
const licenseKeyTypographySx = { fontFamily: 'monospace', flexGrow: 1 };

export const SubscriptionViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize subscriptionId to avoid repeated Number(id!) calls
  const subscriptionId = useMemo(() => (id ? Number(id) : null), [id]);

  const { data: subscription, isLoading, error } = useGetSubscriptionByIdQuery(subscriptionId!);
  const [renewSubscription, { isLoading: isRenewing }] = useRenewSubscriptionMutation();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Memoize handleCopyLicenseKey to prevent recreation on every render
  const handleCopyLicenseKey = useCallback(async () => {
    if (!subscription?.license) return;

    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(subscription.license.licenseKey);
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
  }, [subscription?.license, showToast]);

  // Memoize handleRenew to prevent recreation on every render
  const handleRenew = useCallback(async () => {
    if (!subscription) return;

    try {
      await renewSubscription(subscription.id).unwrap();
      setRenewDialogOpen(false);
      setSuccessMessage(SUCCESS_RENEWED);

      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        successTimeoutRef.current = null;
      }, SUCCESS_TIMEOUT);
    } catch (err) {
      console.error('Failed to renew subscription:', err);
    }
  }, [subscription, renewSubscription]);

  // Memoize navigation handlers to prevent recreation on every render
  const handleBack = useCallback(() => {
    navigate(routes.subscriptions.list);
  }, [navigate]);

  const handleViewLicense = useCallback(() => {
    if (subscription?.license) {
      navigate(routes.licenses.view(subscription.license.id));
    }
  }, [navigate, subscription?.license]);

  const handleOpenRenewDialog = useCallback(() => {
    setRenewDialogOpen(true);
  }, []);

  const handleRenewDialogClose = useCallback(() => {
    setRenewDialogOpen(false);
  }, []);

  const handleSuccessMessageClose = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  // Memoize derived values to prevent recalculation on every render
  const daysRemaining = useMemo(
    () => (subscription ? getDaysRemaining(subscription.endDate) : 0),
    [subscription]
  );

  const canRenew = useMemo(
    () => subscription?.status === 'expired' || subscription?.status === 'grace_period',
    [subscription]
  );

  // Memoize status chip color to prevent recalculation
  const statusChipColor = useMemo(
    () => (subscription ? STATUS_COLOR_MAP[subscription.status] || 'default' : 'default'),
    [subscription]
  );

  // Memoize days remaining color and text to prevent recalculation
  const daysRemainingColor = useMemo(() => {
    if (daysRemaining <= 0) return 'error.main';
    if (daysRemaining <= WARNING_THRESHOLD_DAYS) return 'warning.main';
    return 'text.primary';
  }, [daysRemaining]);

  const daysRemainingText = useMemo(
    () => (daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'),
    [daysRemaining]
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !subscription) {
    return (
      <ErrorMessage message={ERROR_LOADING_SUBSCRIPTION_MESSAGE} title={ERROR_LOADING_SUBSCRIPTION_TITLE} />
    );
  }

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <IconButton onClick={handleBack} size="small">
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Subscription Details</Typography>
        {canRenew && (
          <Tooltip title="Renew this subscription. This will extend the subscription period by one year from today. The subscription status will change to active and the end date will be updated.">
            <span>
              <Button variant="contained" startIcon={<RenewIcon />} onClick={handleOpenRenewDialog} disabled={isRenewing}>
                Renew Subscription
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>

      {successMessage && (
        <Alert severity="success" sx={successAlertSx} onClose={handleSuccessMessageClose}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={paperSx}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box sx={statusBoxSx}>
              <Chip label={subscription.status} color={statusChipColor} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Days Remaining
            </Typography>
            <Typography variant="h6" sx={{ ...daysRemainingTypographySx, color: daysRemainingColor }}>
              {daysRemainingText}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body1" sx={bodyTypographySx}>
              {formatDate(subscription.startDate)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              End Date
            </Typography>
            <Typography variant="body1" sx={bodyTypographySx}>
              {formatDate(subscription.endDate)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Annual Fee
            </Typography>
            <Typography variant="body1" sx={bodyTypographySx}>
              {formatCurrency(subscription.annualFee)}
            </Typography>
          </Grid>
          {subscription.gracePeriodEnd && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Grace Period End
              </Typography>
              <Typography variant="body1" sx={bodyTypographySx}>
                {formatDate(subscription.gracePeriodEnd)}
              </Typography>
            </Grid>
          )}
          {subscription.license && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={licenseTitleSx}>
                  Associated License
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  License Key
                </Typography>
                <Box sx={licenseKeyBoxSx}>
                  <Typography variant="body1" sx={licenseKeyTypographySx}>
                    {subscription.license.licenseKey}
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
                  Customer
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {subscription.license.customerName || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Free Trial
                </Typography>
                <Box sx={statusBoxSx}>
                  <Chip
                    label={subscription.license.isFreeTrial ? 'Yes' : 'No'}
                    color={subscription.license.isFreeTrial ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Tooltip title="View the full license details including all activations, subscriptions, payments, and license information.">
                  <span>
                    <Button variant="outlined" onClick={handleViewLicense}>
                      View License Details
                    </Button>
                  </span>
                </Tooltip>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      <ConfirmDialog
        open={renewDialogOpen}
        title="Renew Subscription"
        message="Are you sure you want to renew this subscription? This will extend the subscription period for another year from today. The subscription status will change to active, the end date will be updated, and the license will remain active during the extended period."
        confirmLabel="Renew"
        cancelLabel="Cancel"
        confirmColor="primary"
        onConfirm={handleRenew}
        onCancel={handleRenewDialogClose}
      />
    </Box>
  );
};