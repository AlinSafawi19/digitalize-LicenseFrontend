import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { memo, useMemo, useCallback } from 'react';

interface RevenueChartProps {
  initialRevenue: number;
  annualRevenue: number;
}

// Extract sx props to constants to prevent recreation on every render
const paperSx = { p: 3, height: '100%' };
const chartBoxSx = { width: '100%', height: 300, mt: 2 };

function RevenueChartComponent({ initialRevenue, annualRevenue }: RevenueChartProps) {
  // Memoize chart data to prevent recreation on every render
  // Only recalculate when revenue values actually change
  const data = useMemo(
    () => [
      {
        name: 'Revenue',
        Initial: initialRevenue,
        Annual: annualRevenue,
      },
    ],
    [initialRevenue, annualRevenue]
  );

  // Memoize the tooltip formatter function to prevent recreation on every render
  const formatTooltipValue = useCallback((value: number) => `$${value.toLocaleString()}`, []);

  return (
    <Paper sx={paperSx}>
      <Typography variant="h6" gutterBottom>
        Revenue Breakdown
      </Typography>
      <Box sx={chartBoxSx}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Bar dataKey="Initial" fill="#1a237e" />
            <Bar dataKey="Annual" fill="#1b5e20" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since charts can be expensive to re-render
export const RevenueChart = memo(RevenueChartComponent);