# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.0] - 2026-02-27

### Added

#### Donor Category Bubble Chart
- **New Visualization Type**: Donor Category Bubble Chart for analyzing donation patterns across donor categories
  - Displays donor categories on X-axis (5K+, 2K-5K, 1K-2K, 500-1K, 100-500, <100)
  - Y-axis shows average donation amount per category
  - Bubble size represents total donation amount per category
  - Color-coded bubbles with distinct colors for each category (Red for 5K+, Orange for 2K-5K, Yellow/Gold for 1K-2K, Green for 500-1K, Blue for 100-500, Purple for <100)

- **Interactive Labels**: Each bubble displays detailed information
  - Category name at the top
  - Donor count with percentage of total donors
  - Total donation amount with percentage of overall total
  - Average donation amount per donor in category

- **Reference Lines**: Visual indicators for overall statistics
  - Red dashed line for overall mean donation amount
  - Blue dashed line for overall median donation amount
  - Labels show exact values in German currency format (EUR)
  - Legend below chart showing both reference values

- **Tooltip Information**: Hover interactions show detailed breakdown
  - Category name with color matching
  - Donor count with count percentage
  - Total amount with amount percentage
  - Average donation amount

- **Performance Optimization**
  - React.memo implementation to prevent unnecessary re-renders
  - Custom comparison function for props
  - Memoized data calculations and formatting functions
  - Memoized X-axis ticks and Z-axis range calculations

- **Data Structure**: New TypeScript type definitions
  - Added `DonorCategoryDataPoint` interface to chart types
  - Includes category (string), count (number), total (number), mean (number)
  - Integrates with existing dashboard data pipeline

### Technical Details

- **Files Modified**:
  - `src/features/dashboard/types/chart.ts`: Added DonorCategoryDataPoint interface
  - `src/features/dashboard/DashboardContainer.tsx`: Added lazy-loaded DonorCategoryBubbleChart component
  - `src/components/DashboardView/index.tsx`: Integrated chart into dashboard grid
  - `src/features/dashboard/charts/index.ts`: Added chart to barrel exports

- **New Files**:
  - `src/features/dashboard/charts/DonorCategoryBubbleChart/DonorCategoryBubbleChart.tsx`: Main component implementation (387 lines)
  - `src/features/dashboard/charts/DonorCategoryBubbleChart/index.tsx`: Barrel export

- **Internationalization**:
  - English: "Donor Category Analysis" title, all chart labels and tooltips
  - Korean: "기부자 카테고리 분석" title, all chart labels and tooltips translated

### Integration
- Chart is lazy-loaded for optimal bundle size
- Added to dashboard chart registry with ID 'donor-category-bubble'
- Scatter chart skeleton type for loading states
- Uses existing ChartExport wrapper for download functionality

## [1.11.0] - 2026-02-24

### Added

#### PDF Signature Image Support
- **Signature Image Section Type**: New `signatureImage` section type for PDF templates
  - Properties: type, x, y, width?, height?, fieldName?, maintainAspectRatio?, imageData?
  - Supports Base64 image data (Data URL format)
  - Variable substitution for custom fields ({{customFields.signatureImage}})
  - Default dimensions: width=50, height=30 (when not specified)
  - Graceful error handling for missing/invalid image data

- **PDF Rendering Functionality**: Implemented `renderSignatureImage()` in generator.ts
  - Renders signature images at absolute coordinates
  - Supports PNG/JPG formats via jsPDF addImage() method
  - Automatic variable substitution in imageData property
  - Fail-safe rendering (skips invalid images without breaking PDF generation)

- **UI Components - Signature Upload**: Enhanced Custom Fields Dialog
  - Signature upload buttons for Pastor and Treasurer signatures
  - File type validation (PNG/JPG only, max 2MB)
  - Image preview dialog with filename display
  - Upload/Remove/Change handlers for signature management
  - Integration with existing custom fields workflow

