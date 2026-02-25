/**
 * Contact matching utility for fuzzy name and address matching
 *
 * Implements Levenshtein distance-based similarity calculation
 * for intelligent contact lookup and suggestion features.
 */

import type { ContactRecord, ColumnMapping, MatchResult } from '../types';

/**
 * Normalizes a string for comparison by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Removing all whitespace
 * - Removing special characters (keeping alphanumeric and Korean)
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // Remove whitespace
    .replace(/[^\w\s가-힣]/g, ''); // Keep alphanumeric, Korean, whitespace
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a matrix of (len1 + 1) x (len2 + 1)
  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculates similarity score between two strings (0-1)
 * Uses Levenshtein distance normalized by string length
 * Normalizes strings first for case-insensitive comparison
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Finds matching contacts based on search term
 * Returns matches sorted by confidence score (descending)
 * Only includes matches with confidence >= 50%
 */
export function findMatchingContacts(
  searchTerm: string,
  contacts: ContactRecord[]
): MatchResult[] {
  if (!searchTerm || contacts.length === 0) {
    return [];
  }

  const normalizedSearch = normalizeString(searchTerm);
  const results: MatchResult[] = [];

  for (const contact of contacts) {
    let confidence = 0;
    let matchType: 'exact' | 'fuzzy' | 'partial' = 'partial';

    // Exact Korean name match (highest priority)
    if (contact.koreanName && normalizeString(contact.koreanName) === normalizedSearch) {
      confidence = 100;
      matchType = 'exact';
    }
    // Exact English name match
    else if (normalizeString(contact.englishName) === normalizedSearch) {
      confidence = 95;
      matchType = 'exact';
    }
    // Starts with match (partial match at beginning of name) - high confidence
    else if (normalizeString(contact.englishName).startsWith(normalizedSearch) ||
      (contact.koreanName && normalizeString(contact.koreanName).startsWith(normalizedSearch))) {
      confidence = 85;
      matchType = 'partial';
    }
    // Fuzzy English name match
    else {
      const englishSimilarity = calculateSimilarity(
        normalizedSearch,
        normalizeString(contact.englishName)
      );
      const koreanSimilarity = contact.koreanName
        ? calculateSimilarity(normalizedSearch, normalizeString(contact.koreanName))
        : 0;

      confidence = Math.max(englishSimilarity, koreanSimilarity) * 100;
      matchType = 'fuzzy';
    }

    if (confidence >= 50) {
      results.push({ contact, confidence, matchType });
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Pattern arrays for column detection
 * Includes common bilingual header patterns (Korean / English)
 */
const KOREAN_NAME_PATTERNS = [
  '한글이름', '한글 성명', '한글성명',
  '한글이름 / korean name', '한글 성명 / korean name', '한글성명/koreanname',
  'korean name', 'korean_name', '이름', '성명', 'name'
];
const ENGLISH_NAME_PATTERNS = [
  '영문이름', '영문 성명', '영문성명', '영문 이름',
  'full name in english',
  '영문이름 / english name', '영문 성명 / full name in english', '영문성명/fullnameinenglish',
  'english name', 'english_name', 'name'
];
const ADDRESS_PATTERNS = [
  '주소', '영문 주소', 'home address in english',
  '영문 주소 / home address in english',
  'address', 'addr'
];

const EMAIL_PATTERNS = [
  '이메일 주소 / Email Address', '이메일 주소/ Email Address',
  '이메일 주소 / email address', '이메일 주소/email address',
  '이메일 주소', 'email address',
  '이메일', 'email', '메일', 'mail',
  'email_address', 'e-mail', 'e mail'
];

// Patterns that should NOT be matched as address (exclusion list)
const ADDRESS_EXCLUSIONS = [
  '이메일', 'email', '메일', 'mail'
];

/**
 * Finds the best matching column index for a given pattern list
 * @param exclusions - Optional list of patterns that should exclude a header from matching
 */
function findBestMatch(
  headers: string[],
  patterns: string[],
  exclusions?: string[]
): { index: number; confidence: number } | null {
  for (const pattern of patterns) {
    const normalizedPattern = normalizeString(pattern);

    for (let i = 0; i < headers.length; i++) {
      const normalizedHeader = normalizeString(headers[i]);

      // Skip if header contains any exclusion pattern
      if (exclusions) {
        const hasExclusion = exclusions.some(excl => {
          const normalizedExcl = normalizeString(excl);
          return normalizedHeader.includes(normalizedExcl) || normalizedExcl.includes(normalizedHeader);
        });
        if (hasExclusion) {
          continue;
        }
      }

      // Exact match (after normalization)
      if (normalizedHeader === normalizedPattern) {
        return { index: i, confidence: 1.0 };
      }

      // Contains match (after normalization)
      if (normalizedHeader.includes(normalizedPattern) || normalizedPattern.includes(normalizedHeader)) {
        const similarity = calculateSimilarity(headers[i], pattern);
        if (similarity >= 0.6) {
          return { index: i, confidence: similarity };
        }
      }
    }
  }

  return null;
}

/**
 * Detects column mappings for Korean name, English name, address, and email
 * Returns null if confidence < 70% or required columns missing
 */
export function detectColumns(headers: string[]): ColumnMapping | null {
  // Find matches with confidence scoring
  const koreanNameCol = findBestMatch(headers, KOREAN_NAME_PATTERNS);
  const englishNameCol = findBestMatch(headers, ENGLISH_NAME_PATTERNS);
  // Address matching excludes email-related columns
  const addressCol = findBestMatch(headers, ADDRESS_PATTERNS, ADDRESS_EXCLUSIONS);
  const emailCol = findBestMatch(headers, EMAIL_PATTERNS);

  // Validate required columns found
  if (!englishNameCol || !addressCol) {
    return null;
  }

  // Calculate overall confidence
  const confidenceScores = [
    koreanNameCol?.confidence || 0.8, // Default to 0.8 for optional Korean name
    englishNameCol.confidence,
    addressCol.confidence
  ];
  const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;

  return avgConfidence >= 0.65 ? {
    koreanName: koreanNameCol ? headers[koreanNameCol.index] : undefined,
    englishName: headers[englishNameCol.index],
    address: headers[addressCol.index],
    email: emailCol ? headers[emailCol.index] : undefined
  } : null;
}
