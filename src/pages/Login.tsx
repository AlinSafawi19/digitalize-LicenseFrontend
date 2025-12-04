import { memo } from 'react';
import { LoginForm } from '../features/auth/components/LoginForm';

function LoginPageComponent() {
  return <LoginForm />;
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since LoginPage is a route component
export const LoginPage = memo(LoginPageComponent);