import { Paper, Typography, Grid, Box } from '@mui/material';
import { memo } from 'react';

interface SummaryStatsGridProps {
  expiredLicenses: number;
  freeTrial: number;
  revokedLicenses: number;
  suspendedLicenses: number;
  inactiveActivations: number;
  expiringSoon: number;
}

// Extract sx props to constants to prevent recreation on every render
const paperSx = { p: 3, height: '100%' };
const statItemSx = { py: 1.5 };
const statValueSx = { fontWeight: 600, fontSize: '1.25rem' };
const statLabelSx = { color: 'text.secondary', fontSize: '0.875rem', mt: 0.5 };

function SummaryStatsGridComponent({
  expiredLicenses,
  freeTrial,
  revokedLicenses,
  suspendedLicenses,
  inactiveActivations,
  expiringSoon,
}: SummaryStatsGridProps) {
  return (
    <Paper sx={paperSx}>
      <Typography variant="h6" gutterBottom>
        Additional Metrics
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6} sm={4}>
          <Box sx={statItemSx}>
            <Typography variant="h5" sx={statValueSx}>
              {expiredLicenses}
            </Typography>
            <Typography variant="body2" sx={statLabelSx}>
              Expired Licenses
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Box sx={statItemSx}>
            <Typography variant="h5" sx={statValueSx}>
              {freeTrial}
            </Typography>
            <Typography variant="body2" sx={statLabelSx}>
              Free Trial
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Box sx={statItemSx}>
            <Typography variant="h5" sx={statValueSx}>
              {revokedLicenses}
            </Typography>
            <Typography variant="body2" sx={statLabelSx}>
              Revoked
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Box sx={statItemSx}>
            <Typography variant="h5" sx={statValueSx}>
              {suspendedLicenses}
            </Typography>
            <Typography variant="body2" sx={statLabelSx}>
              Suspended
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Box sx={statItemSx}>
            <Typography variant="h5" sx={statValueSx}>
              {inactiveActivations}
            </Typography>
            <Typography variant="body2" sx={statLabelSx}>
              Inactive Activations
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Box sx={statItemSx}>
            <Typography variant="h5" sx={statValueSx} color="warning.main">
              {expiringSoon}
            </Typography>
            <Typography variant="body2" sx={statLabelSx}>
              Expiring Soon (30 days)
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
export const SummaryStatsGrid = memo(SummaryStatsGridComponent);

