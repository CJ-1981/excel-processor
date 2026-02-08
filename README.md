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
*   **Export to CSV:** Export the currently displayed (filtered, sorted, and visible columns) detailed data to a CSV file.
*   **Export to PDF:** Generate professional PDF reports with customizable templates.
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

## Project Structure Highlights

*   `src/App.tsx`: Main application component managing overall state and workflow.
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
*   `src/types.ts`: Shared TypeScript type definitions.

## Version History

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