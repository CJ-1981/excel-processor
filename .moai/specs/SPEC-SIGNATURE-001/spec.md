# SPEC-SIGNATURE-001: PDF Signature Image Support

## Metadata

| Field | Value |
|-------|-------|
| **SPEC ID** | SPEC-SIGNATURE-001 |
| **Title** | PDF Signature Image Support |
| **Created** | 2026-02-24 |
| **Status** | Planned |
| **Priority** | High |
| **Assigned** | - |
| **Related SPECs** | - |

## Environment

### Project Context

**Project:** Excel Processor - An Excel-to-PDF donation receipt generator

**Current Architecture:**
- Frontend: React with TypeScript, Material-UI components
- PDF Generation: jsPDF library with autotable plugin
- Template System: JSON-based template configuration with section types
- State Management: React useState hooks
- Custom Fields: Dialog-based form for user input

**Existing Section Types:**
- `header`, `text`, `summary`, `table`, `footer`
- `labeledField`, `textBlock`, `checkbox`, `box`
- `customDataTable`, `pageBreak`, `spacer`, `divider`

**Key Files:**
- `src/types.ts` - TypeScript type definitions
- `src/components/PDFGenerator/generator.ts` - PDF rendering logic
- `src/components/PDFExport/CustomFieldsDialog.tsx` - Custom fields UI
- `src/templates/built-in.ts` - Built-in template configurations
- `src/i18n/locales/en.json` - English translations

### Technical Constraints

**PDF Library Capabilities:**
- jsPDF supports image embedding via `addImage()` method
- Supported formats: PNG, JPG, JPEG, GIF
- Image data can be provided as Base64 string, Data URL, or image URL
- Absolute positioning with x, y coordinates
- Width and height can be specified (optional aspect ratio preservation)

**Browser Capabilities:**
- File API for image file reading
- FileReader API for converting to Base64
- Canvas API for image resizing/compression (optional)

**Storage Considerations:**
- Signature images will be stored in component state (not persisted)
- Base64 strings can be large (~50-200KB per signature)
- localStorage has 5-10MB limit (may need compression for multiple signatures)

## Assumptions

### Technical Assumptions

**Assumption 1:** jsPDF `addImage()` method supports Base64 encoded image strings
- **Confidence:** High (documented jsPDF feature)
- **Evidence Basis:** jsPDF official documentation
- **Risk if Wrong:** Core feature would not work; would need alternative library
- **Validation Method:** Verify jsPDF documentation and create simple test case

**Assumption 2:** FileReader API can convert uploaded PNG/JPG files to Base64
- **Confidence:** High (standard browser API)
- **Evidence Basis:** MDN Web Docs, existing usage in contacts upload feature
- **Risk if Wrong:** Image upload would fail
- **Validation Method:** Test with real image files

**Assumption 3:** Multiple signature images per template are required (e.g., pastor + treasurer)
- **Confidence:** Medium (based on user requirements)
- **Evidence Basis:** User explicitly mentioned "pastor signature, treasurer signature"
- **Risk if Wrong:** Over-engineering if only one signature needed
- **Validation Method:** Confirm with user before implementation

**Assumption 4:** Signature images should be positioned absolutely (not flow-based)
- **Confidence:** High (follows existing pattern for positioned elements)
- **Evidence Basis:** Existing `textBlock`, `checkbox`, `labeledField` use absolute positioning
- **Risk if Wrong:** May not fit all template layouts
- **Validation Method:** Review template requirements

### User Experience Assumptions

**Assumption 5:** Users prefer to upload signature images once per PDF generation session
- **Confidence:** Medium
- **Evidence Basis:** Similar to custom fields pattern (entered per export)
- **Risk if Wrong:** Users may want persistent signature storage
- **Validation Method:** Consider localStorage persistence in design

**Assumption 6:** Users want to preview the signature image after upload
- **Confidence:** High (standard UX pattern)
- **Evidence Basis:** Contacts upload has preview functionality
- **Risk if Wrong:** Minor - can be added later
- **Validation Method:** Implement preview as MVP feature

### Integration Assumptions

**Assumption 7:** Signature button should be placed next to existing "Contacts" button
- **Confidence:** High (explicit user requirement)
- **Evidence Basis:** User requirement: "next to the existing 'Contacts' button"
- **Risk if Wrong:** None (explicitly specified)
- **Validation Method:** None required

**Assumption 8:** Template configuration should support optional `imageData` property
- **Confidence:** High (allows runtime data injection)
- **Evidence Basis:** Pattern used for checkbox `checked` property with `{{customFields.*}}` variables
- **Risk if Wrong:** Would break existing variable substitution pattern
- **Validation Method:** None required (established pattern)

## Requirements (EARS Format)

### REQ-SIGNATURE-001: Signature Image Section Type Definition

