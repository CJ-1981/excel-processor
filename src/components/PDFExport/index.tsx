import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { TemplateSelector } from './TemplateSelector';
import { CustomFieldsDialog } from './CustomFieldsDialog';
import { BUILT_IN_TEMPLATES } from '../../templates/built-in';
import { generatePDF } from '../PDFGenerator/generator';
import { templateRequiresCustomFields } from '../../utils/templateParser';
import type { PDFGenerationContext } from '../../types';

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
  const [selectedTemplate, setSelectedTemplate] = useState(BUILT_IN_TEMPLATES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);

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
    await generatePDFInternal(selectedTemplate, contextWithFields);
    setShowCustomFields(false);
  };

  const generatePDFInternal = async (template: typeof selectedTemplate, ctx: PDFGenerationContext) => {
    setIsGenerating(true);
    try {
      await generatePDF(template, ctx);
      onClose();
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Main PDF Export Dialog */}
      <Dialog open={open && !showCustomFields} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Export as PDF</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {context.includedIndices.size} rows selected for export
          </Typography>
          <TemplateSelector
            templates={BUILT_IN_TEMPLATES}
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : needsCustomFields ? 'Next' : 'Export PDF'}
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
      />
    </>
  );
};
