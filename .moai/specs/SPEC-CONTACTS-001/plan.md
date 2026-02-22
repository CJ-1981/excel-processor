# Implementation Plan: SPEC-CONTACTS-001 Contacts List Feature

**TAG:** TAG-CONTACTS-001
**Related SPEC:** SPEC-CONTACTS-001
**Status:** Planned
**Last Updated:** 2025-02-22

---

## 1. Development Milestones

### Priority High (Core Functionality - MUST HAVE)

**Milestone 1: Data Layer & Storage**
- Implement ContactRecord TypeScript interfaces
- Create localStorage management utilities
- Implement contact matching algorithms
- Add unit tests for data layer

**Milestone 2: File Upload & Parsing**
- Create ContactsUploader component
- Implement SheetJS integration for parsing
- Add column detection logic
- Create ColumnMapperDialog for manual mapping
- Handle file upload errors and validation

**Milestone 3: Lookup UI**
- Create ContactsLookupDialog component
- Implement search and filtering
- Add virtual scrolling for performance
- Integrate with CustomFieldsDialog

**Milestone 4: Intelligent Matching**
- Implement automatic matching on dialog open
- Create ContactMatchBanner component
- Add confidence scoring
- Handle apply/ignore actions

### Priority Medium (Enhancement - SHOULD HAVE)

**Milestone 5: Contact Management**
- Create ContactsManageDialog component
- Implement delete functionality (single and bulk)
- Add pagination for large contact lists
- Integrate with PDFExportDialog

**Milestone 6: UI Polish**
- Add loading states and progress indicators
- Implement drag-and-drop file upload
- Add keyboard shortcuts
- Improve accessibility (ARIA labels, focus management)

### Priority Low (Nice-to-Have - COULD HAVE)

**Milestone 7: Advanced Features**
- Implement fuzzy matching optimization
- Add contact import progress for large files
- Create contact export functionality
- Add contact analytics/statistics

---

## 2. Technical Approach

### 2.1 Component Architecture

**Component Hierarchy:**
```
PDFExportDialog (existing - MODIFY)
├── UploadButton (existing - EXTEND)
├── ContactsUploader (NEW)
│   ├── FileInput (reused from ExcelUploader)
│   └── ColumnMapperDialog (NEW)
├── ContactsIndicator (NEW - shows count)
├── ManageContactsButton (NEW)
│   └── ContactsManageDialog (NEW)
│       ├── ContactList (virtualized)
│       └── DeleteConfirmationDialog
└── CustomFieldsDialog (existing - MODIFY)
    ├── donorName Field (EXTEND - add Lookup button)
    ├── donorAddress Field (EXTEND - add Lookup button)
    ├── ContactMatchBanner (NEW - conditional)
    └── ContactsLookupDialog (NEW - triggered by Lookup)
        └── ContactSearchResults (virtualized)
```

**State Management Strategy:**
```typescript
// PDFExportDialog state
interface PDFExportDialogState {
  // ... existing state
  contacts?: ContactRecord[];  // NEW: All loaded contacts
  contactsLoadedAt?: number;   // NEW: Load timestamp
  showContactsUploader: boolean;  // NEW: Upload dialog state
  showContactsManager: boolean;    // NEW: Manage dialog state
}

// CustomFieldsDialog state (enhanced)
interface CustomFieldsDialogState {
  // ... existing state
  contacts?: ContactRecord[];     // NEW: Passed from parent
  suggestedMatch?: MatchResult;   // NEW: Auto-match result
  showContactLookup: boolean;     // NEW: Which field triggered
  lookupTargetField?: 'donorName' | 'donorAddress';  // NEW
}
```

### 2.2 Data Flow

**Upload Flow:**
```
User selects files → ContactsUploader
  ↓
File validation (format, size)
  ↓
SheetJS parsing → Raw data
  ↓
Column detection (automatic)
  ↓
IF confidence < 70% → Show ColumnMapperDialog
  ↓ (after mapping or if auto-detected)
Map data to ContactRecord format
  ↓
Merge with existing contacts (deduplicate by ID)
  ↓
Save to localStorage (with version and metadata)
  ↓
Callback to PDFExportDialog → Update state
```

**Lookup Flow:**
```
User clicks "Lookup" button → CustomFieldsDialog
  ↓
Open ContactsLookupDialog with all contacts
  ↓
User types in search box → Filter contacts
  ↓ (virtual rendering)
Display matching contacts (Korean, English, Address)
  ↓
User selects contact → Callback to CustomFieldsDialog
  ↓
Fill donorName and donorAddress fields
  ↓
Close lookup dialog
```

