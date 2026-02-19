import React, { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

// The component now takes a callback that receives a FileList
interface ExcelUploaderProps {
  onFilesUpload: (files: FileList) => void;
  disabled: boolean;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onFilesUpload, disabled }) => {
  const { t } = useTranslation();

  // We only keep track of the file names for display purposes
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const names = Array.from(files).map(file => file.name);
      setFileNames(names);
      onFilesUpload(files);
    }
  };

  const fileCount = fileNames.length;
  const buttonText = fileCount > 0
    ? t('uploader.changeButton', { count: fileCount })
    : t('uploader.button');

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>{t('uploader.title')}</Typography>
      <input
        accept=".xlsx, .xls, .csv"
        style={{ display: 'none' }}
        id="raised-button-file"
        multiple // Allow multiple file selection
        type="file"
        onChange={handleFileUpload}
        disabled={disabled}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span" disabled={disabled}>
          {buttonText}
        </Button>
      </label>
      {fileCount > 0 && (
        <Typography variant="body1" sx={{ mt: 1 }}>
          {t('uploader.selected')}: {fileNames.join(', ')}
        </Typography>
      )}
    </Box>
  );
};

export default ExcelUploader;

