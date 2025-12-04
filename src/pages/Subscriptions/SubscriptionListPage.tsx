import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import { Visibility as ViewIcon, Refresh as RenewIcon } from '@mui/icons-material';
import { useGetSubscriptionsQuery, useRenewSubscriptionMutation } from '../../api/subscriptionApi';
import { DataTable, Column } from '../../components/common/DataTable/DataTable';
import { Subscription } from '../../types/license.types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getDaysRemaining } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../config/routes';
import { PAGINATION } from '../../utils/constants';
import { ConfirmDialog } from '../../components/common/Modals/ConfirmDialog';

// Constants
const ERROR_LOADING_SUBSCRIPTIONS = 'Failed to load subscriptions. Please try again.';
const WARNING_THRESHOLD_DAYS = 30;
const EXPIRED_TEXT = 'Expired';

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'grace_period', label: 'Grace Period' },
];

// Status color map constant to avoid function recreation
const STATUS_COLOR_MAP: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  grace_period: 'warning',
  expired: 'default',
};

// Extract sx props to constants to prevent recreation on every render
const titleTypographySx = { mb: 3 };
const filtersGridSx = { mb: 3 };
const errorBoxSx = { mb: 2 };
const daysRemainingTypographySx = { fontWeight: 400 };
const daysRemainingWarningTypographySx = { fontWeight: 600 };
const actionsBoxSx = { display: 'flex', gap: 1, justifyContent: 'center' };

export const SubscriptionListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION.DEFAULT_LIMIT);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);

  // Memoize query parameters to prevent unnecessary re-renders of the query hook
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter || undefined,
      sortBy: 'endDate',
      sortOrder: 'asc' as const,
    }),
    [page, rowsPerPage, statusFilter]
  );

  const { data, isLoading, error } = useGetSubscriptionsQuery(queryParams);

  const [renewSubscription] = useRenewSubscriptionMutation();

  // Memoize handleRenewClick to prevent recreation on every render
  const handleRenewClick = useCallback((subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
    setRenewDialogOpen(true);
  }, []);

  // Memoize handleRenewConfirm to prevent recreation on every render
  const handleRenewConfirm = useCallback(async () => {
    if (!selectedSubscriptionId) return;

    try {
      await renewSubscription(selectedSubscriptionId).unwrap();
      setRenewDialogOpen(false);
      setSelectedSubscriptionId(null);
    } catch (err) {
      console.error('Failed to renew subscription:', err);
    }
  }, [selectedSubscriptionId, renewSubscription]);

  // Memoize navigation handler to prevent recreation on every render
  const handleViewSubscription = useCallback(
    (id: number) => {
      navigate(routes.subscriptions.view(id));
    },
    [navigate]
  );

  // Memoize filter change handler to prevent recreation on every render
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(e.target.value);
    setPage(0);
  }, []);

  // Memoize handleRowsPerPageChange to prevent recreation on every render
  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  // Memoize dialog close handler to prevent recreation on every render
  const handleRenewDialogClose = useCallback(() => {
    setRenewDialogOpen(false);
    setSelectedSubscriptionId(null);
  }, []);

  // Memoize columns array to prevent recreation on every render
  // This is critical for performance since DataTable uses this array
  const columns: Column<Subscription>[] = useMemo(
    () => [
      {
        id: 'licenseId',
        label: 'License ID',
        minWidth: 100,
        align: 'center',
      },
      {
        id: 'startDate',
        label: 'Start Date',
        minWidth: 120,
        format: (value: unknown) => formatDate(value as string),
      },
      {
        id: 'endDate',
        label: 'End Date',
        minWidth: 120,
        format: (value: unknown) => formatDate(value as string),
      },
      {
        id: 'daysRemaining',
        label: 'Days Remaining',
        minWidth: 120,
        align: 'center',
        format: (_value: unknown, row: Subscription) => {
          const days = getDaysRemaining(row.endDate);
          const isWarning = days <= WARNING_THRESHOLD_DAYS;
          const isExpired = days <= 0;
          return (
            <Typography
              variant="body2"
              color={isWarning ? 'warning.main' : isExpired ? 'error.main' : 'text.primary'}
              sx={isWarning ? daysRemainingWarningTypographySx : daysRemainingTypographySx}
            >
              {days > 0 ? `${days} days` : EXPIRED_TEXT}
            </Typography>
          );
        },
      },
      {
        id: 'annualFee',
        label: 'Annual Fee',
        minWidth: 100,
        align: 'right',
        format: (value: unknown) => formatCurrency(value as number),
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 120,
        align: 'center',
        format: (value: unknown) => {
          const statusValue = value as string;
          const color = STATUS_COLOR_MAP[statusValue] || 'default';
          return <Chip label={statusValue} color={color} size="small" />;
        },
      },
      {
        id: 'actions',
        label: 'Actions',
        minWidth: 150,
        align: 'center',
        format: (_value: unknown, row: Subscription) => (
          <Box sx={actionsBoxSx}>
            <IconButton size="small" onClick={() => handleViewSubscription(row.id)}>
              <ViewIcon fontSize="small" />
            </IconButton>
            {row.status === 'expired' || row.status === 'grace_period' ? (
              <IconButton size="small" color="primary" onClick={() => handleRenewClick(row.id)}>
                <RenewIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Box>
        ),
      },
    ],
    [handleViewSubscription, handleRenewClick]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={titleTypographySx}>
        Subscriptions
      </Typography>

      <Grid container spacing={2} sx={filtersGridSx}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Status"
            value={statusFilter}
            onChange={handleStatusChange}
            variant="outlined"
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {error && (
        <Box sx={errorBoxSx}>
          <Typography color="error">{ERROR_LOADING_SUBSCRIPTIONS}</Typography>
        </Box>
      )}

      <DataTable
        columns={columns}
        rows={data?.subscriptions || []}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={data?.pagination.totalItems || 0}
        onPageChange={setPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={isLoading}
        emptyMessage="No subscriptions found"
      />

      <ConfirmDialog
        open={renewDialogOpen}
        title="Renew Subscription"
        message="Are you sure you want to renew this subscription? This will extend the subscription for another year."
        confirmLabel="Renew"
        cancelLabel="Cancel"
        confirmColor="primary"
        onConfirm={handleRenewConfirm}
        onCancel={handleRenewDialogClose}
      />
    </Box>
  );
};