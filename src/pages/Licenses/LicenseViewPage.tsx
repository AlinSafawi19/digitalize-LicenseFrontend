import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  PersonAdd as PersonAddIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { useGetLicenseByIdQuery, useRevokeLicenseMutation, useReactivateLicenseMutation } from '../../api/licenseApi';
import { LicenseStatusBadge } from '../../components/license/LicenseStatusBadge';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';
import { ErrorMessage } from '../../components/common/Error/ErrorMessage';
import { ConfirmDialog } from '../../components/common/Modals/ConfirmDialog';
import { formatDate, formatCurrency, formatDateTime, getPaymentTypeLabel, getPaymentTypeColor } from '../../utils/formatters';
import { routes } from '../../config/routes';
import { Activation, Subscription, Payment } from '../../types/license.types';
import { useToastContext } from '../../components/common/Toast/useToastContext';

// Constants
const COPIED_TIMEOUT = 2000; // 2 seconds
const SUCCESS_COPIED = 'License key copied to clipboard';
const ERROR_COPY_FAILED = 'Failed to copy license key';
const SUCCESS_REVOKED = 'License revoked successfully';
const ERROR_REVOKE_FAILED = 'Failed to revoke license. Please try again.';
const SUCCESS_REACTIVATED = 'License reactivation reset successfully';
const ERROR_REACTIVATE_FAILED = 'Failed to reset license reactivation. Please try again.';

// Extract sx props to constants to prevent recreation on every render
const tabPanelBoxSx = { pt: 3 };
const headerBoxSx = { 
  display: 'flex', 
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: { xs: 'flex-start', sm: 'center' },
  gap: 2, 
  mb: 3 
};
const headerTitleBoxSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  width: { xs: '100%', sm: 'auto' }
};
const headerButtonsBoxSx = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
  width: { xs: '100%', sm: 'auto' },
  justifyContent: { xs: 'flex-start', sm: 'flex-end' }
};
const paperSx = { p: 3, mb: 3 };
const licenseKeyBoxSx = { display: 'flex', alignItems: 'center', gap: 1, mb: 2 };
const licenseKeyTypographySx = { fontFamily: 'monospace', flexGrow: 1 };
const statusBoxSx = { mb: 2 };
const bodyTypographySx = { mb: 2 };
const usersBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 2 };
const increaseUserLimitButtonSx = { mt: 1 };
const hardwareIdTableCellSx = { fontFamily: 'monospace', fontSize: '0.875rem' };

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Memoize TabPanel to prevent unnecessary re-renders
const TabPanel = memo(({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={tabPanelBoxSx}>{children}</Box>}
    </div>
  );
});
TabPanel.displayName = 'TabPanel';

