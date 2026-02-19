import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * LanguageSwitcher Component
 *
 * Provides a button to toggle between English and Korean languages.
 * Simple text-based design with country code and language name.
 * Click to switch to the other language.
 * Persists the selected language in localStorage.
 */
const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageToggle = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'en' ? 'ko' : 'en';
    i18n.changeLanguage(newLang);
    // Save to localStorage
    localStorage.setItem('excel-processor-language', newLang);
  };

  const currentLang = i18n.language;
  // Get the opposite language code
  const oppositeLangCode = currentLang === 'en' ? 'ko' : 'en';

  return (
    <Box sx={{ minWidth: 80 }}>
      <Button
        variant="outlined"
        size="small"
        onClick={handleLanguageToggle}
        sx={{
          minWidth: 100,
          textTransform: 'none',
          fontWeight: 500,
        }}
      >
        <Typography
          component="span"
          sx={{
            mr: 0.5,
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '0.75rem',
            bgcolor: 'action.hover',
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
          }}
        >
          {oppositeLangCode === 'en' ? 'EN' : 'KO'}
        </Typography>
        {oppositeLangCode === 'en' ? t('language.english') : t('language.korean')}
      </Button>
    </Box>
  );
};

export default LanguageSwitcher;
