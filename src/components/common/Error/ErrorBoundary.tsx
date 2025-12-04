import { Component, ErrorInfo, ReactNode, PureComponent } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Extract error UI to separate component to prevent recreation on every render
interface ErrorDisplayProps {
  error: Error | null;
  onReset: () => void;
}

class ErrorDisplay extends PureComponent<ErrorDisplayProps> {
  render() {
    const { error, onReset } = this.props;
    return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          textAlign="center"
          p={3}
        >
          <Typography variant="h4" gutterBottom color="error">
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button variant="contained" onClick={onReset} sx={{ mt: 2 }}>
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (consider adding error reporting service in production)
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  // Prevent unnecessary re-renders when props change but error state hasn't
  shouldComponentUpdate(_nextProps: Props, nextState: State): boolean {
    // Only re-render if error state changes or if we're resetting from error state
    return (
      this.state.hasError !== nextState.hasError ||
      this.state.error !== nextState.error
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}