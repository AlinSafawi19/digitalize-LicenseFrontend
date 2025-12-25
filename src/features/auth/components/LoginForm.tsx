import { useState, memo, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';
import { useLoginMutation, useGetUserInfoQuery } from '../slice/authApi';
import { setCredentials, updateUser } from '../slice/authSlice';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../config/routes';
import { LoginCredentials } from '../../../types/auth.types';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required'),
});

// Extract sx props to constants to prevent recreation on every render
const containerBoxSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  bgcolor: 'background.default',
};
const cardSx = { maxWidth: 400, width: '100%' };
const cardContentSx = { p: 2 };
const logoContainerSx = { display: 'flex', justifyContent: 'center', mb: 2 };
const logoImageSx = { height: '50px', width: 'auto', display: 'block' };
const subtitleTypographySx = { mb: 2.5 };
const alertSx = { mb: 2.5 };
const submitButtonSx = { mt: 1.5, mb: 1 };

// Error message constant
const DEFAULT_ERROR_MESSAGE = 'Login failed. Please check your credentials.';

function LoginFormComponent() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  // Get the getUserInfo query hook - we'll trigger it manually after login
  const { refetch: refetchUserInfo } = useGetUserInfoQuery(undefined, { skip: true });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  // Memoize the form submit handler to prevent recreation on every render
  const onSubmit = useCallback(
    async (data: LoginCredentials) => {
      try {
        setError(null);
        const result = await login(data).unwrap();
        dispatch(setCredentials(result));
        
        // Refresh user info from server to ensure we have the latest data (especially phone number)
        // This is important because the login response might not always include the phone number
        try {
          const userInfoResult = await refetchUserInfo().unwrap();
          if (userInfoResult && userInfoResult.phone) {
            dispatch(updateUser(userInfoResult));
          } else if (userInfoResult) {
            // If we got userInfo but no phone, still update (phone might be null in DB)
            dispatch(updateUser(userInfoResult));
          }
        } catch (userInfoError) {
          // If getUserInfo fails, continue anyway - we already have user data from login
          console.warn('Failed to refresh user info after login:', userInfoError);
        }
        
        navigate(routes.dashboard);
      } catch (err: unknown) {
        const error = err as { data?: { message?: string } };
        setError(error?.data?.message || DEFAULT_ERROR_MESSAGE);
      }
    },
    [login, dispatch, navigate, refetchUserInfo]
  );

  // Memoize the toggle password handler to prevent recreation on every render
  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Memoize InputProps to prevent recreation on every render
  const passwordInputProps = useMemo(
    () => ({
      endAdornment: (
        <InputAdornment position="end">
          <IconButton onClick={handleTogglePassword} edge="end">
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    }),
    [showPassword, handleTogglePassword]
  );

  return (
    <Box sx={containerBoxSx}>
      <Card sx={cardSx}>
        <CardContent sx={cardContentSx}>
          <Box sx={logoContainerSx}>
            <Box
              component="img"
              src="https://downloads.digitalizepos.com/admin-panel-logo.svg"
              alt="DigitalizePOS Logo"
              sx={logoImageSx}
            />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            License Manager
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={subtitleTypographySx}>
            Sign in to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={alertSx}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('username')}
              label="Username"
              type="text"
              fullWidth
              margin="normal"
              error={!!errors.username}
              helperText={errors.username?.message}
              autoComplete="username"
            />
            <TextField
              {...register('password')}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              autoComplete="current-password"
              InputProps={passwordInputProps}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={submitButtonSx}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
export const LoginForm = memo(LoginFormComponent);