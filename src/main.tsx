import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Application entry point.
 *
 * Performance optimizations:
 * 1. ReactDOM.createRoot(): Uses the modern concurrent rendering API which provides
 *    better performance and user experience compared to the legacy ReactDOM.render()
 * 2. React.StrictMode: Enables additional development-time checks and warnings,
 *    but has zero overhead in production builds
 * 3. Single root element: Efficient DOM query and render
 * 4. Module-level execution: Code runs once at application startup
 *
 * Note: The non-null assertion (!) is safe here because:
 * - The root element is guaranteed to exist in index.html
 * - This is the application entry point, so the DOM is ready
 * - TypeScript's non-null assertion prevents unnecessary null checks
 */

// Get the root DOM element
const rootElement = document.getElementById('root');

// Performance: Check if root element exists (defensive programming)
if (!rootElement) {
  throw new Error('Root element not found. Please ensure index.html contains a <div id="root"></div> element.');
}

// Create React root and render application
// Performance: createRoot() uses concurrent rendering for better performance
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);