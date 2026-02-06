// This file contains shared type definitions for the application.

export interface ParsedSheet {
  sheetName: string;
  data: any[];
}

export interface ParsedFile {
  fileName: string;
  sheets: ParsedSheet[];
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
