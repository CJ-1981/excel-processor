# SPEC-CONTACTS-001: Contacts List Feature for PDF Export

**TAG:** TAG-CONTACTS-001
**Status:** Planned
**Priority:** High
**Created:** 2025-02-22
**Domain:** PDF Export, User Experience

---

## 1. Environment

### 1.1 Current System

**Project:** Excel Processor - Donation Receipt Generator
**Tech Stack:**
- Frontend: React 19 with TypeScript
- UI Framework: Material-UI v7 (MUI v7)
- File Processing: SheetJS (xlsx) library for Excel/CSV parsing
- Internationalization: i18n system (English, Korean)
- State Management: React hooks, localStorage for persistence

**Existing Components:**
- `src/components/PDFExport/index.tsx` - Main PDF export dialog
- `src/components/PDFExport/CustomFieldsDialog.tsx` - Custom fields form
- `src/components/ExcelUploader.tsx` - File upload patterns to reuse

**Browser Environment:**
- Modern browsers with localStorage support
- localStorage quota: Typically 5-10MB per origin
- File upload via standard HTML file input

### 1.2 Dependencies

**External Libraries:**
- `xlsx` (SheetJS) - Already installed for Excel processing
- `@mui/material` v7 - UI components
- `i18next` - Internationalization

**No New Dependencies Required:**
- File parsing: Reuse existing SheetJS installation
- Storage: Browser localStorage API
- Matching: Custom fuzzy matching implementation

---

## 2. Assumptions

### 2.1 Technical Assumptions

| Assumption | Confidence | Evidence Basis | Risk if Wrong |
|------------|------------|----------------|---------------|
| SheetJS can parse Korean text correctly | High | Existing code processes Korean Excel files | Medium - May need encoding handling |
| localStorage sufficient for contact lists | Medium | 5-10MB typical limit; contacts are small | Medium - Need compression/pagination fallback |
| Fuzzy matching can achieve 80% accuracy | Medium | Simple string matching + normalization | Low - Can iterate on algorithm |
| Material-UI v7 supports required components | High | Project already using MUI v7 | Low - Well-established library |

### 2.2 Business Assumptions

| Assumption | Confidence | Evidence Basis | Risk if Wrong |
|------------|------------|----------------|---------------|
| Users have existing contact lists in Excel/CSV | High | Common business practice | Low - Can still add contacts manually |
| Korean name columns vary in naming | High | No standard naming convention | Medium - Need flexible column detection |
| Auto-filling reduces manual entry time significantly | High | Primary user pain point | Low - Feature still provides value |

### 2.3 User Assumptions

- Users are comfortable uploading files to web application
- Users understand basic file format (Excel/CSV)
- Users can identify correct columns if auto-detection fails
- Users prefer suggestions over fully automatic behavior

---

## 3. Requirements (EARS Format)

### 3.1 Ubiquitous Requirements (Always Active)

**REQ-CONTACTS-001:** The system SHALL use the existing SheetJS (xlsx) library for parsing XLS/CSV contact files.

**REQ-CONTACTS-002:** The system SHALL persist all contacts in browser localStorage using key `excel-processor-contacts`.

**REQ-CONTACTS-003:** The system SHALL support all file formats currently supported by ExcelUploader (.xlsx, .xls, .csv).

**REQ-CONTACTS-004:** The system SHALL provide all UI text in both English and Korean through the existing i18n system.

**REQ-CONTACTS-005:** The system SHALL maintain backward compatibility with existing PDF export functionality (no breaking changes).

### 3.2 Event-Driven Requirements (WHEN-THEN)

**REQ-CONTACTS-006:** WHEN user uploads one or more contact files, THEN the system SHALL parse all files and merge contacts into a single list.

**REQ-CONTACTS-007:** WHEN file upload completes, THEN the system SHALL attempt automatic column detection using predefined header name patterns.

**REQ-CONTACTS-008:** WHEN automatic column detection fails (confidence < 70%), THEN the system SHALL display a column mapping dialog for manual configuration.

**REQ-CONTACTS-009:** WHEN user clicks "Lookup Contact" button in CustomFieldsDialog, THEN the system SHALL open a searchable contacts dialog.

**REQ-CONTACTS-010:** WHEN user selects a contact from the lookup dialog, THEN the system SHALL fill both donorName and donorAddress fields and close the dialog.

**REQ-CONTACTS-011:** WHEN CustomFieldsDialog opens, THEN the system SHALL automatically search for contacts matching the current donorName value.

**REQ-CONTACTS-012:** WHEN a contact match is found with confidence score ≥ 80%, THEN the system SHALL display a suggestion banner with "Apply" and "Ignore" buttons.

**REQ-CONTACTS-013:** WHEN user clicks "Apply" on suggestion banner, THEN the system SHALL fill all matched fields (donorName, donorAddress, donorEnglishName if available).

