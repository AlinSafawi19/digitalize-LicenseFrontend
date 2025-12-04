import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { useGetActivationsQuery } from '../../api/activationApi';
import { DataTable, Column } from '../../components/common/DataTable/DataTable';
import { Activation } from '../../types/license.types';
import { formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../config/routes';
import { PAGINATION } from '../../utils/constants';

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

// Extract sx props to constants to prevent recreation on every render
const titleSx = { mb: 3 };
const filtersGridSx = { mb: 3 };
const errorBoxSx = { mb: 2 };

// Debounce delay constant
const DEBOUNCE_DELAY = 500;

export const ActivationListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION.DEFAULT_LIMIT);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [licenseIdFilter, setLicenseIdFilter] = useState<string>('');
  const [debouncedLicenseIdFilter, setDebouncedLicenseIdFilter] = useState<string>('');

  // Debounce timer refs
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const licenseIdDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    searchDebounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0); // Reset to first page when search changes
    }, DEBOUNCE_DELAY);

    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Debounce license ID filter - wait 500ms after user stops typing
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

  // Memoize query parameters to prevent unnecessary API refetches
  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      isActive: statusFilter ? statusFilter === 'true' : undefined,
      search: debouncedSearchQuery || undefined,
      licenseId: debouncedLicenseIdFilter ? Number(debouncedLicenseIdFilter) : undefined,
      sortBy: 'activatedAt' as const,
      sortOrder: 'desc' as const,
    }),
    [page, rowsPerPage, statusFilter, debouncedSearchQuery, debouncedLicenseIdFilter]
  );

  const { data, isLoading, error } = useGetActivationsQuery(queryParams);

  // Memoize navigation handler to prevent recreation on every render
  const handleViewActivation = useCallback(
    (id: number) => {
      navigate(routes.activations.view(id));
    },
    [navigate]
  );

  // Memoize columns array to prevent recreation on every render
  // This is important since DataTable uses columns for rendering
  const columns: Column<Activation>[] = useMemo(
    () => [
      {
        id: 'hardwareId',
        label: 'Hardware ID',
        minWidth: 200,
        format: (value: unknown) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {typeof value === 'string' ? value.substring(0, 16) + '...' : String(value ?? '')}
          </Typography>
        ),
      },
      {
        id: 'machineName',
        label: 'Machine Name',
        minWidth: 150,
        format: (value: unknown) => (typeof value === 'string' ? value : value === null ? '-' : String(value ?? '-')),
      },
      {
        id: 'licenseId',
        label: 'License ID',
        minWidth: 100,
        align: 'center',
      },
      {
        id: 'activatedAt',
        label: 'Activated At',
        minWidth: 150,
        format: (value: unknown) => typeof value === 'string' ? formatDateTime(value) : String(value ?? ''),
      },
      {
        id: 'isActive',
        label: 'Status',
        minWidth: 100,
        align: 'center',
        format: (value: unknown) => {
          const isActive = typeof value === 'boolean' ? value : false;
          return (
            <Chip
              label={isActive ? 'Active' : 'Inactive'}
              color={isActive ? 'success' : 'default'}
              size="small"
            />
          );
        },
      },
      {
        id: 'actions',
        label: 'Actions',
        minWidth: 100,
        align: 'center',
        format: (_value: unknown, row: Activation) => (
          <IconButton size="small" onClick={() => handleViewActivation(row.id)}>
            <ViewIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [handleViewActivation]
  );

  // Memoize onChange handlers to prevent recreation on every render
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Page reset is handled by debounce effect
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(e.target.value);
    setPage(0);
  }, []);

  const handleLicenseIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseIdFilter(e.target.value);
    // Page reset is handled by debounce effect
  }, []);

  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage: number) => {
      setRowsPerPage(newRowsPerPage);
      setPage(0);
    },
    []
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={titleSx}>
        Activations
      </Typography>

      <Grid container spacing={2} sx={filtersGridSx}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search"
            placeholder="Search by hardware ID or machine name"
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
            label="License ID"
            type="number"
            value={licenseIdFilter}
            onChange={handleLicenseIdChange}
            variant="outlined"
          />
        </Grid>
      </Grid>

      {error && (
        <Box sx={errorBoxSx}>
          <Typography color="error">Failed to load activations. Please try again.</Typography>
        </Box>
      )}

      <DataTable
        columns={columns}
        rows={data?.activations || []}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={data?.pagination.totalItems || 0}
        onPageChange={setPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={isLoading}
        emptyMessage="No activations found"
      />
    </Box>
  );
};