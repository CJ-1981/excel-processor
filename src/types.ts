// This file contains shared type definitions for the application.

export interface ParsedSheet {
  sheetName: string;
  data: any[];
}

export interface ParsedFile {
  fileName: string;
  sheets: ParsedSheet[];
}
