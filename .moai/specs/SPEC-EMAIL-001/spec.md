# SPEC-EMAIL-001: PDF Export Email Integration

## Metadata

| Field | Value |
|-------|-------|
| **SPEC ID** | SPEC-EMAIL-001 |
| **Title** | PDF Export Email Integration |
| **Created** | 2026-02-25 |
| **Status** | Completed |
| **Priority** | High |
| **Assigned** | - |
| **Related SPECs** | SPEC-CONTACTS-001 (Contacts Management), SPEC-SIGNATURE-001 (PDF Signatures) |

## Environment

### Project Context

**Project:** Excel Processor - An Excel-to-PDF donation receipt generator

**Current Architecture:**
- Frontend: React 19 with TypeScript, Material-UI v7 components
- PDF Generation: jsPDF library with autotable plugin
- Template System: JSON-based template configuration with section types
- State Management: React useState hooks
- Custom Fields: Dialog-based form for user input
- Contacts System: Excel upload, name/address matching, localStorage persistence

**Key Files:**
- `src/types.ts` - TypeScript type definitions (ContactRecord, etc.)
- `src/components/PDFExport/CustomFieldsDialog.tsx` - Custom fields UI with Contacts integration
- `src/components/PDFExport/index.tsx` - PDF export context and generation
- `src/components/PDFExport/ContactsLookupDialog.tsx` - Contacts search dialog
- `src/utils/contactMatcher.ts` - Column detection and matching logic
- `src/i18n/locales/en.json` - English translations
- `src/templates/built-in.ts` - Built-in template configurations

### Technical Constraints

**Client-Side Only Architecture:**
- Application runs entirely in browser (no backend processing)
- All data processing happens locally for privacy
- Email sending requires external service integration

**Email Sending Limitations:**
- Browser's `mailto:` protocol does NOT support file attachments
- Direct SMTP from browser exposes credentials (security risk)
- Requires third-party email service for reliable email+attachment sending

**PDF Generation:**
- PDFs are generated client-side using jsPDF
- PDF data available as Blob or Base64 string
- File size: Typically 50-500KB per receipt PDF

**Contacts System:**
- Contacts stored in localStorage as ContactRecord[] array
- Current ContactRecord has: id, koreanName, englishName, address, sourceFile, createdAt
- Email detection: contactMatcher.ts already excludes email columns from address matching

## Assumptions

### Technical Assumptions

**Assumption 1:** EmailJS SDK can be integrated into existing React application
- **Confidence:** High (EmailJS provides React/TypeScript SDK)
- **Evidence Basis:** EmailJS documentation, npm package @emailjs/browser
- **Risk if Wrong:** Primary email implementation approach would fail
- **Validation Method:** Verify EmailJS SDK compatibility with React 19, TypeScript 5.9

**Assumption 2:** EmailJS supports PDF attachments via Base64 encoding
- **Confidence:** High (EmailJS documents attachment support)
- **Evidence Basis:** EmailJS documentation on attachments parameter
- **Risk if Wrong:** PDF attachment feature would not work
- **Validation Method:** Create test with EmailJS send function including Base64 PDF

**Assumption 3:** ContactRecord can be extended with optional email field
- **Confidence:** High (TypeScript interfaces support optional properties)
- **Evidence Basis:** ContactRecord already has optional koreanName field
- **Risk if Wrong:** Would require migration of existing contacts data
- **Validation Method:** Review contacts storage format and add migration logic

**Assumption 4:** Users want to preview email content before sending
- **Confidence:** High (standard UX pattern for email sending)
- **Evidence Basis:** User requirement mentions "email input field... allowing users to modify"
- **Risk if Wrong:** Minor - can add preview dialog in Phase 2
- **Validation Method:** Include preview dialog in MVP design

### User Experience Assumptions

**Assumption 5:** Email button should be next to "Export PDF" button in CustomFieldsDialog
- **Confidence:** High (explicit user requirement)
- **Evidence Basis:** User requirement: "Add a 'Send Email' button next to the 'Export PDF' button"
- **Risk if Wrong:** None (explicitly specified)
- **Validation Method:** None required

