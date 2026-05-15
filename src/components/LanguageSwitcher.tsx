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
          fontWeight: 600,
          borderRadius: 9999,
          borderColor: 'hairlineStrong',
          color: 'white',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'white',
          },
          px: 1.5,
          py: 0.5
        }}
      >
        <Typography
          component="span"
          sx={{
            mr: 1,
            fontWeight: 800,
            fontSize: '0.7rem',
            bgcolor: 'primary.main',
            color: 'secondary.main',
            px: 0.8,
            py: 0.2,
            borderRadius: '4px',
            lineHeight: 1
          }}
        >
          {oppositeLangCode === 'en' ? 'EN' : 'KO'}
        </Typography>
        <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
          {oppositeLangCode === 'en' ? t('language.english') : t('language.korean')}
        </Typography>
      </Button>
    </Box>
  );
};

export default LanguageSwitcher;
