import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
  error?: any;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // eslint-disable-next-line no-console
    console.error('[Dashboard ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            <AlertTitle>{this.props.title || 'Something went wrong in this view.'}</AlertTitle>
            {String(this.state.error?.message || this.state.error || 'Unknown error')}
            <Box sx={{ mt: 1 }}>
              <Button size="small" variant="outlined" onClick={this.handleReset}>Try again</Button>
            </Box>
          </Alert>
        </Box>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;

