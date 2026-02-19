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
  onFilesUpload: (files: FileList) => void;
  disabled: boolean;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

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
      const fileInfo: FileInfo[] = valid.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      setSelectedFiles(fileInfo);

      // Convert back to FileList-like structure for the callback
      const fileList = valid.reduce((acc, file) => {
        acc.push(file);
        return acc;
      }, [] as File[]);

      // Create a new FileList-like object
      const dataTransfer = new DataTransfer();
      fileList.forEach(file => dataTransfer.items.add(file));
      onFilesUpload(dataTransfer.files);
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
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    // Update the parent component with remaining files
    if (newFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      newFiles.forEach(fileInfo => {
        // Create a new File object from the stored info
        const file = new File([], fileInfo.name, { type: fileInfo.type });
        dataTransfer.items.add(file);
      });
      onFilesUpload(dataTransfer.files);
    } else {
      // Send empty FileList
      const dataTransfer = new DataTransfer();
      onFilesUpload(dataTransfer.files);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        {t('uploader.title')}
      </Typography>

      <Paper
        elevation={isDragging ? 8 : 2}
        sx={{
          p: 4,
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CloudUploadOutlined
            sx={{
              fontSize: 64,
              color: isDragging ? 'primary.main' : 'text.secondary',
              transition: 'color 0.3s ease'
            }}
          />
          <Box>
            <Typography variant="h6" color="text.primary">
              {isDragging ? t('uploader.dropFiles') : t('uploader.dragDrop')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('uploader.orClick')}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
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
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('uploader.selectedFiles', { count: selectedFiles.length })}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedFiles.map((file, index) => (
              <Chip
                key={index}
                icon={getFileIcon(file.name)}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={(e) => handleRemoveFile(index, e)}
                deleteIcon={<Delete />}
                variant="outlined"
                size="medium"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ExcelUploader;
