import React, { useState, useCallback, useMemo } from 'react';
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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
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

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setSearchTerm('');
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
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: 600 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('contacts.manage.title')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={t('contacts.manage.totalCount', { count: contacts.length })}
                color="primary"
                size="small"
              />
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={contacts.length === 0}
              >
                {t('contacts.manage.export')}
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder={t('contacts.manage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
            {selectedIds.size > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
              >
                {t('contacts.manage.deleteSelected', { count: selectedIds.size })}
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteAll}
              disabled={contacts.length === 0}
            >
              {t('contacts.manage.deleteAll')}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary">
            {t('contacts.manage.showingCount', {
              count: filteredContacts.length,
              total: contacts.length,
            })}
          </Typography>

          <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ width: 50 }}>
                    <Checkbox
                      indeterminate={someSelected}
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ width: 60 }} />
                  <TableCell>{t('contacts.manage.koreanName')}</TableCell>
                  <TableCell>{t('contacts.manage.englishName')}</TableCell>
                  <TableCell>{t('contacts.manage.address')}</TableCell>
                  <TableCell>{t('contacts.manage.email')}</TableCell>
                  <TableCell>{t('contacts.manage.source')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
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
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(contact.id)}
                          onChange={() => handleToggleSelect(contact.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <PersonIcon color="action" fontSize="small" />
                      </TableCell>
                      <TableCell>{contact.koreanName || '-'}</TableCell>
                      <TableCell>{contact.englishName}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 300 }}
                          title={contact.address}
                        >
                          {contact.address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 200 }}
                          title={contact.email || ''}
                        >
                          {contact.email || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {contact.sourceFile && (
                          <Chip size="small" label={contact.sourceFile} variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {contacts.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                {t('contacts.manage.lastImport', {
                  date: new Date(contacts[0].createdAt).toLocaleDateString(),
                })}
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{t('common.close')}</Button>
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