**Automatic Matching Flow:**
```
CustomFieldsDialog opens (or donorName changes)
  ↓
Trigger useEffect with donorName value
  ↓
Call findMatchingContacts(donorName, contacts)
  ↓
IF confidence >= 80% → Show ContactMatchBanner
  ↓
User clicks "Apply" → Fill all matched fields
User clicks "Ignore" → Dismiss banner
User types in field → Dismiss banner (auto)
```

### 2.3 Implementation Sequence

**Phase 1: Foundation (Milestone 1)**
1. Create `src/types.ts` enhancements (ContactRecord interfaces)
2. Create `src/utils/contactStorage.ts` (localStorage management)
3. Create `src/utils/contactMatcher.ts` (matching algorithms)
4. Write unit tests for utilities (Vitest)

**Phase 2: Upload Pipeline (Milestone 2)**
5. Create `src/components/PDFExport/ContactsUploader.tsx`
6. Create `src/components/PDFExport/ColumnMapperDialog.tsx`
7. Integrate ContactsUploader into PDFExportDialog
8. Add file upload progress indicators

**Phase 3: Lookup Integration (Milestone 3)**
9. Create `src/components/PDFExport/ContactsLookupDialog.tsx`
10. Modify CustomFieldsDialog to add Lookup buttons
11. Implement search and virtualization
12. Connect lookup selection to field filling

**Phase 4: Intelligent Matching (Milestone 4)**
13. Create `src/components/PDFExport/ContactMatchBanner.tsx`
14. Implement automatic matching useEffect in CustomFieldsDialog
15. Add apply/ignore handlers
16. Test matching accuracy with sample data

**Phase 5: Management UI (Milestone 5)**
17. Create `src/components/PDFExport/ContactsManageDialog.tsx`
18. Add delete functionality
19. Integrate into PDFExportDialog
20. Add pagination/virtualization for performance

**Phase 6: Polish & Translation (Milestone 6)**
21. Add all i18n translations (en.json, ko.json)
22. Implement drag-and-drop upload
23. Add keyboard navigation
24. Accessibility audit and improvements

**Phase 7: Advanced Features (Milestone 7 - Optional)**
25. Optimize fuzzy matching algorithm
26. Add progress indicators for large files
27. Implement contact export
28. Add usage statistics

### 2.4 File Structure

**New Files:**
```
src/
├── types.ts (MODIFY - add ContactRecord interfaces)
├── utils/
│   ├── contactStorage.ts (NEW - localStorage management)
│   ├── contactMatcher.ts (NEW - matching algorithms)
│   └── stringUtils.ts (NEW - normalization, similarity)
├── components/
│   └── PDFExport/
│       ├── ContactsUploader.tsx (NEW)
│       ├── ColumnMapperDialog.tsx (NEW)
│       ├── ContactsLookupDialog.tsx (NEW)
│       ├── ContactMatchBanner.tsx (NEW)
│       └── ContactsManageDialog.tsx (NEW)
└── i18n/
    ├── locales/
    │   ├── en.json (MODIFY - add contacts namespace)
    │   └── ko.json (MODIFY - add contacts namespace)
    └── index.ts (MODIFY - if needed)

tests/
├── unit/
│   ├── utils/
│   │   ├── contactStorage.test.ts (NEW)
│   │   ├── contactMatcher.test.ts (NEW)
│   │   └── stringUtils.test.ts (NEW)
│   └── components/
│       └── PDFExport/
│           ├── ContactsUploader.test.tsx (NEW)
│           ├── ContactsLookupDialog.test.tsx (NEW)
│           └── ContactMatchBanner.test.tsx (NEW)
└── integration/
    └── contacts-flow.test.ts (NEW - end-to-end flow)
```

**Modified Files:**
```
src/
├── components/
│   └── PDFExport/
│       ├── index.tsx (MODIFY - add contacts state and UI)
│       └── CustomFieldsDialog.tsx (MODIFY - add lookup buttons and matching)
```

---

## 3. Architecture Decisions

### 3.1 Decision: Client-Side Storage vs Server-Side

**Decision:** Use client-side localStorage