**Assumption 6:** Email templates should support placeholder variables (donor name, amount, etc.)
- **Confidence:** High (follows existing PDF template variable pattern)
- **Evidence Basis:** User requirement: "with placeholders for donor name, amount, etc."
- **Risk if Wrong:** Would reduce flexibility of email templates
- **Validation Method:** None required (established pattern in PDF templates)

**Assumption 7:** Email sending should be optional, not mandatory for PDF export
- **Confidence:** High (user workflow requirement)
- **Evidence Basis:** Standard UX pattern - email is additional action, not replacement for export
- **Risk if Wrong:** Users forced to use email feature
- **Validation Method:** Design as separate button, not replacement for Export PDF

### Integration Assumptions

**Assumption 8:** Email sending occurs after PDF generation (PDF → Email flow)
- **Confidence:** High (logical workflow dependency)
- **Evidence Basis:** PDF must be generated before it can be attached
- **Risk if Wrong:** Would require alternative architecture
- **Validation Method:** Design flow: Export PDF → Generate PDF Blob → Open Email Dialog → Send

**Assumption 9:** Email service credentials should be configurable (not hardcoded)
- **Confidence:** High (security and flexibility requirement)
- **Evidence Basis:** Best practice for external service integration
- **Risk if Wrong:** Hardcoded credentials would be security vulnerability
- **Validation Method:** Store EmailJS config in environment variables or settings UI

## Requirements (EARS Format)

### REQ-EMAIL-001: Email Button in Custom Fields Dialog

**WHEN** the PDF export custom fields dialog is displayed, **THE SYSTEM SHALL** render a "Send Email" button next to the existing "Export PDF" button in the dialog actions area.

**Button Behavior:**
- Button text: "Send Email" / "이메일 보내기" (translated)
- Button variant: outlined or contained (distinct from "Export PDF")
- Clicking the button **SHALL** validate required email fields
- **IF** validation passes, **THE SYSTEM SHALL** generate PDF and open email composition dialog
- **IF** validation fails, **THE SYSTEM SHALL** display error message

**Validation Requirements:**
- Recipient email address is required
- **IF** no recipient email available, **THE SYSTEM SHALL** prompt user to enter email address

### REQ-EMAIL-002: Email Address Detection from Contacts

**WHEN** a contact is selected from the contacts list, **THE SYSTEM SHALL** automatically extract and populate the email address field if the contact contains an email address.

**Detection Logic:**
- ContactRecord **SHALL** include optional `email?: string` field
- **WHEN** user selects contact via ContactsLookupDialog, **THE SYSTEM SHALL** populate email field
- **IF** selected contact has no email, **THE SYSTEM SHALL** leave email field empty for manual entry
- Auto-matching **SHALL** use same confidence threshold (80%) as existing address matching

**Column Detection:**
- contactMatcher.ts **SHALL** detect email columns from Excel headers
- Email column patterns: 'email', 'e-mail', '이메일', '메일', 'mail', '@'
- Detected email column **SHALL** be imported into ContactRecord.email field

### REQ-EMAIL-003: Dynamic Email Input Field

**WHEN** the email composition dialog is displayed, **THE SYSTEM SHALL** provide an editable email input field under the donor name and address fields.

**Field Requirements:**
- Label: "Email" / "이메일" (translated)
- Placeholder: "recipient@example.com"
- Type: email input (browser validation)
- Validation: Required field, email format validation
- Editable: User can modify auto-detected email address
- Autocomplete: Browser email autocomplete support

**Field Placement:**
- Position: In email composition dialog, below donor address field
- Same styling as existing donor name/address fields in CustomFieldsDialog

### REQ-EMAIL-004: PDF Attachment to Email

**WHEN** the user sends an email, **THE SYSTEM SHALL** automatically attach the exported PDF document to the email.