**REQ-CONTACTS-014:** WHEN user clicks "Manage Contacts" button, THEN the system SHALL display a dialog showing all loaded contacts with delete capability.

**REQ-CONTACTS-015:** WHEN user deletes contacts from management dialog, THEN the system SHALL update localStorage and refresh all contact-dependent UI elements.

### 3.3 State-Driven Requirements (IF-THEN)

**REQ-CONTACTS-016:** IF localStorage quota is exceeded during contact storage, THEN the system SHALL display an error message explaining the limit and suggesting reducing contact count.

**REQ-CONTACTS-017:** IF contact list is empty (no contacts loaded), THEN the system SHALL disable "Lookup Contact" and "Manage Contacts" buttons and show "No contacts loaded" indicator.

**REQ-CONTACTS-018:** IF multiple matches are found with equal confidence scores, THEN the system SHALL display all matches and require manual selection.

**REQ-CONTACTS-019:** IF no matches are found with confidence ≥ 50%, THEN the system SHALL not display any suggestion.

### 3.4 Unwanted Requirements (Prohibited Behavior)

**REQ-CONTACTS-020:** The system SHALL NOT overwrite existing custom field values without user confirmation (via suggestion acceptance).

**REQ-CONTACTS-021:** The system SHALL NOT lose existing contacts when new files are uploaded (append/merge behavior only).

**REQ-CONTACTS-022:** The system SHALL NOT prevent PDF export when contacts feature fails (graceful degradation).

**REQ-CONTACTS-023:** The system SHALL NOT store any personal data beyond what's explicitly provided in contact files.

### 3.5 Optional Requirements (Enhancement Features)

**REQ-CONTACTS-024:** WHERE possible, the system SHALL implement fuzzy matching for English names using string similarity algorithms (Levenshtein distance or similar).

**REQ-CONTACTS-025:** WHERE possible, the system SHALL provide contact import progress indicators for large files (>100 rows).

**REQ-CONTACTS-026:** WHERE possible, the system SHALL support drag-and-drop file upload in addition to standard file picker.

**REQ-CONTACTS-027:** WHERE possible, the system SHALL cache match results to avoid redundant searches within the same session.

---

## 4. Specifications

### 4.1 Data Structures

**ContactRecord Interface:**
```typescript
interface ContactRecord {
  id: string;                    // Unique identifier (UUID)
  koreanName?: string;           // Korean name (optional)
  englishName: string;           // English name (required, primary match field)
  address: string;               // Full address
  sourceFile?: string;           // Source filename for debugging
  createdAt: number;             // Timestamp of import
}
```

**ContactsState Interface:**
```typescript
interface ContactsState {
  contacts: ContactRecord[];     // All loaded contacts
  loadedAt?: number;             // Last load timestamp
  version: string;               // Data structure version for migration
}
```

**ColumnMapping Interface:**
```typescript
interface ColumnMapping {
  koreanName?: string;           // Column index or name for Korean name
  englishName: string;           // Column index or name for English name (required)
  address: string;               // Column index or name for address (required)
}
```

**MatchResult Interface:**
```typescript
interface MatchResult {
  contact: ContactRecord;        // Matched contact
  confidence: number;            // Confidence score 0-100
  matchType: 'exact' | 'fuzzy' | 'partial'; // Type of match
}
```

### 4.2 Component Architecture

**New Components to Create:**

1. **ContactsUploader.tsx**
   - Location: `src/components/PDFExport/ContactsUploader.tsx`
   - Purpose: Handle file upload, parsing, and column detection
   - Props:
     - `onContactsLoaded: (contacts: ContactRecord[]) => void`
     - `existingContacts?: ContactRecord[]` - For merging
   - State:
     - `files: File[]` - Selected files
     - `isUploading: boolean` - Upload progress
     - `showColumnMapper: boolean` - Show mapping dialog if needed
     - `error?: string` - Error message display

2. **ContactsLookupDialog.tsx**
   - Location: `src/components/PDFExport/ContactsLookupDialog.tsx`
   - Purpose: Searchable contact selection dialog
   - Props:
     - `open: boolean` - Dialog open state
     - `contacts: ContactRecord[]` - All contacts to search
     - `onSelect: (contact: ContactRecord) => void` - Selection callback
     - `onClose: () => void` - Close callback
   - Features:
     - Search input (filters both Korean and English names)
     - Virtual scrolling for large lists (react-window or MUI VirtualList)
     - Single-click selection
     - Display format: "Korean Name (English Name) - Address"