- **Internationalization**:
  - English translations for all signature-related UI elements
  - Korean translations for all signature-related UI elements
  - Translation keys: uploadButton, previewTitle, removeButton, changeButton, invalidFile, noSignature, pastorSignature, treasurerSignature

- **Type Definitions**:
  - Added `SignatureImageSection` interface to `TemplateSection` union type
  - Complete TypeScript type safety for signature image configuration

### Technical Details

- **Files Modified**:
  - `src/types.ts`: Added SignatureImageSection interface and type union
  - `src/components/PDFGenerator/generator.ts`: Implemented renderSignatureImage function and switch case
  - `src/components/PDFExport/CustomFieldsDialog.tsx`: Added signature upload UI and handlers
  - `src/i18n/locales/en.json`: English translations
  - `src/i18n/locales/ko.json`: Korean translations

- **Test Coverage**:
  - 11 tests for `renderSignatureImage` function
  - 10 tests for signature handlers (upload, remove, change)
  - All tests passing (561/561 total - 1 pre-existing performance test failure unrelated to this feature)

- **Backward Compatibility**:
  - No breaking changes to existing templates
  - Existing templates without signature sections continue to work
  - Optional properties ensure gradual adoption

### Usage Example

Template configuration:
```typescript
{
  type: 'signatureImage',
  fieldName: 'pastorSignature',
  x: 140,
  y: 240,
  width: 50,
  height: 25,
  maintainAspectRatio: true,
}
```

Custom fields injection:
```typescript
customFields: {
  pastorSignature: 'data:image/png;base64,iVBORw0KGgo...',
  treasurerSignature: 'data:image/jpeg;base64,/9j/4AAQ...'
}
```

## [1.10.0] - 2026-02-23

### Added

#### Contacts List Feature
- Upload contacts from XLS/CSV files with auto column detection
- Supports Korean name, English name, and address columns
- Auto-detects column mappings with common header patterns (Korean: 한글이름, English name, etc.)
- Fallback to manual column mapping dialog if auto-detection fails
- Store contacts in localStorage for persistence across sessions
- Manage loaded contacts with view, delete, and export functionality

#### Intelligent Contact Lookup
- Searchable contacts lookup dialog in PDF export custom fields
- Fuzzy matching algorithm with confidence scoring (Levenshtein distance)
- Auto-suggest contacts based on donor name when PDF export dialog opens
- Shows ContactMatchBanner for 80%+ confidence matches
- One-click contact selection fills both donorName and donorAddress
- Users can ignore suggestions and manually override at any time

#### Enhanced Custom Fields Dialog
- Added lookup icon buttons next to donorName and donorAddress fields
- Intelligent matching automatically suggests contacts
- Apply/Ignore buttons for quick selection
- Seamless integration with existing custom fields workflow

#### Contact Management
- View all loaded contacts in sortable table format
- Delete selected contacts individually or in bulk
- Delete all contacts option with confirmation dialog
- Export contacts to CSV for backup or sharing

#### Bilingual Support
- Full UI translations for contacts feature in English and Korean
- All dialog titles, buttons, and messages localized

### Technical Improvements
- New TypeScript types: ContactRecord, ContactsState, ColumnMapping, MatchResult
- Utility functions: normalizeString, calculateSimilarity, findMatchingContacts, detectColumns
- 51 new tests added (38 for contactMatcher, 13 for ContactMatchBanner)
- Total: 538 tests passing

### Bug Fixes
- Fixed ContactMatchBanner tests to work with i18n translated text

## [1.9.1] - 2026-02-22

### Bug Fixes
- Fixed: Second selected name not displayed when both "Auto-deselect empty/zero-value rows" and "Hide deselected" are enabled
- Root cause: Column filters were preserved from the first selection, filtering out the second name's values
- Solution: Added useEffect to reset columnFilters when selectedUniqueNames changes
- Fixed auto-deselect effect to use filteredDataWithIndex and row._stableIndex for consistent index tracking
- Fixed i18n plural placeholder issue: Changed broken `{{plural}}` to `(s)` notation for English plural forms
- All plural strings now correctly display "1 group(s)" instead of "1 group{{plural}}"