**WHEN** the template system processes a PDF template, **THE SYSTEM SHALL** support a new section type called `signatureImage` for rendering signature images.

**Properties:**
- `type: 'signatureImage'` - Discriminator for section type
- `x: number` - X coordinate from left margin (in PDF units)
- `y: number` - Y coordinate from top margin (in PDF units)
- `width: number` - Image width in PDF units (optional, default: 50)
- `height: number` - Image height in PDF units (optional, default: 30)
- `imageData?: string` - Base64 image data (optional, provided at runtime via custom fields)

**IF** `width` or `height` are not specified, **THEN** the system **SHALL** use default values of 50 and 30 PDF units respectively.

**IF** `imageData` is provided in the template section, **THEN** the system **SHALL** use that data; otherwise **THE SYSTEM SHALL** look for the image data in `context.customFields.signatureImage` or other named custom field.

### REQ-SIGNATURE-002: Signature Image Upload Button in PDF Export Dialog

**WHEN** the PDF export custom fields dialog is displayed, **THE SYSTEM SHALL** render a signature image upload button next to the existing "Contacts" button.

**Button Behavior:**
- Clicking the button **SHALL** trigger a file picker dialog
- File picker **SHALL** accept only PNG and JPG/JPEG image files
- **IF** a non-image file is selected, **THE SYSTEM SHALL** display an error message
- **AFTER** a valid image is selected, **THE SYSTEM SHALL** display the image preview

**Button Placement:**
- Positioned in the dialog title area, next to the Contacts button
- Uses consistent Material-UI IconButton styling
- Uses a signature-related icon (e.g., `DrawIcon` or `EditIcon` from Material-UI)

### REQ-SIGNATURE-003: Signature Image State Management

**WHEN** a user uploads a signature image, **THE SYSTEM SHALL** store the image data in component state and pass it to the PDF generation context.

**State Management Requirements:**
- Store Base64 encoded image data in React state
- Support multiple signature images keyed by name (e.g., `pastorSignature`, `treasurerSignature`)
- Pass signature images to PDF generation via `context.customFields` object
- Clear signature images when dialog closes (optional persistence)

**Data Flow:**
1. User selects image file via file picker
2. FileReader converts image to Base64 Data URL
3. Base64 string stored in state: `signatures[name] = base64Data`
4. On export, signatures merged into `customFields` object
5. PDF generator retrieves image data from `context.customFields`

### REQ-SIGNATURE-004: PDF Rendering of Signature Images

**WHEN** the PDF generator encounters a `signatureImage` section, **THE SYSTEM SHALL** render the image at the specified coordinates using jsPDF's `addImage()` method.

**Rendering Requirements:**
- Extract Base64 image data from `section.imageData` or `context.customFields[fieldName]`
- Handle Data URL format (`data:image/png;base64,...`) or raw Base64
- Position image at `(x, y)` coordinates
- Scale image to specified `width` and `height`
- **IF** image data is missing or invalid, **THEN** skip rendering (fail silently)

**Error Handling:**
- Invalid Base64 data: Skip rendering, log warning
- Missing image data: Skip rendering
- Corrupted image data: Skip rendering, log error

### REQ-SIGNATURE-005: Multiple Signature Images Support

**WHERE** a template requires multiple signatures (e.g., pastor, treasurer), **THE SYSTEM SHALL** support multiple `signatureImage` sections with unique custom field mappings.

**Use Cases:**
- Pastor signature: `{{customFields.pastorSignature}}`
- Treasurer signature: `{{customFields.treasurerSignature}}`
- Additional signatures as needed

**Implementation:**
- Each `signatureImage` section has an optional `fieldName` property (default: 'signatureImage')
- Upload dialog supports multiple signature upload buttons/sections
- State stores signatures as object: `{ pastorSignature: 'data:...', treasurerSignature: 'data:...' }`

### REQ-SIGNATURE-006: Signature Image Preview

**WHEN** a user uploads a signature image, **THE SYSTEM SHALL** display a preview of the uploaded image in the custom fields dialog.

**Preview Requirements:**
- Display image in a preview dialog or inline preview area
- Show image filename
- Provide option to remove/change the uploaded image
- Preview should be reasonably sized (e.g., max 200x150 pixels)

**UX Requirements:**
- Clear indication of which signature is being previewed (for multiple signatures)
- "Remove" button to clear uploaded signature
- "Change" button to upload a different image

### REQ-SIGNATURE-007: Internationalization Support

**THE SYSTEM SHALL** provide translation keys for all signature-related UI elements in English and Korean.

