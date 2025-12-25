import { Box, Grid, Typography, Paper, Button, Alert, Link, Chip, Divider } from '@mui/material';
import {
  VpnKey as LicenseIcon,
  CheckCircle as ActiveIcon,
  AttachMoney as RevenueIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useMemo, lazy, Suspense, useCallback } from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { useGetDashboardStatsQuery } from '../api/statsApi';
import { useGetPaymentsQuery } from '../api/paymentApi';
import { useNavigate } from 'react-router-dom';
import { routes } from '../config/routes';
import { formatCurrency, formatDate } from '../utils/formatters';
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
const ActivationsChart = lazy(() => 
  import('../components/dashboard/ActivationsChart').then(module => ({
    default: module.ActivationsChart
  }))
);
const SubscriptionsChart = lazy(() => 
  import('../components/dashboard/SubscriptionsChart').then(module => ({
    default: module.SubscriptionsChart
  }))
);
const SummaryStatsGrid = lazy(() => 
  import('../components/dashboard/SummaryStatsGrid').then(module => ({
    default: module.SummaryStatsGrid
  }))
);
import { LoadingSpinner } from '../components/common/Loading/LoadingSpinner';
import { ErrorMessage } from '../components/common/Error/ErrorMessage';

// Constants
const ERROR_LOADING_DASHBOARD_MESSAGE = 'Failed to load dashboard statistics. Please try again later.';
const ERROR_LOADING_DASHBOARD_TITLE = 'Error Loading Dashboard';

