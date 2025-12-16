import { ReactNode, useState, useCallback, memo, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSessionExpiry } from '../../../hooks/useSessionExpiry';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { useGetUserInfoQuery } from '../../../features/auth/slice/authApi';
import { updateUser } from '../../../features/auth/slice/authSlice';

interface AppLayoutProps {
  children: ReactNode;
}

// Extract sx props to constants to prevent recreation on every render
const rootBoxSx = { display: 'flex', minHeight: '100vh' };
const contentBoxSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  width: { xs: '100%', md: 'calc(100% - 240px)' },
  minWidth: 0, // Prevents overflow on mobile
};
const containerSx = {
  flexGrow: 1,
  py: { xs: 1, md: 1.5 },
  px: { xs: 1.5, md: 2 },
  width: '100%',
  '& > *': {
    mb: 2.5,
  },
};

function AppLayoutComponent({ children }: AppLayoutProps) {
  // Monitor session expiry - shows warnings and handles logout
  useSessionExpiry();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Fetch user info on mount if authenticated to ensure we have the latest data
  const { data: userInfo } = useGetUserInfoQuery(undefined, {
    skip: !isAuthenticated, // Only fetch if authenticated
  });

  // Update Redux state when userInfo is fetched
  useEffect(() => {
    if (userInfo && isAuthenticated && user) {
      // Update if phone number is different, missing, or empty
      if (userInfo.phone && (userInfo.phone !== user.phone || !user.phone)) {
        dispatch(updateUser(userInfo));
      }
    }
  }, [userInfo, isAuthenticated, user, dispatch]);

  // Memoize the drawer toggle handler to prevent unnecessary re-renders of Header and Sidebar
  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <Box sx={rootBoxSx}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />
      <Box sx={contentBoxSx}>
        <Header onMenuClick={handleDrawerToggle} />
        <Container maxWidth="xl" sx={containerSx}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since AppLayout wraps all page content
export const AppLayout = memo(AppLayoutComponent);