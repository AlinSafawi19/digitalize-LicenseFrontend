import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, useMediaQuery, useTheme, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  VpnKey as LicenseIcon,
  Devices as ActivationIcon,
  CardMembership as SubscriptionIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Tune as PreferencesIcon,
} from '@mui/icons-material';
import { routes } from '../../../config/routes';
import { memo, useCallback, useMemo } from 'react';

const drawerWidth = 240;

// Use icon components instead of JSX elements to prevent recreation
interface MenuItem {
  text: string;
  Icon: React.ComponentType;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', Icon: DashboardIcon, path: routes.dashboard },
  { text: 'Licenses', Icon: LicenseIcon, path: routes.licenses.list },
  { text: 'Activations', Icon: ActivationIcon, path: routes.activations.list },
  { text: 'Subscriptions', Icon: SubscriptionIcon, path: routes.subscriptions.list },
  { text: 'Payments', Icon: PaymentIcon, path: routes.payments.list },
  { text: 'Settings', Icon: SettingsIcon, path: routes.settings },
  { text: 'Preferences', Icon: PreferencesIcon, path: routes.preferences },
];

// Extract sx props to constants to prevent recreation on every render
const navBoxSx = { width: { md: drawerWidth }, flexShrink: { md: 0 } };
const logoContainerSx = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 1 };
const logoImageSx = {
  height: '40px',
  width: 'auto',
  maxWidth: '100%',
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
};
const mobileDrawerSx = {
  display: { xs: 'block', md: 'none' },
  '& .MuiDrawer-paper': {
    boxSizing: 'border-box',
    width: drawerWidth,
  },
};
const desktopDrawerSx = {
  display: { xs: 'none', md: 'block' },
  '& .MuiDrawer-paper': {
    boxSizing: 'border-box',
    width: drawerWidth,
  },
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarComponent({ mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Memoize navigation handlers to prevent unnecessary re-renders
  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
      if (isMobile) {
        onMobileClose();
      }
    },
    [navigate, isMobile, onMobileClose]
  );

  const handleLogoClick = useCallback(() => {
    navigate(routes.dashboard);
    if (isMobile) {
      onMobileClose();
    }
  }, [navigate, isMobile, onMobileClose]);

  // Memoize menu item click handlers to prevent recreation on every render
  const menuItemHandlers = useMemo(
    () =>
      menuItems.reduce(
        (acc, item) => {
          acc[item.path] = () => handleNavigation(item.path);
          return acc;
        },
        {} as Record<string, () => void>
      ),
    [handleNavigation]
  );

  // Memoize drawer content to prevent recreation when only location changes
  // Location is used for selected state, which is handled by ListItemButton
  const drawerContent = useMemo(
    () => (
      <>
        <Toolbar>
          <Box sx={logoContainerSx}>
            <Box
              component="img"
              src="/logo.svg"
              alt="DigitalizePOS Logo"
              onClick={handleLogoClick}
              sx={logoImageSx}
            />
          </Box>
        </Toolbar>
        <List>
          {menuItems.map((item) => {
            const Icon = item.Icon;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={menuItemHandlers[item.path]}
                >
                  <ListItemIcon>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </>
    ),
    [location.pathname, handleLogoClick, menuItemHandlers]
  );

  return (
    <Box component="nav" sx={navBoxSx}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={mobileDrawerSx}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer variant="permanent" sx={desktopDrawerSx} open>
        {drawerContent}
      </Drawer>
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders when parent re-renders
// This is especially important since Sidebar is rendered on every page
export const Sidebar = memo(SidebarComponent);