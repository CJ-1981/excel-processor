/**
 * Korean font utilities for jsPDF
 * NOTE: Korean font support is disabled due to font loading limitations
 * Korean characters will appear as garbled text in PDFs
 */

import jsPDF from 'jspdf';

const koreanFontLoaded = false;

/**
 * Load Korean font - NOOP (disabled)
 * Korean font loading is not supported due to CORS and bundling limitations
 */
export async function loadKoreanFont(_doc: jsPDF): Promise<void> {
  // Korean font loading disabled - function does nothing
  return;
}

/**
 * Check if text contains Korean characters
 */
export function containsKorean(text: string): boolean {
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3131-\u318E]/;
  return koreanRegex.test(text);
}

/**
 * Set appropriate font for text (Korean or default)
 * NOTE: Korean font is never loaded, so always uses default font
 */
export function setFontForText(doc: jsPDF, _text: string, bold = false): void {
  // Always use default font since Korean font is disabled
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
}

/**
 * Check if Korean font is available
 */
export function isKoreanFontLoaded(): boolean {
  return koreanFontLoaded;
}
