import { Box, LinearProgress, Typography, Paper, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { ParseProgress } from '../types';
import { useTranslation } from 'react-i18next';

interface FileProgressIndicatorProps {
  /** Progress information */
  progress: ParseProgress;
}

/**
 * Displays file processing progress with a progress bar and counter.
 *
 * Shows:
 * - Linear progress bar with percentage
 * - File counter (e.g., "Processed 15 of 53 files")
 * - Current processing stage
 * - Error count badge if there are errors
 */
export default function FileProgressIndicator({ progress }: FileProgressIndicatorProps) {
  const { t } = useTranslation();

  const { total, completed, stage, errors } = progress;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const hasErrors = errors.length > 0;

  const getStageText = () => {
    switch (stage) {
      case 'reading':
        return t('progress.reading');
      case 'parsing':
        return t('progress.parsing');
      default:
        return t('progress.processing');
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mt: 4,
        width: '100%',
        maxWidth: 600,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'hairline',
        boxShadow: '0px 8px 24px rgba(0, 30, 43, 0.08)'
      }}
    >
      {/* Header with stage and status icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {getStageText()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {hasErrors ? (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                color: 'error.main',
                bgcolor: alpha('#d32f2f', 0.1),
                px: 1,
                py: 0.25,
                borderRadius: 9999
              }}
            >
              <ErrorIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {t('progress.error', { count: errors.length })}
              </Typography>
            </Box>
          ) : null}
          {completed === total && total > 0 && !hasErrors && (
            <CheckCircleIcon color="success" fontSize="small" />
          )}
        </Box>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 12,
          borderRadius: 6,
          backgroundColor: 'surface',
          border: '1px solid',
          borderColor: 'hairline',
          '& .MuiLinearProgress-bar': {
            borderRadius: 6,
            backgroundColor: (theme) => theme.palette.mode === 'light' ? '#2e7d32' : '#4caf50',
          }
        }}
      />

      {/* File counter and percentage */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="body2" sx={{ color: 'steel', fontWeight: 500 }}>
          {t('progress.processed', { completed, total, plural: total === 1 ? '' : 's' })}
        </Typography>
        <Typography variant="h6" sx={(theme) => ({ color: theme.palette.mode === 'light' ? '#2e7d32' : '#4caf50', fontWeight: 700 })}>
          {Math.round(percentage)}%
        </Typography>
      </Box>

      {/* Error summary (if there are errors) */}
      {hasErrors && (
        <Alert severity="warning" sx={{ mt: 1, borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t('progress.failed', { count: errors.length })}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}
