# Implementation Plan: SPEC-SIGNATURE-001

## Metadata

| Field | Value |
|-------|-------|
| **SPEC ID** | SPEC-SIGNATURE-001 |
| **Title** | PDF Signature Image Support |
| **Development Mode** | Hybrid (new code: TDD, existing code: DDD) |

## Overview

This plan describes the implementation of PDF signature image support for the Excel Processor application. The feature allows users to upload signature images (PNG/JPG) that are stamped onto generated PDFs at specified coordinates defined in templates.

## Implementation Approach

### Development Methodology: Hybrid

**Rationale:** This feature involves:
- **NEW code** (SignatureImageSection type, renderSignatureImage function) → Apply TDD
- **EXISTING code modifications** (CustomFieldsDialog.tsx, generator.ts) → Apply DDD

**TDD for New Components:**
- Write failing tests for SignatureImageSection type validation
- Write failing tests for renderSignatureImage function
- Implement to pass tests
- Refactor for quality

**DDD for Existing Code:**
- ANALYZE: Understand existing dialog state management, PDF generation flow
- PRESERVE: Write characterization tests for CustomFieldsDialog behavior
- IMPROVE: Add signature-related state and handlers with test coverage

## Technical Approach

### Architecture Decisions

**Decision 1: State Management Pattern**

**Approach:** Extend existing React state pattern in CustomFieldsDialog

**Options Considered:**
- Option A: Add signature state to existing component state (CHOSEN)
- Option B: Create separate signature context provider
- Option C: Use Redux for signature state

**Trade-offs:**
- **Option A Pros:** Simple, follows existing pattern, no new dependencies
- **Option A Cons:** Component state grows larger
- **Option B Pros:** Cleaner separation, reusable across dialogs
- **Option B Cons:** Over-engineering for single use case, more complexity
- **Option C Pros:** Centralized state management
- **Option C Cons:** Heavy dependency for simple feature, Redux boilerplate

**What We Gain:** Simplicity and consistency with existing codebase
**What We Sacrifice:** Some scalability if signature usage expands significantly
**Why Acceptable:** Signatures are tightly coupled to PDF export dialog; reusability not a current requirement

**Decision 2: Image Data Storage Format**

**Approach:** Base64 Data URL strings stored in object keyed by field name

**Options Considered:**
- Option A: Base64 Data URL strings (CHOSEN)
- Option B: Blob URLs
- Option C: Image URLs (external storage)

**Trade-offs:**
- **Option A Pros:** Simple, works with jsPDF, no external dependencies
- **Option A Cons:** 33% size increase, large strings in memory
- **Option B Pros:** Smaller memory footprint
- **Option B Cons:** Not compatible with jsPDF, lifecycle management complexity
- **Option C Pros:** Small state size
- **Option C Cons:** Requires external storage, network dependency, async loading

**What We Gain:** Simplicity and jsPDF compatibility
**What We Sacrifice:** Memory efficiency for large images
**Why Acceptable:** Signatures are typically small (<100KB), memory impact acceptable

**Decision 3: Template Section Properties**

**Approach:** Minimal required properties with sensible defaults

**Options Considered:**
- Option A: Required x, y, width, height, imageData (strict)
- Option B: Required x, y; optional width, height, imageData (CHOSEN)
- Option C: Required x, y; all other properties optional with defaults (CHOSEN)

**Trade-offs:**
- **Option A Pros:** Explicit configuration
- **Option A Cons:** Verbose templates, less flexibility
- **Option B Pros:** Balance of explicitness and flexibility
- **Option B Cons:** Still requires width/height in most cases
- **Option C Pros:** Most flexible, minimal configuration
- **Option C Cons:** Magic numbers may not suit all use cases

**What We Gain:** Ease of template authoring with reasonable defaults
**What We Sacrifice:** Some control over default sizing
**Why Acceptable:** Defaults can be overridden; common use case supported out of the box

## Implementation Milestones

### Priority 1: Core Type System and Rendering (Primary Goal)

**Objective:** Enable basic signature rendering on PDFs

**Tasks:**
1. Add SignatureImageSection interface to types.ts
2. Update TemplateSection union type to include SignatureImageSection
3. Implement renderSignatureImage function in generator.ts
4. Add switch case for 'signatureImage' in generatePDF()
5. Write unit tests for renderSignatureImage