**Attachment Requirements:**
- PDF generated with current custom field values
- Filename format: `{donorName}_Donation_Receipt_{date}.pdf`
- File size: Generated PDF (typically 50-500KB)
- Encoding: Base64 for EmailJS attachment
- **IF** PDF generation fails, **THE SYSTEM SHALL** display error and prevent email sending

**Technical Implementation:**
- Use EmailJS attachments parameter
- Convert PDF Blob to Base64 Data URL
- Extract Base64 data after comma prefix
- Pass to EmailJS send() function

### REQ-EMAIL-005: Email Template System

**THE SYSTEM SHALL** provide built-in email templates for subject and body with support for placeholder variable substitution.

**Template Structure:**
```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;      // Supports {{donorName}}, {{amount}}, {{date}}
  body: string;         // Supports {{donorName}}, {{amount}}, {{date}}, {{organization}}
}
```

**Supported Placeholders:**
- `{{donorName}}` - Donor's English name
- `{{amount}}` - Total donation amount
- `{{date}}` - Current date (German format: DD.MM.YYYY)
- `{{organization}}` - Organization name (configurable)
- `{{period}}` - Donation period (e.g., "January 2025 - December 2025")

**Default Templates:**
1. German donation receipt template (formal, German language)
2. English donation receipt template (formal, English language)
3. Korean donation receipt template (formal, Korean language)

**Template Selection:**
- Auto-select based on application language (i18next language)
- User can select alternate template via dropdown

### REQ-EMAIL-006: Email Composition Dialog

**WHEN** the user clicks "Send Email" button, **THE SYSTEM SHALL** display an email composition dialog with pre-filled recipient, subject, and body.

**Dialog Fields:**
- **To:** Recipient email address (auto-detected from contact, editable)
- **Subject:** Email subject from template (editable)
- **Body:** Email body from template (multiline text area, editable)
- **Attachment:** Read-only display of attached PDF filename

**Dialog Actions:**
- **Send Email:** Send email via EmailJS and close dialog
- **Cancel:** Close dialog without sending
- **Back:** Return to custom fields dialog

**Validation:**
- Recipient email required and valid format
- Subject required
- Body required
- **IF** validation fails, **THE SYSTEM SHALL** highlight invalid fields and prevent sending

### REQ-EMAIL-007: Email Service Integration (EmailJS)

**THE SYSTEM SHALL** integrate EmailJS service for sending emails with PDF attachments from the client-side application.

**EmailJS Configuration:**
- Service ID: Configurable (user-provided)
- Template ID: Configurable (user-provided)
- Public Key: Configurable (user-provided)
- Configuration stored in localStorage or environment variables

**Email Sending Process:**
1. Validate email fields (recipient, subject, body)
2. Convert PDF Blob to Base64
3. Call EmailJS send() with parameters
4. Display loading state during send
5. **IF** successful, display success message and close dialog
6. **IF** failed, display error message with details

**Error Handling:**
- Network errors: Display retry option
- EmailJS quota exceeded: Display quota message
- Invalid configuration: Display setup instructions
- Attachment too large: Display size error and prevent sending

### REQ-EMAIL-008: Internationalization Support

**THE SYSTEM SHALL** provide translation keys for all email-related UI elements in English, German, and Korean.

**Required Translation Keys:**
- `pdfExport.email.sendButton` - "Send Email" / "이메일 보내기" / "E-Mail senden"
- `pdfExport.email.dialogTitle` - "Send Receipt via Email" / "영수증 이메일로 보내기"
- `pdfExport.email.toLabel` - "To:" / "받는 사람:" / "An:"
- `pdfExport.email.subjectLabel` - "Subject:" / "제목:" / "Betreff:"
- `pdfExport.email.bodyLabel` - "Message:" / "메시지:" / "Nachricht:"
- `pdfExport.email.attachmentLabel` - "Attachment:" / "첨부파일:" / "Anhang:"
- `pdfExport.email.sending` - "Sending..." / "보내는 중..." / "Wird gesendet..."
- `pdfExport.email.success` - "Email sent successfully!" / "이메일이 성공적으로 전송되었습니다!"
- `pdfExport.email.error` - "Failed to send email. Please try again." / "이메일 전송에 실패했습니다. 다시 시도해주세요."
- `pdfExport.email.noEmailError` - "Please enter a recipient email address." / "받는 사람 이메일 주소를 입력해주세요."
- `pdfExport.email.configRequired` - "Email service is not configured. Please contact administrator."

