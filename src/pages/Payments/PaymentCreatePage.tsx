import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useCreatePaymentMutation } from '../../api/paymentApi';
import { useLazyGetLicenseByKeyQuery } from '../../api/licenseApi';
import { routes } from '../../config/routes';
import { useToastContext } from '../../components/common/Toast/useToastContext';
import { dateToUTCISOString } from '../../utils/dateUtils';
import moment from 'moment-timezone';
import { License } from '../../types/license.types';
import { getPaymentTypeLabel } from '../../utils/formatters';

// Constants
const DEBOUNCE_DELAY = 500; // milliseconds
const DEFAULT_PRICE_PER_USER = 25;
const SUCCESS_CREATED = 'Payment created successfully';
const ERROR_DEFAULT = 'Failed to create payment. Please try again.';
const LICENSE_NOT_FOUND_MESSAGE = 'License not found. Please check the license key and try again.';
const ERROR_LICENSE_KEY_REQUIRED = 'License key is required';
const ERROR_LICENSE_NOT_FOUND = 'License not found. Please enter a valid license key.';
const ERROR_PAYMENT_TYPE_REQUIRED = 'Payment type is required';
const ERROR_USER_QUANTITY_INVALID = 'Quantity of users must be greater than 0';
const ERROR_AMOUNT_INVALID = 'Amount must be greater than 0';
const ERROR_PAYMENT_DATE_INVALID = 'Invalid payment date';

// Extract sx props to constants to prevent recreation on every render
const headerBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 3 };
const paperSx = { p: 3 };
const licenseCardSx = { mt: 2, bgcolor: 'background.default' };
const licenseCardHeaderBoxSx = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 };
const bodyTypographySx = { fontWeight: 'medium' };
const paymentHistoryBoxSx = { mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 };
const errorTypographySx = { mt: 1 };
const buttonsBoxSx = { display: 'flex', gap: 2, justifyContent: 'flex-end' };
const errorCaptionSx = { mt: 0.5, ml: 1.75 };
const helperTextTypographySx = { mt: 1 };
const paymentHistoryLabelSx = { mb: 1 };

