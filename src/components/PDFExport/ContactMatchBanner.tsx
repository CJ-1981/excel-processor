/**
 * ContactMatchBanner Component
 *
 * Displays intelligent contact match suggestions with confidence scores
 * Shows non-intrusive alert banner with Apply/Ignore actions
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { MatchResult } from '../../types';

interface ContactMatchBannerProps {
  match: MatchResult | null;
  onApply: () => void;
  onIgnore: () => void;
}

export const ContactMatchBanner: React.FC<ContactMatchBannerProps> = ({
  match,
  onApply,
  onIgnore,
}) => {
  const { t } = useTranslation();

  // Don't render if no match
  if (!match) {
    return null;
  }

  const { contact, confidence, matchType } = match;

  // Format contact display name
  const getDisplayName = () => {
    if (contact.koreanName) {
      return `${contact.koreanName} (${contact.englishName})`;
    }
    return contact.englishName;
  };

  // Get match type color
  const getSeverity = () => {
    if (matchType === 'exact') {
      return 'success';
    }
    if (confidence >= 80) {
      return 'info';
    }
    return 'warning';
  };

  return (
    <Alert
      severity={getSeverity() as 'success' | 'info' | 'warning'}
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            color="inherit"
            onClick={onApply}
            sx={{ minWidth: 60 }}
          >
            {t('pdfExport.contacts.matchBanner.apply')}
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={onIgnore}
            sx={{ minWidth: 60 }}
          >
            {t('pdfExport.contacts.matchBanner.ignore')}
          </Button>
        </Box>
      }
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        {t('pdfExport.contacts.matchBanner.suggestion', {
          name: getDisplayName(),
          confidence: Math.round(confidence),
        })}
      </AlertTitle>
      <Typography variant="body2" color="text.secondary">
        {contact.address}
      </Typography>
    </Alert>
  );
};