### REQ-EMAIL-009: Email Configuration Settings

**WHERE** email service configuration is required, **THE SYSTEM SHALL** provide a settings interface for EmailJS credentials.

**Configuration Fields:**
- EmailJS Service ID
- EmailJS Template ID
- EmailJS Public Key
- Organization Name (for email templates)

**Storage:**
- Configuration stored in localStorage: `emailServiceConfig`
- **IF** configuration missing, display setup prompt
- Configuration optional (feature disabled if not configured)

**Security:**
- Public key only (no private credentials stored)
- Configuration validation before sending
- Clear error messages for invalid config

## Specifications

### Type Definitions (src/types.ts)

```typescript
// Add email field to ContactRecord
export interface ContactRecord {
  id: string;
  koreanName?: string;
  englishName: string;
  address: string;
  email?: string;              // NEW: Optional email address
  sourceFile?: string;
  createdAt: number;
}

// Email template types
export interface EmailTemplate {
  id: string;
  name: string;
  language: 'en' | 'de' | 'ko';
  subject: string;      // Supports {{placeholders}}
  body: string;         // Supports {{placeholders}}
}

export interface EmailServiceConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  organizationName?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  attachment?: {
    filename: string;
    content: string;  // Base64 data
  };
}
```

### Email Templates Configuration (src/email-templates.ts)

```typescript
import type { EmailTemplate } from '../types';

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'german-donation-receipt',
    name: 'German Donation Receipt',
    language: 'de',
    subject: 'Ihre Zuwendungsbestätigung für {{year}}',
    body: `Sehr geehrte/r {{donorName}},

anbei erhalten Sie Ihre Zuwendungsbestätigung für das Jahr {{year}}.

Gespendeter Betrag: {{amount}} €
Zeitraum: {{period}}

Vielen Dank für Ihre Unterstützung!

Mit freundlichen Grüßen
{{organization}}`
  },
  {
    id: 'english-donation-receipt',
    name: 'English Donation Receipt',
    language: 'en',
    subject: 'Your Donation Receipt for {{year}}',
    body: `Dear {{donorName}},

Please find attached your donation receipt for the year {{year}}.

Total Amount: {{amount}}
Period: {{period}}

Thank you for your generous support!

Best regards
{{organization}}`
  },
  {
    id: 'korean-donation-receipt',
    name: 'Korean Donation Receipt',
    language: 'ko',
    subject: '{{year}}년도 기부금 영수증',
    body: `{{donorName}}님,

{{year}}년도 기부금 영수증을 첨부해 드립니다.

기부 금액: {{amount}}
기부 기간: {{period}}

후원해 주셔서 감사합니다!

{{organization}} 드림`
  }
];

// Template variable substitution function
export function substituteEmailVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value);
  }
  return result;
}
```

### ContactMatcher Enhancements (src/utils/contactMatcher.ts)

