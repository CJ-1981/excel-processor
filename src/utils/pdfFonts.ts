/**
 * Korean font utilities for jsPDF
 * Loads and registers Korean fonts for proper character rendering
 */

import jsPDF from 'jspdf';

let koreanFontLoaded = false;

/**
 * Load Korean font into jsPDF from CDN
 * Uses Noto Sans KR which supports Korean characters
 */
export async function loadKoreanFont(doc: jsPDF): Promise<void> {
  if (koreanFontLoaded) {
    return;
  }

  try {
    // Try to fetch Noto Sans KR font from Google Fonts CDN
    // We'll use the WOFF2 format which is smaller
    const fontUrl = 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQe.woff2';

    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.warn('Korean font not found, falling back to default fonts');
      return;
    }

    const fontArrayBuffer = await response.arrayBuffer();

    // Convert to base64
    const fontBase64 = arrayBufferToBase64(fontArrayBuffer);

    // Add font to jsPDF virtual file system
    doc.addFileToVFS('NotoSansKR-Regular.woff2', fontBase64);
    doc.addFont('NotoSansKR-Regular.woff2', 'NotoSansKR', 'normal');

    koreanFontLoaded = true;
    console.log('Korean font loaded successfully');

    // Set default font to Korean font
    doc.setFont('NotoSansKR');
  } catch (error) {
    console.warn('Failed to load Korean font:', error);
  }
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
 */
export function setFontForText(doc: jsPDF, text: string, bold = false): void {
  if (containsKorean(text) && koreanFontLoaded) {
    doc.setFont('NotoSansKR', 'normal');
  } else {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
  }
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Check if Korean font is available
 */
export function isKoreanFontLoaded(): boolean {
  return koreanFontLoaded;
}
