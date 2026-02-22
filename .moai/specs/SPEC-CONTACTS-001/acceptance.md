# Acceptance Criteria: SPEC-CONTACTS-001 Contacts List Feature

**TAG:** TAG-CONTACTS-001
**Related SPEC:** SPEC-CONTACTS-001
**Status:** Planned
**Last Updated:** 2025-02-22

---

## 1. Functional Acceptance Criteria

### AC-001: File Upload and Parsing

**Scenario:** Upload standard Excel file with contacts

**GIVEN** user is on PDF Export dialog
**AND** user has a contacts file in .xlsx format with standard headers
**WHEN** user clicks "Upload Contacts" button
**AND** selects the contacts file
**THEN** system shall parse the file using SheetJS
**AND** detect columns automatically (confidence ≥ 70%)
**AND** import all contacts into localStorage
**AND** show contacts count indicator: "N contacts loaded"

**Acceptance Tests:**
- TC-UPLOAD-001: Standard .xlsx file upload
- TC-UPLOAD-002: .csv file upload
- TC-UPLOAD-003: .xls file upload
- TC-UPLOAD-004: Multiple file upload (merge behavior)

---

### AC-002: Column Detection and Mapping

**Scenario:** Auto-detect standard column names

**GIVEN** user uploads a file with headers: "한글이름", "영문이름", "주소"
**WHEN** system analyzes headers
**THEN** system shall map columns automatically without showing mapping dialog
**AND** confidence score shall be ≥ 90%

**Scenario:** Manual column mapping for non-standard headers

**GIVEN** user uploads a file with headers: "KName", "EName", "Addr"
**WHEN** system analyzes headers
**THEN** system shall display ColumnMapperDialog
**AND** show dropdown selectors for Korean Name, English Name, Address
**WHEN** user maps columns correctly
**AND** clicks "Import"
**THEN** system shall parse file using selected mappings

**Acceptance Tests:**
- TC-MAPPING-001: Standard Korean headers (auto-detect)
- TC-MAPPING-002: Standard English headers (auto-detect)
- TC-MAPPING-003: Non-standard headers (manual mapping)
- TC-MAPPING-004: Mixed language headers

---

### AC-003: Contact Data Persistence

**Scenario:** Contacts persist across browser sessions

**GIVEN** user has uploaded 50 contacts
**WHEN** user closes browser
**AND** reopens application
**THEN** system shall load contacts from localStorage
**AND** show "50 contacts loaded" indicator
**AND** all contact data shall be intact (names, addresses)

**Scenario:** Append new contacts to existing

**GIVEN** user has 50 contacts loaded
**WHEN** user uploads another file with 30 contacts
**THEN** system shall merge contacts (total: 80)
**AND** preserve all existing contacts

**Acceptance Tests:**
- TC-PERSIST-001: localStorage save and load
- TC-PERSIST-002: Browser close and reopen
- TC-PERSIST-003: Append behavior (no duplicates)
- TC-PERSIST-004: Version migration (future-proofing)

---

### AC-004: Contact Lookup Dialog

**Scenario:** Search and select contact

**GIVEN** user is on CustomFieldsDialog
**AND** 500 contacts are loaded
**WHEN** user clicks "Lookup Contact" button next to donorName field
**THEN** system shall open ContactsLookupDialog
**AND** show search input field
**WHEN** user types "김" in search box
**THEN** system shall filter contacts showing all contacts with "김" in Korean or English name
**AND** display in format: "김철수 (Kim Chul-soo) - Seoul, Gangnam-gu..."
**WHEN** user clicks on a contact
**THEN** system shall fill donorName and donorAddress fields
**AND** close lookup dialog

**Acceptance Tests:**
- TC-LOOKUP-001: Open lookup dialog
- TC-LOOKUP-002: Search by Korean name
- TC-LOOKUP-003: Search by English name
- TC-LOOKUP-004: Select contact and fill fields
- TC-LOOKUP-005: Cancel lookup (no changes)

---

### AC-005: Intelligent Matching

**Scenario:** Automatic match on dialog open

