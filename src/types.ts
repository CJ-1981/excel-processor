// This file contains shared type definitions for the application.

// Type alias for Excel row data - each row is a record with string keys and unknown values
export type ExcelRowData = Record<string, unknown>;
export type ExcelDataArray = ExcelRowData[];

export interface ParsedSheet {
  sheetName: string;
  data: ExcelDataArray;
}

export interface ParsedFile {
  fileName: string;
  sheets: ParsedSheet[];
  isCSV?: boolean; // True if file was parsed as CSV
}

/**
 * Progress tracking for file parsing operations
 */
export interface ParseProgress {
  /** Total number of files to process */
  total: number;
  /** Number of files completed */
  completed: number;
  /** Current processing stage */
  stage: 'reading' | 'parsing';
  /** Errors encountered during processing */
  errors: ParseError[];
}

/**
 * Error information for a failed file parse
 */
export interface ParseError {
  /** Name of the file that failed */
  fileName: string;
  /** Error message or details */
  error: string;
}

// PDF Template Types
export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  page: {
    orientation: 'portrait' | 'landscape';
    format: 'a4' | 'letter';
    margins: { top: number; right: number; bottom: number; left: number };
  };
  sections: TemplateSection[];
  // Optional default values for custom fields (template-specific)
  customFieldDefaults?: Record<string, string | number | boolean>;
}

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
  | CustomDataTableSection;

export interface HeaderSection {
  type: 'header';
  title: string;          // Supports {{variables}}
  subtitle?: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
}

export interface TableSection {
  type: 'table';
  options: {
    showHeaders: boolean;
    repeatHeader: boolean;      // On each page
    gridLines: boolean;
    borderWidth: number;
    borderColor: string;
    headerBackgroundColor: string;
    headerTextColor: string;
    alternateRowColors: boolean;
    alternateRowColor1: string;
    alternateRowColor2: string;
    fontSize: number;
    cellPadding: number;
  };
  // Number-to-words conversion per column
  columnConversions?: {
    [columnLabel: string]: {
      toWords: boolean;          // Convert numbers to words
      capitalize?: 'lower' | 'upper' | 'title';
    };
  };
}

// Custom data table with embedded data
export interface CustomDataTableSection {
  type: 'customDataTable';
  headers: string[];
  rows: string[][];  // 2D array of cell values
  x?: number;  // Absolute X position (optional - if omitted, uses default margin)
  y?: number;  // Absolute Y position (optional - if omitted, flows from previous content)
  options: {
    showHeaders: boolean;
    repeatHeader: boolean;
    gridLines: boolean;
    borderWidth: number;
    borderColor: string;
    headerBackgroundColor: string;
    headerTextColor: string;
    alternateRowColors: boolean;
    alternateRowColor1: string;
    alternateRowColor2: string;
    fontSize: number;
    cellPadding: number;
    align?: 'left' | 'center' | 'right' | 'justify';  // Table alignment
    columnAlign?: Array<'left' | 'center' | 'right'>;  // Per-column alignment
  };
  // Support variable substitution in cell values
  substituteVariables?: boolean;
}

export interface SummarySection {
  type: 'summary';
  showRowCounts: boolean;
  showColumnTotals: boolean;
  position: 'top' | 'bottom';
  backgroundColor: string;
  fontSize: number;
}

export interface FooterSection {
  type: 'footer';
  left?: string;   // Supports {{variables}}
  center?: string;
  right?: string;
  fontSize: number;
}

export interface TextSection {
  type: 'text';
  content: string;  // Supports {{variables}}
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  margin: { top: number; bottom: number };
}

// Labeled field with absolute positioning
export interface LabeledFieldSection {
  type: 'labeledField';
  label: string;
  value: string;  // Supports {{variables}} like {{donorName}}, {{amount}}
  x: number;      // Absolute X position (from left margin)
  y: number;      // Absolute Y position (from top margin)
  labelWidth?: number;
  fieldWidth?: number;
  fontSize?: number;
  labelFontSize?: number;
  boldLabel?: boolean;
  boldValue?: boolean;
  separator?: string;  // Default: ': '
}