**Required Translation Keys:**
- `pdfExport.signature.uploadButton` - "Upload Signature" / "서명 업로드"
- `pdfExport.signature.previewTitle` - "Signature Preview" / "서명 미리보기"
- `pdfExport.signature.removeButton` - "Remove" / "삭제"
- `pdfExport.signature.changeButton` - "Change" / "변경"
- `pdfExport.signature.invalidFile` - "Invalid image file. Please upload PNG or JPG." / "잘못된 이미지 파일입니다. PNG 또는 JPG를 업로드해주세요."
- `pdfExport.signature.noSignature` - "No signature uploaded" / "업로드된 서명 없음"

## Specifications

### Type Definitions (src/types.ts)

```typescript
// Add SignatureImageSection to TemplateSection union type
export type TemplateSection =
  | HeaderSection
  | TableSection
  | SummarySection
  | FooterSection
  | TextSection
  | LabeledFieldSection
  | TextBlockSection
  | CheckboxFieldSection
  | BoxSection
  | PageBreakSection
  | SpacerSection
  | DividerSection
  | CustomDataTableSection
  | SignatureImageSection;  // NEW

// New section type definition
export interface SignatureImageSection {
  type: 'signatureImage';
  x: number;              // X coordinate from left margin
  y: number;              // Y coordinate from top margin
  width?: number;         // Image width (default: 50)
  height?: number;        // Image height (default: 30)
  fieldName?: string;     // Custom field name (default: 'signatureImage')
  maintainAspectRatio?: boolean;  // Preserve aspect ratio (default: true)
}
```

### Component Enhancements (CustomFieldsDialog.tsx)

**State additions:**
```typescript
// Signature state
const [signatures, setSignatures] = useState<Record<string, string>>({});
const [showSignatureUpload, setShowSignatureUpload] = useState(false);
const [activeSignatureField, setActiveSignatureField] = useState<string>('signatureImage');
```

**Handler functions:**
```typescript
// Handle signature file upload
const handleSignatureUpload = (fieldName: string, file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target?.result as string;
    setSignatures(prev => ({ ...prev, [fieldName]: base64 }));
  };
  reader.readAsDataURL(file);
};

// Remove signature
const handleSignatureRemove = (fieldName: string) => {
  setSignatures(prev => {
    const updated = { ...prev };
    delete updated[fieldName];
    return updated;
  });
};

// Update handleConfirm to include signatures
const handleConfirm = () => {
  const customFields: Record<string, string | number | boolean> = {
    // ... existing fields
    ...signatures,  // Merge in all signatures
  };
  onConfirm(customFields as Record<string, string | number>, textColor);
};
```

**UI components:**
- Signature upload button in title area (next to Contacts button)
- Signature preview dialog with image display
- Remove/Change buttons for each uploaded signature

### PDF Generator Enhancements (generator.ts)

**Import addition:**
```typescript
import type {
  // ... existing imports
  SignatureImageSection,
} from '../../types';
```

**New render function:**
```typescript
function renderSignatureImage(
  doc: jsPDF,
  section: SignatureImageSection,
  context: PDFGenerationContext
): void {
  // Get image data from section or custom fields
  const fieldName = section.fieldName ?? 'signatureImage';
  let imageData = section.imageData ?? (context.customFields?.[fieldName] as string);

  // Handle variable substitution in imageData
  if (imageData && typeof imageData === 'string') {
    imageData = substituteVariables(imageData, context);
  }

  // Skip if no image data
  if (!imageData) {
    console.warn(`No image data found for signature field: ${fieldName}`);
    return;
  }

  try {
    // Add image to PDF at specified position
    doc.addImage(
      imageData,
      'PNG',  // Format (auto-detected by jsPDF if Data URL)
      section.x,
      section.y,
      section.width ?? 50,
      section.height ?? 30
    );
  } catch (error) {
    console.error(`Failed to render signature image for field ${fieldName}:`, error);
  }
}
```

**Switch case addition in generatePDF():**
```typescript
case 'signatureImage':
  renderSignatureImage(doc, section as SignatureImageSection, context);
  break;
```

### Template Configuration Example (built-in.ts)

```typescript
{
  type: 'signatureImage',
  fieldName: 'pastorSignature',  // References customFields.pastorSignature
  x: 140,
  y: 240,
  width: 50,
  height: 25,
  maintainAspectRatio: true,
}
```

### Internationalization (en.json, ko.json)

```json
{
  "pdfExport": {
    "signature": {
      "uploadButton": "Upload Signature",
      "previewTitle": "Signature Preview",
      "removeButton": "Remove",
      "changeButton": "Change",
      "invalidFile": "Invalid image file. Please upload PNG or JPG.",
      "noSignature": "No signature uploaded",
      "pastorSignature": "Pastor Signature",
      "treasurerSignature": "Treasurer Signature"
    }
  }
}
```

## Success Criteria

### Functional Requirements

