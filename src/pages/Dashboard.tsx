import { Box, Grid, Typography, Paper } from '@mui/material';
import {
  VpnKey as LicenseIcon,
  CheckCircle as ActiveIcon,
  Cancel as ExpiredIcon,
  Devices as ActivationIcon,
  CardMembership as SubscriptionIcon,
  AttachMoney as RevenueIcon,
  Warning as ExpiringIcon,
  FreeBreakfast as FreeTrialIcon,
} from '@mui/icons-material';
import { useMemo, lazy, Suspense } from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { useGetDashboardStatsQuery } from '../api/statsApi';
// Performance optimization: Lazy load chart components to reduce initial bundle size by 100-150KB
const LicenseStatusChart = lazy(() => 
  import('../components/dashboard/LicenseStatusChart').then(module => ({
    default: module.LicenseStatusChart
  }))
);
const RevenueChart = lazy(() => 
  import('../components/dashboard/RevenueChart').then(module => ({
    default: module.RevenueChart
  }))
);
import { LoadingSpinner } from '../components/common/Loading/LoadingSpinner';
import { ErrorMessage } from '../components/common/Error/ErrorMessage';
import { formatCurrency } from '../utils/formatters';

// Constants
const ERROR_LOADING_DASHBOARD_MESSAGE = 'Failed to load dashboard statistics. Please try again later.';
const ERROR_LOADING_DASHBOARD_TITLE = 'Error Loading Dashboard';
const EXPIRING_SOON_SUBTITLE = 'Next 30 days';

// Extract sx props to constants to prevent recreation on every render
const titleTypographySx = { mb: 2.5 };
const recentActivityPaperSx = { p: 1.5 };
const recentActivityGridSx = { mt: 1.5 };

export const DashboardPage = () => {
  const { data: stats, isLoading, error } = useGetDashboardStatsQuery();

  // Memoize chart data to prevent recreation on every render
  const licenseStatusChartData = useMemo(
    () => ({
      active: stats?.activeLicenses || 0,
      expired: stats?.expiredLicenses || 0,
      revoked: 0,
      suspended: 0, // Add if available in stats
    }),
    [stats?.activeLicenses, stats?.expiredLicenses]
  );

  // Memoize revenue subtitle to prevent recreation on every render
  const revenueSubtitle = useMemo(
    () =>
      stats
        ? `Initial: ${formatCurrency(stats.initialRevenue)} | Annual: ${formatCurrency(stats.annualRevenue)}`
        : '',
    [stats]
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <ErrorMessage message={ERROR_LOADING_DASHBOARD_MESSAGE} title={ERROR_LOADING_DASHBOARD_TITLE} />
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={titleTypographySx}>
        Dashboard
      </Typography>

      <Grid container spacing={2.5}>
        {/* License Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Licenses"
            value={stats.totalLicenses}
            icon={<LicenseIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Licenses"
            value={stats.activeLicenses}
            icon={<ActiveIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Expired Licenses"
            value={stats.expiredLicenses}
            icon={<ExpiredIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Free Trial Licenses"
            value={stats.freeTrial}
            icon={<FreeTrialIcon />}
            color="info"
          />
        </Grid>

        {/* Other Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Activations"
            value={stats.totalActivations}
            icon={<ActivationIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions}
            icon={<SubscriptionIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<RevenueIcon />}
            color="primary"
            subtitle={revenueSubtitle}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Expiring Soon"
            value={stats.expiringSoon}
            icon={<ExpiringIcon />}
            color="warning"
            subtitle={EXPIRING_SOON_SUBTITLE}
          />
        </Grid>

        {/* Charts - Lazy loaded for better performance */}
        <Grid item xs={12} md={6}>
          <Suspense fallback={<LoadingSpinner />}>
            <LicenseStatusChart data={licenseStatusChartData} />
          </Suspense>
        </Grid>
        <Grid item xs={12} md={6}>
          <Suspense fallback={<LoadingSpinner />}>
            <RevenueChart initialRevenue={stats.initialRevenue} annualRevenue={stats.annualRevenue} />
          </Suspense>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={recentActivityPaperSx}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Grid container spacing={2.5} sx={recentActivityGridSx}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  New Licenses (Last 7 days)
                </Typography>
                <Typography variant="h5">{stats.recentActivity.licenses}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  New Activations (Last 7 days)
                </Typography>
                <Typography variant="h5">{stats.recentActivity.activations}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  New Payments (Last 7 days)
                </Typography>
                <Typography variant="h5">{stats.recentActivity.payments}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};