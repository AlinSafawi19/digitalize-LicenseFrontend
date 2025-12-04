# DigitalizePOS License Management Frontend

A modern, responsive web application for managing DigitalizePOS licenses, activations, subscriptions, and payments. Built with React and TypeScript, this frontend provides a comprehensive admin interface for license management operations.

## Technology Stack

- **React 18** with TypeScript
- **Vite 5** for fast build tooling and HMR
- **Material-UI (MUI) 5** for UI components and theming
- **Redux Toolkit** with RTK Query for state management and API calls
- **React Router 6** for client-side routing
- **React Hook Form** with Zod for form validation
- **Recharts** for data visualization and charts
- **jsPDF** for PDF generation and exports
- **date-fns** with MUI Date Pickers for date handling
- **Axios** for HTTP requests
- **Vitest** with Testing Library for unit and integration tests

## Features

### Core Functionality

- ✅ **License Management**: 
  - Create new licenses with customizable parameters
  - View detailed license information
  - Edit existing licenses
  - Reactivate revoked licenses
  - Increase user limits for licenses
  - Track license status and expiration

- ✅ **Activation Tracking**: 
  - Monitor device activations per license
  - View activation history and details
  - Track activation limits and usage

- ✅ **Subscription Management**: 
  - View all subscriptions
  - Monitor subscription status and renewals
  - Track subscription expiration dates

- ✅ **Payment Management**: 
  - Create and record payments
  - View payment history and details
  - Export payment data to CSV/PDF
  - Track payment status and amounts

- ✅ **Dashboard**: 
  - Real-time statistics and metrics
  - Revenue charts and visualizations
  - License status overview
  - Quick access to key information

- ✅ **Settings**: 
  - Application configuration
  - User preferences

### Technical Features

- ✅ **Authentication**: Secure admin login with JWT token-based authentication
- ✅ **Protected Routes**: Route-level authentication guards
- ✅ **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- ✅ **Loading States**: Optimized loading indicators and suspense boundaries
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ✅ **Code Splitting**: Lazy-loaded routes for optimized bundle sizes
- ✅ **Type Safety**: Full TypeScript coverage for type-safe development
- ✅ **Form Validation**: Client-side validation with Zod schemas
- ✅ **Toast Notifications**: User-friendly notification system
- ✅ **Data Tables**: Sortable, filterable data tables with pagination

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your API base URL:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=DigitalizePOS License Manager
VITE_APP_VERSION=1.0.0
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

### Testing

The project uses **Vitest** with **React Testing Library** for testing.

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with UI (interactive):
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Code Quality

Run ESLint to check for code issues:
```bash
npm run lint
```

Format code with Prettier:
```bash
npm run format
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Project Structure

```
src/
├── api/                    # RTK Query API slices
│   ├── baseApi.ts         # Base API configuration
│   ├── licenseApi.ts      # License CRUD operations
│   ├── activationApi.ts   # Activation queries
│   ├── subscriptionApi.ts # Subscription queries
│   ├── paymentApi.ts      # Payment CRUD operations
│   └── statsApi.ts        # Dashboard statistics
├── components/             # Reusable UI components
│   ├── common/            # Common components
│   │   ├── DataTable/     # Reusable data table
│   │   ├── Error/         # Error boundary & messages
│   │   ├── Layout/        # App layout components
│   │   ├── Loading/       # Loading spinners
│   │   ├── Modals/        # Modal dialogs
│   │   └── Toast/         # Toast notifications
│   ├── dashboard/            # Dashboard-specific components
│   │   ├── LicenseStatusChart.tsx
│   │   ├── RevenueChart.tsx
│   │   └── StatsCard.tsx
│   └── license/          # License-specific components
│       ├── LicenseForm.tsx
│       └── LicenseStatusBadge.tsx
├── features/              # Feature modules
│   └── auth/             # Authentication feature
│       ├── components/    # Auth components (ProtectedRoute)
│       └── ...
├── pages/                 # Page components (lazy-loaded)
│   ├── Login.tsx          # Login page
│   ├── Dashboard.tsx      # Dashboard page
│   ├── Licenses/          # License pages
│   │   ├── LicenseListPage.tsx
│   │   ├── LicenseCreatePage.tsx
│   │   ├── LicenseViewPage.tsx
│   │   ├── LicenseEditPage.tsx
│   │   ├── IncreaseUserLimitPage.tsx
│   │   └── ReactivateLicensePage.tsx
│   ├── Activations/       # Activation pages
│   │   ├── ActivationListPage.tsx
│   │   └── ActivationViewPage.tsx
│   ├── Subscriptions/     # Subscription pages
│   │   ├── SubscriptionListPage.tsx
│   │   └── SubscriptionViewPage.tsx
│   ├── Payments/          # Payment pages
│   │   ├── PaymentListPage.tsx
│   │   ├── PaymentCreatePage.tsx
│   │   └── PaymentViewPage.tsx
│   └── Settings/          # Settings page
│       └── SettingsPage.tsx
├── store/                 # Redux store configuration
│   └── index.ts          # Store setup
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── types/                 # TypeScript type definitions
├── styles/                # Global styles and theme
│   ├── theme.ts          # MUI theme configuration
│   └── index.css         # Global CSS
├── config/                # Configuration files
│   └── routes.ts         # Route definitions
├── App.tsx               # Root component with routing
└── main.tsx              # Application entry point
```

## API Integration

The frontend communicates with the DigitalizePOS License Server API using RTK Query. All API endpoints are configured in the `src/api/` directory.

### API Configuration

- Base API URL is configured via `VITE_API_BASE_URL` environment variable
- JWT tokens are automatically included in request headers
- Error handling is centralized in the base API slice
- Request/response caching is handled by RTK Query

### Available API Slices

- **licenseApi**: License CRUD operations, reactivation, user limit increases
- **activationApi**: Activation queries and tracking
- **subscriptionApi**: Subscription data retrieval
- **paymentApi**: Payment CRUD operations
- **statsApi**: Dashboard statistics and metrics

For detailed API integration documentation, refer to the backend API documentation.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Default | Required |
|--------|-------------|---------|----------|
| `VITE_API_BASE_URL` | License server API base URL | `http://localhost:3000/api` | Yes |
| `VITE_APP_NAME` | Application display name | `DigitalizePOS License Manager` | No |
| `VITE_APP_VERSION` | Application version | `1.0.0` | No |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `false` | No |

