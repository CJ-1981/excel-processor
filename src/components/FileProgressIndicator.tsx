import { Box, LinearProgress, Typography, Paper, Alert } from '@mui/material';
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
      elevation={2}
      sx={{
        p: 3,
        mt: 4,
        width: '100%',
        maxWidth: 600,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
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
        <Typography variant="h6" component="div">
          {getStageText()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasErrors ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
              <ErrorIcon fontSize="small" />
              <Typography variant="body2" color="error">
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
          height: 10,
          borderRadius: 5,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
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
        <Typography variant="body2" color="text.secondary">
          {t('progress.processed', { completed, total, plural: total === 1 ? '' : 's' })}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight="medium">
          {Math.round(percentage)}%
        </Typography>
      </Box>

      {/* Error summary (if there are errors) */}
      {hasErrors && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          <Typography variant="body2">
            {t('progress.failed', { count: errors.length })}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}