**Success Criteria:**
- TypeScript compiles without errors
- Unit tests pass for renderSignatureImage
- Manual test: Template with signature section renders image on PDF

**Dependencies:** None (can start immediately)

**Estimated Complexity:** Medium (new code, straightforward implementation)

---

### Priority 2: UI - Signature Upload (Primary Goal)

**Objective:** Enable users to upload signature images via dialog

**Tasks:**
1. Add signature state to CustomFieldsDialog component
2. Implement handleSignatureUpload handler
3. Implement handleSignatureRemove handler
4. Add signature upload button to dialog title area
5. Create signature preview dialog component
6. Add file type validation (PNG/JPG only)
7. Update handleConfirm to merge signatures into customFields
8. Write unit tests for signature handlers

**Success Criteria:**
- Upload button appears next to Contacts button
- File picker opens on click
- Valid image files are accepted and previewed
- Invalid files show error message
- Signatures are passed to PDF generation context

**Dependencies:** Priority 1 (need type definitions first)

**Estimated Complexity:** Medium (existing pattern to follow)

---

### Priority 3: Multiple Signatures Support (Secondary Goal)

**Objective:** Support multiple signature images per template

**Tasks:**
1. Extend signature state to support multiple fields
2. Update upload handlers to accept field name parameter
3. Add UI for selecting which signature to upload
4. Test with template containing multiple signature sections
5. Update unit tests for multiple signature scenario

**Success Criteria:**
- Multiple signatures can be uploaded (e.g., pastor, treasurer)
- Each signature renders at correct position on PDF
- State management handles multiple signatures correctly

**Dependencies:** Priority 2 (need basic upload working first)

**Estimated Complexity:** Low (extension of Priority 2)

---

### Priority 4: Internationalization (Secondary Goal)

**Objective:** Add translation keys for signature-related UI

**Tasks:**
1. Add English translation keys to en.json
2. Add Korean translation keys to ko.json
3. Update UI components to use translation keys
4. Verify translations appear correctly

**Success Criteria:**
- All signature UI text is translatable
- English and Korean translations provided
- Language switch works correctly

**Dependencies:** Priority 2 (need UI components first)

**Estimated Complexity:** Low (straightforward translation work)

---

### Priority 5: Template Integration (Optional Goal)

**Objective:** Add signature sections to built-in templates

**Tasks:**
1. Identify appropriate templates for signature support
2. Add signatureImage sections to template definitions
3. Test signature rendering with built-in templates
4. Document template configuration for users

**Success Criteria:**
- At least one built-in template includes signature section
- Signature renders correctly on template
- Template documentation includes signature examples

**Dependencies:** Priority 1 (need rendering working first)

**Estimated Complexity:** Low (configuration work)

---

### Priority 6: Error Handling and Edge Cases (Final Goal)

**Objective:** Robust error handling and user feedback

**Tasks:**
1. Add error handling for corrupt Base64 data
2. Add error handling for missing image data
3. Add user-friendly error messages
4. Add loading states during image processing
5. Add file size limits and warnings
6. Write error scenario tests

**Success Criteria:**
- Invalid images show clear error messages
- Large images show size warning
- Loading states prevent duplicate uploads
- Errors don't crash PDF generation

**Dependencies:** Priority 2 (need upload flow working)

**Estimated Complexity:** Medium (various edge cases)

---

## Risk Mitigation Strategy

### Risk: Performance Degradation with Large Images

**Mitigation Tasks:**
1. Implement file size validation (max 2MB)
2. Add warning for files >1MB
3. Consider Canvas-based compression if needed
4. Profile PDF generation time with signatures

**Trigger:** Address if PDF generation slows by >10% with signatures

### Risk: Breaking Existing Templates

**Mitigation Tasks:**
1. Ensure backward compatibility (templates without signatures work)
2. Add regression tests for existing templates
3. Test with all built-in templates

**Trigger:** Test before merge; must pass all existing tests

### Risk: TypeScript Type Errors

**Mitigation Tasks:**
1. Use strict typing for SignatureImageSection
2. Ensure all discriminated unions are exhaustive
3. Run `tsc --noEmit` before commit

**Trigger:** Must have zero TypeScript errors before merge

## Quality Gates

### Pre-Implementation

