# Acceptance Criteria: SPEC-EMAIL-001

## Overview

This document defines the acceptance criteria for the PDF Export Email Integration feature using the Given-When-Then format.

**SPEC ID:** SPEC-EMAIL-001
**Title:** PDF Export Email Integration
**Status:** Planned

---

## User Stories

### Story 1: Email Address Detection

**As a** non-profit organization administrator
**I want** email addresses to be automatically detected from my contacts Excel file
**So that** I can quickly send donation receipts without manually typing email addresses

---

### Story 2: Email Receipt Sending

**As a** non-profit organization administrator
**I want** to send donation receipts via email with the PDF attached
**So that** donors receive their tax documentation quickly and conveniently

---

### Story 3: Email Template Customization

**As a** non-profit organization administrator
**I want** to use pre-built email templates in multiple languages
**So that** I can send professional receipts to donors in their preferred language

---

## Acceptance Criteria

### AC-001: Email Button Visibility

**GIVEN** the PDF Export Custom Fields dialog is open
**WHEN** viewing the dialog actions area
**THEN** a "Send Email" button is displayed next to the "Export PDF" button

**Verification:**
- [ ] Button text is translatable ("Send Email" / "이메일 보내기" / "E-Mail senden")
- [ ] Button uses outlined or contained variant (distinct from Export PDF)
- [ ] Button is enabled when email recipient is available
- [ ] Button is disabled when no email recipient is available

---

### AC-002: Email Address Detection from Excel Upload

**GIVEN** I have an Excel file with an "email" column
**WHEN** I upload the contacts file via the contacts upload feature
**THEN** the system should detect and import email addresses into ContactRecord.email field

**Verification:**
- [ ] Email columns detected from patterns: email, e-mail, 이메일, 메일, mail
- [ ] Email addresses correctly parsed from Excel data
- [ ] ContactRecord.email field populated (optional field)
- [ ] Contacts without email addresses still import successfully
- [ ] Email column excluded from address column matching (existing behavior)

**Test Cases:**
| Excel Headers | Expected Behavior |
|---------------|-------------------|
| Name, Address, Email | Email column detected |
| Name, Address, E-mail | Email column detected |
| Name, Address, 이메일 | Email column detected |
| Name, Address (no email) | No error, email field undefined |

---

### AC-003: Email Address Auto-Population from Contact Selection

**GIVEN** I have uploaded contacts with email addresses
**WHEN** I select a contact from the Contacts Lookup Dialog
**THEN** the email address should be automatically populated in the email input field

**Verification:**
- [ ] Email field populated when contact selected
- [ ] Email field editable after auto-population
- [ ] Contact selection without email shows empty email field
- [ ] Email field supports browser autocomplete

**Example Scenario:**
```
Given contacts file contains:
| Name          | Address         | Email              |
| John Doe      | 123 Main St     | john@example.com   |

When I select "John Doe" from contacts lookup
Then email field is pre-filled with "john@example.com"
And I can edit the email address before sending
```

---

### AC-004: Email Input Field Display

**GIVEN** the email composition dialog is open
**WHEN** viewing the donor information section
**THEN** an email input field is displayed below the address field

**Verification:**
- [ ] Email input field labeled "Email" / "이메일" / "E-Mail"
- [ ] Input type is "email" (browser validation)
- [ ] Placeholder shows example format
- [ ] Field is required for email sending
- [ ] Email format validation applied
- [ ] Styling consistent with existing donor name/address fields

---

### AC-005: Email Dialog Opens with Pre-filled Data

**GIVEN** I have filled in custom fields and selected a contact with email
**WHEN** I click the "Send Email" button
**THEN** an email composition dialog opens with pre-filled recipient, subject, and body

**Verification:**
- [ ] Email dialog opens within 500ms of button click
- [ ] "To" field pre-filled with selected contact's email
- [ ] "Subject" field pre-filled from template with variables substituted
- [ ] "Message" field pre-filled from template with variables substituted
- [ ] "Attachment" field shows generated PDF filename
- [ ] All fields are editable

**Example Pre-filled Data:**
```
To: john.doe@example.com
Subject: Ihre Zuwendungsbestätigung für 2025
Message: Sehr geehrte/r John Doe,

anbei erhalten Sie Ihre Zuwendungsbestätigung für das Jahr 2025.

Gespendeter Betrag: 150.00 €
Zeitraum: January 2025 - December 2025

Vielen Dank für Ihre Unterstützung!

Mit freundlichen Grüßen
My Organization
Attachment: John_Doe_Donation_Receipt_2025-02-25.pdf
```

---

### AC-006: PDF Attachment to Email