**GIVEN** user has 200 contacts loaded
**AND** CustomFieldsDialog donorName field has value "홍길동"
**WHEN** user opens CustomFieldsDialog
**THEN** system shall search for matching contacts
**AND** if exact match found with confidence ≥ 80%
**THEN** display ContactMatchBanner: "Found matching contact: 홍길동 (Hong Gil-dong) - 100% match"
**AND** show "Apply" and "Ignore" buttons

**Scenario:** Apply matching suggestion

**GIVEN** ContactMatchBanner is displayed for "홍길동"
**WHEN** user clicks "Apply" button
**THEN** system shall fill donorName with "홍길동"
**AND** fill donorAddress with matched contact's address
**AND** dismiss banner

**Scenario:** Ignore matching suggestion

**GIVEN** ContactMatchBanner is displayed
**WHEN** user clicks "Ignore" button
**THEN** system shall dismiss banner
**AND** NOT fill any fields

**Scenario:** Auto-dismiss on user input

**GIVEN** ContactMatchBanner is displayed
**WHEN** user types in donorName field
**THEN** system shall automatically dismiss banner

**Acceptance Tests:**
- TC-MATCH-001: Exact Korean name match (100% confidence)
- TC-MATCH-002: Exact English name match (95% confidence)
- TC-MATCH-003: Fuzzy match with 80%+ confidence
- TC-MATCH-004: Low confidence match (no banner shown)
- TC-MATCH-005: Apply suggestion
- TC-MATCH-006: Ignore suggestion
- TC-MATCH-007: Auto-dismiss on input

---

### AC-006: Contact Management

**Scenario:** View and delete contacts

**GIVEN** user has 100 contacts loaded
**WHEN** user clicks "Manage Contacts" button
**THEN** system shall open ContactsManageDialog
**AND** display all contacts in a list
**WHEN** user selects 5 contacts using checkboxes
**AND** clicks "Delete Selected" button
**THEN** system shall show confirmation dialog
**WHEN** user confirms deletion
**THEN** system shall delete selected contacts
**AND** update localStorage
**AND** refresh contacts count indicator: "95 contacts loaded"

**Scenario:** Delete all contacts

**GIVEN** user has contacts loaded
**WHEN** user clicks "Manage Contacts" button
**AND** clicks "Delete All" button
**THEN** system shall show confirmation: "Are you sure you want to delete all contacts?"
**WHEN** user confirms
**THEN** system shall delete all contacts
**AND** clear localStorage
**AND** show "No contacts loaded" indicator

**Acceptance Tests:**
- TC-MANAGE-001: Open manage dialog
- TC-MANAGE-002: Delete single contact
- TC-MANAGE-003: Delete multiple contacts
- TC-MANAGE-004: Delete all contacts
- TC-MANAGE-005: Cancel deletion

---

### AC-007: Error Handling

**Scenario:** localStorage quota exceeded

**GIVEN** user attempts to upload 10,000 contacts
**WHEN** system tries to save to localStorage
**AND** quota is exceeded
**THEN** system shall display error message: "Storage quota exceeded. Please reduce number of contacts."
**AND** NOT save any contacts
**AND** show guidance on reducing contact count

**Scenario:** Invalid file format

**GIVEN** user clicks "Upload Contacts"
**AND** selects a .pdf file
**THEN** system shall show error: "Invalid file format. Please upload .xlsx, .xls, or .csv file."

**Scenario:** File parsing error

**GIVEN** user uploads a corrupted Excel file
**WHEN** system attempts to parse
**AND** parsing fails
**THEN** system shall show error: "Failed to parse file. Please check the file format."
**AND** NOT import any contacts

**Acceptance Tests:**
- TC-ERROR-001: localStorage quota exceeded
- TC-ERROR-002: Invalid file format
- TC-ERROR-003: Corrupted file handling
- TC-ERROR-004: Empty file handling

---

### AC-008: Performance Requirements

**Scenario:** Large file parsing performance