export const LicenseViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [tabValue, setTabValue] = useState(0);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize licenseId to avoid repeated Number(id!) calls
  const licenseId = useMemo(() => (id ? Number(id) : null), [id]);

  const { data: license, isLoading, error } = useGetLicenseByIdQuery(licenseId!);
  const [revokeLicense] = useRevokeLicenseMutation();
  const [reactivateLicense, { isLoading: isReactivating }] = useReactivateLicenseMutation();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Memoize handleRevoke to prevent recreation on every render
  const handleRevoke = useCallback(async () => {
    if (!license) return;
    try {
      await revokeLicense(license.id).unwrap();
      setRevokeDialogOpen(false);
      showToast(SUCCESS_REVOKED, 'success');
      navigate(routes.licenses.list);
    } catch (err) {
      console.error('Failed to revoke license:', err);
      showToast(ERROR_REVOKE_FAILED, 'error');
    }
  }, [license, revokeLicense, showToast, navigate]);

  // Memoize handleReactivate to prevent recreation on every render
  const handleReactivate = useCallback(async () => {
    if (!license) return;
    try {
      const result = await reactivateLicense(license.id).unwrap();
      setReactivateDialogOpen(false);
      showToast(result.message || SUCCESS_REACTIVATED, 'success');
    } catch (err) {
      console.error('Failed to reactivate license:', err);
      showToast(ERROR_REACTIVATE_FAILED, 'error');
    }
  }, [license, reactivateLicense, showToast]);

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

  const handleAddPayment = useCallback(() => {
    if (license) {
      navigate(`${routes.payments.create}?licenseKey=${encodeURIComponent(license.licenseKey)}`);
    }
  }, [navigate, license]);

  const handleEditLicense = useCallback(() => {
    if (license) {
      navigate(routes.licenses.edit(license.id));
    }
  }, [navigate, license]);

  const handleIncreaseUserLimit = useCallback(() => {
    if (license) {
      navigate(`${routes.licenses.increaseUserLimit}?licenseKey=${encodeURIComponent(license.licenseKey)}`);
    }
  }, [navigate, license]);

  // Memoize tab change handler to prevent recreation on every render
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  // Memoize dialog close handlers to prevent recreation on every render
  const handleRevokeDialogClose = useCallback(() => {
    setRevokeDialogOpen(false);
  }, []);

  const handleReactivateDialogClose = useCallback(() => {
    setReactivateDialogOpen(false);
  }, []);

  const handleOpenReactivateDialog = useCallback(() => {
    setReactivateDialogOpen(true);
  }, []);

  const handleOpenRevokeDialog = useCallback(() => {
    setRevokeDialogOpen(true);
  }, []);


  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !license) {
    return (
      <ErrorMessage
        message="Failed to load license details. Please try again."
        title="Error Loading License"
      />
    );
  }

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <Box sx={headerTitleBoxSx}>
          <IconButton onClick={handleBack}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>License Details</Typography>
        </Box>
        <Box sx={headerButtonsBoxSx}>
          <Tooltip title="Add a payment record for this license. This can be an initial payment, annual subscription payment, or user limit increase payment. Payments extend subscriptions and update license status.">
            <span>
              <Button 
                variant="outlined" 
                startIcon={<PaymentIcon />} 
                onClick={handleAddPayment}
                size="small"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Add Payment
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Edit license information (customer name, phone, location, prices). This does not affect existing subscriptions or payments.">
            <span>
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />} 
                onClick={handleEditLicense}
                size="small"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Edit
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Reactivate this license by deactivating all existing activations. This allows the customer to re-enter their license key. All license data (subscriptions, payments, deadlines) will be preserved.">
            <span>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleOpenReactivateDialog}
                disabled={isReactivating}
                size="small"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Reactivate
              </Button>
            </span>
          </Tooltip>
          {license.status !== 'revoked' && (
            <Tooltip title="Revoke this license permanently. This action cannot be undone. The license will be marked as revoked, all activations will be deactivated, and the customer will no longer be able to use the license.">
              <span>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />} 
                  onClick={handleOpenRevokeDialog}
                  size="small"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Revoke
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Paper sx={paperSx}>
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
              Branch/Location Name
            </Typography>
            <Typography variant="body1" sx={bodyTypographySx}>
              {license.locationName || '-'}
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
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Branch/Location Address
            </Typography>
            <Typography variant="body1" sx={bodyTypographySx}>
              {license.locationAddress || '-'}
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
              Users
            </Typography>
            <Box sx={usersBoxSx}>
              <Typography variant="body1">
                {license.userCount} / {license.userLimit}
              </Typography>
              <Chip
                label={
                  license.userCount >= license.userLimit
                    ? 'Limit Reached'
                    : `${license.userLimit - license.userCount} available`
                }
                color={license.userCount >= license.userLimit ? 'error' : 'success'}
                size="small"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              User Limit Management
            </Typography>
            <Tooltip title="Increase the user limit for this license. This allows more users to be added to the license. The change takes effect immediately and allows additional users to be created in the desktop application.">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={handleIncreaseUserLimit}
                  sx={increaseUserLimitButtonSx}
                >
                  Increase User Limit
                </Button>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Activations" />
          <Tab label="Subscriptions" />
          <Tab label="Payments" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Hardware ID</TableCell>
                  <TableCell>Machine Name</TableCell>
                  <TableCell>Activated At</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {license.activations && license.activations.length > 0 ? (
                  license.activations.map((activation: Activation) => (
                    <TableRow key={activation.id}>
                      <TableCell sx={hardwareIdTableCellSx}>{activation.hardwareId}</TableCell>
                      <TableCell>{activation.machineName || '-'}</TableCell>
                      <TableCell>{formatDateTime(activation.activatedAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={activation.isActive ? 'Active' : 'Inactive'}
                          color={activation.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No activations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Annual Fee</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {license.subscriptions && license.subscriptions.length > 0 ? (
                  license.subscriptions.map((subscription: Subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{formatDate(subscription.startDate)}</TableCell>
                      <TableCell>{formatDate(subscription.endDate)}</TableCell>
                      <TableCell>{formatCurrency(subscription.annualFee)}</TableCell>
                      <TableCell>
                        <Chip
                          label={subscription.status}
                          color={
                            subscription.status === 'active'
                              ? 'success'
                              : subscription.status === 'grace_period'
                              ? 'warning'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {license.payments && license.payments.length > 0 ? (
                  license.payments.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getPaymentTypeLabel(payment.paymentType, payment.isAnnualSubscription)}
                          color={getPaymentTypeColor(payment.paymentType, payment.isAnnualSubscription)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      <ConfirmDialog
        open={revokeDialogOpen}
        title="Revoke License"
        message="Are you sure you want to revoke this license? This action cannot be undone. The license will be marked as revoked, all activations will be deactivated, and the customer will no longer be able to use the license. Existing subscriptions and payments will remain in the system for record-keeping purposes."
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        confirmColor="error"
        onConfirm={handleRevoke}
        onCancel={handleRevokeDialogClose}
      />

      <ConfirmDialog
        open={reactivateDialogOpen}
        title="Reactivate License"
        message="This will deactivate all existing activations for this license, allowing the customer to re-enter their license key. All license data (subscriptions, payments, deadlines) will be preserved. Only activations will be reset. The customer will need to activate the license again in the desktop application. Continue?"
        confirmLabel="Reactivate"
        cancelLabel="Cancel"
        confirmColor="primary"
        onConfirm={handleReactivate}
        onCancel={handleReactivateDialogClose}
      />

    </Box>
  );
};