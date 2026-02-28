# Implementation Plan: SPEC-EMAIL-001

## Overview

This document outlines the implementation plan for adding email functionality to the PDF Export workflow in the Excel Processor application.

**SPEC ID:** SPEC-EMAIL-001
**Title:** PDF Export Email Integration
**Status:** Planned
**Priority:** High

---

## Implementation Milestones

### Milestone 1: Foundation (Primary Goal)

**Description:** Core type definitions and email service infrastructure

**Tasks:**
1. Extend `ContactRecord` type with optional `email` field
2. Create email-related TypeScript types (`EmailTemplate`, `EmailServiceConfig`, `EmailData`)
3. Set up EmailJS SDK integration (`src/services/emailService.ts`)
4. Create email template definitions (`src/email-templates.ts`)
5. Implement template variable substitution function

**Dependencies:** None (foundational work)

**Estimated Complexity:** Low-Medium

---

### Milestone 2: Contacts Integration (Primary Goal)

**Description:** Email address detection and extraction from contacts

**Tasks:**
1. Add email column detection patterns to `contactMatcher.ts`
2. Update `parseContactRow` to extract email values
3. Update `ContactsLookupDialog` to return email field
4. Update `CustomFieldsDialog` to capture email from contact selection
5. Add email field to contacts upload/import flow

**Dependencies:** Milestone 1 (type definitions)

**Estimated Complexity:** Medium

---

### Milestone 3: Email Dialog Component (Primary Goal)

**Description:** Email composition dialog UI component

**Tasks:**
1. Create `EmailDialog.tsx` component with form fields
2. Implement email validation logic
3. Add loading state during email sending
4. Implement error handling and display
5. Add PDF attachment info display
6. Integrate with EmailJS service

**Dependencies:** Milestone 1

**Estimated Complexity:** Medium

---

### Milestone 4: PDF Generation Integration (Primary Goal)

**Description:** Generate PDF Blob for email attachment

**Tasks:**
1. Modify PDF generation to return Blob instead of just download
2. Implement PDF to Base64 conversion for EmailJS attachment
3. Create PDF filename generator
4. Add PDF Blob state management to `CustomFieldsDialog`
5. Handle PDF generation errors for email flow

**Dependencies:** Milestone 1, Milestone 3

**Estimated Complexity:** Medium

---

### Milestone 5: UI Integration (Primary Goal)

**Description:** Integrate email button into existing PDF Export flow

**Tasks:**
1. Add "Send Email" button to `CustomFieldsDialog` actions
2. Wire up email button to generate PDF and open email dialog
3. Pass custom fields and PDF Blob to email dialog
4. Handle email dialog close/cancel flow
5. Update `PDFExport/index.tsx` context for email support

**Dependencies:** Milestone 2, Milestone 3, Milestone 4

**Estimated Complexity:** Low-Medium

---

### Milestone 6: Internationalization (Primary Goal)

**Description:** Add translations for email-related UI elements

**Tasks:**
1. Add English translation keys to `en.json`
2. Add German translation keys to `de.json`
3. Add Korean translation keys to `ko.json`
4. Verify template language auto-selection based on i18n locale
5. Test all three language variations

**Dependencies:** Milestone 1, Milestone 3

**Estimated Complexity:** Low

---

### Milestone 7: Configuration & Error Handling (Secondary Goal)

**Description:** Email service configuration and comprehensive error handling

**Tasks:**
1. Implement `getEmailConfig` and `saveEmailConfig` functions
2. Add `isEmailConfigured` validation
3. Create configuration validation UI (optional for MVP)
4. Implement error handling for:
   - Network errors
   - EmailJS quota exceeded
   - Invalid configuration
   - Attachment size limits
5. Add user-friendly error messages

**Dependencies:** Milestone 1

**Estimated Complexity:** Medium

---

### Milestone 8: Testing (Primary Goal)

**Description:** Comprehensive testing of email functionality

**Tasks:**
1. Unit tests for email service functions
2. Unit tests for template variable substitution
3. Component tests for EmailDialog
4. Integration tests for email sending flow (with EmailJS mock)
5. Manual testing with real EmailJS credentials
6. Cross-browser testing (Chrome, Firefox, Safari, Edge)

**Dependencies:** Milestone 1-7

**Estimated Complexity:** Medium-High

