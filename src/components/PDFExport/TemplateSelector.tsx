import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { PDFTemplate } from '../../types';

interface TemplateSelectorProps {
  templates: PDFTemplate[];
  selectedTemplate: PDFTemplate;
  onTemplateChange: (template: PDFTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateChange,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const template = templates.find(t => t.id === event.target.value);
    if (template) onTemplateChange(template);
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel>PDF Template</InputLabel>
      <Select
        value={selectedTemplate.id}
        label="PDF Template"
        onChange={handleChange}
      >
        {templates.map(template => (
          <MenuItem key={template.id} value={template.id}>
            {template.name} - {template.description}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