**Rationale:**
- No backend changes required
- Faster implementation (no API design)
- Privacy-friendly (data stays on user's device)
- Sufficient for typical contact lists (<5000 contacts)

**Trade-offs:**
- ❌ No cross-device sync
- ❌ Limited storage capacity
- ✅ Simpler architecture
- ✅ No additional infrastructure

**Mitigation for Limitations:**
- Implement size checks and graceful degradation
- Provide clear error messages for quota exceeded
- Future SPEC for cloud sync if needed (SPEC-CONTACTS-002)

### 3.2 Decision: Virtual Scrolling vs Pagination

**Decision:** Use virtual scrolling (react-window or MUI VirtualList)

**Rationale:**
- Better UX for large lists (smooth scrolling)
- No page load boundaries
- Lower memory footprint than rendering all items

**Trade-offs:**
- ❌ More complex implementation
- ❌ Requires dynamic row height measurement
- ✅ Better performance for 1000+ contacts
- ✅ Modern UI pattern

**Implementation:**
- Use `react-window` with MUI styling
- Fixed row height: 60px per contact
- Estimated height for dynamic content (addresses)

### 3.3 Decision: Exact vs Fuzzy Matching

**Decision:** Hybrid approach with confidence scoring

**Rationale:**
- Exact matching for Korean names (high precision)
- Fuzzy matching for English names (handles typos, variations)
- Confidence threshold prevents false positives

**Algorithm:**
```typescript
Match Priority:
1. Exact Korean name match → 100% confidence
2. Exact English name match → 95% confidence
3. Fuzzy English match (Levenshtein) → 0-94% confidence
4. Partial Korean match (contains) → 50-79% confidence

Display threshold: ≥80% confidence
```

**Trade-offs:**
- ❌ More complex matching logic
- ❌ Potential for false positives
- ✅ Better user experience (fewer manual searches)
- ✅ Handles common data entry variations

### 3.4 Decision: Column Detection Strategy

**Decision:** Multi-pattern matching with confidence threshold

**Rationale:**
- Korean Excel files have varying column naming conventions
- Automatic detection reduces user friction
- Fallback to manual mapping when confidence low

**Detection Patterns:**
```typescript
Korean Name: ['한글이름', 'Korean Name', 'korean_name', '이름']
English Name: ['영문이름', 'English Name', 'english_name', 'name', 'Name']
Address: ['주소', 'Address', 'address', 'addr']
```

**Confidence Scoring:**
- Direct match: 100%
- Case-insensitive match: 90%
- Partial match (contains): 70%
- Overall threshold: ≥70% to auto-detect

### 3.5 Decision: Deduplication Strategy

**Decision:** Append-only with UUID-based deduplication

**Rationale:**
- Simple implementation
- Preserves data from multiple sources
- UUID ensures uniqueness even with duplicate data

**Deduplication Logic:**
```typescript
// Each contact gets unique UUID on import
// No automatic merging of "similar" contacts
// User can manually delete duplicates via Manage UI
```

**Future Enhancement:**
- SPEC-CONTACTS-003 could add smart deduplication
- User-controlled merge rules
- Fuzzy matching for duplicate detection

---

## 4. Risk Assessment

### 4.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| localStorage quota exceeded | Medium | High | Implement size checks, clear error messages, suggest reducing contacts |
| SheetJS encoding issues with Korean | Low | Medium | Test with various Excel files, provide encoding options if needed |
| Performance degradation with large lists | Medium | Medium | Implement virtual scrolling, limit max contacts, add lazy loading |
| Fuzzy matching false positives | Medium | Low | Conservative confidence threshold (80%), user can override |
| Material-UI v7 compatibility issues | Low | Low | Project already using MUI v7, reuse existing patterns |

### 4.2 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Column detection fails frequently | Medium | High | Extensive pattern testing, manual mapping fallback, user documentation |
| Users don't understand matching suggestions | Low | Medium | Clear UI labels, help text, ignore option always available |
| Contact list becomes unmanageable | Medium | Medium | Pagination/virtualization, bulk delete, sort/search in manage UI |
| Breaking existing PDF export workflow | Low | High | Comprehensive regression tests, feature flag for gradual rollout |

### 4.3 Data Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss on browser storage clear | High | Medium | Clear documentation that contacts are local-only, future cloud sync |
| Malicious file upload | Low | High | File validation, size limits, SheetJS sandboxed parsing |
| Accidental deletion of contacts | Medium | Medium | Confirmation dialogs, "Undo" notification, restore from backup |

---

## 5. Testing Strategy

### 5.1 Unit Tests (Vitest)

**Data Layer Tests:**
- `contactStorage.test.ts`: localStorage read/write, quota handling, version migration
- `contactMatcher.test.ts`: exact matching, fuzzy matching, confidence scoring
- `stringUtils.test.ts`: normalization, similarity calculation

**Component Tests:**
- `ContactsUploader.test.tsx`: file selection, parsing, column detection
- `ContactsLookupDialog.test.tsx`: search filtering, selection, keyboard navigation
- `ContactMatchBanner.test.tsx`: display conditions, apply/ignore actions

**Target Coverage:** 85% for new code

### 5.2 Integration Tests

**End-to-End Flow:**
```typescript
describe('Contacts Feature Flow', () => {
  it('should upload file and auto-fill fields', async () => {
    // 1. Upload file
    // 2. Verify contacts loaded
    // 3. Open CustomFieldsDialog
    // 4. Verify automatic match
    // 5. Apply suggestion
    // 6. Verify fields filled
  });

  it('should handle column mapping dialog', async () => {
    // 1. Upload file with non-standard headers
    // 2. Verify column mapping dialog opens
    // 3. Select correct columns
    // 4. Verify contacts imported
  });
});
```

### 5.3 Manual Testing Scenarios

**Test Files Required:**
- `test-data/contacts-standard.xlsx` - Standard headers
- `test-data/contacts-non-standard.xlsx` - Non-standard headers
- `test-data/contacts-korean.xlsx` - Korean names only
- `test-data/contacts-large.xlsx` - 1000+ contacts (performance test)
- `test-data/contacts-malformed.xlsx` - Invalid data (error handling)

**Browser Testing:**
- Chrome, Firefox, Safari, Edge
- Test localStorage quota limits
- Test file encoding variations
- Test keyboard navigation
- Test screen reader accessibility

---

## 6. Definition of Done

**For Each Milestone:**
- [ ] Code implemented per specifications
- [ ] Unit tests passing (85%+ coverage)
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] i18n translations added (English + Korean)
- [ ] Accessibility reviewed (keyboard, screen reader)
- [ ] Documentation updated (if needed)