**GIVEN** user uploads a file with 1,000 contacts
**WHEN** system parses the file
**THEN** parsing shall complete within 2 seconds
**AND** UI shall remain responsive

**Scenario:** Search performance

**GIVEN** user has 5,000 contacts loaded
**WHEN** user types in search box
**THEN** search results shall appear within 100ms
**AND** scrolling shall be smooth (60 FPS)

**Scenario:** localStorage read/write performance

**GIVEN** user has 1,000 contacts
**WHEN** system saves to localStorage
**THEN** operation shall complete within 500ms

**Acceptance Tests:**
- TC-PERF-001: Parse 1,000 contacts < 2s
- TC-PERF-002: Search 5,000 contacts < 100ms
- TC-PERF-003: localStorage save < 500ms
- TC-PERF-004: Virtual scrolling smoothness

---

### AC-009: Internationalization

**Scenario:** English language UI

**GIVEN** user has selected English language
**WHEN** user views contacts feature
**THEN** all UI text shall be in English
**AND** button labels: "Upload Contacts", "Manage Contacts", "Lookup Contact"
**AND** dialog titles: "Select Contact", "Manage Contacts", "Map Contact Columns"

**Scenario:** Korean language UI

**GIVEN** user has selected Korean language
**WHEN** user views contacts feature
**THEN** all UI text shall be in Korean
**AND** button labels: "연락처 업로드", "연락처 관리", "연락처 찾기"
**AND** dialog titles: "연락처 선택", "연락처 관리", "연락처 열 매핑"

**Acceptance Tests:**
- TC-I18N-001: English UI translation
- TC-I18N-002: Korean UI translation
- TC-I18N-003: Language switching
- TC-I18N-004: Contact data preserves Korean characters

---

### AC-010: Backward Compatibility

**Scenario:** No breaking changes to PDF export

**GIVEN** user has existing PDF export workflow
**WHEN** contacts feature is added
**THEN** all existing PDF export functionality shall work unchanged
**AND** CustomFieldsDialog shall work without contacts loaded
**AND** PDF export shall succeed even if contacts feature fails

**Scenario:** Graceful degradation

**GIVEN** localStorage is disabled or full
**WHEN** user tries to use contacts feature
**THEN** system shall show error message
**AND** PDF export shall remain functional
**AND** user can still manually fill fields

**Acceptance Tests:**
- TC-COMPAT-001: Existing PDF export works
- TC-COMPAT-002: CustomFieldsDialog without contacts
- TC-COMPAT-003: PDF export when contacts fail
- TC-COMPAT-004: No errors in browser console

---

## 2. Quality Gates

### 2.1 Code Quality Standards

**TRUST 5 Framework Compliance:**

**Tested:**
- [ ] 85%+ code coverage for new components
- [ ] Unit tests for all utility functions
- [ ] Integration tests for key workflows
- [ ] Manual testing completed

**Readable:**
- [ ] TypeScript strict mode enabled
- [ ] Clear component and function names
- [ ] English comments for complex logic
- [ ] No code smells (ESLint warnings)

**Unified:**
- [ ] Prettier formatting applied
- [ ] Consistent naming conventions
- [ ] Material-UI v7 design patterns
- [ ] i18n keys follow existing pattern

**Secured:**
- [ ] No XSS vulnerabilities (escape user content)
- [ ] File upload validation
- [ ] No sensitive data logging
- [ ] Input sanitization for all user inputs

**Trackable:**
- [ ] Conventional commit messages
- [ ] SPEC reference in commits (refs TAG-CONTACTS-001)
- [ ] Clear PR description linking to SPEC

---

### 2.2 LSP Quality Gates

**Pre-Implementation Baseline:**
- Run LSP diagnostic capture
- Document current error/warning counts
- Use as regression baseline

**Post-Implementation Requirements:**
- Zero new LSP errors (type errors, syntax errors)
- Zero new LSP warnings (lint errors, unused imports)
- Zero security warnings (if security LSP enabled)
- Maximum 10 new general warnings (acceptable)

