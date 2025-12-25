import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Button,
  Paper,
} from '@mui/material';
import { Visibility as ViewIcon, FileDownload as ExportIcon, Add as AddIcon, AttachMoney as MoneyIcon } from '@mui/icons-material';
import { SingleInputDateRangeField } from '@mui/x-date-pickers-pro/SingleInputDateRangeField';
import { useGetPaymentsQuery, useLazyExportPaymentsCSVQuery } from '../../api/paymentApi';
import { DataTable, Column } from '../../components/common/DataTable/DataTable';
import { Payment } from '../../types/license.types';
import { formatDate, formatCurrency, getPaymentTypeLabel, getPaymentTypeColor } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../config/routes';
import { PAGINATION } from '../../utils/constants';
import type { DateRange } from '@mui/x-date-pickers-pro/models';
import { useToastContext } from '../../components/common/Toast/useToastContext';
import { dateToUTCDateString } from '../../utils/dateUtils';

// Constants
const DEBOUNCE_DELAY = 500; // milliseconds
const ERROR_EXPORT_FAILED = 'Failed to export CSV. Please try again.';
const ERROR_LOADING_PAYMENTS = 'Failed to load payments. Please try again.';

const typeOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'true', label: 'Annual Subscription' },
  { value: 'false', label: 'Initial Purchase' },
];

// Extract sx props to constants to prevent recreation on every render
const headerBoxSx = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 };
const buttonsBoxSx = { display: 'flex', gap: 2 };
const filtersGridSx = { mb: 3 };
const totalAmountBoxSx = { mb: 3 };
const errorBoxSx = { mb: 2 };
const totalAmountCardSx = {
  p: 3,
  bgcolor: 'primary.main',
  color: 'white',
  borderRadius: 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
};
const totalAmountIconSx = {
  fontSize: 40,
  opacity: 0.9,
};
const totalAmountContentSx = {
  flex: 1,
};
const totalAmountLabelSx = {
  fontSize: '0.875rem',
  opacity: 0.9,
  mb: 0.5,
  fontWeight: 500,
};
const totalAmountValueSx = {
  fontSize: '2rem',
  fontWeight: 700,
  lineHeight: 1.2,
};

