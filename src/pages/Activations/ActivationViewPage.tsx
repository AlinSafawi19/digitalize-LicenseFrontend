import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
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
import { useGetActivationByIdQuery } from '../../api/activationApi';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';
import { ErrorMessage } from '../../components/common/Error/ErrorMessage';
import { formatDateTime } from '../../utils/formatters';
import { routes } from '../../config/routes';
import { useToastContext } from '../../components/common/Toast/useToastContext';

// Constants
const COPIED_TIMEOUT = 2000; // 2 seconds
const SUCCESS_MESSAGE = 'License key copied to clipboard';
const ERROR_MESSAGE = 'Failed to copy license key';

// Extract sx props to constants to prevent recreation on every render
const headerBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 3 };
const paperSx = { p: 3, mb: 3 };
const hardwareIdTypographySx = { fontFamily: 'monospace', mb: 2, wordBreak: 'break-all' };
const statusBoxSx = { mb: 2 };
const bodyTypographySx = { mb: 2 };
const licenseKeyBoxSx = { display: 'flex', alignItems: 'center', gap: 1, mb: 2 };
const licenseKeyTypographySx = { fontFamily: 'monospace', flexGrow: 1 };
const licenseTitleSx = { mb: 2, mt: 2 };

export const ActivationViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: activation, isLoading, error } = useGetActivationByIdQuery(Number(id!));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoize the copy handler to prevent recreation on every render
  const handleCopyLicenseKey = useCallback(async () => {
    if (!activation?.license) return;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      await navigator.clipboard.writeText(activation.license.licenseKey);
      setCopied(true);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, COPIED_TIMEOUT);
      showToast(SUCCESS_MESSAGE, 'success');
    } catch (err) {
      console.error('Failed to copy license key:', err);
      showToast(ERROR_MESSAGE, 'error');
    }
  }, [activation?.license, showToast]);

  // Memoize navigation handlers to prevent recreation on every render
  const handleBack = useCallback(() => {
    navigate(routes.activations.list);
  }, [navigate]);

  const handleViewLicense = useCallback(() => {
    if (activation?.license) {
      navigate(routes.licenses.view(activation.license.id));
    }
  }, [navigate, activation?.license]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !activation) {
    return (
      <ErrorMessage
        message="Failed to load activation details. Please try again."
        title="Error Loading Activation"
      />
    );
  }

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <IconButton onClick={handleBack}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Activation Details</Typography>
      </Box>

      <Paper sx={paperSx}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Hardware ID
            </Typography>
            <Typography variant="body1" sx={hardwareIdTypographySx}>
              {activation.hardwareId}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box sx={statusBoxSx}>
              <Chip
                label={activation.isActive ? 'Active' : 'Inactive'}
                color={activation.isActive ? 'success' : 'default'}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Machine Name
            </Typography>
            <Typography variant="body1" sx={bodyTypographySx}>
              {activation.machineName || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Activated At
            </Typography>
            <Typography variant="body1" sx={bodyTypographySx}>
              {formatDateTime(activation.activatedAt)}
            </Typography>
          </Grid>
          {activation.lastValidation && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Validation
              </Typography>
              <Typography variant="body1" sx={bodyTypographySx}>
                {formatDateTime(activation.lastValidation)}
              </Typography>
            </Grid>
          )}
          {activation.license && (
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
                    {activation.license.licenseKey}
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
                  Location
                </Typography>
                <Typography variant="body1" sx={bodyTypographySx}>
                  {activation.license.locationName || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Free Trial
                </Typography>
                <Box sx={statusBoxSx}>
                  <Chip
                    label={activation.license.isFreeTrial ? 'Yes' : 'No'}
                    color={activation.license.isFreeTrial ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
              {activation.license.locationAddress && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location Address
                  </Typography>
                  <Typography variant="body1" sx={bodyTypographySx}>
                    {activation.license.locationAddress}
                  </Typography>
                </Grid>
              )}
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