## [1.9.0] - 2026-02-19

### Added
- PDF Template System Improvements:
  - Added `customFieldDefaults` support in PDF templates for per-template default values
  - Implemented flexible setter mapping system for automatic field binding
  - Multiple templates can now have different default values (signature location, tax numbers, dates)

### User Preferences Persistence
- Tax-related fields now persist in localStorage across sessions
- User-entered values are automatically saved and reused
- No need to re-enter tax information or edit template files each time

### Reset to Defaults Button
- Added reset button in PDF export dialog to restore template defaults
- Clears localStorage and reloads values from selected template
- Easy recovery from accidentally entered wrong data

### Decimal Point Handling
- Fixed number fields to display at most 2 decimal places
- Proper rounding for all monetary values in PDF export dialog
- Consistent formatting prevents floating point precision issues

### Mutually Exclusive Tax Options
- Tax exemption checkboxes now properly mutually exclusive (radio buttons)
- Group-based checkbox system for future mutually exclusive options
- "Tax Exemption According to Exemption Notice" set as default selection

### Editable Tax Fields
- All tax number and date fields are now fully editable
- Previously disabled fields for "Preliminary Certificate" option now editable

### UI Text Updates
- PDF export button updated to "EXPORT PDF" (English) / "PDF 출력" (Korean)
- Consistent button text across detailed data view and export dialog

### Bug Fixes
- Fixed FormField number input to properly handle decimal values
- Fixed monthly amount aggregation rounding issues

## [1.8.0] - 2026-02-19

### Added
- Material UI v7 Upgrade:
  - Upgraded from Material-UI v5 to v7 (latest)
  - Enhanced UI with modern Material-UI v7 components and design patterns
  - Improved layout consistency with new PageContainer and SectionCard components
  - Added visual workflow stepper showing application progress

### Internationalization (i18n)
- Added comprehensive internationalization support with react-i18next
- Added Korean language support alongside English
- Language switcher with EN/KO badges in header
- Translated all UI elements including PDF export dialogs
- Added helper text for complex tax options in Korean and English

### Enhanced File Upload
- Improved drag-and-drop functionality with visual feedback
- File chips showing name, size, and type icons
- Better visual states for drag enter/leave/drop events

### PDF Export Improvements
- Added complete Korean translations for PDF export dialogs
- Made waiver reimbursement options mutually exclusive (radio buttons)
- Enhanced tax option explanations with helper text
- Fixed missing state setter for taxValidFrom field

### Performance Optimization
- Implemented centralized debug logging system
- Debug logs can be toggled via localStorage flag
- Improved console output for production use

### UI/UX Enhancements
- Consistent spacing and elevation throughout application
- Better visual hierarchy with improved typography
- Responsive design improvements for mobile devices
- Simplified language switcher design (text-based badges)

### Bug Fixes
- Fixed MUI type imports (SxProps, PaperProps from @mui/system)
- Resolved emoji rendering issues on Windows 10 (fallback to text badges)
- Fixed PDF export state management issues

## [1.7.1] - 2026-02-18

### Added
- iOS Mobile Web Improvements:
  - Chart download buttons (PNG/JPG) now work correctly on iOS Safari
  - Pareto chart "account for" text font size increased for better readability

### Known Issues
- Trend chart controls (period dropdown and chart type buttons) do not work on iOS mobile web. Use desktop browser for full functionality.

### Build Improvements
- Simplified chunking strategy to prevent circular dependencies
- Bundled all React-related packages in single vendor-react chunk
- Fixed react-is version override to 18.3.1

## [1.7.0] - 2026-02-18