// Multi-line text block with absolute positioning
export interface TextBlockSection {
  type: 'textBlock';
  content: string;  // Supports {{variables}}
  x: number;
  y: number;
  width: number;
  fontSize?: number;
  bold?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
}

// Checkbox element
export interface CheckboxFieldSection {
  type: 'checkbox';
  label: string;
  checked: boolean | string;  // true/false or {{variable}} that evaluates to boolean
  x: number;
  y: number;
  fontSize?: number;
  boxSize?: number;  // Size of checkbox square
  labelGap?: number;  // Gap between checkbox and label (default: 5)
  group?: string;  // Group ID for mutually exclusive checkboxes (only one can be checked)
  groupValue?: string;  // Value that this checkbox represents in the group (e.g., 'option1', 'option2')
}

// Group/border container (optional, for visual grouping)
export interface BoxSection {
  type: 'box';
  x: number;
  y: number;
  width: number;
  height: number;
  border?: boolean;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  sections: TemplateSection[];  // Nested sections with relative positioning
}

// Page break section
export interface PageBreakSection {
  type: 'pageBreak';
}

// Spacer section to advance Y position
export interface SpacerSection {
  type: 'spacer';
  height: number;
}

// Divider line section
export interface DividerSection {
  type: 'divider';
  x: number;
  y: number;
  width: number;
  color?: string;  // Default: '#000000'
  lineWidth?: number;  // Default: 0.5
  style?: 'solid' | 'dashed';  // Default: 'solid'
}

export interface PDFGenerationContext {
  data: any[];
  visibleHeaders: Array<{ id: string; label: string }>;
  includedIndices: Set<number>;
  columnTotals: Record<string, number>;
  selectedNames: string[];
  sourceFiles: string[];
  sourceSheets: string[];
  // Custom form fields
  customFields?: Record<string, string | number>;
  // Text color for PDF (hex format, e.g., "#FF0000")
  textColor?: string;
}

// Name Merging Types
export interface NameMergeGroup {
  id: string;
  displayName: string;
  originalNames: string[];
  createdAt: number;
  active: boolean; // Whether the merge group is active (applied) or inactive (ignored)
}

export interface NameMergeState {
  mergeGroups: NameMergeGroup[];
  nameToGroupId: Record<string, string>;
}

// Dashboard Types
export interface ColumnStatistics {
  columnName: string;
  columnLabel: string;
  sum: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
  count: number;
  nonNullCount: number;
  percentile25: number;
  percentile75: number;
  percentile90: number;
  percentile95: number;
}

export interface TimeSeriesDataPoint {
  period: string;
  value: number;
  count: number;
  date?: Date;
}

export interface CategoryDistribution {
  category: string;
  value: number;
  count: number;
  percentage: number;
}

// Histogram Types
export interface HistogramBin {
  binStart: number;
  binEnd: number;
  count: number;
  label: string;
}

export interface HistogramData {
  bins: HistogramBin[];
  mean: number;
  median: number;
  min: number;
  max: number;
}

// Box Plot Types
export interface Quartiles {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  outliers: number[];
}

// Pareto Types
export interface ParetoDataPoint {
  category: string;
  value: number;
  cumulativeValue: number;
  cumulativePercentage: number;
}

// Range Distribution Types
export interface ValueRange {
  label: string;
  min: number;
  max: number;
}

export interface RangeDistributionData {
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface DashboardAnalysis {
  numericColumns: ColumnStatistics[];
  timeSeries: {
    monthly?: TimeSeriesDataPoint[];
    quarterly?: TimeSeriesDataPoint[];
    yearly?: TimeSeriesDataPoint[];
  };
  distributions: {
    byName?: CategoryDistribution[];
    bySource?: CategoryDistribution[];
  };
  topDonors: CategoryDistribution[];
  metadata: {
    totalRows: number;
    filteredRows: number;
    dateRange?: { start: Date; end: Date };
  };
}
