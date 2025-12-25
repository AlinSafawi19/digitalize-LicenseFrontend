import { Paper, Typography, Box } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { memo, useMemo, useCallback } from 'react';

interface ActivationsChartProps {
  total: number;
  active: number;
  inactive: number;
}

// Extract sx props to constants to prevent recreation on every render
const paperSx = { p: 3, height: '100%' };
const chartBoxSx = { width: '100%', height: 300, mt: 2 };

function ActivationsChartComponent({ total, active, inactive }: ActivationsChartProps) {
  // Memoize chart data to prevent recreation on every render
  const chartData = useMemo(
    () => [
      {
        name: 'Activations',
        Active: active,
        Inactive: inactive,
      },
    ],
    [active, inactive]
  );

  // Memoize the tooltip formatter function to prevent recreation on every render
  const formatTooltipValue = useCallback((value: number) => value.toString(), []);

  return (
    <Paper sx={paperSx}>
      <Typography variant="h6" gutterBottom>
        Activations Overview
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h4" color="primary">
          {total}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Activations
        </Typography>
      </Box>
      <Box sx={chartBoxSx}>
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Area type="monotone" dataKey="Active" stackId="1" stroke="#1b5e20" fill="#1b5e20" fillOpacity={0.6} />
            <Area type="monotone" dataKey="Inactive" stackId="1" stroke="#e65100" fill="#e65100" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
export const ActivationsChart = memo(ActivationsChartComponent);

