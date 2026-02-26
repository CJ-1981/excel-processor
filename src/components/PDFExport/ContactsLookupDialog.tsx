import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { findMatchingContacts, normalizeString } from '../../utils/contactMatcher';
import type { ContactRecord } from '../../types';

interface ContactsLookupDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contact: ContactRecord) => void;
  contacts: ContactRecord[];
  initialSearchTerm?: string;
}

const ITEM_HEIGHT = 72; // Height of each contact item

/**
 * Searchable contacts lookup with fuzzy matching.
 * Supports fuzzy matching for both Korean and English names.
 */
export const ContactsLookupDialog: React.FC<ContactsLookupDialogProps> = ({
  open,
  onClose,
  onSelect,
  contacts,
  initialSearchTerm = '',
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset search term when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm(initialSearchTerm);
      setSelectedIndex(0);
      // Auto-focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open, initialSearchTerm]);

  // Perform fuzzy search with debouncing
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      // Return all contacts if no search term
      return contacts.map(contact => ({
        contact,
        confidence: 100,
        matchType: 'exact' as const,
      }));
    }
    return findMatchingContacts(searchTerm, contacts);
  }, [searchTerm, contacts]);

  // Highlight matching text in the search result
  const highlightMatch = useCallback((text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const normalizedText = normalizeString(text);
    const normalizedQuery = normalizeString(query);
    const index = normalizedText.indexOf(normalizedQuery);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <>
        {before}
        <mark style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>{match}</mark>
        {after}
      </>
    );
  }, []);

  // Handle contact selection
  const handleSelect = useCallback((contact: ContactRecord) => {
    onSelect(contact);
    onClose();
  }, [onSelect, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults.length > 0 && searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex].contact);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [searchResults, selectedIndex, handleSelect, onClose]);

  // Render a single contact item
  const renderContactItem = useCallback((contact: ContactRecord, index: number, isSelected: boolean) => {
    const isBestMatch = index === 0 && searchTerm;
    // Get confidence from precomputed searchResults instead of recalculating
    const searchResult = searchResults.find(r => r.contact.id === contact.id);
    const confidence = searchResult ? searchResult.confidence : 100;

    return (
      <Paper
        key={contact.id}
        elevation={isSelected ? 4 : 1}
        sx={{
          p: 2,
          mb: 1,
          cursor: 'pointer',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          bgcolor: isSelected ? 'action.selected' : 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          height: contact.email ? ITEM_HEIGHT : ITEM_HEIGHT - 8,
          boxSizing: 'border-box',
        }}
        onClick={() => handleSelect(contact)}
      >
        <PersonIcon color="action" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {highlightMatch(contact.englishName, searchTerm)}
          </Typography>
          {contact.koreanName && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {highlightMatch(contact.koreanName, searchTerm)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {contact.address}
          </Typography>
          {contact.email && (
            <Typography variant="caption" color="primary" noWrap display="block">
              {contact.email}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          {searchTerm && confidence < 100 && (
            <Chip
              size="small"
              label={`${confidence}%`}
              color={confidence >= 80 ? 'success' : confidence >= 60 ? 'warning' : 'default'}
            />
          )}
          {isBestMatch && (
            <Chip size="small" label={t('contacts.lookup.bestMatch')} color="primary" />
          )}
        </Box>
      </Paper>
    );
  }, [searchTerm, highlightMatch, handleSelect, t]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { height: 500 } }}>
      <DialogTitle>{t('contacts.lookup.title')}</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
        <TextField
          ref={searchInputRef}
          fullWidth
          placeholder={t('contacts.lookup.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
          sx={{ mb: 2 }}
          autoFocus
        />

        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {t('contacts.lookup.resultCount', { count: searchResults.length })}
        </Typography>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {searchResults.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                {t('contacts.lookup.noResults')}
              </Typography>
            </Paper>
          ) : (
            <Box>
              {searchResults.map((result, index) => (
                <div key={result.contact.id}>
                  {renderContactItem(
                    result.contact,
                    index,
                    index === selectedIndex
                  )}
                </div>
              ))}
            </Box>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {t('contacts.lookup.keyboardHint')}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};