### Environment File Setup

1. Copy the example file (if available):
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_APP_NAME=DigitalizePOS License Manager
   VITE_APP_VERSION=1.0.0
   VITE_ENABLE_ANALYTICS=false
   ```

**Note**: All environment variables must be prefixed with `VITE_` to be accessible in the application. Changes to environment variables require a restart of the development server.

## Deployment

For comprehensive deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deployment Steps

1. **Set environment variables** for production
2. **Build the application**:
   ```bash
   npm run build
   ```
3. **Deploy the `dist` folder** to your hosting provider

### Recommended Hosting Options

- **Vercel**: Zero-config deployment for React apps with automatic HTTPS
- **Netlify**: Similar to Vercel with built-in CI/CD and form handling
- **VPS (DigitalOcean, AWS, etc.)**: Full control with Nginx/Apache configuration

### Production Checklist

- [ ] Environment variables configured
- [ ] API server URL is correct and accessible
- [ ] HTTPS enabled (required for production)
- [ ] CORS properly configured on API server
- [ ] Build succeeds without errors
- [ ] All tests passing
- [ ] Error tracking configured (optional)

## Browser Support

The application supports all modern browsers:

- **Chrome** (latest 2 versions)
- **Firefox** (latest 2 versions)
- **Safari** (latest 2 versions)
- **Edge** (latest 2 versions)

### Browser Requirements

- JavaScript enabled
- LocalStorage support
- Modern ES6+ features support

## Performance Optimizations

The application is optimized for performance with several strategies:

- **Code Splitting**: All routes are lazy-loaded using `React.lazy()` for smaller initial bundle
- **Tree Shaking**: Unused code is eliminated during build
- **Bundle Optimization**: Vite automatically optimizes and minifies production builds
- **Memoization**: Components are memoized to prevent unnecessary re-renders
- **Suspense Boundaries**: Loading states are handled efficiently with React Suspense
- **API Caching**: RTK Query provides automatic request caching and deduplication

### Bundle Size

- Initial bundle: Optimized for fast loading
- Route chunks: Loaded on-demand when navigating
- Vendor chunks: Separated for better caching

### Performance Best Practices

- Use React DevTools Profiler to identify performance bottlenecks
- Monitor bundle size with `npm run build` output
- Leverage browser DevTools Network tab for loading analysis

## Security

The application implements several security measures:

- **JWT Authentication**: Secure token-based authentication with automatic token refresh
- **Protected Routes**: Route-level authentication guards prevent unauthorized access
- **HTTPS**: Required in production environments
- **Input Validation**: Client-side validation with Zod schemas on all forms
- **XSS Protection**: React automatically escapes user input
- **Secure Storage**: JWT tokens stored securely in memory/localStorage
- **CORS**: Properly configured CORS on API server
- **Error Handling**: Sensitive information is not exposed in error messages

### Security Checklist

- [ ] HTTPS enabled in production
- [ ] Environment variables secured (not committed to version control)
- [ ] API tokens not exposed in client code
- [ ] CORS properly configured on API server
- [ ] Regular dependency updates for security patches

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
- Run `npm run build` to see detailed error messages
- Ensure all types are properly imported
- Check `tsconfig.json` configuration

**API requests failing**
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings on API server
- Verify API server is running and accessible
- Check browser console for detailed error messages

**Authentication not working**
- Verify JWT token is being stored correctly
- Check token expiration
- Ensure API server authentication endpoint is working

**Routes showing 404 on refresh**
- Ensure server is configured to serve `index.html` for all routes
- Check hosting platform redirect rules (see [DEPLOYMENT.md](./DEPLOYMENT.md))

**Environment variables not working**
- Ensure variables are prefixed with `VITE_`
- Restart development server after changing `.env`
- Rebuild application after changing production environment variables

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**:
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
4. **Write tests** for new features
5. **Run linting and tests**:
   ```bash
   npm run lint
   npm test
   ```
6. **Commit your changes** with descriptive commit messages
7. **Submit a pull request** with a clear description of changes

## License

Proprietary - DigitalizePOS