```typescript
// Add email column detection patterns
const EMAIL_PATTERNS = [
  'email', 'e-mail', 'e_mail', 'e mail',
  '이메일', '메일', 'mail'
];

export function detectColumns(headers: string[]): ColumnMapping | null {
  const koreanNameCol = findBestMatch(headers, KOREAN_NAME_PATTERNS);
  const englishNameCol = findBestMatch(headers, ENGLISH_NAME_PATTERNS);
  const addressCol = findBestMatch(headers, ADDRESS_PATTERNS, ADDRESS_EXCLUSIONS);
  const emailCol = findBestMatch(headers, EMAIL_PATTERNS);  // NEW

  // Email is optional, only englishName and address are required
  if (!englishNameCol || !addressCol) {
    return null;
  }

  return {
    koreanNameIndex: koreanNameCol?.index,
    englishNameIndex: englishNameCol.index,
    addressIndex: addressCol.index,
    emailIndex: emailCol?.index  // NEW: Optional email index
  };
}

// Update parseContactRow to include email
export function parseContactRow(
  row: ExcelRowData,
  mapping: ColumnMapping
): Omit<ContactRecord, 'id' | 'createdAt' | 'sourceFile'> {
  return {
    koreanName: mapping.koreanNameIndex !== undefined
      ? String(row[mapping.koreanNameIndex] ?? '')
      : undefined,
    englishName: mapping.englishNameIndex !== undefined
      ? String(row[mapping.englishNameIndex] ?? '')
      : '',
    address: mapping.addressIndex !== undefined
      ? String(row[mapping.addressIndex] ?? '')
      : '',
    email: mapping.emailIndex !== undefined  // NEW
      ? String(row[mapping.emailIndex] ?? '') || undefined
      : undefined
  };
}
```

### Email Service (src/services/emailService.ts)

```typescript
import emailjs from '@emailjs/browser';
import type { EmailServiceConfig, EmailData } from '../types';

const STORAGE_KEY = 'emailServiceConfig';

export function getEmailConfig(): EmailServiceConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveEmailConfig(config: EmailServiceConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  return !!(
    config?.serviceId &&
    config?.templateId &&
    config?.publicKey
  );
}

export async function sendEmail(
  emailData: EmailData,
  config?: EmailServiceConfig
): Promise<{ success: boolean; error?: string }> {
  const effectiveConfig = config ?? getEmailConfig();

  if (!effectiveConfig) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Initialize EmailJS with public key
    emailjs.init(effectiveConfig.publicKey);

    // Prepare email parameters
    const params = {
      to_email: emailData.to,
      subject: emailData.subject,
      message: emailData.body,
      attachment: emailData.attachment
    };

    // Send email via EmailJS
    const response = await emailjs.send(
      effectiveConfig.serviceId,
      effectiveConfig.templateId,
      params
    );

    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: `EmailJS error: ${response.status}` };
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function convertPDFToAttachment(pdfBlob: Blob, filename: string): {
  filename: string;
  content: string;
} {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Extract Base64 data after comma prefix
      const base64Data = dataUrl.split(',')[1];
      resolve({ filename, content: base64Data });
    };
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });
}
```

### Email Composition Dialog (src/components/PDFExport/EmailDialog.tsx)

