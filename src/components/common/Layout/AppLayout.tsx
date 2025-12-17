import { ReactNode, useState, useCallback, memo, useEffect, useRef } from 'react';
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
  const { data: userInfo, refetch: refetchUserInfo } = useGetUserInfoQuery(undefined, {
    skip: !isAuthenticated, // Only fetch if authenticated
    refetchOnMountOrArgChange: true, // Always refetch on mount to get latest data
  });

  // Update Redux state when userInfo is fetched
  useEffect(() => {
    if (userInfo && isAuthenticated) {
      // Always update user data from API to ensure we have the latest phone number
      // This is critical for production where phone might be missing from initial login response
      if (user) {
        const hasPhoneFromAPI = userInfo.phone && userInfo.phone.trim() !== '';
        const phoneIsDifferent = userInfo.phone !== user.phone;
        const phoneIsMissing = !user.phone || user.phone.trim() === '';
        
        // Debug logging (remove in production if needed)
          console.log('UserInfo from API:', { phone: userInfo.phone, name: userInfo.name });
          console.log('Current user in state:', { phone: user?.phone, name: user?.name });
        
        if (hasPhoneFromAPI && (phoneIsDifferent || phoneIsMissing)) {
          dispatch(updateUser(userInfo));
        } else if (phoneIsMissing && !hasPhoneFromAPI) {
          // If phone is missing in state and API also doesn't have it, log for debugging
            console.warn('Phone number is missing in both state and API response');
        }
      } else {
        // If user doesn't exist in state but we have userInfo, update it
        // This shouldn't happen normally, but handles edge cases
        dispatch(updateUser(userInfo));
      }
    }
  }, [userInfo, isAuthenticated, user, dispatch]);
  
  // Force refetch once if user exists but phone is missing (only on mount)
  const hasAttemptedRefetch = useRef(false);
  useEffect(() => {
    if (isAuthenticated && user && (!user.phone || user.phone.trim() === '') && !hasAttemptedRefetch.current) {
      // Refetch user info to get phone number from server
      // Use a small delay to avoid race conditions
      hasAttemptedRefetch.current = true;
      const timer = setTimeout(() => {
        refetchUserInfo();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, refetchUserInfo]); // Include all dependencies

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