// Extract sx props to constants to prevent recreation on every render
const titleTypographySx = { mb: 2.5 };
const recentActivityPaperSx = { p: 2.5 };
const recentActivityGridSx = { mt: 1.5 };
const sectionPaperSx = { p: 2.5, height: '100%' };
const sectionTitleSx = { mb: 2, display: 'flex', alignItems: 'center', gap: 1 };
const quickActionButtonSx = { mb: 1, justifyContent: 'flex-start', textTransform: 'none' };
const alertBoxSx = { mb: 2 };
const recentPaymentsListSx = { mt: 2 };
const recentPaymentItemSx = { py: 1.5, borderBottom: '1px solid', borderColor: 'divider' };
const recentPaymentItemLastSx = { py: 1.5 };
const viewAllLinkSx = { mt: 2, display: 'flex', justifyContent: 'flex-end' };

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useGetDashboardStatsQuery();
  
  // Fetch recent payments for the dashboard
  const { data: recentPaymentsData } = useGetPaymentsQuery({
    page: 1,
    limit: 5,
    sortBy: 'paymentDate',
    sortOrder: 'desc',
  });

  // Memoize chart data to prevent recreation on every render
  const licenseStatusChartData = useMemo(
    () => ({
      active: stats?.activeLicenses || 0,
      expired: stats?.expiredLicenses || 0,
      revoked: stats?.revokedLicenses || 0,
      suspended: stats?.suspendedLicenses || 0,
    }),
    [stats?.activeLicenses, stats?.expiredLicenses, stats?.revokedLicenses, stats?.suspendedLicenses]
  );

  // Memoize navigation handlers
  const handleCreateLicense = useCallback(() => {
    navigate(routes.licenses.create);
  }, [navigate]);

  const handleCreatePayment = useCallback(() => {
    navigate(routes.payments.create);
  }, [navigate]);

  const handleIncreaseUserLimit = useCallback(() => {
    navigate(routes.licenses.increaseUserLimit);
  }, [navigate]);

  const handleReactivateLicense = useCallback(() => {
    navigate(routes.licenses.reactivate);
  }, [navigate]);

  // Memoize alerts/warnings
  const alerts = useMemo(() => {
    const alertsList = [];
    if (stats?.expiringSoon && stats.expiringSoon > 0) {
      alertsList.push({
        severity: 'warning' as const,
        message: `${stats.expiringSoon} license(s) expiring in the next 30 days`,
        action: () => navigate(routes.licenses.list),
      });
    }
    if (stats?.expiringSoonSubscriptions && stats.expiringSoonSubscriptions > 0) {
      alertsList.push({
        severity: 'warning' as const,
        message: `${stats.expiringSoonSubscriptions} subscription(s) expiring soon`,
        action: () => navigate(routes.subscriptions.list),
      });
    }
    if (stats?.expiredLicenses && stats.expiredLicenses > 0) {
      alertsList.push({
        severity: 'info' as const,
        message: `${stats.expiredLicenses} expired license(s) need attention`,
        action: () => navigate(routes.licenses.list),
      });
    }
    return alertsList;
  }, [stats, navigate]);

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
        {/* Key Metrics - Only show the most important stats */}
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
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<RevenueIcon />}
            color="primary"
            subtitle={revenueSubtitle}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue || 0)}
            icon={<TrendingUpIcon />}
            color="success"
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
        <Grid item xs={12} md={6}>
          <Suspense fallback={<LoadingSpinner />}>
            <ActivationsChart 
              total={stats.totalActivations}
              active={stats.activeActivations || 0}
              inactive={stats.inactiveActivations || 0}
            />
          </Suspense>
        </Grid>
        <Grid item xs={12} md={6}>
          <Suspense fallback={<LoadingSpinner />}>
            <SubscriptionsChart 
              total={stats.totalSubscriptions || 0}
              active={stats.activeSubscriptions}
              expired={stats.expiredSubscriptions || 0}
            />
          </Suspense>
        </Grid>
        
        {/* Summary Stats Grid - Additional metrics in a compact view */}
        <Grid item xs={12} md={6}>
          <Suspense fallback={<LoadingSpinner />}>
            <SummaryStatsGrid
              expiredLicenses={stats.expiredLicenses}
              freeTrial={stats.freeTrial}
              revokedLicenses={stats.revokedLicenses || 0}
              suspendedLicenses={stats.suspendedLicenses || 0}
              inactiveActivations={stats.inactiveActivations || 0}
              expiringSoon={stats.expiringSoon}
            />
          </Suspense>
        </Grid>

        {/* Alerts and Warnings */}
        {alerts.length > 0 && (
          <Grid item xs={12}>
            <Box sx={alertBoxSx}>
              {alerts.map((alert, index) => (
                <Alert
                  key={index}
                  severity={alert.severity}
                  action={
                    <Button color="inherit" size="small" onClick={alert.action}>
                      View
                    </Button>
                  }
                  sx={{ mb: 1 }}
                >
                  {alert.message}
                </Alert>
              ))}
            </Box>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={sectionPaperSx}>
            <Typography variant="h6" sx={sectionTitleSx}>
              Quick Actions
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateLicense}
              sx={quickActionButtonSx}
            >
              Create New License
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={handleCreatePayment}
              sx={quickActionButtonSx}
            >
              Record Payment
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={handleIncreaseUserLimit}
              sx={quickActionButtonSx}
            >
              Increase User Limit
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReactivateLicense}
              sx={quickActionButtonSx}
            >
              Reactivate License
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(routes.licenses.list)}
              sx={quickActionButtonSx}
            >
              View All Licenses
            </Button>
            <Button
              fullWidth
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(routes.payments.list)}
              sx={quickActionButtonSx}
            >
              View All Payments
            </Button>
            <Button
              fullWidth
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(routes.activations.list)}
              sx={quickActionButtonSx}
            >
              View All Activations
            </Button>
            <Button
              fullWidth
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(routes.subscriptions.list)}
              sx={quickActionButtonSx}
            >
              View All Subscriptions
            </Button>
          </Paper>
        </Grid>

        {/* Recent Payments */}
        <Grid item xs={12} md={8}>
          <Paper sx={sectionPaperSx}>
            <Typography variant="h6" sx={sectionTitleSx}>
              Recent Payments
            </Typography>
            {recentPaymentsData?.payments && recentPaymentsData.payments.length > 0 ? (
              <>
                <Box sx={recentPaymentsListSx}>
                  {recentPaymentsData.payments.map((payment, index) => (
                    <Box
                      key={payment.id}
                      sx={index < recentPaymentsData.payments.length - 1 ? recentPaymentItemSx : recentPaymentItemLastSx}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" color="text.secondary">
                            License ID
                          </Typography>
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate(routes.licenses.view(payment.licenseId))}
                            sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            {payment.licenseId}
                          </Link>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" color="text.secondary">
                            Amount
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" color="text.secondary">
                            Date
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(payment.paymentDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Chip
                            label={payment.isAnnualSubscription ? 'Annual' : 'Initial'}
                            color={payment.isAnnualSubscription ? 'primary' : 'default'}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
                <Box sx={viewAllLinkSx}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate(routes.payments.list)}
                    sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    View All Payments
                    <ArrowForwardIcon fontSize="small" />
                  </Link>
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No recent payments
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={recentActivityPaperSx}>
            <Typography variant="h6" gutterBottom>
              Recent Activity (Last 7 days)
            </Typography>
            <Grid container spacing={2.5} sx={recentActivityGridSx}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  New Licenses
                </Typography>
                <Typography variant="h5">{stats.recentActivity.licenses}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  New Activations
                </Typography>
                <Typography variant="h5">{stats.recentActivity.activations}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  New Payments
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