export const PaymentCreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [searchParams] = useSearchParams();
  const [createPayment, { isLoading }] = useCreatePaymentMutation();

  // Get license key from URL params if present
  const initialLicenseKey = searchParams.get('licenseKey') || '';

  // Form state
  const [licenseKey, setLicenseKey] = useState<string>(initialLicenseKey);
  const [licenseData, setLicenseData] = useState<License | null>(null);
  const [amount, setAmount] = useState<string>('');
  // Initialize payment date to today in Beirut timezone
  const [paymentDate, setPaymentDate] = useState<Date | null>(
    moment.tz('Asia/Beirut').startOf('day').toDate()
  );
  const [paymentType, setPaymentType] = useState<'initial' | 'annual' | 'user' | ''>('');
  const [userQuantity, setUserQuantity] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lazy query for fetching license by key
  const [fetchLicenseByKey, { isLoading: isLoadingLicense }] = useLazyGetLicenseByKeyQuery();

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLicenseKeyChange = useCallback((value: string) => {
    setLicenseKey(value);
    setLicenseData(null);
    setErrors((prev) => ({ ...prev, licenseKey: '' }));

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
        const result = await fetchLicenseByKey(value.trim()).unwrap();
        setLicenseData(result);
      } catch (err: unknown) {
        // License not found or error
        setLicenseData(null);
        const error = err as { status?: number };
        if (error?.status !== 404) {
          // Only show error if it's not a "not found" error
          console.error('Error fetching license:', err);
        }
      }
    }, DEBOUNCE_DELAY);
  }, [fetchLicenseByKey]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Auto-fetch license when component mounts with initial license key from URL
  useEffect(() => {
    if (initialLicenseKey.trim()) {
      // Fetch immediately without debounce when license key comes from URL
      const fetchInitialLicense = async () => {
        try {
          const result = await fetchLicenseByKey(initialLicenseKey.trim()).unwrap();
          setLicenseData(result);
        } catch (err: unknown) {
          // License not found or error
          setLicenseData(null);
          const error = err as { status?: number };
          if (error?.status !== 404) {
            // Only show error if it's not a "not found" error
            console.error('Error fetching license:', err);
          }
        }
      };
      fetchInitialLicense();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Update payment type when license data changes
  useEffect(() => {
    if (licenseData) {
      const hasInitialPayment = licenseData.payments?.some(p => !p.isAnnualSubscription) || false;
      const isFreeTrial = licenseData.isFreeTrial || false;
      const isExpired = licenseData.status === 'expired';

      // Set default payment type based on license status
      if (isFreeTrial && !hasInitialPayment) {
        // Free trial without initial payment - only initial payment available
        setPaymentType('initial');
      } else if (!isFreeTrial && hasInitialPayment && !isExpired) {
        // Paid license with initial payment and not expired - default to annual
        setPaymentType('annual');
      } else if (!isFreeTrial && !hasInitialPayment) {
        // Paid license without initial payment - default to initial
        setPaymentType('initial');
      } else {
        setPaymentType('');
      }
    } else {
      setPaymentType('');
    }
  }, [licenseData]);

  // Auto-fill amount based on payment type - resets when payment type changes
  useEffect(() => {
    if (!licenseData) {
      setAmount('');
      return;
    }

    if (paymentType === 'initial') {
      // Auto-fill with initial price
      const initialPrice = Number(licenseData.initialPrice) || 0;
      setAmount(initialPrice.toFixed(2));
    } else if (paymentType === 'annual') {
      // Auto-fill with annual fee from subscription
      const activeSubscription = licenseData.subscriptions?.find(sub => sub.status === 'active');
      if (activeSubscription) {
        const annualFee = Number(activeSubscription.annualFee) || 0;
        setAmount(annualFee.toFixed(2));
      } else {
        // If no active subscription, try to get from the first subscription
        const firstSubscription = licenseData.subscriptions?.[0];
        if (firstSubscription) {
          const annualFee = Number(firstSubscription.annualFee) || 0;
          setAmount(annualFee.toFixed(2));
        } else {
          setAmount('');
        }
      }
    } else if (paymentType === 'user') {
      // Set default user quantity to 1 if empty
      if (!userQuantity) {
        setUserQuantity('1');
      }
      // Auto-calculate amount when user payment type is selected
      const quantity = userQuantity ? parseInt(userQuantity, 10) : 1;
      if (!isNaN(quantity) && quantity > 0) {
        const calculatedAmount = (Number(licenseData.pricePerUser) || DEFAULT_PRICE_PER_USER) * quantity;
        setAmount(calculatedAmount.toFixed(2));
      } else {
        // If invalid quantity, calculate with default of 1
        const calculatedAmount = (Number(licenseData.pricePerUser) || DEFAULT_PRICE_PER_USER) * 1;
        setAmount(calculatedAmount.toFixed(2));
      }
    } else if (paymentType === '') {
      // Clear amount if no payment type selected
      setAmount('');
    }
  }, [paymentType, userQuantity, licenseData]);

  // Memoize validateForm to prevent recreation on every render
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!licenseKey.trim()) {
      newErrors.licenseKey = ERROR_LICENSE_KEY_REQUIRED;
    } else if (!licenseData) {
      newErrors.licenseKey = ERROR_LICENSE_NOT_FOUND;
    }

    if (!paymentType) {
      newErrors.paymentType = ERROR_PAYMENT_TYPE_REQUIRED;
    }

    if (paymentType === 'user') {
      if (!userQuantity || parseInt(userQuantity, 10) <= 0) {
        newErrors.userQuantity = ERROR_USER_QUANTITY_INVALID;
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = ERROR_AMOUNT_INVALID;
    }

    if (paymentDate && isNaN(paymentDate.getTime())) {
      newErrors.paymentDate = ERROR_PAYMENT_DATE_INVALID;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [licenseKey, licenseData, paymentType, userQuantity, amount, paymentDate]);

  // Memoize handleSubmit to prevent recreation on every render
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm() || !licenseData) {
        return;
      }

      try {
        await createPayment({
          licenseId: licenseData.id,
          amount: parseFloat(amount),
          paymentDate: dateToUTCISOString(paymentDate),
          isAnnualSubscription: paymentType === 'annual',
          paymentType: paymentType || undefined,
          additionalUsers:
            paymentType === 'user' ? (userQuantity.trim() ? parseInt(userQuantity, 10) : undefined) : undefined,
        }).unwrap();

        showToast(SUCCESS_CREATED, 'success');
        navigate(routes.payments.list);
      } catch (err: unknown) {
        const error = err as { data?: { message?: string }; message?: string };
        const errorMessage = error?.data?.message || error?.message || ERROR_DEFAULT;
        showToast(errorMessage, 'error');
      }
    },
    [validateForm, licenseData, amount, paymentDate, paymentType, userQuantity, createPayment, showToast, navigate]
  );

  // Memoize navigation handlers to prevent recreation on every render
  const handleBack = useCallback(() => {
    navigate(routes.payments.list);
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate(routes.payments.list);
  }, [navigate]);

  // Memoize onChange handlers to prevent recreation on every render
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(e.target.value);
      if (errors.amount) {
        setErrors((prev) => ({ ...prev, amount: '' }));
      }
    },
    [errors.amount]
  );

  const handlePaymentDateChange = useCallback(
    (newValue: Date | null) => {
      setPaymentDate(newValue);
      if (errors.paymentDate) {
        setErrors((prev) => ({ ...prev, paymentDate: '' }));
      }
    },
    [errors.paymentDate]
  );

  const handleUserQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserQuantity(e.target.value);
      if (errors.userQuantity) {
        setErrors((prev) => ({ ...prev, userQuantity: '' }));
      }
    },
    [errors.userQuantity]
  );

  const handlePaymentTypeChange = useCallback(
    (e: { target: { value: unknown } }) => {
      const value = e.target.value as 'initial' | 'annual' | 'user' | '';
      setPaymentType(value);
      // Set default user quantity to 1 when switching to user payment type
      if (value === 'user') {
        setUserQuantity('1');
      } else {
        // Clear user quantity when switching away from user payment type
        setUserQuantity('');
      }
      // Amount will be auto-filled by useEffect based on payment type
    },
    []
  );

  // Memoize derived values to prevent recalculation on every render
  const hasInitialPayment = useMemo(
    () => licenseData?.payments?.some((p) => !p.isAnnualSubscription) || false,
    [licenseData?.payments]
  );

  const isFreeTrial = useMemo(() => licenseData?.isFreeTrial || false, [licenseData?.isFreeTrial]);

  const isExpired = useMemo(() => licenseData?.status === 'expired', [licenseData?.status]);

  const initialPayment = useMemo(
    () => licenseData?.payments?.find((p) => !p.isAnnualSubscription),
    [licenseData?.payments]
  );

  const annualPayments = useMemo(
    () => licenseData?.payments?.filter((p) => p.isAnnualSubscription) || [],
    [licenseData?.payments]
  );

  const latestAnnualPayment = useMemo(
    () => (annualPayments.length > 0 ? annualPayments[0] : null),
    [annualPayments]
  );

  // Memoize payment type options to prevent recreation on every render
  const paymentTypeOptions = useMemo(() => {
    if (!licenseData) {
      return (
        <MenuItem value="" disabled>
          Enter a license key first
        </MenuItem>
      );
    }

    const options = [];

    // Show initial payment option only if license doesn't have one yet
    if (!hasInitialPayment) {
      options.push(
        <MenuItem key="initial" value="initial">
          Initial Payment
        </MenuItem>
      );
    }

    // Show annual payment option only if license is not in free trial
    if (!isFreeTrial) {
      options.push(
        <MenuItem key="annual" value="annual">
          Annual Subscription Payment
        </MenuItem>
      );
    }

    // Show user payment option only if initial payment is paid and license is not expired
    if (hasInitialPayment && !isExpired) {
      options.push(
        <MenuItem key="user" value="user">
          User Payment
        </MenuItem>
      );
    }

    return options.length > 0 ? (
      options
    ) : (
      <MenuItem value="" disabled>
        No payment options available for this license
      </MenuItem>
    );
  }, [licenseData, hasInitialPayment, isFreeTrial, isExpired]);

  // Memoize status chip color to prevent recalculation
  const statusChipColor = useMemo(() => {
    if (!licenseData) return 'default';
    if (licenseData.status === 'active') return 'success';
    if (licenseData.status === 'expired' || licenseData.status === 'revoked') return 'error';
    return 'warning';
  }, [licenseData]);

  // Memoize user limit calculation for helper text
  const userLimitInfo = useMemo(() => {
    if (!licenseData || !userQuantity || isNaN(parseInt(userQuantity, 10)) || parseInt(userQuantity, 10) <= 0) {
      return null;
    }
    const quantity = parseInt(userQuantity, 10);
    const newLimit = licenseData.userLimit + quantity;
    const calculatedAmount = (Number(licenseData.pricePerUser) || DEFAULT_PRICE_PER_USER) * quantity;
    return {
      newLimit,
      calculatedAmount: calculatedAmount.toFixed(2),
    };
  }, [licenseData, userQuantity]);

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <IconButton onClick={handleBack}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Create Payment</Typography>
      </Box>

      <Paper sx={paperSx}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
                  <TextField
                fullWidth
                label="License Key"
                value={licenseKey}
                onChange={(e) => handleLicenseKeyChange(e.target.value)}
                error={!!errors.licenseKey}
                helperText={errors.licenseKey || 'Enter the license key to associate with this payment. The system will automatically fetch license information and suggest appropriate payment types and amounts.'}
                placeholder="Enter license key (e.g., ABCD-1234-EFGH-5678)"
                InputProps={{
                  endAdornment: isLoadingLicense ? <CircularProgress size={20} /> : null,
                }}
              />
              
              {/* Display license information */}
              {licenseData && (
                <Card sx={licenseCardSx}>
                  <CardContent>
                    <Box sx={licenseCardHeaderBoxSx}>
                      <Typography variant="h6">License Information</Typography>
                      <Chip label={licenseData.status} color={statusChipColor} size="small" />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          License Key
                        </Typography>
                        <Typography variant="body1" sx={bodyTypographySx}>
                          {licenseData.licenseKey}
                        </Typography>
                      </Grid>
                      {licenseData.customerName && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Customer Name
                          </Typography>
                          <Typography variant="body1" sx={bodyTypographySx}>
                            {licenseData.customerName}
                          </Typography>
                        </Grid>
                      )}
                      {licenseData.customerEmail && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Customer Email
                          </Typography>
                          <Typography variant="body1" sx={bodyTypographySx}>
                            {licenseData.customerEmail}
                          </Typography>
                        </Grid>
                      )}
                      {licenseData.locationName && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Location
                          </Typography>
                          <Typography variant="body1" sx={bodyTypographySx}>
                            {licenseData.locationName}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Free Trial
                        </Typography>
                        <Typography variant="body1" sx={bodyTypographySx}>
                          {licenseData.isFreeTrial ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      {licenseData.subscriptions && licenseData.subscriptions.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Subscription Status
                          </Typography>
                          <Typography variant="body1" sx={bodyTypographySx}>
                            {licenseData.subscriptions[0].status}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Initial Price
                        </Typography>
                        <Typography variant="body1" sx={bodyTypographySx}>
                          ${(Number(licenseData.initialPrice) || 0).toFixed(2)}
                        </Typography>
                      </Grid>
                      {initialPayment && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Initial Payment
                          </Typography>
                          <Typography variant="body1" sx={bodyTypographySx}>
                            ${(Number(initialPayment.amount) || 0).toFixed(2)} (
                            {new Date(initialPayment.paymentDate).toLocaleDateString()})
                          </Typography>
                        </Grid>
                      )}
                      {licenseData.subscriptions && licenseData.subscriptions.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Annual Fee
                          </Typography>
                          <Typography variant="body1" sx={bodyTypographySx}>
                            ${(Number(licenseData.subscriptions[0].annualFee) || 0).toFixed(2)}
                          </Typography>
                        </Grid>
                      )}
                      {latestAnnualPayment && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Latest Annual Payment
                          </Typography>
                          <Typography variant="body1" sx={bodyTypographySx}>
                            ${(Number(latestAnnualPayment.amount) || 0).toFixed(2)} (
                            {new Date(latestAnnualPayment.paymentDate).toLocaleDateString()})
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Price Per User
                        </Typography>
                        <Typography variant="body1" sx={bodyTypographySx}>
                          ${(Number(licenseData.pricePerUser) || DEFAULT_PRICE_PER_USER).toFixed(2)}
                        </Typography>
                      </Grid>
                      {licenseData.payments && licenseData.payments.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" sx={paymentHistoryLabelSx}>
                            Payment History
                          </Typography>
                          {licenseData.payments.map((payment) => (
                            <Box key={payment.id} sx={paymentHistoryBoxSx}>
                              <Typography variant="body2">
                                {getPaymentTypeLabel(payment.paymentType, payment.isAnnualSubscription)} Payment: $
                                {(Number(payment.amount) || 0).toFixed(2)} -{' '}
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ))}
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              )}
              
              {licenseKey.trim() && !licenseData && !isLoadingLicense && (
                <Typography variant="body2" color="error" sx={errorTypographySx}>
                  {LICENSE_NOT_FOUND_MESSAGE}
                </Typography>
              )}
            </Grid>

            {/* Hide form fields until license is found */}
            {licenseData && (
              <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                value={amount}
                onChange={handleAmountChange}
                error={!!errors.amount}
                helperText={errors.amount || (paymentType === 'user' ? 'Amount is auto-calculated from price per user × quantity, but can be manually adjusted. This payment will increase the user limit by the specified quantity.' : paymentType === 'initial' ? 'Enter the initial payment amount. This payment activates the license and creates the first subscription period.' : paymentType === 'annual' ? 'Enter the annual subscription payment amount. This payment extends the subscription period by one year from the payment date.' : 'Enter the payment amount')}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Payment Date"
                value={paymentDate}
                onChange={handlePaymentDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.paymentDate,
                    helperText: errors.paymentDate || 'Date will be stored in UTC, displayed in Asia/Beirut timezone. This date is used to track when the payment was made and affects subscription periods.',
                  },
                }}
              />
            </Grid>

            {paymentType === 'user' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Additional Users"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  value={userQuantity}
                  onChange={handleUserQuantityChange}
                  error={!!errors.userQuantity}
                  helperText={
                    errors.userQuantity ||
                    (userLimitInfo
                      ? `User limit will increase from ${licenseData?.userLimit} to ${userLimitInfo.newLimit}. Amount: $${userLimitInfo.calculatedAmount}. This payment will automatically increase the user limit when created.`
                      : 'Enter the number of additional users to add. The user limit will be increased automatically when this payment is created.')
                  }
                  required
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Type</InputLabel>
                <Select
                  value={paymentType}
                  label="Payment Type"
                  onChange={handlePaymentTypeChange}
                  error={!!errors.paymentType}
                  disabled={!licenseData}
                >
                  {paymentTypeOptions}
                </Select>
                {errors.paymentType && (
                  <Typography variant="caption" color="error" sx={errorCaptionSx}>
                    {errors.paymentType}
                  </Typography>
                )}
              <Typography variant="body2" color="text.secondary" sx={helperTextTypographySx}>
                  {paymentType === 'annual'
                  ? 'This payment is for an annual subscription renewal. It will extend the subscription period by one year from the payment date. The license will remain active during the extended period.'
                    : paymentType === 'initial'
                    ? 'This payment is for the initial license purchase. It activates the license and creates the first subscription period starting from the payment date. The license status will change to active.'
                    : paymentType === 'user'
                    ? 'This payment is for increasing the user limit. The user limit will be increased by the specified quantity immediately when the payment is created. The amount is calculated as price per user × quantity.'
                    : licenseData
                    ? 'Select a payment type. The available types depend on the license status and existing payments.'
                    : 'Enter a license key to see available payment types'}
              </Typography>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={buttonsBoxSx}>
                <Button variant="outlined" onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </Button>
                <Tooltip title="Create the payment record. This will record the payment, update the license status if needed, extend subscriptions for annual payments, and increase user limits for user payments.">
                  <span>
                    <Button type="submit" variant="contained" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Payment'}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Grid>
            </>
            )}
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};