3. **ContactMatchBanner.tsx**
   - Location: `src/components/PDFExport/ContactMatchBanner.tsx`
   - Purpose: Display intelligent match suggestions
   - Props:
     - `match: MatchResult | null` - Match result to display
     - `currentFieldValue: string` - Current field value for comparison
     - `onApply: () => void` - Apply suggestion callback
     - `onIgnore: () => void` - Dismiss suggestion callback
   - Features:
     - Non-intrusive alert/banner design
     - Shows match details and confidence score
     - "Apply" and "Ignore" action buttons
     - Auto-dismiss on field value change

4. **ContactsManageDialog.tsx**
   - Location: `src/components/PDFExport/ContactsManageDialog.tsx`
   - Purpose: View and delete loaded contacts
   - Props:
     - `open: boolean` - Dialog open state
     - `contacts: ContactRecord[]` - All contacts
     - `onDeleteContacts: (ids: string[]) => void` - Bulk delete callback
     - `onClose: () => void` - Close callback
   - Features:
     - Paginated or virtualized list
     - Checkbox selection for bulk delete
     - "Delete Selected" button
     - "Delete All" button with confirmation

### 4.3 Algorithm Specifications

**Column Detection Algorithm:**
```typescript
function detectColumns(headers: string[]): ColumnMapping | null {
  const koreanNamePatterns = ['한글이름', 'Korean Name', 'korean_name', '이름'];
  const englishNamePatterns = ['영문이름', 'English Name', 'english_name', 'name', 'Name'];
  const addressPatterns = ['주소', 'Address', 'address', 'addr'];

  // Normalize headers to lowercase for matching
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Find matches with confidence scoring
  const koreanNameCol = findBestMatch(normalizedHeaders, koreanNamePatterns);
  const englishNameCol = findBestMatch(normalizedHeaders, englishNamePatterns);
  const addressCol = findBestMatch(normalizedHeaders, addressPatterns);

  // Validate required columns found
  if (!englishNameCol || !addressCol) return null;

  // Calculate overall confidence
  const confidence = calculateConfidence([
    koreanNameCol?.confidence || 0,
    englishNameCol.confidence,
    addressCol.confidence
  ]);

  return confidence >= 0.7 ? {
    koreanName: koreanNameCol?.index,
    englishName: englishNameCol.index,
    address: addressCol.index
  } : null;
}
```

**Contact Matching Algorithm:**
```typescript
function findMatchingContacts(
  searchTerm: string,
  contacts: ContactRecord[]
): MatchResult[] {
  const normalizedSearch = normalizeString(searchTerm);
  const results: MatchResult[] = [];

  for (const contact of contacts) {
    let confidence = 0;
    let matchType: 'exact' | 'fuzzy' | 'partial' = 'partial';

    // Exact Korean name match (highest priority)
    if (contact.koreanName && normalizeString(contact.koreanName) === normalizedSearch) {
      confidence = 100;
      matchType = 'exact';
    }
    // Exact English name match
    else if (normalizeString(contact.englishName) === normalizedSearch) {
      confidence = 95;
      matchType = 'exact';
    }
    // Fuzzy English name match
    else {
      const englishSimilarity = calculateSimilarity(
        normalizedSearch,
        normalizeString(contact.englishName)
      );
      const koreanSimilarity = contact.koreanName
        ? calculateSimilarity(normalizedSearch, normalizeString(contact.koreanName))
        : 0;

      confidence = Math.max(englishSimilarity, koreanSimilarity) * 100;
      matchType = 'fuzzy';
    }

    if (confidence >= 50) {
      results.push({ contact, confidence, matchType });
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove whitespace
    .replace(/[^\w\s가-힣]/g, ''); // Keep alphanumeric, Korean, whitespace
}
```

**Similarity Calculation (Levenshtein-based):**
```typescript
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}
```

### 4.4 localStorage Management

**Storage Key:** `excel-processor-contacts`

**Storage Schema:**
```typescript
interface StorageSchema {
  version: '1.0';
  contacts: ContactRecord[];
  metadata: {
    loadedAt: number;
    sourceFileCount: number;
    totalContacts: number;
  };
}
```

**Size Management Strategy:**
```typescript
const MAX_CONTACTS = 5000; // Soft limit
const COMPRESSION_THRESHOLD = 1000; // Contacts count to trigger compression warning

async function saveContacts(contacts: ContactRecord[]): Promise<void> {
  try {
    const data: StorageSchema = {
      version: '1.0',
      contacts,
      metadata: {
        loadedAt: Date.now(),
        sourceFileCount: new Set(contacts.map(c => c.sourceFile)).size,
        totalContacts: contacts.length
      }
    };

    const serialized = JSON.stringify(data);

    // Check size before saving
    if (serialized.length > 4 * 1024 * 1024) { // 4MB threshold
      throw new Error('Contacts list too large. Please reduce number of contacts.');
    }

    localStorage.setItem('excel-processor-contacts', serialized);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete some contacts or reduce file size.');
    }
    throw error;
  }
}
```

