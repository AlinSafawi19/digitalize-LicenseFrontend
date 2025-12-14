import { TextField, Button, Box, Grid, FormControlLabel, Switch, Typography, Alert, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memo, useCallback, useMemo, useState } from 'react';
import { licenseFormSchema, LicenseFormData } from '../../utils/validators';
import { CreateLicenseInput, UpdateLicenseInput } from '../../types/license.types';
import { dateToUTCISOString, utcDateStringToDate } from '../../utils/dateUtils';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useSendOTPMutation, useVerifyOTPMutation } from '../../api/phoneVerificationApi';
import { CheckCircle } from '@mui/icons-material';

interface LicenseFormProps {
  initialData?: Partial<LicenseFormData>;
  onSubmit: (data: CreateLicenseInput | UpdateLicenseInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

// Extract sx props to constants to prevent recreation on every render
const submitBoxSx = { display: 'flex', gap: 1, justifyContent: 'flex-end' };
const switchTypographySx = { mt: 1, ml: 4 };

function LicenseFormComponent({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Submit',
}: LicenseFormProps) {
  // Phone verification state
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendOTP, { isLoading: isSendingOTP }] = useSendOTPMutation();
  const [verifyOTP, { isLoading: isVerifyingOTP }] = useVerifyOTPMutation();

  // Memoize defaultValues to prevent unnecessary form resets
  const defaultValues = useMemo(
    () => {
      // Default dates: start date is today, end date is 1 year from today
      const defaultStartDate = new Date();
      const defaultEndDate = new Date();
      defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
      
      return {
        customerName: initialData?.customerName || '',
        customerPhone: initialData?.customerPhone || '',
        initialPrice: initialData?.initialPrice || 350,
        annualPrice: initialData?.annualPrice || 50,
        pricePerUser: initialData?.pricePerUser || 25,
        locationName: initialData?.locationName || '',
        locationAddress: initialData?.locationAddress || '',
        isFreeTrial: initialData?.isFreeTrial || false,
        startDate: initialData?.startDate 
          ? (initialData.startDate instanceof Date ? initialData.startDate : utcDateStringToDate(initialData.startDate as string) || defaultStartDate)
          : defaultStartDate,
        endDate: initialData?.endDate
          ? (initialData.endDate instanceof Date ? initialData.endDate : utcDateStringToDate(initialData.endDate as string) || defaultEndDate)
          : defaultEndDate,
      };
    },
    [initialData]
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LicenseFormData>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues,
  });

  // Watch startDate to use as minDate for endDate
  const startDateValue = watch('startDate');
  const customerPhone = watch('customerPhone');

  // Handle send OTP
  const handleSendOTP = useCallback(async () => {
    if (!customerPhone) return;
    
    try {
      await sendOTP({ phone: customerPhone }).unwrap();
      setOtpSent(true);
    } catch (error: unknown) {
      console.error('Failed to send OTP:', error);
    }
  }, [customerPhone, sendOTP]);

  // Handle verify OTP
  const handleVerifyOTP = useCallback(async () => {
    if (!customerPhone || !otpCode || otpCode.length !== 6) return;
    
    try {
      const result = await verifyOTP({ phone: customerPhone, otpCode }).unwrap();
      setVerificationToken(result.verificationToken);
      setPhoneVerified(true);
    } catch (error: unknown) {
      console.error('Failed to verify OTP:', error);
    }
  }, [customerPhone, otpCode, verifyOTP]);

  // Reset verification when phone changes
  const handlePhoneChange = useCallback((_value: string | undefined) => {
    setOtpSent(false);
    setOtpCode('');
    setPhoneVerified(false);
    setVerificationToken(null);
  }, []);

  // Memoize the form submit handler to prevent recreation on every render
  const onFormSubmit = useCallback(
    async (data: LicenseFormData) => {
      // Convert dates to UTC ISO strings for API
      const submitData: CreateLicenseInput | UpdateLicenseInput = {
        ...data,
        verificationToken: verificationToken || undefined, // Include verification token if available
        startDate: data.startDate ? dateToUTCISOString(data.startDate) : undefined,
        endDate: data.endDate ? dateToUTCISOString(data.endDate) : undefined,
      };
      await onSubmit(submitData);
    },
    [onSubmit, verificationToken]
  );

