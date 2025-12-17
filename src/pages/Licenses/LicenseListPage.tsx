import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  PersonAdd as PersonAddIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useGetLicensesQuery, useRevokeLicenseMutation, useLazyExportLicensesCSVQuery } from '../../api/licenseApi';
import { DataTable, Column } from '../../components/common/DataTable/DataTable';
import { License, LicenseStatus } from '../../types/license.types';
import { LicenseStatusBadge } from '../../components/license/LicenseStatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../config/routes';
import { PAGINATION } from '../../utils/constants';
import { ConfirmDialog } from '../../components/common/Modals/ConfirmDialog';
import { useToastContext } from '../../components/common/Toast/useToastContext';

// Constants
// Performance optimization: Adaptive debounce delay - shorter for better UX while preventing excessive API calls
// For longer queries, use shorter delay (user is actively typing)
// For shorter queries, use longer delay (user might still be typing)
const getDebounceDelay = (queryLength: number): number => {
  if (queryLength >= 5) return 200; // Longer queries: 200ms (user is actively searching)
  if (queryLength >= 3) return 300; // Medium queries: 300ms (default)
  return 400; // Short queries: 400ms (user might still be typing)
};
const DEFAULT_DEBOUNCE_DELAY = 300; // milliseconds (fallback)
const COPIED_TIMEOUT = 2000; // 2 seconds
const SUCCESS_COPIED = 'License key copied to clipboard';
const ERROR_COPY_FAILED = 'Failed to copy license key';
const SUCCESS_REVOKED = 'License revoked successfully';
const ERROR_REVOKE_FAILED = 'Failed to revoke license. Please try again.';
const ERROR_EXPORT_FAILED = 'Failed to export CSV. Please try again.';
const ERROR_LOADING_LICENSES = 'Failed to load licenses. Please try again.';

const statusOptions: { value: LicenseStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'suspended', label: 'Suspended' },
];

// Extract sx props to constants to prevent recreation on every render
const titleBoxSx = { mb: 2.5 };
const titleTypographySx = { mb: 2 };
const buttonsBoxSx = {
  display: 'flex',
  gap: 2,
  flexWrap: 'wrap',
  flexDirection: { xs: 'column', sm: 'row' },
};
const buttonSx = { width: { xs: '100%', sm: 'auto' } };
const filtersGridSx = { mb: 2.5 };
const errorBoxSx = { mb: 2 };
const licenseKeyBoxSx = { display: 'flex', alignItems: 'center', gap: 1 };
const licenseKeyTypographySx = { fontFamily: 'monospace', flexGrow: 1 };
const copyIconButtonSx = { padding: '4px' };
const idTypographySx = { fontFamily: 'monospace' };
const freeTrialChipSx = { fontWeight: 'medium' };
const userCountBoxSx = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 };
const fullChipSx = { height: 20, fontSize: '0.7rem' };
const actionsBoxSx = { display: 'flex', gap: 1, justifyContent: 'center' };