- [ ] SPEC document approved
- [ ] Development environment set up
- [ ] Test framework configured

### During Implementation

- [ ] All new code has unit tests (85%+ coverage)
- [ ] All modified code has characterization tests (DDD)
- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings
- [ ] Code follows existing patterns

### Post-Implementation

- [ ] All acceptance criteria met
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Translation keys added
- [ ] Code review completed

## Testing Strategy

### Unit Tests

**renderSignatureImage:**
- Test with valid Base64 image data
- Test with missing image data (should skip)
- Test with invalid Base64 (should log error and skip)
- Test with custom field variable substitution
- Test with default width/height values
- Test with specified width/height values

**Signature Handlers:**
- Test handleSignatureUpload with valid file
- Test handleSignatureUpload with invalid file type
- Test handleSignatureRemove
- Test multiple signatures in state
- Test customFields merge in handleConfirm

### Integration Tests

- Test signature upload → PDF generation flow
- Test multiple signatures on same PDF
- Test template with signature section renders correctly
- Test backward compatibility with templates without signatures

### Manual Testing

- Upload PNG signature and verify PDF rendering
- Upload JPG signature and verify PDF rendering
- Upload invalid file and verify error message
- Remove signature and verify it doesn't appear on PDF
- Test with built-in template containing signature section

### Performance Testing

- Measure PDF generation time with signatures
- Profile memory usage with large signature images
- Test with multiple signatures (3-5)

## Rollout Plan

### Phase 1: Internal Testing (Developer Only)

- Deploy to development environment
- Test all acceptance criteria
- Fix bugs and issues
- Performance profiling

### Phase 2: Beta Release (Optional Users)

- Release to subset of users
- Gather feedback
- Address usability issues
- Refine based on usage

### Phase 3: General Release

- Merge to main branch
- Update documentation
- Release notes
- Monitor for issues

## Rollback Plan

**If critical issues are found:**

1. Revert commits related to signature feature
2. Remove SignatureImageSection from types (or mark as deprecated)
3. Remove signature UI from dialog
4. Keep tests for future re-implementation

**Trigger Criteria:**
- PDF generation failures >5% of exports
- Performance degradation >20%
- Security vulnerabilities identified
- Data corruption or loss

## Success Metrics

### Functional Metrics

- Signature upload success rate: >95%
- PDF rendering success rate: >99%
- Error rate: <1%

### Performance Metrics

- Upload time: <2 seconds for <1MB files
- PDF generation overhead: <5%
- Memory increase: <10MB per signature

### User Experience Metrics

- Task completion rate: >90%
- Error message clarity: User can recover without help
- UI intuitiveness: <3 clicks to upload signature

## Dependencies and Prerequisites

### External Dependencies

- `jspdf`: Already installed, verify version compatibility
- `@mui/material`: Already installed
- `@mui/icons-material`: Verify required icons available

### Internal Dependencies

- CustomFieldsDialog component must be functional
- PDF generator must be working
- Template system must be stable

### Environment Setup

- Node.js and npm/yarn installed
- Development server running
- Test environment configured

## Open Issues

1. **Icon Selection:** Which Material-UI icon to use for signature upload button?
   - Options: DrawIcon, EditIcon, CreateIcon, GestureIcon
   - Decision needed: Before Priority 2 implementation

2. **File Size Limit:** What should be the maximum file size for signature images?
   - Options: 1MB, 2MB, 5MB
   - Decision needed: Before Priority 6 implementation

3. **Preview Dialog:** Should signature preview be a separate dialog or inline in main dialog?
   - Options: Separate dialog, Modal, Inline preview area
   - Decision needed: Before Priority 2 implementation

## Next Steps

1. **Immediate:** Approve SPEC and implementation plan
2. **Week 1:** Implement Priority 1 (Type system and rendering)
3. **Week 2:** Implement Priority 2 (UI upload)
4. **Week 3:** Implement Priority 3-4 (Multiple signatures and i18n)
5. **Week 4:** Testing, bug fixes, documentation

## References

- jsPDF Documentation: https://github.com/parallax/jsPDF
- FileReader API: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
- Material-UI Icons: https://mui.com/components/material-icons/
- Existing PDF Generator: `src/components/PDFGenerator/generator.ts`
- Existing Custom Fields Dialog: `src/components/PDFExport/CustomFieldsDialog.tsx`