**Validation Command:**
```bash
# TypeScript type checking
npx tsc --noEmit

# ESLint checking
npx eslint src/components/PDFExport/*.tsx

# Security audit (if using npm audit)
npm audit
```

---

### 2.3 Performance Benchmarks

**Metrics to Collect:**
1. File parsing time (by file size: 100, 500, 1000 contacts)
2. Search response time (by contact count: 100, 1000, 5000)
3. localStorage read/write time
4. UI rendering time (dialog open, search results render)
5. Memory usage (by contact count)

**Performance Targets:**
- Parse 1000 contacts: < 2000ms
- Search 5000 contacts: < 100ms
- localStorage save: < 500ms
- Dialog open: < 200ms
- Memory growth: < 10MB per 1000 contacts

---

### 2.4 Accessibility Standards

**WCAG 2.1 Level AA Compliance:**
- [ ] All dialogs accessible via keyboard (Tab, Enter, Escape)
- [ ] Focus management correct (trap in modals, return on close)
- [ ] ARIA labels for icon-only buttons
- [ ] Screen reader announcements for suggestions
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Keyboard shortcuts documented

**Testing Tools:**
-axe DevTools (Chrome extension)
-NVDA screen reader (Windows)
-VoiceOver (macOS)
-Keyboard-only navigation

---

## 3. Edge Cases and Boundary Conditions

### EC-001: Empty Contact List

**GIVEN** no contacts are loaded
**WHEN** user clicks "Lookup Contact"
**THEN** button shall be disabled
**AND** tooltip: "No contacts loaded"

### EC-002: Single Contact

**GIVEN** only 1 contact is loaded
**WHEN** user opens lookup dialog
**THEN** contact shall be displayed without virtual scrolling
**AND** search shall work normally

### EC-003: Very Long Names or Addresses

**GIVEN** contact has name > 100 characters or address > 500 characters
**WHEN** displayed in UI
**THEN** text shall be truncated with ellipsis
**AND** full text visible on hover or click

### EC-004: Special Characters in Names

**GIVEN** contact name contains special characters: "O'Brien", "안녕하세요!"
**WHEN** searched or displayed
**THEN** system shall handle correctly without errors
**AND** search shall match correctly

### EC-005: Duplicate Contacts in File

**GIVEN** uploaded file contains duplicate entries
**WHEN** system imports contacts
**THEN** each entry shall get unique UUID
**AND** all duplicates shall be imported
**AND** user can manually delete via manage dialog

### EC-006: Missing Optional Fields

**GIVEN** contact record has only English name and address (no Korean name)
**WHEN** displayed in lookup
**THEN** system shall show: "(English Name) - Address"
**AND** not show empty Korean name field

### EC-007: Concurrent Modifications

**GIVEN** user has contacts loaded in one tab
**AND** uploads different contacts in another tab
**WHEN** tabs are synced (storage event)
**THEN** system shall reload contacts from localStorage
**AND** update UI accordingly

### EC-008: Network Offline

**GIVEN** user is offline
**WHEN** using contacts feature
**THEN** all features shall work normally (client-side only)
**AND** no network errors shall appear

---

## 4. User Acceptance Testing (UAT) Checklist

### UAT-001: Basic Workflow

**Test Steps:**
1. Open PDF Export dialog
2. Click "Upload Contacts"
3. Select test file: `contacts-standard.xlsx`
4. Verify contacts imported successfully
5. Verify count indicator shows correct number
6. Click "Manage Contacts"
7. Verify all contacts displayed correctly
8. Close management dialog
9. Open CustomFieldsDialog
10. Click "Lookup Contact"
11. Search for a known contact
12. Select contact
13. Verify fields filled correctly
14. Generate PDF and verify data correct

**Expected Result:** All steps complete successfully without errors

---

### UAT-002: Column Mapping Workflow

**Test Steps:**
1. Upload file with non-standard headers: `contacts-non-standard.xlsx`
2. Verify ColumnMapperDialog opens
3. Map columns correctly
4. Click "Import"
5. Verify contacts imported with correct data
6. Open lookup and verify contact names are correct

**Expected Result:** Column mapping works, contacts imported correctly