export const LicenseListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION.DEFAULT_LIMIT);
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | ''>('');
  const [freeTrialFilter, setFreeTrialFilter] = useState<'' | 'true' | 'false'>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [licenseToRevoke, setLicenseToRevoke] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce timer ref
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Copy timeout ref
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query - adaptive delay based on query length
  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    // Performance: Use adaptive debounce delay for better UX
    const delay = searchQuery.length > 0 ? getDebounceDelay(searchQuery.length) : DEFAULT_DEBOUNCE_DELAY;

    searchDebounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0); // Reset to first page when search changes
    }, delay);

    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Cleanup copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Memoize query parameters to prevent unnecessary re-renders of the query hook
  // Performance optimization: Set includeRelations=false for list views to reduce payload size by 70-90%
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter || undefined,
      search: debouncedSearchQuery || undefined,
      isFreeTrial: freeTrialFilter ? freeTrialFilter === 'true' : undefined,
      sortBy,
      sortOrder,
      includeRelations: false, // List views only need counts, not full relations
    }),
    [page, rowsPerPage, statusFilter, debouncedSearchQuery, freeTrialFilter, sortBy, sortOrder]
  );

  const { data, isLoading, error } = useGetLicensesQuery(queryParams);

  const [revokeLicense] = useRevokeLicenseMutation();
  const [exportCSV] = useLazyExportLicensesCSVQuery();

  // Memoize handleRevokeClick to prevent recreation on every render
  const handleRevokeClick = useCallback((id: number) => {
    setLicenseToRevoke(id);
    setRevokeDialogOpen(true);
  }, []);

  // Memoize handleRevokeConfirm to prevent recreation on every render
  const handleRevokeConfirm = useCallback(async () => {
    if (licenseToRevoke === null) return;

    try {
      await revokeLicense(licenseToRevoke).unwrap();
      showToast(SUCCESS_REVOKED, 'success');
      setRevokeDialogOpen(false);
      setLicenseToRevoke(null);
    } catch (err) {
      console.error('Failed to revoke license:', err);
      showToast(ERROR_REVOKE_FAILED, 'error');
    }
  }, [licenseToRevoke, revokeLicense, showToast]);

  // Memoize handleRevokeCancel to prevent recreation on every render
  const handleRevokeCancel = useCallback(() => {
    setRevokeDialogOpen(false);
    setLicenseToRevoke(null);
  }, []);

  // Memoize handleIncreaseUserLimitClick to prevent recreation on every render
  const handleIncreaseUserLimitClick = useCallback(
    (license: License) => {
      navigate(`${routes.licenses.increaseUserLimit}?licenseKey=${encodeURIComponent(license.licenseKey)}`);
    },
    [navigate]
  );

  // Memoize handleReactivateClick to prevent recreation on every render
  const handleReactivateClick = useCallback(
    (license: License) => {
      navigate(`${routes.licenses.reactivate}?licenseKey=${encodeURIComponent(license.licenseKey)}`);
    },
    [navigate]
  );

  // Memoize handleCopyLicenseKey to prevent recreation on every render
  const handleCopyLicenseKey = useCallback(
    async (licenseKey: string) => {
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      try {
        await navigator.clipboard.writeText(licenseKey);
        setCopiedKey(licenseKey);
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedKey(null);
          copyTimeoutRef.current = null;
        }, COPIED_TIMEOUT);
        showToast(SUCCESS_COPIED, 'success');
      } catch (err) {
        console.error('Failed to copy license key:', err);
        showToast(ERROR_COPY_FAILED, 'error');
      }
    },
    [showToast]
  );

  // Memoize navigation handlers to prevent recreation on every render
  const handleViewLicense = useCallback(
    (id: number) => {
      navigate(routes.licenses.view(id));
    },
    [navigate]
  );

  const handleEditLicense = useCallback(
    (id: number) => {
      navigate(routes.licenses.edit(id));
    },
    [navigate]
  );

  const handleAddPayment = useCallback(
    (licenseKey: string) => {
      navigate(`${routes.payments.create}?licenseKey=${encodeURIComponent(licenseKey)}`);
    },
    [navigate]
  );

  const handleCreateLicense = useCallback(() => {
    navigate(routes.licenses.create);
  }, [navigate]);

  const handleIncreaseUserLimit = useCallback(() => {
    navigate(routes.licenses.increaseUserLimit);
  }, [navigate]);

  const handleReactivateLicense = useCallback(() => {
    navigate(routes.licenses.reactivate);
  }, [navigate]);

  // Memoize handleExportCSV to prevent recreation on every render
  const handleExportCSV = useCallback(async () => {
    try {
      const result = await exportCSV({
        status: statusFilter || undefined,
        search: debouncedSearchQuery || undefined,
        isFreeTrial: freeTrialFilter ? freeTrialFilter === 'true' : undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      }).unwrap();

      const blob = new Blob([result], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `licenses_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast(ERROR_EXPORT_FAILED, 'error');
    }
  }, [exportCSV, statusFilter, debouncedSearchQuery, freeTrialFilter, sortBy, sortOrder, showToast]);

  // Memoize handleRowsPerPageChange to prevent recreation on every render
  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  // Memoize filter change handlers to prevent recreation on every render
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(e.target.value as LicenseStatus | '');
    setPage(0);
  }, []);

  const handleFreeTrialChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFreeTrialFilter(e.target.value as '' | 'true' | 'false');
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Page reset is handled by debounce effect
  }, []);

  // Performance optimization: Extract format functions to prevent recreation on every render
  // Create license key formatter with current state
  const licenseKeyFormatter = useMemo(
    () => (value: unknown, _row: License) => {
      const licenseKey = String(value);
      const isCopied = copiedKey === licenseKey;
      return (
        <Box sx={licenseKeyBoxSx}>
          <Typography variant="body2" sx={licenseKeyTypographySx}>
            {licenseKey}
          </Typography>
          <Tooltip title="Copy license key to clipboard. The customer needs this key to activate the license in the desktop application.">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLicenseKey(licenseKey);
              }}
              color="primary"
              size="small"
              sx={copyIconButtonSx}
            >
              {isCopied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    [copiedKey, handleCopyLicenseKey]
  );

  // Create actions formatter with current handlers
  const actionsFormatter = useMemo(
    () => (_value: unknown, row: License) => (
      <Box sx={actionsBoxSx}>
        <Tooltip title="View license details including activations, subscriptions, and payment history">
          <IconButton size="small" onClick={() => handleViewLicense(row.id)}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit license information (customer name, phone, location, prices). This does not affect existing subscriptions or payments.">
          <IconButton size="small" onClick={() => handleEditLicense(row.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Increase the user limit for this license. This allows more users to be added to the license. The change takes effect immediately.">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleIncreaseUserLimitClick(row)}
          >
            <PersonAddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add a payment record for this license. This can be an initial payment, annual subscription payment, or user limit increase payment. Payments extend subscriptions and update license status.">
          <IconButton size="small" color="success" onClick={() => handleAddPayment(row.licenseKey)}>
            <PaymentIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reactivate this license by deactivating all existing activations. This allows the customer to re-enter their license key. All license data (subscriptions, payments, deadlines) will be preserved.">
          <IconButton size="small" color="primary" onClick={() => handleReactivateClick(row)}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Revoke this license permanently. This action cannot be undone. The license will be marked as revoked and all activations will be deactivated.">
          <span>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleRevokeClick(row.id)}
              disabled={row.status === 'revoked'}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    ),
    [
      handleViewLicense,
      handleEditLicense,
      handleIncreaseUserLimitClick,
      handleAddPayment,
      handleReactivateClick,
      handleRevokeClick,
    ]
  );

  // Memoize columns array to prevent recreation on every render
  // This is critical for performance since DataTable uses this array
  const columns: Column<License>[] = useMemo(
    () => [
      {
        id: 'id',
        label: 'ID',
        minWidth: 80,
        align: 'center',
        format: (value: unknown) => (
          <Typography variant="body2" sx={idTypographySx}>
            {value as number}
          </Typography>
        ),
      },
      {
        id: 'licenseKey',
        label: 'License Key',
        minWidth: 200,
        format: licenseKeyFormatter,
      },
      {
        id: 'customerName',
        label: 'Customer',
        minWidth: 150,
        format: (_value: unknown) => (_value as string | null) || '-',
      },
      {
        id: 'locationName',
        label: 'Branch/Location',
        minWidth: 150,
        format: (_value: unknown) => (_value as string | null) || '-',
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 100,
        align: 'center',
        format: (_value: unknown, row: License) => {
          // Check if license has been activated
          // Use activeActivationsCount if available (from backend when includeRelations is false)
          // Otherwise check the activations array if available
          let isNotActivated = false;
          
          if (row.activeActivationsCount !== undefined) {
            // Use the count field from backend
            isNotActivated = row.activeActivationsCount === 0;
          } else if (row.activations !== undefined) {
            // Fall back to checking activations array if available
            isNotActivated = !row.activations || 
              row.activations.length === 0 || 
              !row.activations.some(activation => activation.isActive);
          }
          
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <LicenseStatusBadge status={_value as LicenseStatus} />
              {isNotActivated && (
                <Chip
                  label="Not Activated"
                  color="warning"
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 18 }}
                />
              )}
            </Box>
          );
        },
      },
      {
        id: 'isFreeTrial',
        label: 'Free Trial',
        minWidth: 100,
        align: 'center',
        format: (_value: unknown) => (
          <Chip
            label={(_value as boolean) ? 'Yes' : 'No'}
            color={(_value as boolean) ? 'success' : 'error'}
            size="small"
            sx={freeTrialChipSx}
          />
        ),
      },
      {
        id: 'userCount',
        label: 'Users',
        minWidth: 120,
        align: 'center',
        format: (_value: unknown, row: License) => {
          const isAtLimit = row.userCount >= row.userLimit;
          const usagePercentage = (row.userCount / row.userLimit) * 100;
          const isNearLimit = usagePercentage >= 80;

          return (
            <Box sx={userCountBoxSx}>
              <Typography
                variant="body2"
                sx={{
                  color: isAtLimit ? 'error.main' : isNearLimit ? 'warning.main' : 'text.primary',
                  fontWeight: isAtLimit ? 'bold' : 'normal',
                }}
              >
                {row.userCount} / {row.userLimit}
              </Typography>
              {isAtLimit && <Chip label="Full" color="error" size="small" sx={fullChipSx} />}
            </Box>
          );
        },
      },
      {
        id: 'initialPrice',
        label: 'Price',
        minWidth: 100,
        align: 'right',
        format: (_value: unknown) => formatCurrency(_value as number),
      },
      {
        id: 'purchaseDate',
        label: 'Purchase Date',
        minWidth: 120,
        format: (_value: unknown) => formatDate(_value as string),
      },
      {
        id: 'actions',
        label: 'Actions',
        minWidth: 120,
        align: 'center',
        format: actionsFormatter,
      },
    ],
    [licenseKeyFormatter, actionsFormatter]
  );

  return (
    <Box>
      <Box sx={titleBoxSx}>
        <Typography variant="h4" sx={titleTypographySx}>
          Licenses
        </Typography>
        <Box sx={buttonsBoxSx}>
          <Tooltip title="Increase the user limit for a license. This allows more users to be added to the license. The change takes effect immediately.">
            <span>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={handleIncreaseUserLimit}
                sx={buttonSx}
              >
                Increase User Limit
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Reactivate a license by deactivating all existing activations. This allows the customer to re-enter their license key. All license data (subscriptions, payments, deadlines) will be preserved.">
            <span>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReactivateLicense} sx={buttonSx}>
                Reactivate License
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Export all licenses matching the current filters to a CSV file. The export includes license details, customer information, status, and user counts.">
            <span>
              <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportCSV} sx={buttonSx}>
                Export CSV
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Create a new license. You'll need to provide customer information, location details, and pricing. A unique license key will be generated automatically. An initial payment record will be created unless it's a free trial.">
            <span>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateLicense} sx={buttonSx}>
                Create License
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={filtersGridSx}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Search"
            placeholder="Search by ID, license key, customer name, phone, or branch/location"
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} md={3}>
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
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Free Trial"
            value={freeTrialFilter}
            onChange={handleFreeTrialChange}
            variant="outlined"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {error && (
        <Box sx={errorBoxSx}>
          <Typography color="error">{ERROR_LOADING_LICENSES}</Typography>
        </Box>
      )}

      <DataTable
        columns={columns}
        rows={data?.licenses || []}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={data?.pagination.totalItems || 0}
        onPageChange={setPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={isLoading}
        emptyMessage="No licenses found"
      />

      <ConfirmDialog
        open={revokeDialogOpen}
        title="Revoke License"
        message="Are you sure you want to revoke this license? This action cannot be undone. The license will be marked as revoked, all activations will be deactivated, and the customer will no longer be able to use the license."
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        confirmColor="error"
        onConfirm={handleRevokeConfirm}
        onCancel={handleRevokeCancel}
      />

    </Box>
  );
};