**Overall Feature Completion:**
- [ ] All Milestones 1-4 completed (Priority High)
- [ ] Milestone 5 completed (Priority Medium)
- [ ] Manual testing completed with test files
- [ ] No regressions in existing PDF export functionality
- [ ] Performance benchmarks met (<100ms search, <2s parsing)
- [ ] localStorage size limits documented
- [ ] User acceptance testing completed

---

## 7. Open Questions

1. **Question:** Should we implement contact deduplication on import?
   **Status:** Deferred to Phase 1 feedback
   **Default:** No deduplication (UUID-based uniqueness)

2. **Question:** What is the maximum number of contacts we should support?
   **Status:** Proposed 5000 soft limit
   **Decision Needed:** Confirm with product owner

3. **Question:** Should matching be case-sensitive or case-insensitive?
   **Status:** Proposed case-insensitive with normalization
   **Decision Needed:** Confirm with user testing

4. **Question:** Should we add a "Reset All Contacts" button?
   **Status:** Not in current spec
   **Decision Needed:** Consider for Milestone 5

---

## 8. Dependencies

**Internal Dependencies:**
- Existing PDFExport component architecture
- Existing i18n system
- Existing FormField component
- Existing SheetJS integration

**External Dependencies:**
- SheetJS (already installed)
- Material-UI v7 (already installed)
- Optional: `react-window` for virtualization (new dependency if needed)

**Blocked By:**
- None (standalone feature)

**Blocking:**
- Future SPEC-CONTACTS-002 (cloud sync)
- Future SPEC-CONTACTS-003 (smart deduplication)

---

## 9. Time Estimation (Priority-Based)

**Priority High (Milestones 1-4):** Primary Goal
- Core functionality only
- Essential UI components
- Basic error handling

**Priority Medium (Milestone 5):** Secondary Goal
- Management UI
- Enhanced UX
- Comprehensive error handling

**Priority Low (Milestone 6-7):** Final Goal
- Polish and optimization
- Advanced features
- Performance tuning

**Dependencies:**
- Complete Milestone 1 before starting Milestone 2
- Complete Milestone 2 before starting Milestone 3
- Milestones 3 and 4 can be developed in parallel
- Complete Milestones 1-4 before starting Milestone 5

---

## 10. Rollout Plan

**Phase 1: Alpha (Internal Testing)**
- Deploy to development environment
- Test with sample contact files
- Validate core functionality
- Fix critical bugs

**Phase 2: Beta (Limited Users)**
- Deploy to staging environment
- Test with real user data
- Gather feedback on matching accuracy
- Iterate on UX

**Phase 3: Production Release**
- Deploy to production
- Monitor for errors and performance
- Gather user feedback
- Plan iterations for Milestones 5-7

**Feature Flag Consideration:**
- Consider adding feature flag to enable/disable contacts feature
- Allows quick rollback if issues arise
- Enables gradual rollout to users

---

**TAG-CONTACTS-001**: Implementation Plan Complete
