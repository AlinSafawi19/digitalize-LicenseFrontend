import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useGetPaymentByIdQuery } from '../../api/paymentApi';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';
import { ErrorMessage } from '../../components/common/Error/ErrorMessage';
import { formatDate, formatCurrency, getPaymentTypeLabel, getPaymentTypeColor } from '../../utils/formatters';
import { routes } from '../../config/routes';
import { useToastContext } from '../../components/common/Toast/useToastContext';

// Constants
const COPIED_TIMEOUT = 2000; // 2 seconds
const SUCCESS_COPIED = 'License key copied to clipboard';
const ERROR_COPY_FAILED = 'Failed to copy license key';
const ERROR_LOADING_PAYMENT_MESSAGE = 'Failed to load payment details. Please try again.';
const ERROR_LOADING_PAYMENT_TITLE = 'Error Loading Payment';

// Extract sx props to constants to prevent recreation on every render
const headerBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 3 };
const paperSx = { p: 3, mb: 3 };
const amountTypographySx = { mb: 2, color: 'primary.main' };
const statusBoxSx = { mb: 2 };
const bodyTypographySx = { mb: 2 };
const licenseTitleSx = { mb: 2, mt: 2 };
const licenseKeyBoxSx = { display: 'flex', alignItems: 'center', gap: 1, mb: 2 };
const licenseKeyTypographySx = { fontFamily: 'monospace', flexGrow: 1 };

export const PaymentViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize paymentId to avoid repeated Number(id!) calls
  const paymentId = useMemo(() => (id ? Number(id) : null), [id]);

  const { data: payment, isLoading, error } = useGetPaymentByIdQuery(paymentId!);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Memoize handleCopyLicenseKey to prevent recreation on every render
  const handleCopyLicenseKey = useCallback(async () => {
    if (!payment?.license) return;

    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(payment.license.licenseKey);
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
  }, [payment?.license, showToast]);

  // Memoize navigation handlers to prevent recreation on every render
  const handleBack = useCallback(() => {
    navigate(routes.payments.list);
  }, [navigate]);

  const handleViewLicense = useCallback(() => {
    if (payment?.license) {
      navigate(routes.licenses.view(payment.license.id));
    }
  }, [navigate, payment?.license]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !payment) {
    return (
      <ErrorMessage message={ERROR_LOADING_PAYMENT_MESSAGE} title={ERROR_LOADING_PAYMENT_TITLE} />
    );
  }

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <IconButton onClick={handleBack}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Payment Details</Typography>
      </Box>

      <Paper sx={paperSx}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Amount
            </Typography>
            <Typography variant="h5" sx={amountTypographySx}>
              {formatCurrency(payment.amount)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Payment Type
            </Typography>
            <Box sx={statusBoxSx}>
              <Chip
                label={getPaymentTypeLabel(payment.paymentType, payment.isAnnualSubscription)}
                color={getPaymentTypeColor(payment.paymentType, payment.isAnnualSubscription)}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Payment Date
            </Typography>
            <Typography variant="body1" sx={bodyTypographySx}>
              {formatDate(payment.paymentDate)}
            </Typography>
          </Grid>
          {payment.license && (
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
                    {payment.license.licenseKey}
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
                  {payment.license.customerName || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {payment.license.locationName || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Free Trial
                </Typography>
                <Box sx={statusBoxSx}>
                  <Chip
                    label={payment.license.isFreeTrial ? 'Yes' : 'No'}
                    color={payment.license.isFreeTrial ? 'success' : 'default'}
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
    </Box>
  );
};