import { Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { memo, useMemo, useCallback } from 'react';

interface LicenseStatusChartProps {
  data: {
    active: number;
    expired: number;
    revoked: number;
    suspended: number;
  };
}

const COLORS = ['#1b5e20', '#e65100', '#c62828', '#616161'];

// Extract sx props to constants to prevent recreation on every render
const paperSx = { p: 3, height: '100%' };
const chartBoxSx = { width: '100%', height: 300, mt: 2 };

function LicenseStatusChartComponent({ data }: LicenseStatusChartProps) {
  // Memoize chart data to prevent recreation on every render
  // Only recalculate when data values actually change
  const chartData = useMemo(
    () =>
      [
        { name: 'Active', value: data.active },
        { name: 'Expired', value: data.expired },
        { name: 'Revoked', value: data.revoked },
        { name: 'Suspended', value: data.suspended },
      ].filter((item) => item.value > 0),
    [data.active, data.expired, data.revoked, data.suspended]
  );

  // Memoize the label function to prevent recreation on every render
  const renderLabel = useCallback(
    ({ name, percent }: { name: string; percent: number }) =>
      `${name}: ${(percent * 100).toFixed(0)}%`,
    []
  );

  return (
    <Paper sx={paperSx}>
      <Typography variant="h6" gutterBottom>
        License Status Distribution
      </Typography>
      <Box sx={chartBoxSx}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#534bae"
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since charts can be expensive to re-render
export const LicenseStatusChart = memo(LicenseStatusChartComponent);