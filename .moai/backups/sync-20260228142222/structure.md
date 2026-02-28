# Architecture Documentation

## System Overview

**Architecture Pattern:** Client-Side SPA (Single Page Application)

**Type:** Monolithic React application with modular component structure

**Data Flow:** Unidirectional (React hooks) with local state management

**Deployment:** Static site hosting (GitHub Pages)

## Directory Structure

```
excel-processor/
├── src/
│   ├── components/           # React UI components
│   │   ├── DashboardView/   # Analytics dashboard (MODULARIZED - 2026-02-15)
│   │   │   ├── index.tsx    # Main dashboard container (orchestrator)
│   │   │   ├── TrendChart.tsx
│   │   │   ├── TopDonorsChart.tsx
│   │   │   ├── StatisticsTable.tsx
│   │   │   ├── DistributionHistogram.tsx
│   │   │   ├── ParetoChart.tsx
│   │   │   ├── RangeDistributionCharts.tsx
│   │   │   ├── DraggableColumnSelector.tsx
│   │   │   ├── DraggableColumnList.tsx
│   │   │   └── KPICard.tsx
│   ├── features/            # Feature-based modules (NEW - 2026-02-15)
│   │   └── dashboard/       # Modular dashboard architecture
│   │       ├── charts/      # 6 chart modules
│   │       │   ├── TrendChart/
│   │       │   ├── TopDonorsChart/
│   │       │   ├── StatisticsTable/
│   │       │   ├── DistributionHistogram/
│   │       │   ├── ParetoChart/
│   │       │   └── RangeDistributionCharts/
│   │       ├── components/  # 3 shared components
│   │       │   ├── ChartExport/
│   │       │   ├── ColumnSelector/
│   │       │   └── DashboardGrid/
│   │       ├── hooks/       # 7 custom hooks
│   │       ├── utils/       # 4 utility modules
│   │       └── types/       # TypeScript definitions
│   │   ├── DetailedDataView/ # Data table with filtering/sorting
│   │   ├── PDFExport/       # PDF generation system
│   │   ├── PDFGenerator/   # PDF rendering engine
│   │   ├── common/         # Shared components (ErrorBoundary)
│   │   ├── App.tsx         # Root application component
│   │   ├── ExcelUploader.tsx
│   │   ├── SheetSelector.tsx
│   │   ├── ColumnSelector.tsx
│   │   ├── UniqueNameList.tsx
│   │   ├── NameMergingPanel.tsx
│   │   └── FileProgressIndicator.tsx
│   ├── utils/              # Utility functions
│   │   ├── statisticsAnalyzer.ts      # Data analysis algorithms
│   │   ├── chartDataTransformers.ts   # Chart data formatting
│   │   ├── batchProcessor.ts          # File processing queue
│   │   ├── monthlyAggregator.ts       # Time-based aggregation
│   │   ├── nameMergeUtils.ts          # Name grouping logic
│   │   ├── germanFormatter.ts         # German date/number formatting
│   │   ├── templateParser.ts          # PDF template parsing
│   │   ├── pdfFonts.ts                # Font embeddings
│   │   └── logger.ts                  # Debug logging
│   ├── templates/          # PDF template definitions
│   ├── types.ts            # TypeScript type definitions
│   ├── main.tsx            # Application entry point
│   └── version.ts          # Build version info
├── public/                 # Static assets
├── .moai/                  # MoAI-ADK configuration
│   ├── project/            # Project documentation (this file)
│   └── config/             # MoAI settings
├── .claude/                # Claude Code configuration
├── dist/                   # Production build output
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # User documentation
```

## Core Modules

### 1. Data Processing Pipeline

**Purpose:** Transform uploaded files into structured, queryable data

**Flow:**
```
Excel/CSV Files → SheetJS Parser → ParsedFile[] → Sheet Selection
→ Merge Operation → Merged Data → Column Selection → Filtered Data
```

**Key Components:**
- `ExcelUploader`: File input and drag-drop handling
- `SheetSelector`: Visual sheet selection interface
- `batchProcessor`: Queue-based file parsing (prevents memory overload)
- `App.tsx`: State orchestration for the pipeline

**Data Structures:**
```typescript
ParsedFile {
  fileName: string
  sheets: ParsedSheet[]
  isCSV?: boolean
}

ParsedSheet {
  sheetName: string
  data: any[]
}
```

