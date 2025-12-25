import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode, memo, useMemo } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
}

// Color map constant to avoid function recreation
const COLOR_MAP: Record<'primary' | 'success' | 'warning' | 'error' | 'info', string> = {
  primary: '#1a237e',
  success: '#1b5e20',
  warning: '#e65100',
  error: '#c62828',
  info: '#455a64',
};

// Extract sx props to constants to prevent recreation on every render
const valueTypographySx = { fontWeight: 600 };
const subtitleTypographySx = { mt: 1, display: 'block' };
const cardSx = { height: '100%', display: 'flex', flexDirection: 'column' };
const cardContentSx = { flexGrow: 1, display: 'flex', flexDirection: 'column' };

function StatsCardComponent({ title, value, icon, color = 'primary', subtitle }: StatsCardProps) {
  // Memoize color value to prevent recalculation on every render
  const colorValue = useMemo(() => COLOR_MAP[color] || COLOR_MAP.primary, [color]);

  // Memoize icon box sx to prevent recreation when color changes
  const iconBoxSx = useMemo(
    () => ({
      backgroundColor: `${colorValue}15`,
      borderRadius: 0,
      p: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [colorValue]
  );

  // Memoize icon color sx to prevent recreation when color changes
  const iconColorSx = useMemo(() => ({ color: colorValue }), [colorValue]);

  return (
    <Card sx={cardSx}>
      <CardContent sx={cardContentSx}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ flexGrow: 1 }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={valueTypographySx}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={subtitleTypographySx}>
                {subtitle}
              </Typography>
            )}
            {!subtitle && <Box sx={{ mt: 1, height: '1.5rem' }} />}
          </Box>
          {icon && (
            <Box sx={iconBoxSx}>
              <Box sx={iconColorSx}>{icon}</Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since StatsCard is used multiple times on the dashboard
export const StatsCard = memo(StatsCardComponent);