### 4.5 API Contracts (Internal Component Communication)

**PDFExportDialog → ContactsUploader:**
```typescript
interface ContactsUploaderProps {
  onContactsLoaded: (contacts: ContactRecord[]) => void;
  existingContacts?: ContactRecord[];
}
```

**PDFExportDialog → CustomFieldsDialog:**
```typescript
interface CustomFieldsDialogProps {
  // ... existing props
  contacts?: ContactRecord[];  // NEW: Pass loaded contacts
  onContactLookup?: (field: 'donorName' | 'donorAddress') => void;  // NEW
}
```

**CustomFieldsDialog Internal:**
```typescript
// Automatic matching on mount
useEffect(() => {
  if (contacts && contacts.length > 0 && donorName) {
    const matches = findMatchingContacts(donorName, contacts);
    if (matches.length > 0 && matches[0].confidence >= 80) {
      setSuggestedMatch(matches[0]);
    }
  }
}, [donorName, contacts]);
```

**Internationalization Keys (en.json):**
```json
{
  "contacts": {
    "uploadButton": "Upload Contacts",
    "manageButton": "Manage Contacts",
    "lookupButton": "Lookup Contact",
    "noContacts": "No contacts loaded",
    "contactsCount": "{{count}} contacts loaded",
    "columnMappingDialog": {
      "title": "Map Contact Columns",
      "instruction": "Select which columns contain contact information:"
    },
    "lookupDialog": {
      "title": "Select Contact",
      "searchPlaceholder": "Search by name...",
      "noResults": "No contacts found"
    },
    "matchBanner": {
      "suggestion": "Found matching contact: {{name}} ({{confidence}}% match)",
      "apply": "Apply",
      "ignore": "Ignore"
    },
    "manageDialog": {
      "title": "Manage Contacts",
      "deleteSelected": "Delete Selected",
      "deleteAll": "Delete All",
      "confirmDeleteAll": "Are you sure you want to delete all contacts?"
    }
  }
}
```

---

## 5. Traceability

**TAG-CONTACTS-001:** All requirements, specifications, and implementation tasks for the contacts list feature.

**Traceability Matrix:**

| Requirement | Component(s) | Test Scenario |
|-------------|--------------|---------------|
| REQ-CONTACTS-001 to 005 | All | System-level tests |
| REQ-CONTACTS-006, 007 | ContactsUploader | TC-UPLOAD-001, TC-UPLOAD-002 |
| REQ-CONTACTS-008 | ColumnMapperDialog | TC-MAPPING-001 |
| REQ-CONTACTS-009, 010 | ContactsLookupDialog | TC-LOOKUP-001, TC-LOOKUP-002 |
| REQ-CONTACTS-011, 012, 013 | ContactMatchBanner | TC-MATCH-001, TC-MATCH-002 |
| REQ-CONTACTS-014, 015 | ContactsManageDialog | TC-MANAGE-001, TC-MANAGE-002 |
| REQ-CONTACTS-016 to 019 | All (state handling) | TC-STATE-001 to TC-STATE-004 |
| REQ-CONTACTS-020 to 023 | All (negative tests) | TC-NEG-001 to TC-NEG-003 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Contact file parsing: < 2 seconds for 1000 contacts
- Search/filter response: < 100ms for 5000 contacts
- localStorage read/write: < 500ms
- UI responsiveness: No blocking operations on main thread

### 6.2 Security

- No sensitive data logging
- Input validation for all file uploads
- XSS prevention in contact display (escape user content)
- No server-side transmission of contact data

### 6.3 Accessibility

- All dialogs accessible via keyboard navigation
- ARIA labels for icon buttons
- Focus management in modal dialogs
- Screen reader announcements for suggestions

### 6.4 Compatibility

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- localStorage support required
- File API support required

---

## 7. Related Specifications

**Related Features:**
- PDF Export Custom Fields (existing)
- Excel File Upload (existing)
- Internationalization (existing)

**Potential Future SPECs:**
- SPEC-CONTACTS-002: Contact sync across devices
- SPEC-CONTACTS-003: Contact groups/categories
- SPEC-CONTACTS-004: Contact import from cloud sources (Google Sheets, etc.)

---

## 8. References

**Existing Code:**
- `src/components/PDFExport/index.tsx` - Main PDF export dialog
- `src/components/PDFExport/CustomFieldsDialog.tsx` - Custom fields form
- `src/components/ExcelUploader.tsx` - File upload patterns

**Libraries:**
- SheetJS Documentation: https://sheetjs.com/
- Material-UI v7: https://mui.com/
- i18next: https://www.i18next.com/

**Algorithms:**
- Levenshtein Distance: https://en.wikipedia.org/wiki/Levenshtein_distance
