import { ReactNode, useState, useCallback, memo } from 'react';
import { Box, Container } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSessionExpiry } from '../../../hooks/useSessionExpiry';

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