import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CloudUploadOutlined,
  InsertDriveFile,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { detectColumns } from '../../utils/contactMatcher';
import * as XLSX from 'xlsx';
import type { ContactRecord } from '../../types';

interface ContactsUploaderProps {
  open: boolean;
  onClose: () => void;
  onContactsLoaded: (contacts: ContactRecord[]) => void;
  maxFileSize?: number; // in bytes, default 5MB
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

/**
 * Parses an Excel/CSV file and returns the data as array of objects
 */
const parseFile = async (file: File): Promise<any[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
};

/**
 * Contacts uploader component with drag-and-drop support.
 * Auto-detects columns using contactMatcher.detectColumns().
 */
export const ContactsUploader: React.FC<ContactsUploaderProps> = ({
  open,
  onClose,
  onContactsLoaded,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
}) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<ContactRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const validExtensions = ['.xlsx', '.xls', '.csv'];

    files.forEach(file => {
      const fileName = file.name.toLowerCase();
      const isValid = validExtensions.some(ext => fileName.endsWith(ext));

      if (!isValid) {
        errors.push(t('contacts.upload.invalidFileType', { fileName: file.name }));
        return;
      }

      if (file.size > maxFileSize) {
        errors.push(t('contacts.upload.fileTooLarge', {
          fileName: file.name,
          maxSize: formatFileSize(maxFileSize),
        }));
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const processFile = async (file: File): Promise<ContactRecord[]> => {
    const rows = await parseFile(file);

    if (rows.length < 2) {
      throw new Error(t('contacts.upload.noDataFound'));
    }

    // First row is headers
    const headers = rows[0] as string[];
    const data = rows.slice(1);

    // Auto-detect columns
    const mapping = detectColumns(headers);

    if (!mapping) {
      throw new Error(t('contacts.upload.cannotDetectColumns'));
    }

    // Map rows to ContactRecord objects
    const contacts: ContactRecord[] = [];
    const now = Date.now();

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const row of data) {
      const rowData = row as any[];

      // Get values using column mapping
      const koreanName = mapping.koreanName
        ? rowData[headers.indexOf(mapping.koreanName)]
        : undefined;
      const englishName = rowData[headers.indexOf(mapping.englishName)];
      const address = rowData[headers.indexOf(mapping.address)];
      const rawEmail = mapping.email
        ? rowData[headers.indexOf(mapping.email)]
        : undefined;

      // Skip rows without required fields
      if (!englishName || !address) continue;

      // Validate and clean email
      let email: string | undefined = undefined;
      if (rawEmail && typeof rawEmail === 'string' && rawEmail.trim()) {
        const trimmed = rawEmail.trim();
        if (emailRegex.test(trimmed)) {
          email = trimmed;
        }
      }

      contacts.push({
        id: crypto.randomUUID(),
        koreanName: koreanName || undefined,
        englishName: String(englishName).trim(),
        address: String(address).trim(),
        email,
        sourceFile: file.name,
        createdAt: now,
      });
    }

    if (contacts.length === 0) {
      throw new Error(t('contacts.upload.noValidContacts'));
    }

    return contacts;
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
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
        type: file.type,
      }));
      setSelectedFiles(fileInfo);

      // Process the first file
      setIsProcessing(true);
      try {
        const contacts = await processFile(valid[0]);
        setParsedContacts(contacts);
        setShowPreview(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setShowPreview(false);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [validateFiles, processFile, maxFileSize]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

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

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (parsedContacts.length > 0) {
      onContactsLoaded(parsedContacts);
      handleClose();
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setParsedContacts([]);
    setSelectedFiles([]);
  };

  const handleClose = () => {
    setShowPreview(false);
    setParsedContacts([]);
    setSelectedFiles([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {showPreview ? t('contacts.upload.previewTitle') : t('contacts.upload.title')}
      </DialogTitle>

      <DialogContent>
        {!showPreview ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'hairlineStrong',
              bgcolor: isDragging ? 'primary.light' : 'surface',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: alpha('#00ED64', 0.04)
              }
            }}
            onClick={handleButtonClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple={false}
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <CloudUploadOutlined sx={(theme) => ({ fontSize: 64, color: theme.palette.mode === 'light' ? '#2e7d32' : '#4caf50', mb: 2, opacity: 0.8 })} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
              {t('contacts.upload.dragDrop')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('contacts.upload.orClick')}
            </Typography>
            <Typography variant="caption" color="steel" sx={{ display: 'block', mt: 3, fontWeight: 500 }}>
              {t('contacts.upload.supportedFormats')}
            </Typography>
          </Paper>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t('contacts.upload.successMessage', { count: parsedContacts.length })}
              </Typography>
            </Alert>

            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
              {t('contacts.upload.preview')}
            </Typography>
            <Paper elevation={0} sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'hairline', borderRadius: 1 }}>
              {parsedContacts.slice(0, 5).map((contact, index) => (
                <Box
                  key={contact.id}
                  sx={{
                    p: 2,
                    borderBottom: index < Math.min(5, parsedContacts.length) - 1 ? '1px solid' : 0,
                    borderColor: 'hairlineSoft',
                    '&:hover': { bgcolor: 'surface' }
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {contact.englishName}
                    {contact.koreanName && (
                      <Typography component="span" variant="body2" sx={{ color: 'steel', ml: 1, fontWeight: 400 }}>
                        ({contact.koreanName})
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="body2" color="slate">
                    {contact.address}
                  </Typography>
                  {contact.email && (
                    <Typography variant="caption" sx={(theme) => ({ color: theme.palette.mode === 'light' ? '#2e7d32' : '#4caf50', fontWeight: 700, display: 'block', mt: 0.5 })}>
                      {contact.email}
                    </Typography>
                  )}
                </Box>
              ))}
              {parsedContacts.length > 5 && (
                <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'surface' }}>
                  <Chip
                    size="small"
                    label={t('contacts.upload.moreContacts', { count: parsedContacts.length - 5 })}
                    sx={{ fontWeight: 600, bgcolor: 'secondary.main', color: 'white' }}
                  />
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {selectedFiles.length > 0 && !showPreview && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'surface', borderRadius: 2, border: '1px solid', borderColor: 'hairline' }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'steel', fontWeight: 800, textTransform: 'uppercase' }}>
              {t('contacts.upload.selectedFile')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <InsertDriveFile color="success" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedFiles[0].name}</Typography>
              <Typography variant="caption" color="steel">
                ({formatFileSize(selectedFiles[0].size)})
              </Typography>
            </Box>
          </Box>
        )}

        {isProcessing && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {t('contacts.upload.processing')}
            </Typography>
            <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={isProcessing} sx={{ borderRadius: 9999 }}>
          {showPreview ? t('common.cancel') : t('common.close')}
        </Button>
        {showPreview && (
          <>
            <Button onClick={handleCancel} disabled={isProcessing} sx={{ borderRadius: 9999 }}>
              {t('common.back')}
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={isProcessing}
              startIcon={<CheckCircle />}
              sx={{ borderRadius: 9999, px: 3, fontWeight: 700 }}
            >
              {t('contacts.upload.confirm')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
