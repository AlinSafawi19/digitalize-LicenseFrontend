import { TextField, Button, Box, Grid, FormControlLabel, Switch, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memo, useCallback, useMemo } from 'react';
import { licenseFormSchema, LicenseFormData } from '../../utils/validators';
import { CreateLicenseInput, UpdateLicenseInput } from '../../types/license.types';
import { dateToUTCISOString, utcDateStringToDate } from '../../utils/dateUtils';

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
  // Memoize defaultValues to prevent unnecessary form resets
  const defaultValues = useMemo(
    () => {
      // Default dates: start date is today, end date is 1 year from today
      const defaultStartDate = new Date();
      const defaultEndDate = new Date();
      defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
      
      return {
        customerName: initialData?.customerName || '',
        customerEmail: initialData?.customerEmail || '',
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

  // Memoize the form submit handler to prevent recreation on every render
  const onFormSubmit = useCallback(
    async (data: LicenseFormData) => {
      // Convert dates to UTC ISO strings for API
      const submitData: CreateLicenseInput | UpdateLicenseInput = {
        ...data,
        startDate: data.startDate ? dateToUTCISOString(data.startDate) : undefined,
        endDate: data.endDate ? dateToUTCISOString(data.endDate) : undefined,
      };
      await onSubmit(submitData);
    },
    [onSubmit]
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
            name="customerEmail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Customer Email"
                type="text"
                fullWidth
                error={!!errors.customerEmail}
                helperText={errors.customerEmail?.message || "The email address of the customer. This is used for communication and will be used to generate login credentials when the license is activated in the desktop app."}
              />
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