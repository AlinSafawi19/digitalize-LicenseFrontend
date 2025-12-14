import { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Typography, Paper, Alert, IconButton, Button, Divider, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon, Check as CheckIcon, Info as InfoIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LicenseForm } from '../../components/license/LicenseForm';
import { useCreateLicenseMutation } from '../../api/licenseApi';
import { CreateLicenseInput, UpdateLicenseInput } from '../../types/license.types';
import { routes } from '../../config/routes';

// Constants
const COPIED_TIMEOUT = 2000; // 2 seconds
const ERROR_DEFAULT = 'Failed to create license. Please try again.';

// Extract sx props to constants to prevent recreation on every render
const successPaperSx = { p: 2, maxWidth: 600, mx: 'auto' };
const successAlertSx = { mb: 2.5 };
const licenseKeyBoxSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  p: 1.5,
  bgcolor: 'background.default',
  borderRadius: 0,
  border: '1px solid #e0e0e0',
  mb: 2.5,
};
const licenseKeyTypographySx = {
  fontFamily: 'monospace',
  flexGrow: 1,
  wordBreak: 'break-all',
};
const saveMessageSx = { mb: 2.5 };
const dividerSx = { my: 2.5 };
const infoAlertSx = { mb: 2.5 };
const alertListSx = { mt: 1, mb: 1, pl: 2.5 };
const buttonsBoxSx = { display: 'flex', gap: 2, justifyContent: 'flex-end' };
const headerBoxSx = { display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 };
const backIconButtonSx = { mr: -1 };
const errorAlertSx = { mb: 2.5 };
const formPaperSx = { p: 1.5 };

export const LicenseCreatePage = () => {
  const navigate = useNavigate();
  const [createLicense, { isLoading }] = useCreateLicenseMutation();
  const [generatedLicenseKey, setGeneratedLicenseKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Memoize handleSubmit to prevent recreation on every render
  const handleSubmit = useCallback(
    async (data: CreateLicenseInput | UpdateLicenseInput) => {
      try {
        setError(null);
        const result = await createLicense(data as CreateLicenseInput).unwrap();
        setGeneratedLicenseKey(result.licenseKey);
      } catch (err: unknown) {
        const error = err as { data?: { message?: string } };
        setError(error?.data?.message || ERROR_DEFAULT);
      }
    },
    [createLicense]
  );

  // Memoize handleCopyToClipboard to prevent recreation on every render
  const handleCopyToClipboard = useCallback(async () => {
    if (!generatedLicenseKey) return;

    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(generatedLicenseKey);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, COPIED_TIMEOUT);
    } catch (err) {
      console.error('Failed to copy license key:', err);
    }
  }, [generatedLicenseKey]);

  // Memoize handleClose to prevent recreation on every render
  const handleClose = useCallback(() => {
    navigate(routes.licenses.list);
  }, [navigate]);

  // Memoize navigation handlers to prevent recreation on every render
  const handleBack = useCallback(() => {
    navigate(routes.licenses.list);
  }, [navigate]);

  // Memoize error close handler to prevent recreation on every render
  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  if (generatedLicenseKey) {
    return (
      <Box>
        <Paper sx={successPaperSx}>
          <Alert severity="success" sx={successAlertSx}>
            License created successfully!
          </Alert>
          <Typography variant="h6" gutterBottom>
            Generated License Key
          </Typography>
          <Box sx={licenseKeyBoxSx}>
            <Typography variant="body1" sx={licenseKeyTypographySx}>
              {generatedLicenseKey}
            </Typography>
            <Tooltip title="Copy the license key to clipboard. The customer needs this key to activate the license in the desktop application. This key will not be shown again after you close this page.">
              <IconButton onClick={handleCopyToClipboard} color="primary" size="small">
                {copied ? <CheckIcon /> : <CopyIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={saveMessageSx}>
            Please save this license key. It will not be shown again.
          </Typography>

          <Divider sx={dividerSx} />

          <Alert severity="info" icon={<InfoIcon />} sx={infoAlertSx}>
            <Typography variant="body2" component="div">
              <strong>Desktop App Login Credentials:</strong>
              <br />
              When the customer activates this license in the DigitalizePOS Desktop app, an admin user account will be automatically created.
              <br />
              <br />
              The login credentials (username and password) will be:
              <Box component="ul" sx={alertListSx}>
                <li>Generated automatically from the customer's phone number and name</li>
                <li>Displayed on the license activation screen in the desktop app</li>
                <li>Sent via WhatsApp to the customer's phone number</li>
                <li>Shown only once during the first activation</li>
              </Box>
              <strong>Important:</strong> The customer must save these credentials when they activate the license, as they will need them to log in to the desktop application.
            </Typography>
          </Alert>

          <Box sx={buttonsBoxSx}>
            <Button onClick={handleClose} variant="outlined">
              Close
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={headerBoxSx}>
        <IconButton onClick={handleBack} aria-label="go back" sx={backIconButtonSx}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Create New License</Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={errorAlertSx} onClose={handleErrorClose}>
          {error}
        </Alert>
      )}
      <Paper sx={formPaperSx}>
        <Alert severity="info" sx={infoAlertSx}>
          <Typography variant="body2" component="div">
            <strong>What happens when you create a license:</strong>
            <Box component="ul" sx={alertListSx}>
              <li>A unique license key will be generated automatically</li>
              <li>An initial payment record will be created (unless it's a free trial)</li>
              <li>An annual subscription period will be created starting from today</li>
              <li>The license will be set to 'active' status</li>
              <li>The customer can immediately use the license key to activate the desktop application</li>
              <li>An admin user account will be automatically created when the customer activates the license</li>
            </Box>
          </Typography>
        </Alert>
        <LicenseForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Create License" />
      </Paper>
    </Box>
  );
};