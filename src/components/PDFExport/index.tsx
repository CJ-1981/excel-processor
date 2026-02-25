import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TemplateSelector } from './TemplateSelector';
import { CustomFieldsDialog } from './CustomFieldsDialog';
import { ContactsUploader } from './ContactsUploader';
import { ContactsManageDialog } from './ContactsManageDialog';
import { BUILT_IN_TEMPLATES } from '../../templates/built-in';
import { generatePDF } from '../PDFGenerator/generator';
import { templateRequiresCustomFields } from '../../utils/templateParser';
import type { PDFGenerationContext, ContactRecord, ContactsState } from '../../types';
import { warn } from '../../utils/logger';

const CONTACTS_STORAGE_KEY = 'excel-processor-contacts';

interface PDFExportDialogProps {
  open: boolean;
  onClose: () => void;
  context: PDFGenerationContext;
}

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  open,
  onClose,
  context,
}) => {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState(BUILT_IN_TEMPLATES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [pdfSuccessOpen, setPdfSuccessOpen] = useState(false);

  // Contacts state management
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [showContactsUploader, setShowContactsUploader] = useState(false);
  const [showContactsManage, setShowContactsManage] = useState(false);

  // Load contacts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (saved) {
      try {
        const data: ContactsState = JSON.parse(saved);
        setContacts(data.contacts);
      } catch (e) {
        warn('PDFExport', 'Failed to load contacts from storage:', e);
      }
    }
  }, []);

  // Save contacts to localStorage when they change
  useEffect(() => {
    if (contacts.length > 0) {
      const data: ContactsState = {
        contacts,
        version: '1.0',
      };
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(data));
    }
  }, [contacts]);

  // Handle contacts loaded from uploader
  const handleContactsLoaded = (newContacts: ContactRecord[]) => {
    // Merge with existing contacts (deduplicate by englishName)
    const existingNames = new Set(contacts.map(c => c.englishName.toLowerCase()));
    const uniqueNewContacts = newContacts.filter(c => !existingNames.has(c.englishName.toLowerCase()));

    setContacts(prev => [...prev, ...uniqueNewContacts]);
  };

  // Check if template needs custom fields
  const needsCustomFields = templateRequiresCustomFields(selectedTemplate);

  const handleExport = async () => {
    if (needsCustomFields) {
      // Show custom fields dialog
      setShowCustomFields(true);
    } else {
      // Generate PDF directly
      await generatePDFInternal(selectedTemplate, context);
    }
  };

  const handleCustomFieldsConfirm = async (customFields: Record<string, string | number>, textColor: string) => {
    // Add customFields and textColor to context
    const contextWithFields = { ...context, customFields, textColor };
    setIsGenerating(true);
    try {
      await generatePDF(selectedTemplate, contextWithFields);
      // Show success message
      setPdfSuccessOpen(true);
      // Check if email is filled (could be donorEmail or email key)
      const hasEmail = (customFields.donorEmail || customFields.email) && String(customFields.donorEmail || customFields.email).trim() !== '';
      if (!hasEmail) {
        // No email filled, close custom fields dialog and go back to template selection
        setShowCustomFields(false);
      }
      // If email is filled, keep custom fields dialog open so user can click "Send Email"
    } catch (error) {
      warn('PDFExport', 'PDF generation failed:', error);
      alert(t('pdfExport.failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Callback when email is sent - close all dialogs
  const handleEmailSent = () => {
    setShowCustomFields(false);
    onClose();
  };

  const generatePDFInternal = async (template: typeof selectedTemplate, ctx: PDFGenerationContext) => {
    setIsGenerating(true);
    try {
      await generatePDF(template, ctx);
      // Show success message
      setPdfSuccessOpen(true);
    } catch (error) {
      warn('PDFExport', 'PDF generation failed:', error);
      alert(t('pdfExport.failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Main PDF Export Dialog */}
      <Dialog open={open && !showCustomFields} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('pdfExport.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('pdfExport.rowsSelected', { count: context.includedIndices.size })}
          </Typography>
          <TemplateSelector
            templates={BUILT_IN_TEMPLATES}
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isGenerating}>
            {t('pdfExport.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={isGenerating}
          >
            {isGenerating ? t('pdfExport.generating') : needsCustomFields ? t('pdfExport.next') : t('pdfExport.exportPdf')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Fields Dialog */}
      <CustomFieldsDialog
        open={showCustomFields}
        onClose={() => setShowCustomFields(false)}
        onConfirm={handleCustomFieldsConfirm}
        context={context}
        template={selectedTemplate}
        contacts={contacts}
        onContactsUploadClick={() => setShowContactsUploader(true)}
        onContactsManageClick={() => setShowContactsManage(true)}
        onEmailSent={handleEmailSent}
      />

      {/* Contacts Upload Dialog */}
      <ContactsUploader
        open={showContactsUploader}
        onClose={() => setShowContactsUploader(false)}
        onContactsLoaded={handleContactsLoaded}
      />

      {/* Contacts Manage Dialog */}
      <ContactsManageDialog
        open={showContactsManage}
        onClose={() => setShowContactsManage(false)}
        contacts={contacts}
        onUpdateContacts={(updated) => setContacts(updated)}
      />

      {/* PDF Success Message */}
      <Snackbar
        open={pdfSuccessOpen}
        autoHideDuration={3000}
        onClose={() => setPdfSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setPdfSuccessOpen(false)}>
          {t('pdfExport.success')}
        </Alert>
      </Snackbar>
    </>
  );
};