  // Memoize the number field onChange handler to prevent recreation
  const handleNumberChange = useCallback(
    (fieldOnChange: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const numValue = target.valueAsNumber;
      if (!isNaN(numValue)) {
        fieldOnChange(numValue);
      } else if (target.value === '') {
        fieldOnChange(0);
      }
    },
    []
  );

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Controller
            name="customerName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Customer Name"
                fullWidth
                error={!!errors.customerName}
                helperText={errors.customerName?.message || "The name of the customer who will use this license. This is used for identification and communication purposes."}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="customerPhone"
            control={control}
            render={({ field }) => (
              <Box>
                  <PhoneInput
                    international
                    defaultCountry="LB"
                    value={field.value}
                    onChange={(value) => {
                      handlePhoneChange(value);
                      field.onChange(value);
                    }}
                    className="mui-phone-input"
                    style={{
                      '--PhoneInputInput-height': '56px',
                      '--PhoneInputInput-fontSize': '16px',
                    } as React.CSSProperties}
                  />
                {errors.customerPhone && (
                  <Typography variant="caption" sx={{ color: 'error.main', fontSize: '12px', mt: 0.5, display: 'block' }}>
                    {errors.customerPhone.message}
                  </Typography>
                )}
                {!errors.customerPhone && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px', mt: 0.5, display: 'block' }}>
                    The phone number of the customer. This is used for communication via WhatsApp and will be used to send login credentials when the license is activated in the desktop app.
                  </Typography>
                )}
                
                {/* Phone Verification Section */}
                {field.value && (
                  <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                    {!phoneVerified ? (
                      <>
                        {!otpSent ? (
                          <Box>
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                              Verify the phone number to ensure it's valid. We'll send a verification code via WhatsApp.
                            </Typography>
                            <Button
                              type="button"
                              variant="outlined"
                              onClick={handleSendOTP}
                              disabled={isSendingOTP || !field.value}
                              startIcon={isSendingOTP ? <CircularProgress size={16} /> : null}
                            >
                              {isSendingOTP ? 'Sending...' : 'Send Verification Code'}
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                              Enter the 6-digit verification code sent to the phone number via WhatsApp.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                              <TextField
                                value={otpCode}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setOtpCode(value);
                                }}
                                placeholder="000000"
                                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '18px', fontFamily: 'monospace' } }}
                                sx={{ flex: 1 }}
                              />
                              <Button
                                type="button"
                                variant="contained"
                                onClick={handleVerifyOTP}
                                disabled={isVerifyingOTP || otpCode.length !== 6}
                                startIcon={isVerifyingOTP ? <CircularProgress size={16} /> : null}
                              >
                                Verify
                              </Button>
                            </Box>
                            <Button
                              type="button"
                              variant="text"
                              size="small"
                              onClick={() => {
                                setOtpSent(false);
                                setOtpCode('');
                              }}
                            >
                              Resend Code
                            </Button>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Alert severity="success" icon={<CheckCircle />}>
                        Phone number verified successfully
                      </Alert>
                    )}
                  </Box>
                )}
                <style>{`
                  .mui-phone-input {
                    width: 100%;
                  }
                  .mui-phone-input .PhoneInputInput {
                    width: 100%;
                    height: 56px;
                    padding: 16px 14px;
                    font-size: 16px;
                    border: 1px solid ${errors.customerPhone ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)'};
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
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="locationName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Branch/Location Name"
                fullWidth
                error={!!errors.locationName}
                helperText={errors.locationName?.message || 'Each branch/location requires a separate license. Customers can have multiple licenses for different branches.'}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="initialPrice"
            control={control}
            render={({ field }) => (
              <TextField
                label="Initial Price"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                error={!!errors.initialPrice}
                helperText={errors.initialPrice?.message || "The one-time initial purchase price for the license. This is the amount paid when the license is first purchased. An initial payment record will be created automatically unless this is a free trial."}
                value={field.value ?? 350}
                onChange={handleNumberChange(field.onChange)}
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="annualPrice"
            control={control}
            render={({ field }) => (
              <TextField
                label="Annual Price"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                error={!!errors.annualPrice}
                helperText={errors.annualPrice?.message || "The annual subscription fee that the customer will pay each year to renew the license. This creates an annual subscription period when the initial payment is made."}
                value={field.value ?? 50}
                onChange={handleNumberChange(field.onChange)}
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="pricePerUser"
            control={control}
            render={({ field }) => (
              <TextField
                label="Price Per User"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                error={!!errors.pricePerUser}
                helperText={errors.pricePerUser?.message || 'Additional cost per user beyond the default 2 users'}
                value={field.value ?? 25}
                onChange={handleNumberChange(field.onChange)}
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="locationAddress"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Branch/Location Address"
                fullWidth
                multiline
                rows={3}
                error={!!errors.locationAddress}
                helperText={errors.locationAddress?.message || "The physical address of the branch or location where this license will be used. This helps identify the location of the business."}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Start Date"
                value={field.value || null}
                onChange={(newValue) => field.onChange(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate?.message || "The start date of the license. Defaults to today if not specified. Dates are in Asia/Beirut timezone.",
                  },
                }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="End Date"
                value={field.value || null}
                onChange={(newValue) => field.onChange(newValue)}
                minDate={startDateValue || defaultValues.startDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.endDate,
                    helperText: errors.endDate?.message || "The end date of the license. Defaults to 1 year from start date if not specified. Dates are in Asia/Beirut timezone.",
                  },
                }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="isFreeTrial"
            control={control}
            render={({ field }) => (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value || false}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  }
                  label="Free Trial License"
                />
                <Typography variant="body2" color="text.secondary" sx={switchTypographySx}>
                  Enable this to create a free trial license. The initial price will still be set, but no payment will be created automatically. Free trial licenses allow customers to test the software before making a purchase. The license will work normally but won't have an initial payment record.
                </Typography>
              </Box>
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={submitBoxSx}>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? 'Submitting...' : submitLabel}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// Note: The onSubmit prop should be memoized in parent components for best performance
export const LicenseForm = memo(LicenseFormComponent);