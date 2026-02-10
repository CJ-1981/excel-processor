# Excel Data Processor - Development Guide

This document contains important information for developers working on this codebase.

## Project Overview

An Excel data processor application for Korean churches in Germany to manage donation data. Built with React, TypeScript, Material-UI, and Vite.

## Key Technical Details

### Excel Column Naming

The xlsx library automatically generates column names when Excel files don't have proper headers:

- **Columns without headers** are named: `__EMPTY`, `__EMPTY_1`, `__EMPTY_2`, etc.
- **Metadata columns added by the app**: `_sourceFileName`, `_sourceSheetName`

**Important:** When filtering columns, do NOT use `key.startsWith('_')` because it will incorrectly skip `__EMPTY*` columns which contain actual data.

```typescript
// ❌ WRONG - skips data columns like __EMPTY_7
if (key.startsWith('_')) return;

// ✅ CORRECT - only skip specific metadata columns
const skipColumns = new Set(['_sourceFileName', '_sourceSheetName']);
if (skipColumns.has(key)) return;
```

See: `src/utils/statisticsAnalyzer.ts` - `detectNumericColumns()` and `detectDateColumns()`

### Column Mapping

The app uses a two-level column naming system:

1. **Internal keys**: The original column keys from Excel (e.g., `__EMPTY_7`)
2. **Display labels**: Human-readable names from the header row (e.g., `헌금총액`)

The `columnMapping` record maps internal keys to display labels:
```typescript
// columnMapping example:
{
  "__EMPTY": "교인성명",
  "__EMPTY_7": "헌금총액",
  "_sourceFileName": "Source File"
}
```

### Data Flow

1. **File Upload** → `ExcelUploader` → `handleFilesUpload()`
2. **Sheet Selection** → `SheetSelector` → `handleMergeSheets()`
3. **Column Selection** → `ColumnSelector` → Name column selection
4. **Name Selection** → `UniqueNameList` → Filter by selected names
5. **Detailed View** → `DetailedDataView` → Row/column filtering, sorting, export
6. **Dashboard** → `DashboardView` → Statistics and visualizations

### Dashboard Data

The dashboard receives data filtered by:
- **Included rows**: Only rows checked in the detailed view
- **Visible columns**: Only columns that are visible in the detailed view

The dashboard data uses the original column keys (e.g., `__EMPTY_7`), not the display labels.

### Date Extraction from Filenames

The dashboard can extract dates from filenames when no date column exists in the data. This is useful for files named like:
- `우리교회 입출금양식-20250105_00.xlsx` (date pattern: YYYYMMDD)

The date pattern used: `/(\d{8})/`

When filename dates are detected, a checkbox "Use filename dates" appears in the dashboard configuration.

## Common Issues

### Numeric Columns Not Detected

If the dashboard shows "No numeric columns detected":

1. Check the console logs for `Column "xxx": x/x numeric values`
2. Verify columns aren't being skipped by `startsWith('_')` check
3. Ensure data is actually numeric (numbers or parseable strings)

### Column Visibility Issues

Column visibility is stored in localStorage with key `excel-processor-column-visibility`.

## File Structure

```
src/
├── components/
│   ├── DashboardView/       # Dashboard visualizations
│   │   ├── index.tsx        # Main dashboard with column selectors
│   │   ├── KPICard.tsx      # Statistics cards
│   │   ├── TrendChart.tsx   # Time series charts
│   │   ├── DistributionChart.tsx
│   │   ├── TopDonorsChart.tsx
│   │   └── StatisticsTable.tsx
│   ├── DetailedDataView.tsx # Main data table with filtering
│   ├── PDFExport/           # PDF generation
│   └── ...
├── utils/
│   ├── statisticsAnalyzer.ts # Statistical calculations
│   ├── chartDataTransformers.ts
│   ├── germanFormatter.ts    # German date/currency formatting
│   └── ...
└── types.ts                  # TypeScript interfaces
```

## Deployment

```bash
npm run build   # Build for production
npm run deploy  # Deploy to GitHub Pages
```
