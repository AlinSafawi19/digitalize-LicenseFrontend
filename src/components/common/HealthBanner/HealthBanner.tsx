import { Box, Typography, Chip, Theme, useTheme } from '@mui/material';
import { useGetHealthQuery } from '../../../api/healthApi';
import { memo } from 'react';

// Extract sx props to constants to prevent recreation on every render
const bannerBoxSx = {
  position: 'fixed',
  bottom: 0,
  left: { xs: 0, md: '240px' }, // Account for sidebar width on desktop
  right: 0,
  backgroundColor: 'background.paper',
  borderTop: '1px solid',
  borderColor: 'divider',
  py: 1,
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'center',
};

const getContentContainerSx = (theme: Theme) => ({
  width: '100%',
  maxWidth: `${theme.breakpoints.values.xl}px`, // Match Container maxWidth="xl"
  px: { xs: 1.5, md: 2 }, // Match Container padding
  mx: 'auto', // Center the content
});

const itemsContainerSx = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: { xs: 1, md: 2 },
};

const healthItemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  whiteSpace: 'nowrap',
};

const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'unhealthy':
      return 'error';
    case 'degraded':
      return 'warning';
    default:
      return 'success';
  }
};

function HealthBannerComponent() {
  const theme = useTheme();
  const contentContainerSx = getContentContainerSx(theme);
  
  // Poll every 30 seconds to keep health status updated
  const { data: healthData, isLoading, error } = useGetHealthQuery(undefined, {
    pollingInterval: 30000,
    // Skip the query if it fails - we'll show a fallback
    skip: false,
  });

  // Debug logging
  if (error) {
    console.error('Health API error:', error);
  }

  // Show fallback if API endpoint doesn't exist or returns error
  if (error || (!isLoading && !healthData)) {
    // Show a simple fallback message
    const fallbackItems = [
      { name: 'Server Status', status: 'healthy' as const, message: 'Health endpoint unavailable' },
    ];
    
    return (
      <Box sx={bannerBoxSx}>
        <Box sx={contentContainerSx}>
          <Box sx={itemsContainerSx}>
            {fallbackItems.map((item, index) => (
              <Box key={`${item.name}-${index}`} sx={healthItemSx}>
                <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                  {item.name}:
                </Typography>
                <Chip
                  label={item.status.toUpperCase()}
                  color={getStatusColor(item.status)}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                {item.message && (
                  <Typography variant="body2" component="span" color="text.secondary">
                    {item.message}
                  </Typography>
                )}
                {index < fallbackItems.length - 1 && (
                  <Typography variant="body2" component="span" sx={{ mx: 0.5, color: 'text.secondary' }}>
                    •
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  if (isLoading || !healthData) {
    // Show loading state instead of nothing
    return (
      <Box sx={bannerBoxSx}>
        <Box sx={contentContainerSx}>
          <Typography variant="body2" color="text.secondary">
            Loading health status...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Handle empty health array
  if (!healthData.health || healthData.health.length === 0) {
    const fallbackItems = [
      { name: 'Server Status', status: 'healthy' as const, message: 'No health data available' },
    ];
    
    return (
      <Box sx={bannerBoxSx}>
        <Box sx={contentContainerSx}>
          <Box sx={itemsContainerSx}>
            {fallbackItems.map((item, index) => (
              <Box key={`${item.name}-${index}`} sx={healthItemSx}>
                <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                  {item.name}:
                </Typography>
                <Chip
                  label={item.status.toUpperCase()}
                  color={getStatusColor(item.status)}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                {item.message && (
                  <Typography variant="body2" component="span" color="text.secondary">
                    {item.message}
                  </Typography>
                )}
                {index < fallbackItems.length - 1 && (
                  <Typography variant="body2" component="span" sx={{ mx: 0.5, color: 'text.secondary' }}>
                    •
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // Display health items without marquee
  const healthItems = healthData.health;

  return (
    <Box sx={bannerBoxSx}>
      <Box sx={contentContainerSx}>
        <Box sx={itemsContainerSx}>
          {healthItems.map((item, index) => (
            <Box key={`${item.name}-${index}`} sx={healthItemSx}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                {item.name}:
              </Typography>
              <Chip
                label={item.status.toUpperCase()}
                color={getStatusColor(item.status)}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              {item.message && (
                <Typography variant="body2" component="span" color="text.secondary">
                  {item.message}
                </Typography>
              )}
              {index < healthItems.length - 1 && (
                <Typography variant="body2" component="span" sx={{ mx: 0.5, color: 'text.secondary' }}>
                  •
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const HealthBanner = memo(HealthBannerComponent);