export const PaymentListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION.DEFAULT_LIMIT);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [licenseIdFilter, setLicenseIdFilter] = useState<string>('');
  const [debouncedLicenseIdFilter, setDebouncedLicenseIdFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange<Date>>([null, null]);

  // Debounce timer ref
  const licenseIdDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce license ID filter - wait DEBOUNCE_DELAY after user stops typing
  useEffect(() => {
    if (licenseIdDebounceTimerRef.current) {
      clearTimeout(licenseIdDebounceTimerRef.current);
    }

    licenseIdDebounceTimerRef.current = setTimeout(() => {
      setDebouncedLicenseIdFilter(licenseIdFilter);
      setPage(0); // Reset to first page when filter changes
    }, DEBOUNCE_DELAY);

    return () => {
      if (licenseIdDebounceTimerRef.current) {
        clearTimeout(licenseIdDebounceTimerRef.current);
      }
    };
  }, [licenseIdFilter]);

  // Memoize date calculations to prevent recalculation on every render
  const startDate = useMemo(() => dateToUTCDateString(dateRange[0]) || '', [dateRange]);
  const endDate = useMemo(() => dateToUTCDateString(dateRange[1]) || '', [dateRange]);

  // Memoize query parameters to prevent unnecessary re-renders of the query hook
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      isAnnualSubscription: typeFilter ? typeFilter === 'true' : undefined,
      licenseId: debouncedLicenseIdFilter ? Number(debouncedLicenseIdFilter) : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy: 'paymentDate',
      sortOrder: 'desc' as const,
    }),
    [page, rowsPerPage, typeFilter, debouncedLicenseIdFilter, startDate, endDate]
  );

  const { data, isLoading, error } = useGetPaymentsQuery(queryParams);

  const [exportCSV] = useLazyExportPaymentsCSVQuery();

  // Memoize handleExportCSV to prevent recreation on every render
  const handleExportCSV = useCallback(async () => {
    try {
      const result = await exportCSV({
        isAnnualSubscription: typeFilter ? typeFilter === 'true' : undefined,
        licenseId: debouncedLicenseIdFilter ? Number(debouncedLicenseIdFilter) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }).unwrap();

      // Create blob and download
      const blob = new Blob([result], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast(ERROR_EXPORT_FAILED, 'error');
    }
  }, [exportCSV, typeFilter, debouncedLicenseIdFilter, startDate, endDate, showToast]);

  // Memoize navigation handler to prevent recreation on every render
  const handleViewPayment = useCallback(
    (id: number) => {
      navigate(routes.payments.view(id));
    },
    [navigate]
  );

  // Memoize license navigation handler to prevent recreation on every render
  const handleViewLicense = useCallback(
    (licenseId: number) => {
      navigate(routes.licenses.view(licenseId));
    },
    [navigate]
  );

  const handleCreatePayment = useCallback(() => {
    navigate(routes.payments.create);
  }, [navigate]);

  // Memoize columns array to prevent recreation on every render
  // This is critical for performance since DataTable uses this array
  const columns: Column<Payment>[] = useMemo(
    () => [
      {
        id: 'licenseId',
        label: 'License ID',
        minWidth: 100,
        align: 'center',
        format: (value: unknown) => {
          const licenseId = typeof value === 'number' ? value : Number(value);
          return (
            <Typography
              variant="body2"
              onClick={(e) => {
                e.stopPropagation();
                handleViewLicense(licenseId);
              }}
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                textDecoration: 'underline',
                '&:hover': {
                  color: 'primary.dark',
                },
              }}
            >
              {licenseId}
            </Typography>
          );
        },
      },
      {
        id: 'amount',
        label: 'Amount',
        minWidth: 120,
        align: 'right',
        format: (value: unknown) => (typeof value === 'number' ? formatCurrency(value) : String(value ?? '')),
      },
      {
        id: 'paymentDate',
        label: 'Payment Date',
        minWidth: 120,
        format: (value: unknown) => (typeof value === 'string' ? formatDate(value) : String(value ?? '')),
      },
      {
        id: 'paymentType',
        label: 'Type',
        minWidth: 120,
        align: 'center',
        format: (value: unknown, row: Payment) => (
          <Chip
            label={getPaymentTypeLabel(value as 'initial' | 'annual' | 'user' | undefined, row.isAnnualSubscription)}
            color={getPaymentTypeColor(value as 'initial' | 'annual' | 'user' | undefined, row.isAnnualSubscription)}
            size="small"
          />
        ),
      },
      {
        id: 'actions',
        label: 'Actions',
        minWidth: 100,
        align: 'center',
        format: (_value: unknown, row: Payment) => (
          <IconButton size="small" onClick={() => handleViewPayment(row.id)}>
            <ViewIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [handleViewPayment, handleViewLicense]
  );

  // Memoize filter change handlers to prevent recreation on every render
  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTypeFilter(e.target.value);
    setPage(0);
  }, []);

  const handleLicenseIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseIdFilter(e.target.value);
    // Page reset is handled by debounce effect
  }, []);

  const handleDateRangeChange = useCallback((newValue: DateRange<Date>) => {
    setDateRange(newValue);
    setPage(0);
  }, []);

  // Memoize handleRowsPerPageChange to prevent recreation on every render
  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <Typography variant="h4">Payments</Typography>
        <Box sx={buttonsBoxSx}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreatePayment}>
            Create Payment
          </Button>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportCSV} disabled={isLoading}>
            Export CSV
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={filtersGridSx}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Type"
            value={typeFilter}
            onChange={handleTypeChange}
            variant="outlined"
          >
            {typeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="License ID"
            type="number"
            value={licenseIdFilter}
            onChange={handleLicenseIdChange}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SingleInputDateRangeField
            value={dateRange}
            onChange={handleDateRangeChange}
            slotProps={{
              textField: {
                label: 'Date Range',
                fullWidth: true,
                variant: 'outlined' as const,
                placeholder: 'Select date range',
                size: 'medium' as const,
              },
            }}
            sx={{ width: '100%', '& .MuiInputBase-root': { height: '56px' } }}
          />
        </Grid>
      </Grid>

      {data?.meta?.totalAmount !== undefined && data?.meta?.totalAmount !== null && (
        <Box sx={totalAmountBoxSx}>
          <Paper elevation={3} sx={totalAmountCardSx}>
            <MoneyIcon sx={totalAmountIconSx} />
            <Box sx={totalAmountContentSx}>
              <Typography variant="body2" sx={totalAmountLabelSx}>
                Total Payment Amount
              </Typography>
              <Typography variant="h4" sx={totalAmountValueSx}>
                {formatCurrency(data.meta.totalAmount)}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {error && (
        <Box sx={errorBoxSx}>
          <Typography color="error">{ERROR_LOADING_PAYMENTS}</Typography>
        </Box>
      )}

      <DataTable
        columns={columns}
        rows={data?.payments || []}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={data?.pagination.totalItems || 0}
        onPageChange={setPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={isLoading}
        emptyMessage="No payments found"
      />
    </Box>
  );
};