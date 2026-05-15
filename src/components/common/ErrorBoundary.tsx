import React from 'react';
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';

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
     
    console.error('[Dashboard ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'error.light',
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>{this.props.title || 'Something went wrong in this view.'}</AlertTitle>
            <Typography variant="body2" sx={{ mb: 2, display: 'block' }}>
              {String(this.state.error?.message || this.state.error || 'Unknown error')}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Button 
                size="small" 
                variant="contained" 
                color="error"
                onClick={this.handleReset}
                sx={{ borderRadius: 9999, fontWeight: 700 }}
              >
                Try again
              </Button>
            </Box>
          </Alert>
        </Box>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;

