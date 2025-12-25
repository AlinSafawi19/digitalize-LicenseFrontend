import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { memo, useMemo, useCallback } from 'react';

interface SubscriptionsChartProps {
  total: number;
  active: number;
  expired: number;
}

// Extract sx props to constants to prevent recreation on every render
const paperSx = { p: 3, height: '100%' };
const chartBoxSx = { width: '100%', height: 300, mt: 2 };

function SubscriptionsChartComponent({ total, active, expired }: SubscriptionsChartProps) {
  // Memoize chart data to prevent recreation on every render
  const data = useMemo(
    () => [
      {
        name: 'Subscriptions',
        Active: active,
        Expired: expired,
      },
    ],
    [active, expired]
  );

  // Memoize the tooltip formatter function to prevent recreation on every render
  const formatTooltipValue = useCallback((value: number) => value.toString(), []);

  return (
    <Paper sx={paperSx}>
      <Typography variant="h6" gutterBottom>
        Subscriptions Overview
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h4" color="primary">
          {total}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Subscriptions
        </Typography>
      </Box>
      <Box sx={chartBoxSx}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Bar dataKey="Active" fill="#1b5e20" />
            <Bar dataKey="Expired" fill="#e65100" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
export const SubscriptionsChart = memo(SubscriptionsChartComponent);