```typescript
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { sendEmail, convertPDFToAttachment, isEmailConfigured } from '../../services/emailService';
import { EMAIL_TEMPLATES, substituteEmailVariables } from '../../email-templates';
import type { EmailData, EmailServiceConfig } from '../../types';

interface EmailDialogProps {
  open: boolean;
  onClose: () => void;
  donorName: string;
  donorEmail?: string;
  pdfBlob: Blob;
  pdfFilename: string;
  customFields: Record<string, string | number>;
  organizationName?: string;
}

export const EmailDialog: React.FC<EmailDialogProps> = ({
  open,
  onClose,
  donorName,
  donorEmail = '',
  pdfBlob,
  pdfFilename,
  customFields,
  organizationName,
}) => {
  const { t, i18n } = useTranslation();
  const [emailData, setEmailData] = useState({
    to: donorEmail,
    subject: '',
    body: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Initialize template on open
  useEffect(() => {
    if (open) {
      const template = EMAIL_TEMPLATES.find(t => t.language === i18n.language)
        ?? EMAIL_TEMPLATES[0];

      const variables = {
        donorName,
        amount: `${customFields.amount || 0} €`,
        year: new Date().getFullYear().toString(),
        period: customFields.donationPeriod || '',
        organization: organizationName || '',
      };

      setEmailData({
        to: donorEmail,
        subject: substituteEmailVariables(template.subject, variables),
        body: substituteEmailVariables(template.body, variables),
      });
    }
  }, [open, i18n.language, donorName, donorEmail, customFields, organizationName]);

  const handleSend = async () => {
    // Validation
    if (!emailData.to || !emailData.to.includes('@')) {
      setError(t('pdfExport.email.noEmailError'));
      return;
    }
    if (!emailData.subject || !emailData.body) {
      setError(t('pdfExport.email.emptyFieldsError'));
      return;
    }
    if (!isEmailConfigured()) {
      setError(t('pdfExport.email.configRequired'));
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Convert PDF to Base64 attachment
      const attachment = await convertPDFToAttachment(pdfBlob, pdfFilename);

      // Send email
      const result = await sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        attachment,
      });

      if (result.success) {
        // Show success message and close
        alert(t('pdfExport.email.success'));
        onClose();
      } else {
        setError(result.error || t('pdfExport.email.error'));
      }
    } catch (err) {
      setError(t('pdfExport.email.error'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSending ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('pdfExport.email.dialogTitle')}</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Recipient */}
          <TextField
            fullWidth
            label={t('pdfExport.email.toLabel')}
            type="email"
            value={emailData.to}
            onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
            disabled={isSending}
            autoComplete="email"
          />

          {/* Subject */}
          <TextField
            fullWidth
            label={t('pdfExport.email.subjectLabel')}
            value={emailData.subject}
            onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
            disabled={isSending}
          />

          {/* Body */}
          <TextField
            fullWidth
            label={t('pdfExport.email.bodyLabel')}
            multiline
            rows={8}
            value={emailData.body}
            onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
            disabled={isSending}
          />

          {/* Attachment Info */}
          <Typography variant="body2" color="text.secondary">
            {t('pdfExport.email.attachmentLabel')}: {pdfFilename}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSending}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={isSending}
          startIcon={isSending ? <CircularProgress size={20} /> : null}
        >
          {isSending ? t('pdfExport.email.sending') : t('pdfExport.email.sendButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### CustomFieldsDialog Enhancements (src/components/PDFExport/CustomFieldsDialog.tsx)

**State additions:**
```typescript
// Email dialog state
const [showEmailDialog, setShowEmailDialog] = useState(false);
const [generatedPDFBlob, setGeneratedPDFBlob] = useState<Blob | null>(null);
const [emailRecipient, setEmailRecipient] = useState('');
```

**Email button in DialogActions:**
```typescript
<DialogActions>
  <Button onClick={onClose}>{t('pdfExport.cancel')}</Button>
  <Button variant="outlined" onClick={handleSendEmail} disabled={!emailRecipient}>
    {t('pdfExport.email.sendButton')}
  </Button>
  <Button variant="contained" onClick={handleConfirm}>
    {t('pdfExport.exportPdf')}
  </Button>
</DialogActions>
```

**Email handler:**
```typescript
const handleSendEmail = async () => {
  // Validate custom fields
  const customFields: Record<string, string | number | boolean> = {
    donorName,
    donorAddress,
    amount: totalAmount.toFixed(2),
    // ... rest of fields
  };

  // Generate PDF
  const pdfBlob = await generatePDFBlob(customFields, textColor);
  setGeneratedPDFBlob(pdfBlob);

  // Generate email filename
  const filename = `${donorName.replace(/\s+/g, '_')}_Donation_Receipt_${new Date().toISOString().split('T')[0]}.pdf`;

  // Open email dialog
  setEmailRecipient(/* email from contact or empty */);
  setShowEmailDialog(true);
};
```

**Email dialog integration:**
```typescript
<EmailDialog
  open={showEmailDialog}
  onClose={() => setShowEmailDialog(false)}
  donorName={donorName}
  donorEmail={emailRecipient}
  pdfBlob={generatedPDFBlob!}
  pdfFilename={generatedPDFFilename}
  customFields={customFields}
  organizationName={organizationName}