### 2. Dashboard Analytics System

**Purpose:** Compute statistical metrics and generate visualizations

**Previous Architecture (BEFORE 2026-02-15):**
- **Single File:** `DashboardView/index.tsx` (1,698 LOC)
- **Responsibilities:** 10+ chart types, grid layout, state management, PDF export
- **Coupling:** Chart components tightly coupled to main container
- **Testability:** Difficult to unit test due to monolithic structure

**Current Architecture (AFTER DDD Refactoring - 2026-02-15):**
```
src/features/dashboard/ (modular feature-based architecture)
├── charts/                    # Chart modules (6)
│   ├── TrendChart/           # Time-series visualization
│   ├── TopDonorsChart/       # Ranking bar chart
│   ├── StatisticsTable/      # Descriptive statistics
│   ├── DistributionHistogram/# Frequency distribution
│   ├── ParetoChart/          # 80/20 analysis
│   └── RangeDistributionCharts/ # Category distribution
├── components/                # Shared components (3)
│   ├── ChartExport/          # Image export functionality
│   ├── ColumnSelector/       # Draggable column selection
│   └── DashboardGrid/        # Responsive grid layout
├── hooks/                     # Custom React hooks (7)
│   ├── useDashboardData.ts   # Data loading and processing
│   ├── useColumnSelection.ts # Column state management
│   ├── useChartExport.ts     # Export functionality
│   ├── useAnonymize.ts       # Privacy controls
│   ├── useGridLayout.ts      # Layout persistence
│   ├── useHistogramZoom.ts   # Histogram interaction
│   └── useMultiSeriesTimeData.ts # Time-series computation
├── utils/                     # Utility functions (4)
│   ├── chartCalculations.ts  # Statistical computations
│   ├── colorUtils.ts         # Color management
│   ├── dataAnalysis.ts       # Data transformation
│   └── dateExtraction.ts     # Date parsing utilities
└── types/                     # TypeScript definitions
    ├── chart.ts              # Chart data interfaces
    └── dashboard.ts          # Dashboard configuration
```

**Benefits of Modular Architecture:**
- **Testability:** Each module has dedicated test files (214 tests, 100% passing)
- **Maintainability:** Clear separation of concerns, single responsibility per module
- **Reusability:** Shared components and utilities prevent code duplication
- **Type Safety:** Full TypeScript coverage with strict type checking
- **Scalability:** Easy to add new chart types or features

### 3. Data Filtering & Selection

**Purpose:** Enable granular data subset selection

**Components:**
- `ColumnSelector`: Choose name identification column
- `UniqueNameList`: Searchable list of unique values
- `NameMergingPanel`: Group similar names (state persisted to localStorage)
- `DetailedDataView`: Sortable, filterable data table

**State Management:**
```typescript
// Application state (App.tsx)
- selectedNameColumn: string | null
- baseSelectedNames: string[]
- nameMergeState: NameMergeState
- dataWithMerging: any[] (computed)

// View state (DetailedDataView)
- sortColumn: string
- sortDirection: 'asc' | 'desc'
- filterText: string
- currentPage: number
- visibleColumns: Record<string, boolean>
```

### 4. PDF Export System

**Purpose:** Generate formatted PDF reports from filtered data

**Architecture:**
```
PDFExport/ (UI layer)
├── TemplateSelector.tsx    # Choose PDF template
├── CustomFieldsDialog.tsx  # Configure custom fields
└── index.tsx               # Export orchestrator

PDFGenerator/ (engine layer)
└── generator.ts            # jsPDF rendering logic

templates/ (template definitions)
└── german-donation-receipt.json
```

**Template System:**
- JSON-based template definitions
- Variable substitution: `{{donorName}}`, `{{amount}}`
- Support for tables, text blocks, checkboxes, positioned fields
- Multi-page layouts with headers/footers

## Data Flow Diagrams

### File Upload Flow
```
User selects files → ExcelUploader component
↓
batchProcessor (queue of 3 files at a time)
↓
SheetJS parsing (XLSX.read)
↓
ParsedFile[] state update
↓
SheetSelector renders available sheets
```

