import { ReactNode, useMemo, memo } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useToast } from '../../../hooks/useToast';
import { ToastContext } from './ToastContext';

interface ToastProviderProps {
  children: ReactNode;
}

// Extract sx props and anchorOrigin to constants to prevent recreation on every render
const alertSx = { width: '100%' };
const anchorOrigin = { vertical: 'bottom' as const, horizontal: 'right' as const };

function ToastProviderComponent({ children }: ToastProviderProps) {
  const { toast, showToast, hideToast } = useToast();

  // Memoize the context value to prevent unnecessary re-renders of all consumers
  // This is critical: creating a new object on every render causes all context consumers to re-render
  const contextValue = useMemo(
    () => ({ showToast }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={!!toast}
        autoHideDuration={toast?.duration || 4000}
        onClose={hideToast}
        anchorOrigin={anchorOrigin}
      >
        <Alert
          onClose={hideToast}
          severity={toast?.severity || 'info'}
          variant="filled"
          sx={alertSx}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

// Memoize the provider component to prevent unnecessary re-renders
export const ToastProvider = memo(ToastProviderComponent);