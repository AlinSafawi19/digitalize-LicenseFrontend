import { createTheme } from '@mui/material/styles';

/**
 * Material-UI theme configuration.
 *
 * Performance optimizations:
 * 1. Module-level constant: The theme is created once when the module is first imported
 *    and then cached by the module system, avoiding recreation.
 * 2. Extracted constants: Common values (colors, spacing) are extracted to constants
 *    to reduce object recreation and improve maintainability.
 * 3. Single theme creation: createTheme() is called once, and the resulting theme object
 *    is reused across all components via ThemeProvider.
 * 4. Optimized component overrides: Component style overrides are defined once and
 *    applied consistently, reducing runtime style calculations.
 */

// Extract common values to constants for better performance and maintainability
const BORDER_COLOR_LIGHT = '#e0e0e0';
const BORDER_COLOR_MEDIUM = '#d0d0d0';
const BACKGROUND_COLOR_LIGHT = '#f5f5f5';
const BACKGROUND_COLOR_HOVER = '#f9f9f9';
const BACKGROUND_COLOR_SELECTED = '#e8eaf6';
const INPUT_PADDING = '6px 10px';
const INPUT_PADDING_IMPORTANT = '6px 10px !important';
const MENU_ITEM_PADDING = '6px 12px';
const MENU_ITEM_MIN_HEIGHT = '32px';
const LIST_ITEM_BUTTON_PADDING = '6px 12px';
const LIST_ITEM_BUTTON_MIN_HEIGHT = '36px';
const LIST_ITEM_ICON_MIN_WIDTH = '36px';
const CARD_CONTENT_PADDING = '12px';
const DIALOG_PADDING_HORIZONTAL = '12px 16px';
const DIALOG_ACTIONS_PADDING = '8px 16px';
const TABLE_CELL_PADDING = '8px 12px';
const TOOLBAR_MIN_HEIGHT = '48px';
const TOOLBAR_PADDING = '0 12px';
const CHIP_HEIGHT = '24px';
const ALERT_PADDING = '8px 12px';
const BORDER_LEFT_SELECTED = '3px solid #1a237e';
const BORDER_BOTTOM_HEAD = '2px solid #d0d0d0';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
      light: '#534bae',
      dark: '#000051',
    },
    secondary: {
      main: '#424242',
      light: '#6d6d6d',
      dark: '#1b1b1b',
    },
    success: {
      main: '#1b5e20',
      light: '#4caf50',
      dark: '#003300',
    },
    warning: {
      main: '#e65100',
      light: '#ff833a',
      dark: '#ac1900',
    },
    error: {
      main: '#c62828',
      light: '#ff5f52',
      dark: '#8e0000',
    },
    info: {
      main: '#455a64',
      light: '#718792',
      dark: '#1c313a',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 0,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          padding: '4px 12px',
          minHeight: '28px',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          border: `1px solid ${BORDER_COLOR_LIGHT}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          border: `1px solid ${BORDER_COLOR_LIGHT}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${BORDER_COLOR_LIGHT}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: 'none',
          borderRight: `1px solid ${BORDER_COLOR_LIGHT}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            padding: INPUT_PADDING,
            '& fieldset': {
              borderColor: BORDER_COLOR_MEDIUM,
            },
            '& input': {
              padding: INPUT_PADDING,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          padding: INPUT_PADDING,
          '& input': {
            padding: INPUT_PADDING,
          },
        },
        input: {
          padding: INPUT_PADDING,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          padding: INPUT_PADDING_IMPORTANT,
          '& input': {
            padding: INPUT_PADDING_IMPORTANT,
          },
        },
        input: {
          padding: INPUT_PADDING_IMPORTANT,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          padding: INPUT_PADDING,
          '& .MuiSelect-select': {
            padding: INPUT_PADDING,
          },
        },
        select: {
          padding: INPUT_PADDING,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          padding: MENU_ITEM_PADDING,
          minHeight: MENU_ITEM_MIN_HEIGHT,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: TABLE_CELL_PADDING,
          borderBottom: `1px solid ${BORDER_COLOR_LIGHT}`,
        },
        head: {
          backgroundColor: BACKGROUND_COLOR_LIGHT,
          fontWeight: 600,
          borderBottom: BORDER_BOTTOM_HEAD,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: BACKGROUND_COLOR_HOVER,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          padding: LIST_ITEM_BUTTON_PADDING,
          minHeight: LIST_ITEM_BUTTON_MIN_HEIGHT,
          '&.Mui-selected': {
            backgroundColor: BACKGROUND_COLOR_SELECTED,
            borderLeft: BORDER_LEFT_SELECTED,
            '&:hover': {
              backgroundColor: BACKGROUND_COLOR_SELECTED,
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: LIST_ITEM_ICON_MIN_WIDTH,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: CARD_CONTENT_PADDING,
          '&:last-child': {
            paddingBottom: CARD_CONTENT_PADDING,
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: TOOLBAR_MIN_HEIGHT,
          padding: TOOLBAR_PADDING,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: 'none',
          border: `1px solid ${BORDER_COLOR_LIGHT}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          height: CHIP_HEIGHT,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: ALERT_PADDING,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: DIALOG_PADDING_HORIZONTAL,
          borderBottom: `1px solid ${BORDER_COLOR_LIGHT}`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: DIALOG_PADDING_HORIZONTAL,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: DIALOG_ACTIONS_PADDING,
          borderTop: `1px solid ${BORDER_COLOR_LIGHT}`,
          gap: '8px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: BORDER_COLOR_LIGHT,
        },
      },
    },
  },
});