---

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CustomFieldsDialog                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │   Donor      │  │   Amount     │  │  Actions         │      │
│  │   Info       │  │   Fields     │  │  ┌────────────┐  │      │
│  │  - Name      │  │              │  │  │ Send Email │  │      │
│  │  - Address   │  │              │  │  └────────────┘  │      │
│  │  - Email     │  │              │  │  ┌────────────┐  │      │
│  │  (from       │  │              │  │  │ Export PDF │  │      │
│  │   contact)   │  │              │  │  └────────────┘  │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EmailDialog                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  To: [user@example.com]                                   │   │
│  │  Subject: [Your Donation Receipt for 2025]                │   │
│  │  Message: [Dear John, Please find attached...]            │   │
│  │  Attachment: John_Doe_Donation_Receipt_2025-02-25.pdf     │   │
│  │                                                            │   │
│  │  [Cancel]                                      [Send]     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     emailService.ts                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  sendEmail()                                              │   │
│  │  ├─ Initialize EmailJS                                    │   │
│  │  ├─ Convert PDF to Base64                                 │   │
│  │  ├─ Call EmailJS.send()                                   │   │
│  │  └─ Return success/error                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EmailJS Service                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Config: serviceId, templateId, publicKey                 │   │
│  │  Send: to_email, subject, message, attachment            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User selects contact → Email extracted from ContactRecord.email
2. User clicks "Send Email" → PDF generated as Blob
3. Email Dialog opens → Pre-filled with template data
4. User reviews/edits → Can modify subject, body, recipient
5. User clicks Send → PDF converted to Base64
6. EmailJS.send() → Email sent with PDF attachment
7. Success/Error → Display message, close dialog
```

### Key Design Decisions

**Decision 1: EmailJS as Primary Email Service**

**Rationale:**
- Designed for client-side applications
- No backend code required
- Secure (public key only)
- Supports attachments

**Trade-offs:**
- Free tier limited to 200 emails/month
- Requires internet connection
- External service dependency

**Future Path:** SendGrid + Backend API for enterprise scale

**Decision 2: Email Dialog Opens After PDF Generation**

**Rationale:**
- PDF must exist before it can be attached
- User can preview email before sending
- Reduces complexity (single PDF generation)

**Trade-offs:**
- Slight delay before dialog opens
- PDF generated even if user cancels email

**Alternative:** Generate PDF only after email send confirmation (more complex)

**Decision 3: Optional Email Feature**

**Rationale:**
- Doesn't break existing PDF export workflow
- Works offline (except email sending)
- Users can choose when to use email

**Trade-offs:**
- Email button may be confusing if not configured
- Additional UI element

**Mitigation:** Show helpful message if EmailJS not configured

**Decision 4: Email Field Added to ContactRecord**

**Rationale:**
- Consistent with existing contact structure
- Email detected during Excel import
- No separate email storage needed

**Trade-offs:**
- Requires contact matcher update
- Existing contacts won't have email (need re-import)

**Mitigation:** Email field is optional, backward compatible

---

## File Structure Changes

### New Files

```
src/
├── services/
│   └── emailService.ts          # EmailJS integration service
├── components/
│   └── PDFExport/
│       └── EmailDialog.tsx      # Email composition dialog
└── email-templates.ts           # Email template definitions
```

### Modified Files

```
src/
├── types.ts                     # Add email field to ContactRecord, Email* types
├── utils/
│   └── contactMatcher.ts        # Email column detection, parsing
├── components/
│   └── PDFExport/
│       ├── CustomFieldsDialog.tsx  # Add email button, state, handler
│       ├── ContactsLookupDialog.tsx # Return email field
│       └── index.tsx              # PDF Blob generation
└── i18n/
    └── locales/
        ├── en.json              # English translations
        ├── de.json              # German translations
        └── ko.json              # Korean translations