**GIVEN** the email composition dialog is open with a generated PDF
**WHEN** I click the "Send" button
**THEN** the PDF should be attached to the email and sent successfully

**Verification:**
- [ ] PDF generated before email dialog opens
- [ ] PDF converted to Base64 for EmailJS attachment
- [ ] PDF filename format: `{donorName}_Donation_Receipt_{date}.pdf`
- [ ] Attachment size within EmailJS limits (5MB max)
- [ ] Received email contains PDF attachment
- [ ] PDF attachment opens correctly

**Test Cases:**
| PDF Size | Expected Behavior |
|----------|-------------------|
| < 1MB | Successful attachment |
| 1-5MB | Successful attachment |
| > 5MB | Error: Attachment too large |

---

### AC-007: Email Template Variable Substitution

**GIVEN** an email template contains placeholder variables
**WHEN** the email dialog opens
**THEN** all variables should be replaced with actual values from custom fields

**Supported Variables:**
- `{{donorName}}` - Donor's English name
- `{{amount}}` - Total donation amount
- `{{year}}` - Current year
- `{{period}}` - Donation period
- `{{organization}}` - Organization name

**Verification:**
- [ ] All variables replaced with actual values
- [ ] Variables in subject line substituted
- [ ] Variables in email body substituted
- [ ] Unrecognized variables handled gracefully (left as-is or removed)
- [ ] Special characters in variables escaped properly

**Example Substitution:**
```
Template:  "Dear {{donorName}}, your donation of {{amount}} for {{year}}..."
Context:   { donorName: "John Doe", amount: "150.00 €", year: "2025" }
Result:    "Dear John Doe, your donation of 150.00 € for 2025..."
```

---

### AC-008: Email Template Language Selection

**GIVEN** the application supports multiple languages (English, German, Korean)
**WHEN** I open the email dialog
**THEN** the email template should match the current application language

**Verification:**
- [ ] German template used when i18n.language is 'de'
- [ ] English template used when i18n.language is 'en'
- [ ] Korean template used when i18n.language is 'ko'
- [ ] Template language switches when application language changes
- [ ] Fallback to English template if language not found

**Test Cases:**
| i18n Language | Expected Template | Expected Subject |
|---------------|-------------------|------------------|
| 'de' | German donation receipt | "Ihre Zuwendungsbestätigung..." |
| 'en' | English donation receipt | "Your Donation Receipt..." |
| 'ko' | Korean donation receipt | "2025년도 기부금 영수증" |

---

### AC-009: Email Validation

**GIVEN** the email dialog is open
**WHEN** I attempt to send with invalid data
**THEN** appropriate validation errors should be displayed

**Validation Rules:**
- Recipient email is required
- Recipient email must be valid format (contains @)
- Subject is required
- Message body is required

**Verification:**
- [ ] Empty recipient email shows error
- [ ] Invalid email format shows error
- [ ] Empty subject shows error
- [ ] Empty body shows error
- [ ] All validation errors prevent email sending
- [ ] Error messages are translatable
- [ ] Invalid fields highlighted

**Test Cases:**
| Input | Expected Error |
|-------|----------------|
| To: (empty) | "Please enter a recipient email address" |
| To: "invalid" | "Please enter a valid email address" |
| Subject: (empty) | "Please enter a subject" |
| Body: (empty) | "Please enter a message" |

---

### AC-010: Email Sending Success

**GIVEN** I have filled in valid email data
**WHEN** I click the "Send" button
**THEN** the email should be sent successfully with success feedback

**Verification:**
- [ ] Loading state displayed during sending
- [ ] "Send Email" button disabled during sending
- [ ] Success message displayed after sending
- [ ] Dialog closes after successful send
- [ ] Received email contains correct data
- [ ] Received email has PDF attachment
- [ ] No errors in browser console

**User Flow:**
```
1. User clicks "Send" button
2. Button shows "Sending..." with spinner
3. EmailJS API called with parameters
4. On success: Show success message, close dialog
5. On error: Show error message, keep dialog open
```

---

### AC-011: Email Sending Error Handling

**GIVEN** an error occurs during email sending
**WHEN** the error happens
**THEN** an appropriate error message should be displayed

**Error Scenarios:**
- Network timeout or connection error
- EmailJS quota exceeded
- Invalid EmailJS configuration
- EmailJS service unavailable

**Verification:**
- [ ] Network error shows retry message
- [ ] Quota exceeded shows quota message
- [ ] Invalid config shows setup instructions
- [ ] Error messages are translatable
- [ ] Dialog remains open for retry
- [ ] Error details logged to console

**Test Cases:**
| Error Scenario | Expected Message |
|----------------|------------------|
| Network timeout | "Failed to send email. Please check your connection and try again." |
| Quota exceeded | "Email quota exceeded. Please try again later or upgrade your plan." |
| Invalid config | "Email service is not configured. Please contact administrator." |

