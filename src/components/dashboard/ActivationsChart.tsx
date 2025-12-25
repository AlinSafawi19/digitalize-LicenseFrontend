import { Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { memo, useMemo, useCallback } from 'react';

interface ActivationsChartProps {
  total: number;
  active: number;
  inactive: number;
}

const COLORS = ['#1b5e20', '#e65100'];

// Extract sx props to constants to prevent recreation on every render
const paperSx = { p: 3, height: '100%' };
const chartBoxSx = { width: '100%', height: 300, mt: 2 };

function ActivationsChartComponent({ total, active, inactive }: ActivationsChartProps) {
  // Memoize chart data to prevent recreation on every render
  const chartData = useMemo(
    () => [
      { name: 'Active', value: active },
      { name: 'Inactive', value: inactive },
    ].filter((item) => item.value > 0),
    [active, inactive]
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
export const ActivationsChart = memo(ActivationsChartComponent);

