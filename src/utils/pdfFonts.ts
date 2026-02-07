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
    // Try multiple CDN sources for Noto Sans KR font
    const fontUrls = [
      'https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@main/Sans/OTF/Korean/NotoSansKR-Regular.otf',
      'https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/Korean/NotoSansKR-Regular.otf',
    ];

    let fontLoaded = false;
    for (const fontUrl of fontUrls) {
      try {
        console.log('Loading Korean font from:', fontUrl);

        const response = await fetch(fontUrl);
        if (!response.ok) {
          console.log('  -> Failed, trying next URL...');
          continue;
        }

        const fontArrayBuffer = await response.arrayBuffer();

        // Convert to base64
        const fontBase64 = arrayBufferToBase64(fontArrayBuffer);

        // Add font to jsPDF virtual file system
        doc.addFileToVFS('NotoSansKR-Regular.otf', fontBase64);
        doc.addFont('NotoSansKR-Regular.otf', 'NotoSansKR', 'normal');

        koreanFontLoaded = true;
        fontLoaded = true;
        console.log('Korean font loaded successfully');
        break;
      } catch (err) {
        console.log('  -> Error, trying next URL...', err);
        continue;
      }
    }

    if (!fontLoaded) {
      throw new Error('All font URLs failed');
    }

    // Set default font to Korean font
    doc.setFont('NotoSansKR');
  } catch (error) {
    console.warn('Failed to load Korean font:', error);
    console.info('Korean characters will not render correctly in PDF');
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
