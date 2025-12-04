import { createContext } from 'react';
import { ToastMessage } from '../../../hooks/useToast';

export interface ToastContextType {
  showToast: (message: string, severity?: ToastMessage['severity'], duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);