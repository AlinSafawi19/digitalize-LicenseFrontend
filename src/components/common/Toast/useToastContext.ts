import { useContext } from 'react';
import { ToastContext } from './ToastContext';

// Extract error message to constant to prevent recreation on every hook call
const ERROR_MESSAGE = 'useToastContext must be used within ToastProvider';

/**
 * Custom hook to access the Toast context
 * 
 * @returns The Toast context value containing showToast function
 * @throws Error if used outside of ToastProvider
 * 
 * Performance: This hook benefits from the memoized context value in ToastProvider,
 * which prevents unnecessary re-renders of all consumers when the provider re-renders.
 */
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(ERROR_MESSAGE);
  }
  return context;
};