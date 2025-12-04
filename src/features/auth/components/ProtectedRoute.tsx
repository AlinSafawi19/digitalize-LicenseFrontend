import { ReactNode, memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { routes } from '../../../config/routes';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRouteComponent({ children }: ProtectedRouteProps) {
  // Performance optimization: Only select isAuthenticated instead of entire state.auth
  // This prevents re-renders when other auth state properties change (e.g., user, token)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace />;
  }

  return <>{children}</>;
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since ProtectedRoute is used for all protected routes
export const ProtectedRoute = memo(ProtectedRouteComponent);