### Added
- Dashboard Architecture Refactoring:
  - Modularized dashboard components into feature-based structure
  - Extracted 6 chart modules (TrendChart, TopDonorsChart, StatisticsTable, DistributionHistogram, ParetoChart, RangeDistributionCharts)
  - Created reusable components (ChartExport, ColumnSelector, DashboardGrid)
  - Added 7 custom React hooks for data management and chart interactions
  - Added 4 utility modules for calculations, colors, data analysis, and date extraction

### Chart UI Improvements
- Fixed legend positioning to 85% for all charts
- Fixed color consistency when toggling columns (use original column index)
- Fixed X-axis two-line labels with tspan approach
- Fixed histogram mean/median legend icons with pixel calculation
- Removed boundary box from legends

### Testing & Performance
- Added comprehensive performance benchmarking suite
- Added ChartErrorBoundary for better error handling
- Added ChartSkeleton for loading states
- Added chunk load handler for optimized code splitting
- Created 2000+ tests for dashboard module

### Build Configuration
- Added vite.config.test.ts for isolated test environment
- Added deployment tests to validate production builds
- Optimized chunk loading strategy for better performance

## [1.6.1] - 2026-02-16

### Changed
- UI Redesign: Simplified "Value Columns" selector to show a summary count instead of redundant chips.

### Added
- Enhanced Series Management: Added a dedicated, styled area for selected data series with color pickers and better visual grouping.

### Fixed
- Column Selector Polish: Fixed margin and alignment issues in the column selector dialog; improved visual hierarchy with better section labels.
- Bug Fix: Restored drag-and-drop reordering functionality in the column selector.

## [1.6.0] - 2026-02-15

### Added
- Dashboard Architecture: Completed modular refactoring using Domain-Driven Design (DDD) principles
- Comprehensive test infrastructure with Vitest and React Testing Library
- Implemented 214 tests with 100% pass rate for dashboard module
- Created modular architecture with 20+ reusable components, hooks, and utilities
- Improved code maintainability and testability through feature-based structure
- Zero TypeScript errors and strict type checking maintained

## [1.5.0] - 2026-02-14

### Changed
- Range Distribution: Converted from pie charts to horizontal bar charts for better readability
- Added value labels to the end of each bar in range distribution charts
- Added EUR suffix to all range labels (e.g., "0 EUR", "1-50 EUR")
- Increased chart margins to prevent label cutoff for longer bars

### Fixed
- Name merging: Toggle merge groups now automatically updates selected names without requiring manual reselection

## [1.4.0] - 2026-02-13

### Added
- Dashboard stability: added ErrorBoundary around the Dashboard dialog to avoid blank pages on errors.
- Debug instrumentation behind a flag (`excel-processor-debug`) with timings and structured logs.

### Fixed
- CSV/Excel parsing consistency: preserve header rows uniformly; avoid misinterpreting first data row as headers.
- PDF export: aggregate monthly amounts using dates from filenames for CSV; improved date/amount detection.
- Dashboard: defaults to filename dates when no date column exists; dropdown shows only meaningful date sources; respects visible columns from Detailed Data View.
- UI clarity: added "From filename" / "From sheet" indicators and disambiguated duplicate labels.

## [1.2.0] - 2025-02-07

### Added
- PDF export functionality with customizable templates
- Implemented German donation receipt template (Zuwendungsbestätigung)
- Added custom fields dialog with auto-fill from Excel data
- Added monthly aggregation by date from filenames
- Added color picker for custom field values in PDF
- Format dates in German format (DD.MM.YYYY)

## [1.1.0] - 2025-02-07

### Added
- Row selection checkboxes to DetailedDataView
- Auto-deselect zero-value rows feature
- Improved column selector and row selection UX

## [1.0.1] - 2025-02-06

### Fixed
- Column selector row selection
- Added build timestamp

## [1.0.0] - 2025-02-06

### Added
- Initial release with core Excel processing features
