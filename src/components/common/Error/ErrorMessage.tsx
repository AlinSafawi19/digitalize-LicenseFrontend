import { Alert, AlertTitle } from '@mui/material';
import { memo } from 'react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info';
}

// Memoize sx prop to prevent recreation on every render
const alertSx = { mb: 2 };

function ErrorMessageComponent({ message, title, severity = 'error' }: ErrorMessageProps) {
  return (
    <Alert severity={severity} sx={alertSx}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
    </Alert>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since ErrorMessage is used in pages with frequently changing loading states
export const ErrorMessage = memo(ErrorMessageComponent);