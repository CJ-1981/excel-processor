# Excel Data Processor

This is a client-side web application built with React, TypeScript, and Vite, designed to streamline the process of loading, merging, analyzing, and exporting data from multiple Excel files. It provides a user-friendly interface to manage complex datasets efficiently.

**Live Demo:** [https://cj-1981.github.io/excel-processor/](https://cj-1981.github.io/excel-processor/)

## Features

*   **Multi-File Upload:** Load multiple Excel files simultaneously.
*   **Intuitive Sheet Selection:** A parallel, horizontally scrollable interface to view sheets from all uploaded files.
    *   Individual sheet selection.
    *   "Select All" checkbox for all sheets within a specific file.
    *   Cross-file selection: Click a sheet name to select all sheets with that same name across all uploaded files.
*   **Data Merging:** Merge selected sheets from various files into a single, unified dataset. The application intelligently handles differing columns across sheets.
*   **Dynamic Column Selection:** Choose a specific column to identify "name records" for further analysis.
*   **Interactive Unique Names List:**
    *   Displays a list of unique names extracted from the chosen column.
    *   Search and sort functionality.
    *   Selected names are pinned to the top of the list for easy management, even when filtering.
*   **Detailed Results Table:**
    *   Presents all rows of data corresponding to the selected unique names.
    *   Includes "Source File" and "Source Sheet" columns to trace data origin.
    *   **Sorting & Filtering:** Sort data by any column and apply global search filters across all visible columns.
    *   **Pagination:** Efficiently navigate through large datasets.
    *   **Column Visibility:** Toggle which columns are displayed in the table.
    *   **Numeric Sums:** A summary row at the bottom displays the sum of numeric values for each column.
    *   **Responsive Toolbar:** On small screens, action buttons (Select/Deselect, Export CSV/PDF) wrap and stack; on desktop they remain compact.
*   **Export to CSV:** Export the currently displayed (filtered, sorted, and visible columns) detailed data to a CSV file. Respects included (selected) rows and visible columns.
*   **Export to PDF:** Generate professional PDF reports with customizable templates.
    *   Respects included (selected) rows and currently visible columns from the Detailed Data View.
    *   **German Donation Receipt Template:** Pre-built template for German donation receipts (Zuwendungsbestätigung) with:
        *   Donor information (name, address)
        *   Monthly breakdown of donations (Jan-Dec)
        *   Tax exemption options (Steuerbegünstigung)
        *   Signature section
        *   Legal notices and disclaimers
    *   **Custom Fields Dialog:** Auto-fills data from Excel export including:
        *   Donor names (dropdown for multiple selections)
        *   Monthly amounts aggregated by date from filenames
        *   Total amount and amount in words (German format)
        *   Date range and issue dates
        *   Tax information and checkboxes
    *   **Color Picker:** Customize text color for custom field values (default: red)
*   **Full-Screen Mode:** Expand the detailed data table to full-screen mode for better focus and readability.

## Technologies Used

*   **Frontend:** React 18 with TypeScript
*   **Build Tool:** Vite
*   **UI Framework:** Material-UI v5
*   **Excel Parsing:** SheetJS (`xlsx`)
*   **PDF Generation:** jsPDF with AutoTable plugin
*   **Number Formatting:** number-to-words (for German amount conversion)

## Setup and Running the Project

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd excel-processor
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:5173/`.

4.  **Run tests (optional):**
    ```bash
    npm test              # Run tests once
    npm run test:ui       # Run tests with Vitest UI
    npm run test:coverage # Generate coverage report
    ```

## Project Structure Highlights

*   `src/App.tsx`: Main application component managing overall state and workflow.
*   `src/features/dashboard/`: Modular dashboard architecture with 20+ reusable components, hooks, and utilities (v1.6.0).
    *   `charts/`: Six chart modules (TrendChart, TopDonorsChart, StatisticsTable, DistributionHistogram, ParetoChart, RangeDistributionCharts).
    *   `components/`: Shared components (ChartExport, ColumnSelector, DashboardGrid).
    *   `hooks/`: Seven custom React hooks for data management and chart interactions.
    *   `utils/`: Four utility modules for calculations, colors, data analysis, and date extraction.
    *   `types/`: TypeScript type definitions for dashboard entities.
*   `src/components/ExcelUploader.tsx`: Handles file selection (supports multiple files).
*   `src/components/SheetSelector.tsx`: UI for selecting sheets to merge from multiple files.
*   `src/components/ColumnSelector.tsx`: Allows users to select the name column from the merged data.
*   `src/components/UniqueNameList.tsx`: Displays and manages the list of unique names.
*   `src/components/DetailedDataView.tsx`: Displays detailed data with sorting, filtering, pagination, column visibility, and sum row.
*   `src/components/PDFExport/`: PDF export functionality with template system and custom fields dialog.
*   `src/components/PDFGenerator/`: PDF generation engine with support for tables, text blocks, checkboxes, and custom data.
*   `src/templates/`: Built-in PDF templates (German donation receipt).
*   `src/utils/monthlyAggregator.ts`: Aggregates amounts by month from date-parsed filenames.
*   `src/utils/germanFormatter.ts`: German date and number formatting utilities.
*   `src/utils/statisticsAnalyzer.ts`: Column detection, time-series aggregation, and analytics helpers.
*   `src/utils/logger.ts`: Lightweight debug logger controlled by a localStorage flag.
*   `src/components/common/ErrorBoundary.tsx`: Safety wrapper to prevent blank screens on runtime errors.
*   `src/types.ts`: Shared TypeScript type definitions.
*   `vitest.config.ts`: Test configuration for Vitest testing framework (v1.6.0).

## Debug Logging

You can enable verbose, targeted logs for troubleshooting without changing the code:

- Enable: run in DevTools console
  - `localStorage.setItem('excel-processor-debug', 'true')` then refresh
- Disable: run in DevTools console
  - `localStorage.removeItem('excel-processor-debug')` (or set to `'false'`) and refresh

When enabled, the console shows messages/timings for dashboard initialization, column detection, and analysis, prefixed with `[Dashboard]` or `[excel-processor]` timers.

### Force-reset Dashboard layout (debug)

- To force-clear a potentially corrupted saved Dashboard layout on next open, set:
  - `localStorage.setItem('excel-processor-dashboard-force-reset', 'true')` then open the Dashboard.
- The app also performs a one-time auto-reset if it detects an invalid/mismatched saved layout. You can still click “Reset Layout” in the Dashboard at any time.

Layout edits (drag, resize, Taller/Shorter) auto-save per breakpoint. If you need to recover from a corrupted layout, use the force-reset flag above, or click “Reset Layout” in the Dashboard.

## Troubleshooting

- Dashboard shows blank or hangs
  - Enable debug logging (see above), reopen the Dashboard, and check the console for `[Dashboard]` messages.
  - An Error Boundary now wraps the Dashboard dialog, so errors are shown as a message instead of a blank page.
  - If layout issues persist, click “Reset Layout” in the Dashboard to clear a corrupted saved layout.
  - The app now auto-resets a corrupted or mismatched saved Dashboard layout on first open; you can also trigger a reset with the force flag above.
- Action buttons overflow on mobile
  - The Detailed Data View toolbar is mobile-aware and now stacks/wraps controls on small screens while keeping desktop layout unchanged.

## Version History

### v1.7.1 (2026-02-18)
*   **iOS Mobile Web Improvements**:
    *   Chart download buttons (PNG/JPG) now work correctly on iOS Safari
    *   Pareto chart "account for" text font size increased for better readability
*   **Known Issue**: Trend chart controls (period dropdown and chart type buttons) do not work on iOS mobile web. Use desktop browser for full functionality.
*   **Build Improvements**:
    *   Simplified chunking strategy to prevent circular dependencies
    *   Bundled all React-related packages in single vendor-react chunk
    *   Fixed react-is version override to 18.3.1

### v1.7.0 (2026-02-18)
*   **Dashboard Architecture Refactoring**:
    *   Modularized dashboard components into feature-based structure
    *   Extracted 6 chart modules (TrendChart, TopDonorsChart, StatisticsTable, DistributionHistogram, ParetoChart, RangeDistributionCharts)
    *   Created reusable components (ChartExport, ColumnSelector, DashboardGrid)
    *   Added 7 custom React hooks for data management and chart interactions
    *   Added 4 utility modules for calculations, colors, data analysis, and date extraction
*   **Chart UI Improvements**:
    *   Fixed legend positioning to 85% for all charts
    *   Fixed color consistency when toggling columns (use original column index)
    *   Fixed X-axis two-line labels with tspan approach
    *   Fixed histogram mean/median legend icons with pixel calculation
    *   Removed boundary box from legends
*   **Testing & Performance**:
    *   Added comprehensive performance benchmarking suite
    *   Added ChartErrorBoundary for better error handling
    *   Added ChartSkeleton for loading states
    *   Added chunk load handler for optimized code splitting
    *   Created 2000+ tests for dashboard module
*   **Build Configuration**:
    *   Added vite.config.test.ts for isolated test environment
    *   Added deployment tests to validate production builds
    *   Optimized chunk loading strategy for better performance

### v1.6.1 (2026-02-16)
*   **UI Redesign**: Simplified "Value Columns" selector to show a summary count instead of redundant chips.
*   **Enhanced Series Management**: Added a dedicated, styled area for selected data series with color pickers and better visual grouping.
*   **Column Selector Polish**: Fixed margin and alignment issues in the column selector dialog; improved visual hierarchy with better section labels.
*   **Bug Fix**: Restored drag-and-drop reordering functionality in the column selector.
*   **Version Bump**: Updated package version to 1.6.1.

### v1.6.0 (2026-02-15)
*   Dashboard Architecture: Completed modular refactoring using Domain-Driven Design (DDD) principles
*   Added comprehensive test infrastructure with Vitest and React Testing Library
*   Implemented 214 tests with 100% pass rate for dashboard module
*   Created modular architecture with 20+ reusable components, hooks, and utilities
*   Improved code maintainability and testability through feature-based structure
*   Zero TypeScript errors and strict type checking maintained

### v1.5.0 (2026-02-14)
*   Range Distribution: Converted from pie charts to horizontal bar charts for better readability
*   Added value labels to the end of each bar in range distribution charts
*   Added EUR suffix to all range labels (e.g., "0 EUR", "1-50 EUR")
*   Increased chart margins to prevent label cutoff for longer bars
*   Name merging: Toggle merge groups now automatically updates selected names without requiring manual reselection

### v1.4.0 (2026-02-13)
*   Dashboard stability: added ErrorBoundary around the Dashboard dialog to avoid blank pages on errors.
*   Debug instrumentation behind a flag (`excel-processor-debug`) with timings and structured logs.
*   CSV/Excel parsing consistency: preserve header rows uniformly; avoid misinterpreting first data row as headers.
*   PDF export: aggregate monthly amounts using dates from filenames for CSV; improved date/amount detection.
*   Dashboard: defaults to filename dates when no date column exists; dropdown shows only meaningful date sources; respects visible columns from Detailed Data View.
*   UI clarity: added “From filename” / “From sheet” indicators and disambiguated duplicate labels.

### v1.2.0 (2025-02-07)
*   Added PDF export functionality with customizable templates
*   Implemented German donation receipt template (Zuwendungsbestätigung)
*   Added custom fields dialog with auto-fill from Excel data
*   Added monthly aggregation by date from filenames
*   Added color picker for custom field values in PDF
*   Format dates in German format (DD.MM.YYYY)

### v1.1.0 (2025-02-07)
*   Added row selection checkboxes to DetailedDataView
*   Added auto-deselect zero-value rows feature
*   Improved column selector and row selection UX

### v1.0.1 (2025-02-06)
*   Fixed column selector row selection
*   Added build timestamp

### v1.0.0 (2025-02-06)
*   Initial release with core Excel processing features

---
This application provides a robust solution for processing and analyzing Excel data directly in the browser, without the need for a backend server.