/>
```

### Internationalization (src/i18n/locales/en.json)

```json
{
  "pdfExport": {
    "email": {
      "sendButton": "Send Email",
      "dialogTitle": "Send Receipt via Email",
      "toLabel": "To:",
      "subjectLabel": "Subject:",
      "bodyLabel": "Message:",
      "attachmentLabel": "Attachment:",
      "sending": "Sending...",
      "success": "Email sent successfully!",
      "error": "Failed to send email. Please try again.",
      "noEmailError": "Please enter a recipient email address.",
      "emptyFieldsError": "Please fill in all required fields.",
      "configRequired": "Email service is not configured. Please contact administrator.",
      "notConfigured": "Email service is not configured."
    }
  }
}
```

### Package Dependencies

**New dependency to install:**
```bash
npm install @emailjs/browser
```

**Type definitions:**
```bash
npm install --save-dev @types/emailjs-com
```

## Success Criteria

### Functional Requirements

- [ ] "Send Email" button displayed next to "Export PDF" button
- [ ] Email addresses detected from contacts Excel upload
- [ ] Email composition dialog opens with pre-filled data
- [ ] PDF successfully attached to email
- [ ] Email templates support variable substitution
- [ ] Email sending completes successfully via EmailJS
- [ ] Translation keys provided in English, German, Korean
- [ ] Error handling for missing configuration and send failures

### Quality Requirements

- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings
- [ ] EmailJS SDK properly initialized
- [ ] PDF attachment encoding works correctly
- [ ] Template variable substitution works for all placeholders
- [ ] UI remains responsive during email sending
- [ ] Proper validation of email addresses

### Integration Requirements

- [ ] ContactRecord extended with email field
- [ ] contactMatcher detects email columns
- [ ] No breaking changes to existing templates
- [ ] Backward compatibility with contacts without email
- [ ] Consistent styling with existing UI components
- [ ] Email feature is optional (disabled if not configured)

### Acceptance Tests

- **Test 1:** Email address detection from Excel upload
- **Test 2:** Email composition dialog with pre-filled data
- **Test 3:** PDF attachment generation and encoding
- **Test 4:** Email sending via EmailJS (requires test credentials)
- **Test 5:** Template variable substitution
- **Test 6:** Error handling for invalid email addresses
- **Test 7:** Error handling for missing EmailJS configuration
- **Test 8:** Internationalization (EN, DE, KO)
- **Test 9:** Email sending with German template
- **Test 10:** Email sending with English template

## Non-Functional Requirements

### Performance

- Email composition dialog should open within 500ms
- PDF to Base64 conversion should complete within 2 seconds for PDFs <1MB
- Email sending should show loading state during API call
- UI should remain responsive during background operations

### Security

- EmailJS public key only (no private credentials)
- Email addresses validated client-side
- No sensitive data exposed in error messages
- Configuration stored in localStorage (not hardcoded)

### Usability

- Clear visual feedback during email sending
- Intuitive email composition dialog layout
- Helpful error messages with actionable next steps
- Optional feature (doesn't block PDF export)

### Maintainability

- Email service isolated in separate module
- Template configuration externalized
- TypeScript types for all email-related data
- Error logging for debugging

## Risks and Mitigations

### Risk 1: EmailJS Service Limitations

**Risk:** EmailJS free tier has limits (200 emails/month, 50 requests/day)

**Mitigation:**
- Document EmailJS limits for users
- Provide upgrade path instructions for higher volumes
- Consider alternative services for enterprise deployments

**Contingency:** Implement SendGrid+Backend approach as Phase 2

### Risk 2: PDF Attachment Size

**Risk:** Large PDFs may exceed EmailJS attachment limits

**Mitigation:**
- EmailJS supports attachments up to 5MB (typical receipt PDFs <500KB)
- Warn users if PDF exceeds size limit
- Implement PDF optimization if needed

**Contingency:** Add compression for large PDFs

### Risk 3: EmailJS Configuration Complexity

**Risk:** Users may find EmailJS setup complex

**Mitigation:**
- Provide clear setup documentation
- Consider offering managed service option
- Show helpful error messages for misconfiguration

**Contingency:** Add configuration wizard UI

### Risk 4: Network Dependencies

**Risk:** Email sending requires internet connection (contradicts offline-first architecture)

**Mitigation:**
- Clearly document that email requires internet
- Show network error if offline
- PDF export still works offline

**Contingency:** Queue emails for later if offline (Phase 2)

### Risk 5: Template Localization

**Risk:** Email templates may not cover all use cases

**Mitigation:**
- Provide editable template fields
- Support custom templates in future
- Document variable substitution syntax

**Contingency:** Add template editor in Phase 2

## Alternative Approaches Considered

### Approach 1: Client-Side mailto: (REJECTED)

**Description:** Use browser's mailto: protocol to open default email client

**Pros:**
- No external service required
- Works offline
- No configuration needed

**Cons:**
- **CRITICAL:** mailto: does NOT support file attachments
- User must manually attach PDF
- Limited control over email formatting
- Poor user experience

**Decision:** REJECTED - Does not meet requirement for automatic PDF attachment

### Approach 2: SendGrid + Backend API (ALTERNATIVE)

**Description:** Create backend API endpoint that uses SendGrid to send emails

**Pros:**
- Higher email limits
- More control over email sending
- Better for enterprise deployments
- Supports attachments natively

**Cons:**
- Requires backend infrastructure
- Violates client-side-only architecture
- Additional deployment complexity
- Higher maintenance overhead

**Decision:** Alternative for Phase 2 if EmailJS limits are exceeded

### Approach 3: EmailJS (SELECTED)

**Description:** Use EmailJS client-side SDK for email sending

**Pros:**
- Designed for client-side applications
- Secure (no credentials exposed)
- Supports attachments
- No backend code required
- Quick implementation

**Cons:**
- Free tier limits (200 emails/month)
- Requires internet connection
- External service dependency

**Decision:** **PRIMARY APPROACH** for MVP - Best fit for client-side architecture

## Dependencies

### Internal Dependencies

- `src/types.ts` - Add email field to ContactRecord, add Email* types
- `src/utils/contactMatcher.ts` - Email column detection and parsing
- `src/components/PDFExport/CustomFieldsDialog.tsx` - Add email button and state
- `src/components/PDFExport/ContactsLookupDialog.tsx` - Return email with contact
- `src/components/PDFExport/index.tsx` - PDF generation for email attachment
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/de.json` - German translations
- `src/i18n/locales/ko.json` - Korean translations

