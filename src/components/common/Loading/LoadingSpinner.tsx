import { CircularProgress, Box } from '@mui/material';
import { memo } from 'react';

interface LoadingSpinnerProps {
  size?: number;
  fullScreen?: boolean;
}

// Extract sx props to constants to prevent recreation on every render
const fullScreenBoxSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
};

const inlineBoxSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  p: 3,
};

function LoadingSpinnerComponent({ size = 40, fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <Box sx={fullScreenBoxSx}>
        <CircularProgress size={size} />
      </Box>
    );
  }

  return (
    <Box sx={inlineBoxSx}>
      <CircularProgress size={size} />
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since LoadingSpinner is used in Suspense fallbacks and loading states
export const LoadingSpinner = memo(LoadingSpinnerComponent);