import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import {
  CloudUploadOutlined,
  Description,
  Delete,
  InsertDriveFile
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ExcelUploaderProps {
  onFilesUpload: (files: File[]) => void;
  disabled: boolean;
}

// Store actual File objects instead of just metadata
// to preserve file data for removal and re-upload scenarios
type FileInfo = File;

// @MX:NOTE - React automatically escapes JSX content to prevent XSS attacks.
// For non-React contexts requiring HTML escaping, use: div.textContent = text; return div.innerHTML;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'csv') {
    return <Description color="info" />;
  }
  return <InsertDriveFile color="success" />;
};

/**
 * Enhanced file uploader component with drag-and-drop support.
 * Displays selected files with icons, sizes, and remove buttons.
 */
const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onFilesUpload, disabled }) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const validExtensions = ['.xlsx', '.xls', '.csv'];

    files.forEach(file => {
      const fileName = file.name.toLowerCase();
      const isValid = validExtensions.some(ext => fileName.endsWith(ext));
      if (isValid) {
        valid.push(file);
      } else {
        errors.push(`"${file.name}" is not a valid Excel or CSV file`);
      }
    });

    return { valid, errors };
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setError(errors.join('; '));
    } else {
      setError(null);
    }

    if (valid.length > 0) {
      // Store actual File objects to preserve file data
      setSelectedFiles(valid);

      // Pass the File[] directly
      onFilesUpload(valid);
    }
  }, [onFilesUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    // Reset file input value to ensure change event fires even if same file is selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    // Update the parent component with remaining files
    onFilesUpload(newFiles);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleButtonClick();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
        {t('uploader.title')}
      </Typography>

      <input
        accept=".xlsx, .xls, .csv"
        style={{ display: 'none' }}
        id="excel-file-input"
        multiple
        type="file"
        onChange={handleFileInputChange}
        disabled={disabled}
        ref={fileInputRef}
      />

      <Paper
        elevation={isDragging ? 8 : 2}
        role="button"
        aria-label={t('uploader.dragDrop')}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          opacity: disabled ? 0.6 : 1,
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!disabled ? handleButtonClick : undefined}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
          <CloudUploadOutlined
            sx={{
              fontSize: { xs: 48, sm: 56, md: 64 },
              color: isDragging ? 'primary.main' : 'text.secondary',
              transition: 'color 0.3s ease'
            }}
          />
          <Box>
            <Typography variant="h6" color="text.primary" sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
              {isDragging ? t('uploader.dropFiles') : t('uploader.dragDrop')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('uploader.orClick')}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            {t('uploader.supportedFormats')}
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {selectedFiles.length > 0 && (
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            {t('uploader.selectedFiles', { count: selectedFiles.length })}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.75, sm: 1 } }}>
            {selectedFiles.map((file, index) => (
              <Chip
                key={index}
                icon={getFileIcon(file.name)}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={(e) => handleRemoveFile(index, e)}
                deleteIcon={<Delete aria-label="Delete" />}
                variant="outlined"
                size="medium"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ExcelUploader;