---

### AC-012: EmailJS Configuration Validation

**GIVEN** the email service requires EmailJS configuration
**WHEN** I attempt to send an email without configuration
**THEN** I should see a configuration error message

**Configuration Fields:**
- Service ID
- Template ID
- Public Key

**Verification:**
- [ ] Missing configuration detected before send attempt
- [ ] Clear error message displayed
- [ ] Error message includes setup instructions
- [ ] Feature gracefully disabled when not configured
- [ ] "Send Email" button shows disabled state or tooltip

---

### AC-013: Email Dialog Cancel/Back Behavior

**GIVEN** the email dialog is open
**WHEN** I click the "Cancel" button
**THEN** the dialog should close without sending and return to custom fields dialog

**Verification:**
- [ ] "Cancel" button closes dialog
- [ ] No email sent
- [ ] Custom fields preserved
- [ ] Can return to email dialog by clicking "Send Email" again
- [ ] No unsaved changes lost

---

### AC-014: PDF Generation for Email

**GIVEN** I have filled in custom fields
**WHEN** I click the "Send Email" button
**THEN** a PDF should be generated using the current custom field values

**Verification:**
- [ ] PDF generated with same logic as "Export PDF" button
- [ ] Custom field values included in PDF
- [ ] PDF signature images included (if uploaded)
- [ ] PDF color customization applied
- [ ] PDF generation completes before email dialog opens
- [ ] PDF generation errors prevent email dialog from opening

---

### AC-015: Backward Compatibility with Contacts

**GIVEN** I have existing contacts without email addresses
**WHEN** I use the email feature
**THEN** the system should handle missing email addresses gracefully

**Verification:**
- [ ] Contacts without email load without errors
- [ ] Email field shows as empty for contacts without email
- [ ] Can manually enter email address
- [ ] Email sending works with manually entered email
- [ ] No data migration required for existing contacts

---

### AC-016: Internationalization

**GIVEN** the application supports English, German, and Korean
**WHEN** I use the email feature
**THEN** all UI elements should be translated correctly

**Translation Keys:**
- `pdfExport.email.sendButton`
- `pdfExport.email.dialogTitle`
- `pdfExport.email.toLabel`
- `pdfExport.email.subjectLabel`
- `pdfExport.email.bodyLabel`
- `pdfExport.email.attachmentLabel`
- `pdfExport.email.sending`
- `pdfExport.email.success`
- `pdfExport.email.error`
- All error messages

**Verification:**
- [ ] All email UI elements translated to German
- [ ] All email UI elements translated to Korean
- [ ] All email UI elements translated to English
- [ ] Email templates match respective language
- [ ] No hardcoded English text in UI

---

## Definition of Done

A requirement is considered "done" when:

1. **Code Complete:**
   - [ ] All TypeScript files compile without errors
   - [ ] No ESLint warnings
   - [ ] All requirements implemented per specification
   - [ ] Code follows project conventions

2. **Testing Complete:**
   - [ ] Unit tests written and passing
   - [ ] Component tests written and passing
   - [ ] Manual testing completed
   - [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)

3. **Quality Gates Passed:**
   - [ ] TRUST 5 framework compliance
   - [ ] 85%+ test coverage for new code
   - [ ] No security vulnerabilities
   - [ ] Performance acceptable (<500ms dialog open, <2s PDF attach)

4. **Documentation Complete:**
   - [ ] Translation keys added for all languages
   - [ ] Code comments where necessary
   - [ ] SPEC document updated if needed
   - [ ] README updated with feature description

5. **Integration Verified:**
   - [ ] No breaking changes to existing features
   - [ ] Backward compatible with existing data
   - [ ] Works with existing PDF export flow
   - [ ] Contacts integration works correctly

---

## Test Scenarios

### Scenario 1: First-Time Email Send (Happy Path)

```
GIVEN I have uploaded contacts with email addresses
AND I have filled in custom fields for a donation receipt
WHEN I select a contact from the contacts lookup
AND I click the "Send Email" button
AND the email dialog opens with pre-filled data
AND I review the email content
AND I click the "Send" button
THEN the email should be sent successfully
AND the dialog should close
AND a success message should be displayed
AND the donor should receive an email with the PDF attachment
```

### Scenario 2: Email Address Not in Contacts

```
GIVEN I have uploaded contacts without email addresses
AND I have filled in custom fields for a donation receipt
WHEN I select a contact from the contacts lookup
AND I click the "Send Email" button
AND the email dialog opens with empty "To" field
AND I manually enter the recipient email address
AND I click the "Send" button
THEN the email should be sent successfully
AND the donor should receive an email with the PDF attachment
```

