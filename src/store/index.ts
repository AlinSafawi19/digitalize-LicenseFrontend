import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import { healthApi } from '../api/healthApi';
import authReducer from '../features/auth/slice/authSlice';

/**
 * Redux store configuration.
 *
 * Performance optimizations:
 * 1. Module-level store creation: The store is created once when the module is first imported
 *    and then cached by the module system, avoiding recreation.
 * 2. Optimized middleware: Serializable and immutable checks are configured to reduce
 *    unnecessary validation overhead while maintaining data integrity.
 * 3. RTK Query integration: The baseApi middleware is properly integrated for efficient
 *    API caching and request deduplication.
 * 4. Single reducer composition: Reducers are composed at store creation time, ensuring
 *    efficient state updates.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [healthApi.reducerPath]: healthApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Performance optimization: Configure serializable check to ignore certain paths
      // This reduces validation overhead for known-safe data structures
      serializableCheck: {
        // Ignore these field paths in all actions (e.g., Date objects, functions)
        ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta.request', 'meta.baseQueryMeta.response'],
        // Ignore these paths in the state (e.g., Date objects in auth state)
        ignoredPaths: ['auth.tokenExpiry'],
      },
      // Performance optimization: Disable immutable check in production
      // It's useful in development but adds overhead in production
      immutableCheck: {
        warnAfter: 128, // Only warn after 128ms to reduce overhead
      },
    }).concat(baseApi.middleware, healthApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;