import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  Chip,
  Alert,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import type { ContactRecord } from '../../types';

interface ContactsManageDialogProps {
  open: boolean;
  onClose: () => void;
  contacts: ContactRecord[];
  onUpdateContacts: (contacts: ContactRecord[]) => void;
}

/**
 * Contact management dialog with table view, bulk delete, and export functionality.
 */
export const ContactsManageDialog: React.FC<ContactsManageDialogProps> = ({
  open,
  onClose,
  contacts,
  onUpdateContacts,
}) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAllMode, setDeleteAllMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset selection and focus when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setSearchTerm('');

      // Auto-focus search input with a small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          // Force a cursor placement at the end
          const len = searchInputRef.current.value.length;
          searchInputRef.current.setSelectionRange(len, len);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Filter contacts by search term
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;

    const term = searchTerm.toLowerCase();
    return contacts.filter(
      contact =>
        contact.englishName.toLowerCase().includes(term) ||
        (contact.koreanName && contact.koreanName.toLowerCase().includes(term)) ||
        contact.address.toLowerCase().includes(term) ||
        (contact.email && contact.email.toLowerCase().includes(term))
    );
  }, [contacts, searchTerm]);

  // Select/deselect all contacts
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredContacts]);

  // Toggle individual contact selection
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Delete selected contacts
  const handleDeleteSelected = useCallback(() => {
    setDeleteAllMode(false);
    setShowDeleteConfirm(true);
  }, []);

  // Delete all contacts
  const handleDeleteAll = useCallback(() => {
    setDeleteAllMode(true);
    setShowDeleteConfirm(true);
  }, []);

  // Confirm deletion
  const handleConfirmDelete = useCallback(() => {
    let updatedContacts: ContactRecord[];

    if (deleteAllMode) {
      updatedContacts = [];
    } else {
      updatedContacts = contacts.filter(c => !selectedIds.has(c.id));
    }

    onUpdateContacts(updatedContacts);
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);

    if (updatedContacts.length === 0) {
      onClose();
    }
  }, [deleteAllMode, contacts, selectedIds, onUpdateContacts, onClose]);

  // Export contacts to CSV
  const handleExportCSV = useCallback(() => {
    if (contacts.length === 0) return;

    const headers = ['Korean Name', 'English Name', 'Address', 'Email', 'Source File'];
    const rows = contacts.map(c => [
      c.koreanName || '',
      c.englishName,
      c.address,
      c.email || '',
      c.sourceFile || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Add UTF-8 BOM for Excel to properly detect encoding for Korean characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [contacts]);

  const allSelected = filteredContacts.length > 0 && selectedIds.size === filteredContacts.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ 
          sx: { 
            height: 700,
            borderRadius: 2,
            bgcolor: 'background.paper'
          } 
        }}
      >
        <DialogTitle sx={{ p: 3, borderBottom: '1px solid', borderColor: 'hairline' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>{t('contacts.manage.title')}</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Chip
                label={t('contacts.manage.totalCount', { count: contacts.length })}
                sx={(theme) => ({
                  bgcolor: theme.palette.mode === 'dark' ? '#1976d2' : '#e3f2fd',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#0d47a1',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: theme.palette.mode === 'dark' ? '2px solid #42a5f5' : '1px solid #1976d2',
                  fontSize: '0.813rem',
                  height: 26,
                })}
                size="small"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={contacts.length === 0}
                sx={{ borderRadius: 9999, borderColor: 'hairlineStrong', color: 'text.secondary' }}
              >
                {t('contacts.manage.export')}
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <TextField
              fullWidth
              autoFocus
              inputRef={searchInputRef}
              placeholder={t('contacts.manage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'steel' }} fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  height: 44,
                  '& fieldset': { borderColor: 'hairlineStrong' },
                }
              }}
            />
            {selectedIds.size > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                sx={{ borderRadius: 9999, px: 3, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {t('contacts.manage.deleteSelected', { count: selectedIds.size })}
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteAll}
              disabled={contacts.length === 0}
              sx={{ borderRadius: 9999, px: 3, fontWeight: 700, whiteSpace: 'nowrap', borderColor: 'error.light' }}
            >
              {t('contacts.manage.deleteAll')}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            {t('contacts.manage.showingCount', {
              count: filteredContacts.length,
              total: contacts.length,
            })}
          </Typography>

          <TableContainer 
            component={Paper} 
            elevation={0}
            sx={{ 
              flex: 1, 
              overflow: 'auto',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'hairline',
              bgcolor: 'background.paper'
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 50, bgcolor: 'surface', borderBottom: '1px solid', borderColor: 'hairline' }}>
                    <Checkbox
                      indeterminate={someSelected}
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      sx={(theme) => ({
                        color: theme.palette.mode === 'dark' ? '#a5d6a7' : '#8d6e63',
                        '&.Mui-checked': {
                          color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32',
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(76, 175, 80, 0.08)'
                            : 'rgba(46, 125, 50, 0.08)',
                        },
                        '&.Mui-checked:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(76, 175, 80, 0.16)'
                            : 'rgba(46, 125, 50, 0.16)',
                        },
                      })}
                    />
                  </TableCell>
                  <TableCell sx={{ width: 60, bgcolor: 'surface', borderBottom: '1px solid', borderColor: 'hairline' }} />
                  <TableCell sx={{ bgcolor: 'surface', fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderColor: 'hairline' }}>{t('contacts.manage.koreanName')}</TableCell>
                  <TableCell sx={{ bgcolor: 'surface', fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderColor: 'hairline' }}>{t('contacts.manage.englishName')}</TableCell>
                  <TableCell sx={{ bgcolor: 'surface', fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderColor: 'hairline' }}>{t('contacts.manage.address')}</TableCell>
                  <TableCell sx={{ bgcolor: 'surface', fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderColor: 'hairline' }}>{t('contacts.manage.email')}</TableCell>
                  <TableCell sx={{ bgcolor: 'surface', fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderColor: 'hairline' }}>{t('contacts.manage.source')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" variant="body1">
                        {searchTerm ? t('contacts.manage.noSearchResults') : t('contacts.manage.noContacts')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      hover
                      selected={selectedIds.has(contact.id)}
                      onClick={() => handleToggleSelect(contact.id)}
                      sx={{ 
                        cursor: 'pointer',
                        '&.Mui-selected': {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }
                        }
                      }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()} sx={{ borderBottom: '1px solid', borderColor: 'hairlineSoft' }}>
                        <Checkbox
                          checked={selectedIds.has(contact.id)}
                          onChange={() => handleToggleSelect(contact.id)}
                          sx={(theme) => ({
                            color: theme.palette.mode === 'dark' ? '#a5d6a7' : '#8d6e63',
                            '&.Mui-checked': {
                              color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32',
                            },
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(76, 175, 80, 0.08)'
                                : 'rgba(46, 125, 50, 0.08)',
                            },
                            '&.Mui-checked:hover': {
                              backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(76, 175, 80, 0.16)'
                                : 'rgba(46, 125, 50, 0.16)',
                            },
                          })}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'hairlineSoft' }}>
                        <PersonIcon sx={{ color: 'steel' }} fontSize="small" />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'hairlineSoft', fontWeight: 600 }}>{contact.koreanName || '-'}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'hairlineSoft', fontWeight: 600 }}>{contact.englishName}</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'hairlineSoft' }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 250, color: 'text.secondary' }}
                          title={contact.address}
                        >
                          {contact.address}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'hairlineSoft' }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 180, color: 'primary.main', fontWeight: 600 }}
                          title={contact.email || ''}
                        >
                          {contact.email || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid', borderColor: 'hairlineSoft' }}>
                        {contact.sourceFile && (
                          <Chip 
                            size="small" 
                            label={contact.sourceFile} 
                            variant="outlined" 
                            sx={{ 
                              fontSize: '0.65rem', 
                              height: 20, 
                              borderColor: 'hairlineStrong',
                              color: 'text.secondary'
                            }} 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {contacts.length > 0 && (
            <Alert
              severity="info"
              sx={(theme) => ({
                mt: 3,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? '#0d47a1' : '#e3f2fd',
                border: theme.palette.mode === 'dark' ? '2px solid #42a5f5' : '1px solid #1976d2',
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#0d47a1',
                '& .MuiAlert-icon': {
                  color: theme.palette.mode === 'dark' ? '#42a5f5' : '#1976d2',
                },
                '& .MuiAlert-message': {
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#0d47a1',
                  fontWeight: 600,
                },
              })}
            >
              <Typography
                variant="body2"
                sx={(theme) => ({
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#0d47a1',
                })}
              >
                {t('contacts.manage.lastImport', {
                  date: new Date(contacts[0].createdAt).toLocaleDateString(),
                })}
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'hairline' }}>
          <Button 
            onClick={onClose} 
            variant="contained" 
            color="primary" 
            sx={{ borderRadius: 9999, px: 4, fontWeight: 700 }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>
          {deleteAllMode
            ? t('contacts.manage.deleteAllTitle')
            : t('contacts.manage.deleteSelectedTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {deleteAllMode
              ? t('contacts.manage.deleteAllConfirm')
              : t('contacts.manage.deleteSelectedConfirm', { count: selectedIds.size })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