- [ ] Users can upload PNG/JPG signature images via file picker
- [ ] Uploaded signatures are displayed as previews in the dialog
- [ ] Multiple signature uploads are supported (e.g., pastor, treasurer)
- [ ] Signature images are rendered on PDF at specified coordinates
- [ ] Templates can define signature sections with x, y, width, height
- [ ] Signature images can be removed and changed
- [ ] Invalid file types are rejected with error message

### Quality Requirements

- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings
- [ ] Signature images render correctly in generated PDFs
- [ ] Base64 encoding does not cause performance issues
- [ ] UI remains responsive during image processing
- [ ] Error handling prevents PDF generation failures

### Integration Requirements

- [ ] New section type integrates with existing template system
- [ ] No breaking changes to existing templates
- [ ] Backward compatibility with templates without signatures
- [ ] Consistent styling with existing UI components
- [ ] Translation keys provided in English and Korean

### Acceptance Tests

- **Test 1:** Upload single signature image and verify PDF rendering
- **Test 2:** Upload multiple signature images (pastor, treasurer)
- **Test 3:** Upload invalid file type (e.g., PDF) and verify error handling
- **Test 4:** Remove uploaded signature and verify it doesn't appear on PDF
- **Test 5:** Test with template containing no signature section (backward compatibility)
- **Test 6:** Test with template using default width/height values
- **Test 7:** Test with large image file (>1MB) to verify performance

## Non-Functional Requirements

### Performance

- Image upload should complete within 2 seconds for files <1MB
- Base64 conversion should not block UI thread
- PDF generation time should not increase significantly (<5% overhead)

### Security

- Validate file types on client side (accept only PNG/JPG)
- Sanitize Base64 data before rendering
- No XSS vulnerabilities from image data injection

### Usability

- Clear visual feedback during upload process
- Image preview helps users verify correct signature
- Error messages are user-friendly and actionable
- Intuitive placement of signature upload button

### Maintainability

- Code follows existing patterns in the codebase
- Type definitions are comprehensive
- Error handling is consistent
- Comments explain complex logic

## Risks and Mitigations

### Risk 1: Base64 Image Size

**Risk:** Base64 encoding increases image size by ~33%, potentially causing memory issues

**Mitigation:**
- Implement image compression before Base64 encoding
- Limit maximum image file size (e.g., 2MB)
- Warn users if image is too large
- Consider using Canvas API to resize large images

**Contingency:** If issues persist, add option to use image URLs instead of Base64

### Risk 2: Cross-browser Compatibility

**Risk:** Different browsers may handle FileReader/jsPDF differently

**Mitigation:**
- Test on Chrome, Firefox, Safari, Edge
- Use standard APIs (FileReader, jsPDF)
- Provide fallback for unsupported browsers

**Contingency:** Document supported browsers and warn users

### Risk 3: PDF Rendering Quality

**Risk:** Signature images may appear pixelated or distorted

**Mitigation:**
- Support high-resolution images
- Implement aspect ratio preservation
- Provide width/height controls in template

**Contingency:** Add image quality settings in template configuration

### Risk 4: State Management Complexity

**Risk:** Multiple signature images may complicate state management

**Mitigation:**
- Use object-based state structure: `{ [fieldName]: base64Data }`
- Clear naming conventions for signature fields
- Comprehensive TypeScript typing

**Contingency:** Simplify to single signature if complexity becomes unmanageable

## Dependencies

### Internal Dependencies

- `src/types.ts` - Add SignatureImageSection type
- `src/components/PDFExport/CustomFieldsDialog.tsx` - Add signature upload UI
- `src/components/PDFGenerator/generator.ts` - Add renderSignatureImage function
- `src/templates/built-in.ts` - Add signature section to templates (optional)
- `src/i18n/locales/en.json` - Add translation keys
- `src/i18n/locales/ko.json` - Add Korean translation keys

### External Dependencies

- `jspdf` - Already installed, addImage() method used
- `@mui/material` - Already installed, IconButton, Dialog, etc.
- `@mui/icons-material` - May need DrawIcon or EditIcon

### Development Dependencies

- TypeScript - For type definitions
- React - For component state management
- i18next - For translations

## Open Questions

1. **Signature Persistence:** Should uploaded signatures be persisted to localStorage for reuse in future exports?
   - **Decision:** Defer to Phase 2 (MVP does not include persistence)

2. **Image Compression:** Should large images be automatically compressed before Base64 encoding?
   - **Decision:** Implement basic compression in MVP if performance issues arise

3. **Multiple Signatures per Field:** Should users be able to upload multiple variations of the same signature (e.g., different dates)?
   - **Decision:** No, one signature per field in MVP

4. **Signature Verification:** Should there be any mechanism to verify signature authenticity?
   - **Decision:** No, out of scope for this feature

5. **Template Defaults:** Should templates support default signature images?
   - **Decision:** No, signatures always provided at runtime in MVP