### New Files to Create

- `src/services/emailService.ts` - EmailJS integration service
- `src/email-templates.ts` - Email template definitions
- `src/components/PDFExport/EmailDialog.tsx` - Email composition dialog component

### External Dependencies

- `@emailjs/browser` - EmailJS SDK for React
- `@types/emailjs-com` - TypeScript definitions

### Development Dependencies

- TypeScript - Type definitions
- React - Component state management
- i18next - Translations
- jsPDF - PDF generation for attachment

## Open Questions

1. **Email Service Provider:** Should we support multiple email service providers (EmailJS, SendGrid, Mailgun)?
   - **Decision:** MVP uses EmailJS only; architecture designed for extensibility

2. **Template Editor:** Should users be able to create custom email templates?
   - **Decision:** Defer to Phase 2 (MVP uses built-in templates)

3. **Email Queueing:** Should emails be queued if offline?
   - **Decision:** Defer to Phase 2 (MVP requires internet for email)

4. **Bulk Email:** Should users be able to send emails to multiple recipients at once?
   - **Decision:** Defer to Phase 2 (MVP sends to single recipient)

5. **Email History:** Should sent emails be logged/audited?
   - **Decision:** Defer to Phase 2 (MVP does not track sent emails)

6. **Organization Name:** How should users configure their organization name?
   - **Decision:** Add to EmailJS configuration settings in localStorage

7. **Email Signature:** Should emails include a configurable signature?
   - **Decision:** Include in email template body as static text (Phase 2: dynamic)
