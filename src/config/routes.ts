/**
 * Application route configuration.
 * 
 * Performance notes:
 * - This object is created once at module load time and cached by the module system
 * - Route functions (view, edit) are created once and reused across all calls
 * - Template literals are the most efficient way to build dynamic routes
 * - The `as const` assertion ensures immutability and better type inference
 * - All route functions are simple, pure functions with no side effects
 * 
 * Usage:
 * - Static routes: `routes.login`, `routes.dashboard`
 * - Dynamic routes: `routes.licenses.view(123)` returns `/licenses/123`
 */
export const routes = {
  login: '/login',
  dashboard: '/',
  licenses: {
    list: '/licenses',
    create: '/licenses/create',
    view: (id: number | string) => `/licenses/${id}`,
    edit: (id: number | string) => `/licenses/${id}/edit`,
    increaseUserLimit: '/licenses/increase-user-limit',
    reactivate: '/licenses/reactivate',
  },
  activations: {
    list: '/activations',
    view: (id: number | string) => `/activations/${id}`,
  },
  subscriptions: {
    list: '/subscriptions',
    view: (id: number | string) => `/subscriptions/${id}`,
  },
  payments: {
    list: '/payments',
    create: '/payments/create',
    view: (id: number | string) => `/payments/${id}`,
  },
  settings: '/settings',
  preferences: '/preferences',
} as const;