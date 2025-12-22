import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { lazy, Suspense, ReactNode, memo } from 'react';
import { store } from './store';
import { theme } from './styles/theme';
import { ErrorBoundary } from './components/common/Error/ErrorBoundary';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { AppLayout } from './components/common/Layout/AppLayout';
import { ToastProvider } from './components/common/Toast/ToastProvider';
import { routes } from './config/routes';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { LoadingSpinner } from './components/common/Loading/LoadingSpinner';
import './styles/index.css';

/**
 * Main application component with routing and providers.
 *
 * Performance optimizations:
 * 1. Lazy loading: Routes are code-split using React.lazy() for smaller initial bundle
 * 2. Suspense boundaries: Loading states are handled efficiently
 * 3. Provider hierarchy: Providers are ordered for optimal re-render performance
 * 4. Memoized helper component: ProtectedLayoutRoute reduces component recreation
 * 5. Module-level lazy imports: Lazy components are created once at module load
 */

/**
 * Helper function to create lazy-loaded components with consistent pattern.
 * Performance: Reduces code duplication and ensures consistent lazy loading pattern.
 */
const createLazyComponent = <T extends Record<string, React.ComponentType<unknown>>>(
  importFn: () => Promise<T>,
  componentName: keyof T
) => {
  return lazy(() => importFn().then((m) => ({ default: m[componentName] })));
};

// Lazy load routes for code splitting
// Performance: Lazy components are created once at module load and reused
const LicenseListPage = createLazyComponent(
  () => import('./pages/Licenses/LicenseListPage'),
  'LicenseListPage'
);
const LicenseCreatePage = createLazyComponent(
  () => import('./pages/Licenses/LicenseCreatePage'),
  'LicenseCreatePage'
);
const LicenseViewPage = createLazyComponent(
  () => import('./pages/Licenses/LicenseViewPage'),
  'LicenseViewPage'
);
const LicenseEditPage = createLazyComponent(
  () => import('./pages/Licenses/LicenseEditPage'),
  'LicenseEditPage'
);
const IncreaseUserLimitPage = createLazyComponent(
  () => import('./pages/Licenses/IncreaseUserLimitPage'),
  'IncreaseUserLimitPage'
);
const ReactivateLicensePage = createLazyComponent(
  () => import('./pages/Licenses/ReactivateLicensePage'),
  'ReactivateLicensePage'
);
const ActivationListPage = createLazyComponent(
  () => import('./pages/Activations/ActivationListPage'),
  'ActivationListPage'
);
const ActivationViewPage = createLazyComponent(
  () => import('./pages/Activations/ActivationViewPage'),
  'ActivationViewPage'
);
const SubscriptionListPage = createLazyComponent(
  () => import('./pages/Subscriptions/SubscriptionListPage'),
  'SubscriptionListPage'
);
const SubscriptionViewPage = createLazyComponent(
  () => import('./pages/Subscriptions/SubscriptionViewPage'),
  'SubscriptionViewPage'
);
const PaymentListPage = createLazyComponent(
  () => import('./pages/Payments/PaymentListPage'),
  'PaymentListPage'
);
const PaymentCreatePage = createLazyComponent(
  () => import('./pages/Payments/PaymentCreatePage'),
  'PaymentCreatePage'
);
const PaymentViewPage = createLazyComponent(
  () => import('./pages/Payments/PaymentViewPage'),
  'PaymentViewPage'
);
const SettingsPage = createLazyComponent(
  () => import('./pages/Settings/SettingsPage'),
  'SettingsPage'
);
const PreferencesPage = createLazyComponent(
  () => import('./pages/Preferences/PreferencesPage'),
  'PreferencesPage'
);

/**
 * Helper component for protected routes with layout and suspense.
 * Performance: Memoized to prevent unnecessary re-renders when parent re-renders.
 */
interface ProtectedLayoutRouteProps {
  children: ReactNode;
}

const ProtectedLayoutRouteComponent = memo(({ children }: ProtectedLayoutRouteProps) => {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense fallback={<LoadingSpinner fullScreen />}>{children}</Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
});

ProtectedLayoutRouteComponent.displayName = 'ProtectedLayoutRoute';

const ProtectedLayoutRoute = ProtectedLayoutRouteComponent;

/**
 * Main App component.
 * Performance: Component is not memoized as it's the root component and rarely re-renders.
 */
function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  <Route path={routes.login} element={<LoginPage />} />
                  <Route
                    path={routes.dashboard}
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <DashboardPage />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={routes.licenses.list}
                    element={
                      <ProtectedLayoutRoute>
                        <LicenseListPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.licenses.create}
                    element={
                      <ProtectedLayoutRoute>
                        <LicenseCreatePage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.licenses.view(':id')}
                    element={
                      <ProtectedLayoutRoute>
                        <LicenseViewPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.licenses.edit(':id')}
                    element={
                      <ProtectedLayoutRoute>
                        <LicenseEditPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.licenses.increaseUserLimit}
                    element={
                      <ProtectedLayoutRoute>
                        <IncreaseUserLimitPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.licenses.reactivate}
                    element={
                      <ProtectedLayoutRoute>
                        <ReactivateLicensePage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.activations.list}
                    element={
                      <ProtectedLayoutRoute>
                        <ActivationListPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.activations.view(':id')}
                    element={
                      <ProtectedLayoutRoute>
                        <ActivationViewPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.subscriptions.list}
                    element={
                      <ProtectedLayoutRoute>
                        <SubscriptionListPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.subscriptions.view(':id')}
                    element={
                      <ProtectedLayoutRoute>
                        <SubscriptionViewPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.payments.list}
                    element={
                      <ProtectedLayoutRoute>
                        <PaymentListPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.payments.create}
                    element={
                      <ProtectedLayoutRoute>
                        <PaymentCreatePage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.payments.view(':id')}
                    element={
                      <ProtectedLayoutRoute>
                        <PaymentViewPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.settings}
                    element={
                      <ProtectedLayoutRoute>
                        <SettingsPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route
                    path={routes.preferences}
                    element={
                      <ProtectedLayoutRoute>
                        <PreferencesPage />
                      </ProtectedLayoutRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;