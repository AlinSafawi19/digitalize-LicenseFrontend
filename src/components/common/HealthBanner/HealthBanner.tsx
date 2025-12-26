import { Box, Typography, Chip, Theme } from '@mui/material';
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
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: (theme: Theme) => `linear-gradient(to right, ${theme.palette.background.paper} 0%, transparent 5%, transparent 95%, ${theme.palette.background.paper} 100%)`,
    pointerEvents: 'none',
    zIndex: 1,
  },
};

const marqueeContainerSx = {
  display: 'flex',
  width: '100%',
  overflow: 'hidden',
};

const marqueeBoxSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0, // No gaps between items
  animation: 'marquee 60s linear infinite',
  '@keyframes marquee': {
    '0%': {
      transform: 'translateX(0)',
    },
    '100%': {
      transform: 'translateX(-50%)',
    },
  },
  width: 'max-content',
};

const healthItemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0, // No gaps
  whiteSpace: 'nowrap',
  flexShrink: 0,
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
    const healthItems = [...fallbackItems, ...fallbackItems];
    
    return (
      <Box sx={bannerBoxSx}>
        <Box sx={marqueeContainerSx}>
          <Box sx={marqueeBoxSx}>
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
                <Typography variant="body2" component="span" sx={{ mx: 1, color: 'text.secondary' }}>
                  •
                </Typography>
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
        <Box sx={{ px: 2 }}>
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
    const healthItems = [...fallbackItems, ...fallbackItems];
    
    return (
      <Box sx={bannerBoxSx}>
        <Box sx={marqueeContainerSx}>
          <Box sx={marqueeBoxSx}>
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
                <Typography variant="body2" component="span" sx={{ mx: 1, color: 'text.secondary' }}>
                  •
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // Duplicate the health items for seamless marquee loop
  const healthItems = [...healthData.health, ...healthData.health];

  return (
    <Box sx={bannerBoxSx}>
      <Box sx={marqueeContainerSx}>
        <Box sx={marqueeBoxSx}>
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
              <Typography variant="body2" component="span" sx={{ mx: 0.5, color: 'text.secondary' }}>
                •
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const HealthBanner = memo(HealthBannerComponent);