### Scenario 3: Invalid Email Address

```
GIVEN the email dialog is open
WHEN I enter an invalid email address in the "To" field
AND I click the "Send" button
THEN an error message should be displayed
AND the email should not be sent
AND the dialog should remain open
AND I should be able to correct the email address
```

### Scenario 4: EmailJS Not Configured

```
GIVEN EmailJS is not configured
WHEN I click the "Send Email" button
OR the email dialog is open and I click "Send"
THEN an error message should be displayed
AND the error message should explain the configuration issue
AND the email should not be sent
```

### Scenario 5: Language Switching

```
GIVEN the application language is set to German
WHEN I open the email dialog
THEN the German email template should be used
AND all UI elements should be in German

WHEN I switch the application language to English
AND I open the email dialog again
THEN the English email template should be used
AND all UI elements should be in English
```

### Scenario 6: Large PDF Attachment

```
GIVEN the generated PDF is larger than 5MB
WHEN I click the "Send" button
THEN an error message should be displayed
AND the error message should indicate the attachment is too large
AND the email should not be sent
```

---

## Automated Test Requirements

### Unit Tests

```typescript
// emailService.ts
describe('emailService', () => {
  test('getEmailConfig retrieves config from localStorage')
  test('saveEmailConfig saves config to localStorage')
  test('isEmailConfigured returns true when all fields present')
  test('isEmailConfigured returns false when any field missing')
  test('convertPDFToAttachment converts Blob to Base64')
  test('sendEmail calls EmailJS with correct parameters')
})

// email-templates.ts
describe('email-templates', () => {
  test('substituteEmailVariables replaces all variables')
  test('substituteEmailVariables handles missing variables')
  test('EMAIL_TEMPLATES contains all three languages')
})
```

### Component Tests

```typescript
// EmailDialog.tsx
describe('EmailDialog', () => {
  test('renders with initial props')
  test('displays pre-filled email data')
  test('validates email format')
  test('shows error on invalid email')
  test('shows loading state during send')
  test('shows error message on send failure')
  test('calls onClose on successful send')
})
```

### Integration Tests

```typescript
describe('Email Integration', () => {
  test('full flow: button click → PDF gen → email dialog → send')
  test('email address detected from contact selection')
  test('template variables substituted correctly')
  test('error handling for missing EmailJS config')
})
```

---

## Manual Testing Checklist

### Feature Testing

- [ ] Email button visible in CustomFieldsDialog
- [ ] Email column detected from Excel upload
- [ ] Email address populated from contact selection
- [ ] Email dialog opens with pre-filled data
- [ ] Email fields are editable
- [ ] PDF attachment filename correct
- [ ] Email sending succeeds with valid data
- [ ] Success message displayed after send
- [ ] Error handling works for invalid data
- [ ] Configuration error displayed when EmailJS not set up

### Language Testing

- [ ] All UI elements translated to English
- [ ] All UI elements translated to German
- [ ] All UI elements translated to Korean
- [ ] English template used for English locale
- [ ] German template used for German locale
- [ ] Korean template used for Korean locale

### Cross-Browser Testing

- [ ] Feature works in Chrome 90+
- [ ] Feature works in Firefox 88+
- [ ] Feature works in Safari 14+
- [ ] Feature works in Edge 90+

### Edge Cases

- [ ] Works with contacts without email
- [ ] Works with special characters in donor name
- [ ] Works with very long donor names
- [ ] Works with very long email addresses
- [ ] Works with special characters in address
- [ ] Gracefully handles network errors
- [ ] Gracefully handles EmailJS quota exceeded
- [ ] Gracefully handles missing configuration

---

## Success Metrics

### Functional Metrics

- 100% of acceptance criteria passed
- Email sending success rate >95% (with valid config)
- PDF attachment delivery rate >95%
- Email template accuracy 100%

### Performance Metrics

- Email dialog opens within 500ms
- PDF to Base64 conversion within 2 seconds (for <1MB PDF)
- Email sending completes within 5 seconds (excluding network)

### Quality Metrics

- Zero TypeScript compilation errors
- Zero ESLint warnings
- 85%+ test coverage for new code
- All TRUST 5 quality gates passed

### User Experience Metrics

- Intuitive integration with existing workflow
- Clear error messages for all failure scenarios
- Consistent styling with existing UI
- Smooth interaction flows (no jank)

---

## Notes

* All acceptance criteria should be verified by the implementation team
* Manual testing should be performed with real EmailJS credentials
* Cross-browser testing is essential for client-side features
* Translation accuracy should be verified by native speakers if possible
* Performance testing should include various PDF sizes
