import { Chip } from '@mui/material';
import { memo, useMemo } from 'react';
import { LicenseStatus } from '../../types/license.types';

interface LicenseStatusBadgeProps {
  status: LicenseStatus;
}

// Color map constant to avoid function recreation
const COLOR_MAP: Record<LicenseStatus, 'success' | 'error' | 'warning' | 'default'> = {
  active: 'success',
  expired: 'warning',
  revoked: 'error',
  suspended: 'error',
};

// Label map constant to avoid string manipulation on every render
const LABEL_MAP: Record<LicenseStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  revoked: 'Revoked',
  suspended: 'Suspended',
};

function LicenseStatusBadgeComponent({ status }: LicenseStatusBadgeProps) {
  // Memoize color and label to prevent recalculation on every render
  const color = useMemo(() => COLOR_MAP[status] || 'default', [status]);
  const label = useMemo(() => LABEL_MAP[status] || status.charAt(0).toUpperCase() + status.slice(1), [status]);

  return <Chip label={label} color={color} size="small" />;
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since LicenseStatusBadge is used in lists/tables
export const LicenseStatusBadge = memo(LicenseStatusBadgeComponent);