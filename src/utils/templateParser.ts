import type { PDFTemplate } from '../types';

export interface CustomFieldDefinition {
  key: string;
  type: 'text' | 'number' | 'boolean' | 'month-amount';
  label: string;
  defaultValue?: any;
}

/**
 * Extract all custom field definitions from a template
 * by parsing all sections for {{customFields.*}} patterns
 */
export function extractCustomFieldsFromTemplate(
  template: PDFTemplate
): CustomFieldDefinition[] {
  const fields = new Map<string, CustomFieldDefinition>();
  const regex = /\{\{customFields\.([^}]+)\}\}/g;

  // Helper function to process any string content
  const processContent = (content: string | undefined) => {
    if (!content) return;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      if (!fields.has(key)) {
        fields.set(key, createFieldDefinition(key, template.customFieldDefaults?.[key]));
      }
    }
  };

  // Scan all sections for custom fields
  for (const section of template.sections) {
    switch (section.type) {
      case 'header':
        processContent(section.title);
        processContent(section.subtitle);
        break;
      case 'text':
        processContent(section.content);
        break;
      case 'footer':
        processContent(section.left);
        processContent(section.center);
        processContent(section.right);
        break;
      case 'labeledField':
        processContent(section.label);
        processContent(section.value);
        break;
      case 'textBlock':
        processContent(section.content);
        break;
      case 'checkbox':
        processContent(section.label);
        if (typeof section.checked === 'string') {
          processContent(section.checked);
        }
        break;
      case 'customDataTable':
        if (section.substituteVariables !== false) {
          for (const row of section.rows) {
            for (const cell of row) {
              processContent(cell);
            }
          }
        }
        break;
    }
  }

  return Array.from(fields.values());
}

/**
 * Check if a template requires custom fields
 */
export function templateRequiresCustomFields(
  template: PDFTemplate
): boolean {
  return extractCustomFieldsFromTemplate(template).length > 0;
}

/**
 * Create a field definition based on the field key
 * Infers type and label from field name
 */
function createFieldDefinition(key: string, templateDefaultValue?: any): CustomFieldDefinition {
  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  // Determine type based on key
  let type: CustomFieldDefinition['type'] = 'text';
  if (monthKeys.includes(key.toLowerCase())) {
    type = 'month-amount';
  } else if (key.startsWith('is') || key.endsWith('Checked') || key.includes('option')) {
    type = 'boolean';
  } else if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('betrag')) {
    type = 'number';
  }

  // Generate label from key (camelCase to Title Case)
  const label = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  // Set default values for known fields
  // Use template-specific default if provided, otherwise use hardcoded defaults
  let defaultValue: any;
  if (templateDefaultValue !== undefined) {
    defaultValue = templateDefaultValue;
  } else if (key === 'signatureLocation') {
    defaultValue = 'Kelsterbach';
  } else if (key === 'verzichtNein') {
    defaultValue = true;
  } else if (key === 'verzichtJa') {
    defaultValue = false;
  } else if (key === 'taxOption2') {
    defaultValue = true;
  } else if (key === 'taxOption1') {
    defaultValue = false;
  } else if (key === 'notMembership') {
    defaultValue = true;
  } else if (key === 'taxNumber2') {
    defaultValue = '4525057301';
  } else if (key === 'taxDate2') {
    defaultValue = '29.04.2011';
  } else if (key === 'taxValidFrom') {
    defaultValue = '27.12.2016';
  }

  return {
    key,
    type,
    label,
    defaultValue,
  };
}