```

---

## Development Workflow

### Phase 1: Setup (Milestone 1)

1. Install EmailJS SDK: `npm install @emailjs/browser`
2. Install TypeScript definitions: `npm install --save-dev @types/emailjs-com`
3. Create `emailService.ts` with config functions
4. Create `email-templates.ts` with default templates
5. Add TypeScript types to `types.ts`
6. Verify EmailJS account and get credentials (for testing)

### Phase 2: Contacts Integration (Milestone 2)

1. Update `contactMatcher.ts` email detection patterns
2. Test email column detection with sample Excel files
3. Update `ContactsLookupDialog` to return email
4. Verify email field is populated when contact selected
5. Test with contacts that have no email (graceful handling)

### Phase 3: Email Dialog (Milestone 3)

1. Create `EmailDialog.tsx` with Material-UI components
2. Implement form validation (email format, required fields)
3. Add loading state during send
4. Implement error display with Alert component
5. Test dialog open/close behavior
6. Verify template language selection based on i18n locale

### Phase 4: PDF Integration (Milestone 4)

1. Review existing PDF generation code in `PDFExport/index.tsx`
2. Add function to return PDF Blob instead of auto-download
3. Implement PDF to Base64 conversion in `emailService.ts`
4. Generate PDF filename with donor name and date
5. Test with various PDF sizes
6. Verify Base64 encoding for EmailJS attachment

### Phase 5: UI Integration (Milestone 5)

1. Add "Send Email" button to `CustomFieldsDialog` actions
2. Implement email click handler
3. Wire up state for PDF Blob and email recipient
4. Integrate EmailDialog component
5. Test full flow: button click → PDF generation → dialog open
6. Verify email doesn't interfere with "Export PDF" button

### Phase 6: Internationalization (Milestone 6)

1. Add all translation keys to `en.json`
2. Translate to German in `de.json`
3. Translate to Korean in `ko.json`
4. Test email dialog in all three languages
5. Verify template language matches UI language
6. Test template variable substitution in all languages

### Phase 7: Configuration & Errors (Milestone 7)

1. Implement `saveEmailConfig` function
2. Create configuration UI (optional for MVP)
3. Add validation for EmailJS credentials
4. Implement comprehensive error handling:
   - Network timeout
   - EmailJS quota exceeded
   - Invalid email address
   - Missing configuration
   - Attachment too large
5. Add user-friendly error messages
6. Test all error scenarios

### Phase 8: Testing (Milestone 8)

1. Write unit tests for `emailService.ts` functions
2. Write unit tests for template substitution
3. Write component tests for `EmailDialog.tsx`
4. Create integration test with EmailJS mock
5. Perform manual testing with real EmailJS account
6. Test cross-browser compatibility
7. Verify PDF attachment in received emails
8. Test with all three template languages

---

## Risk Mitigation Strategies

### Risk 1: EmailJS Service Limits

**Mitigation:**
- Document EmailJS free tier limits (200 emails/month)
- Add quota exceeded error handling
- Provide upgrade instructions for higher volume
- Monitor usage and warn before limits

### Risk 2: PDF Attachment Size

**Mitigation:**
- EmailJS supports up to 5MB attachments (typical receipts <500KB)
- Add PDF size check before sending
- Warn user if PDF exceeds limits
- Implement compression if needed (Phase 2)

### Risk 3: Configuration Complexity

**Mitigation:**
- Provide clear setup documentation
- Show helpful error messages for missing config
- Consider configuration wizard UI (Phase 2)
- Document EmailJS account setup steps

### Risk 4: Network Dependency

**Mitigation:**
- Clearly document email requires internet
- Show network error if offline
- PDF export still works offline
- Consider email queueing (Phase 2)

---

## Testing Strategy

### Unit Tests

**emailService.ts:**
- `getEmailConfig()` - Retrieve config from localStorage
- `saveEmailConfig()` - Save config to localStorage
- `isEmailConfigured()` - Validate required fields
- `convertPDFToAttachment()` - Base64 encoding

**email-templates.ts:**
- `substituteEmailVariables()` - Variable replacement

### Component Tests

**EmailDialog.tsx:**
- Render with props
- Form validation
- Email send success flow
- Email send error handling
- Loading state display

### Integration Tests

**End-to-end flow:**
1. User selects contact with email
2. User clicks "Send Email" button
3. PDF generated and converted to Base64
4. Email dialog opens with pre-filled data
5. User edits email content
6. User clicks send
7. Email sent with PDF attachment

### Manual Testing Checklist

- [ ] Email address detected from Excel upload
- [ ] Email dialog opens with correct template
- [ ] Template variables substituted correctly
- [ ] PDF attached to email
- [ ] Email received with attachment
- [ ] Error handling for invalid email
- [ ] Error handling for missing config
- [ ] Language switching works (EN, DE, KO)
- [ ] Backward compatibility (contacts without email)

---

## Success Metrics

### Functional Completeness

- All 9 requirements from spec.md implemented
- Email sending works with EmailJS
- PDF attachments delivered successfully
- All three language templates functional

### Code Quality

- Zero TypeScript compilation errors
- Zero ESLint warnings
- 85%+ test coverage for new code
- All TRUST 5 quality gates passed

### User Experience

- Email dialog opens within 500ms of button click
- PDF attachment completes within 2 seconds
- Clear error messages for all failure scenarios
- Intuitive integration with existing workflow

---

## Post-Implementation Tasks

### Documentation

1. Update README.md with email feature description
2. Document EmailJS setup instructions
3. Add email template customization guide
4. Document translation keys for contributors

### Future Enhancements (Out of Scope for MVP)

1. Custom email template editor
2. Email queueing for offline support
3. Bulk email sending to multiple recipients
4. Email history/audit log
5. Dynamic email signatures
6. Alternative email service providers (SendGrid, Mailgun)
7. Backend API for enterprise deployments

---

## Dependencies Summary

### External Dependencies

- `@emailjs/browser` - EmailJS SDK (NEW)
- `@types/emailjs-com` - TypeScript definitions (NEW)

### Internal Dependencies

- Existing `ContactRecord` type
- Existing `contactMatcher.ts` utilities
- Existing `CustomFieldsDialog.tsx` component
- Existing PDF generation code
- Existing i18n translations

---

## Notes

* This implementation follows the SPEC-First DDD methodology
* EmailJS was chosen as the primary approach for client-side email sending
* Alternative SendGrid+Backend approach documented for future scalability
* All new code follows existing project patterns and conventions
* TRUST 5 quality gates apply throughout implementation