---

### UAT-003: Intelligent Matching Workflow

**Test Steps:**
1. Load test contacts (100+ records)
2. Open CustomFieldsDialog
3. Type donorName that exists in contacts
4. Verify ContactMatchBanner appears
5. Verify confidence score is reasonable
6. Click "Apply"
7. Verify all fields filled correctly
8. Repeat with different donorName
9. Click "Ignore" on suggestion
10. Verify suggestion dismissed, fields not filled

**Expected Result:** Matching works reliably, apply/ignore work correctly

---

### UAT-004: Large Dataset Performance

**Test Steps:**
1. Upload file with 1000+ contacts
2. Verify parsing completes within 2 seconds
3. Open lookup dialog
4. Type search query
5. Verify results appear within 100ms
6. Scroll through list
7. Verify smooth scrolling (no lag)
8. Delete some contacts via manage dialog
9. Verify updates complete quickly

**Expected Result:** Performance acceptable at scale

---

### UAT-005: Error Recovery

**Test Steps:**
1. Try uploading invalid file (.pdf)
2. Verify clear error message
3. Try uploading file with 10,000 contacts (expect quota error)
4. Verify clear error message with guidance
5. Upload valid file
6. Verify success after errors
7. Delete all contacts
8. Verify confirmation required
9. Cancel deletion
10. Verify contacts still present

**Expected Result:** All errors handled gracefully with clear messaging

---

## 5. Definition of Done

**All Acceptance Criteria Met:**
- [ ] AC-001 to AC-010: All functional requirements working
- [ ] All quality gates passed (TRUST 5)
- [ ] LSP quality gates passed (zero errors)
- [ ] Performance benchmarks met
- [ ] Accessibility standards met
- [ ] Edge cases handled
- [ ] UAT checklist completed successfully

**Additional Requirements:**
- [ ] Code reviewed and approved
- [ ] Documentation updated (README, CHANGELOG)
- [ ] i18n translations complete (English + Korean)
- [ ] No regressions in existing features
- [ ] Browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive (if applicable)

**Sign-Off:**
- [ ] Developer sign-off
- [ ] QA sign-off
- [ ] Product Owner sign-off

---

## 6. Test Data Specifications

### TD-001: Standard Test File Structure

**File:** `test-data/contacts-standard.xlsx`

**Headers:**
| 한글이름 | 영문이름 | 주소 |
|---------|---------|------|
| 김철수 | Kim Chul-soo | Seoul, Gangnam-gu... |
| 이영수 | Lee Young-soo | Busan, Haeundae-gu... |
| 박미영 | Park Mi-young | Incheon, Yeonsu-gu... |

**Specifications:**
- 50 rows of test data
- Mixed Korean and English names
- Various address formats
- Some rows missing Korean names (optional field)

---

### TD-002: Non-Standard Headers File

**File:** `test-data/contacts-non-standard.xlsx`

**Headers:**
| KName | EName | Addr |
|-------|-------|------|
| ... | ... | ... |

**Purpose:** Test column mapping dialog

---

### TD-003: Large Dataset File

**File:** `test-data/contacts-large.xlsx`

**Specifications:**
- 1000+ rows
- Performance testing
- Virtual scrolling validation

---

### TD-004: Malformed Data File

**File:** `test-data/contacts-malformed.xlsx`

**Issues:**
- Missing required columns
- Empty rows
- Invalid data types
- Corrupted formatting

**Purpose:** Test error handling

---

## 7. Success Metrics

**Quantitative Metrics:**
- 95%+ success rate for file uploads (standard formats)
- 80%+ accuracy for intelligent matching (measured by user acceptance rate)
- < 2s parsing time for 1000 contacts
- < 100ms search response time for 5000 contacts
- 85%+ test coverage for new code

**Qualitative Metrics:**
- Users report reduced manual entry time (survey feedback)
- No increase in support tickets related to PDF export
- Positive user feedback on auto-fill feature
- Minimal user errors during column mapping

---

**TAG-CONTACTS-001**: Acceptance Criteria Complete
