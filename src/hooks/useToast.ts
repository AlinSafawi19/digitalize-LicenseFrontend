import { useState, useCallback, useMemo } from 'react';

export interface ToastMessage {
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Default toast duration in milliseconds
const DEFAULT_TOAST_DURATION = 4000;

/**
 * Custom hook to manage toast notifications
 * 
 * Performance optimizations:
 * - Memoized callbacks to prevent function recreation
 * - Memoized return object to prevent unnecessary re-renders of consumers
 * 
 * @returns Object containing toast state and control functions
 */
export const useToast = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Memoize showToast to prevent recreation on every render
  const showToast = useCallback(
    (message: string, severity: ToastMessage['severity'] = 'info', duration = DEFAULT_TOAST_DURATION) => {
      setToast({ message, severity, duration });
    },
    []
  );

  // Memoize hideToast to prevent recreation on every render
  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Memoize return object to prevent unnecessary re-renders of consumers
  // This is important when the hook is used in components that pass the return value as props
  const returnValue = useMemo(
    () => ({
      toast,
      showToast,
      hideToast,
    }),
    [toast, showToast, hideToast]
  );

  return returnValue;
};