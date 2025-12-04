import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert, IconButton } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { LicenseForm } from '../../components/license/LicenseForm';
import { useGetLicenseByIdQuery, useUpdateLicenseMutation } from '../../api/licenseApi';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';
import { ErrorMessage } from '../../components/common/Error/ErrorMessage';
import { UpdateLicenseInput } from '../../types/license.types';
import { routes } from '../../config/routes';

// Constants
const REDIRECT_DELAY = 1500; // 1.5 seconds
const DEFAULT_ANNUAL_PRICE = 50;
const ERROR_DEFAULT = 'Failed to update license. Please try again.';

// Extract sx props to constants to prevent recreation on every render
const headerBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 };
const alertSx = { mb: 2.5 };
const alertListSx = { mt: 1, mb: 1, pl: 2.5 };
const paperSx = { p: 1.5 };

export const LicenseEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize licenseId to avoid repeated Number(id!) calls
  const licenseId = useMemo(() => (id ? Number(id) : null), [id]);

  const { data: license, isLoading, error: fetchError } = useGetLicenseByIdQuery(licenseId!);
  const [updateLicense, { isLoading: isUpdating }] = useUpdateLicenseMutation();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // Memoize handleSubmit to prevent recreation on every render
  const handleSubmit = useCallback(
    async (data: UpdateLicenseInput) => {
      if (!licenseId) return;

      // Clear any existing timeout
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }

      try {
        setError(null);
        await updateLicense({ id: licenseId, data }).unwrap();
        setSuccess(true);
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(routes.licenses.view(licenseId));
          redirectTimeoutRef.current = null;
        }, REDIRECT_DELAY);
      } catch (err: unknown) {
        const error = err as { data?: { message?: string } };
        setError(error?.data?.message || ERROR_DEFAULT);
      }
    },
    [licenseId, updateLicense, navigate]
  );

  // Memoize navigation handlers to prevent recreation on every render
  const handleBack = useCallback(() => {
    if (licenseId) {
      navigate(routes.licenses.view(licenseId));
    }
  }, [navigate, licenseId]);

  // Memoize error close handler to prevent recreation on every render
  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  // Memoize initialData to prevent recreation on every render
  // This is important since LicenseForm memoizes defaultValues based on initialData
  // Must be before early returns to follow rules of hooks
  const initialData = useMemo(
    () => ({
      customerName: license?.customerName || '',
      customerEmail: license?.customerEmail || '',
      initialPrice: license ? Number(license.initialPrice) : 0,
      annualPrice:
        license?.subscriptions && license.subscriptions.length > 0
          ? Number(license.subscriptions[0].annualFee)
          : DEFAULT_ANNUAL_PRICE,
      locationName: license?.locationName || '',
      locationAddress: license?.locationAddress || '',
    }),
    [license]
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (fetchError || !license) {
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
        <IconButton onClick={handleBack} size="small">
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Edit License</Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={alertSx}>
          License updated successfully! Redirecting...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={alertSx} onClose={handleErrorClose}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={alertSx}>
        <Typography variant="body2" component="div">
          <strong>What happens when you update a license:</strong>
          <Box component="ul" sx={alertListSx}>
            <li>Customer information (name, email) will be updated</li>
            <li>Location information (name, address) will be updated</li>
            <li>Pricing information (initial price, annual price, price per user) will be updated</li>
            <li>
              <strong>Note:</strong> Existing subscriptions and payments are not affected by these changes
            </li>
            <li>New subscriptions will use the updated annual price</li>
            <li>New user limit increases will use the updated price per user</li>
          </Box>
        </Typography>
      </Alert>

      <Paper sx={paperSx}>
        <LicenseForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={isUpdating}
          submitLabel="Update License"
        />
      </Paper>
    </Box>
  );
};