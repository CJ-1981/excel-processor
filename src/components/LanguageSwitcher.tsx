import React from 'react';
import { Button, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

// Flag emoji for languages
const FLAGS = {
  en: '🇺🇸', // US flag for English
  ko: '🇰🇷', // South Korea flag for Korean
};

/**
 * LanguageSwitcher Component
 *
 * Provides a button to toggle between English and Korean languages.
 * Displays the current language flag and the opposite language name.
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
  // Show the opposite flag and name (what clicking will switch to)
  const oppositeFlag = FLAGS[oppositeLangCode as keyof typeof FLAGS] || FLAGS.ko;
  const oppositeLang = currentLang === 'en' ? 'korean' : 'english';

  return (
    <Box sx={{ minWidth: 80 }}>
      <Button
        variant="outlined"
        size="small"
        onClick={handleLanguageToggle}
        startIcon={<span style={{ fontSize: '1.2rem' }}>{oppositeFlag}</span>}
        sx={{
          minWidth: 100,
          textTransform: 'none',
          fontWeight: 500,
        }}
      >
        {t(`language.${oppositeLang}`)}
      </Button>
    </Box>
  );
};

export default LanguageSwitcher;
