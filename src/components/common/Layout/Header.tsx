import { AppBar, Toolbar, Typography, Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Logout as LogoutIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { logout } from '../../../features/auth/slice/authSlice';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../config/routes';
import { useLogoutMutation } from '../../../features/auth/slice/authApi';
import { memo, useCallback } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

// Extract sx props to constants to prevent recreation on every render
const menuButtonSx = { mr: 2 };
const titleSx = { flexGrow: 1 };
const userBoxSx = { display: 'flex', alignItems: 'center', gap: 2 };
const phoneSx = { display: { xs: 'none', sm: 'block' } };

function HeaderComponent({ onMenuClick }: HeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  // Optimize useSelector: only select user instead of entire auth state
  // This prevents re-renders when other auth state properties change
  const user = useSelector((state: RootState) => state.auth.user);
  const [logoutMutation] = useLogoutMutation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Memoize the logout handler to prevent unnecessary re-renders
  const handleLogout = useCallback(async () => {
    try {
      // Call the logout API endpoint
      await logoutMutation().unwrap();
    } catch (error) {
      // Even if the API call fails, we should still clear local state
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state and redirect
      dispatch(logout());
      navigate(routes.login);
    }
  }, [logoutMutation, dispatch, navigate]);

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={menuButtonSx}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="div" sx={titleSx}>
          License Manager
        </Typography>
        {user && (
          <Box sx={userBoxSx}>
            {user.phone && (
              <Typography variant="body2" sx={phoneSx}>
                {user.phone}
              </Typography>
            )}
            <IconButton color="inherit" onClick={handleLogout} size="small">
              <LogoutIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since Header is rendered on every page
export const Header = memo(HeaderComponent);