### Data Analysis Flow
```
User clicks "Open Dashboard"
↓
DashboardView receives data + columnMapping + nameColumn
↓
statisticsAnalyzer.analyzeDataForDashboard()
↓
DashboardAnalysis object computed:
  - numericColumns (statistics for each numeric column)
  - timeSeries (aggregated by period)
  - distributions (category frequencies)
  - topDonors (ranked entities)
  - metadata (row counts, date ranges)
↓
Chart components render based on computed analysis
```

### PDF Export Flow
```
User clicks "Export PDF"
↓
CustomFieldsDialog collects user input
↓
PDFGenerationContext built:
  - data (filtered rows)
  - visibleHeaders (column mapping)
  - includedIndices (selected rows)
  - customFields (form input)
  - columnTotals (sum calculations)
↓
generator.renderPDF()
↓
jsPDF document generated
↓
Browser downloads PDF file
```

## Integration Points

### External Libraries

**Excel Parsing:**
- **Library:** SheetJS (xlsx v0.18.5)
- **Usage:** Parse Excel/CSV files into JSON structures
- **Interface:** `XLSX.read()`, `XLSX.utils.sheet_to_json()`

**PDF Generation:**
- **Library:** jsPDF (v4.1.0) + AutoTable (v5.0.7)
- **Usage:** Render PDF documents with tables and text
- **Interface:** `new jsPDF()`, `autoTable()`

**Charting:**
- **Library:** Recharts (v3.7.0)
- **Usage:** Render responsive charts from data
- **Interface:** `<LineChart>`, `<BarChart>`, `<ResponsiveContainer>`

**UI Framework:**
- **Library:** Material-UI (v7.3.7)
- **Usage:** Pre-built components and theming
- **Interface:** `<Button>`, `<Dialog>`, `<Table>`

### Browser APIs

**File Handling:**
- `FileReader`: Read file contents as ArrayBuffer
- Drag & Drop API: Handle file drops

**Local Storage:**
- `localStorage`: Persist settings (column visibility, name merging)
- Keys: `excel-processor-*` prefix

**Canvas:**
- `html2canvas`: Export charts as images
- Used for: Chart download functionality

## Architecture Issues & Technical Debt

### Critical Issues

**1. DashboardView Monolith (HIGH PRIORITY)**
- **Problem:** 1,698 LOC in single file violates Single Responsibility Principle
- **Impact:** Difficult to test, maintain, extend
- **Solution:** DDD refactoring into domain modules

**2. Type Safety Gaps (MEDIUM)**
- **Problem:** Extensive use of `any[]` for data structures
- **Impact:** Runtime type errors, poor IDE support
- **Solution:** Generic type parameters for data operations

**3. Test Coverage (HIGH)**
- **Problem:** No unit tests exist (0% coverage)
- **Impact:** Regressions during refactoring
- **Solution:** Target 85% coverage per MoAI standards

### Performance Concerns

**1. Large Dataset Handling**
- **Current:** 100K row limit before browser slowdown
- **Bottleneck:** In-memory data structures, unoptimized re-renders
- **Mitigation:** Virtualization, pagination, Web Workers

**2. Chart Rendering**
- **Current:** All charts re-render on any state change
- **Bottleneck:** Recharts `ResponsiveContainer` resize calculations
- **Mitigation:** React.memo, useMemo optimization

**3. File Parsing**
- **Current:** Batch processing in groups of 3
- **Bottleneck:** Synchronous SheetJS parsing blocks UI
- **Mitigation:** Web Worker-based parsing (future)

## Security Considerations

### Client-Side Security

**XSS Prevention:**
- All user input sanitized before rendering
- React's built-in XSS protection via JSX
- No `dangerouslySetInnerHTML` usage

**Data Privacy:**
- Zero network transmission of user data
- No tracking or analytics
- LocalStorage only for preferences (not data)

### File Handling Security

**File Type Validation:**
- Accept `.xlsx`, `.xls`, `.csv` only
- File signature validation (magic numbers)

**Memory Safety:**
- Batch processing prevents OOM crashes
- File size limits (50MB per file recommended)

## Deployment Architecture

**Build Process:**
```
Source (TSX) → TypeScript Compiler → JavaScript
→ Vite Bundling → Optimized Static Assets
→ dist/ directory → GitHub Pages
```

**Hosting:**
- Platform: GitHub Pages
- CDN: GitHub's global CDN
- HTTPS: Automatic TLS certificates
- Caching: Browser cache headers + service worker (planned)

---

**Last Updated:** 2026-02-15
**Document Version:** 1.0
