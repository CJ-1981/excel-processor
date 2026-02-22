/**
 * Specification tests for contact matcher utility
 *
 * TDD approach: RED-GREEN-REFACTOR cycle
 * Tests define expected behavior for contact matching algorithms
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeString,
  calculateSimilarity,
  findMatchingContacts,
  detectColumns,
} from './contactMatcher';
import type { ContactRecord } from '../types';

describe('contactMatcher', () => {
  describe('normalizeString', () => {
    it('should convert to lowercase', () => {
      expect(normalizeString('HELLO')).toBe('hello');
    });

    it('should trim whitespace', () => {
      expect(normalizeString('  hello  ')).toBe('hello');
    });

    it('should remove all whitespace', () => {
      expect(normalizeString('hello world test')).toBe('helloworldtest');
    });

    it('should remove special characters', () => {
      expect(normalizeString('hello@world!')).toBe('helloworld');
    });

    it('should preserve Korean characters', () => {
      expect(normalizeString('홍길동')).toBe('홍길동');
    });

    it('should preserve alphanumeric characters', () => {
      expect(normalizeString('abc123')).toBe('abc123');
    });

    it('should handle empty string', () => {
      expect(normalizeString('')).toBe('');
    });

    it('should handle string with only special characters', () => {
      expect(normalizeString('!@#$%')).toBe('');
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateSimilarity('test', 'test')).toBe(1);
    });

    it('should return 1 for identical Korean strings', () => {
      expect(calculateSimilarity('홍길동', '홍길동')).toBe(1);
    });

    it('should return 1 for empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = calculateSimilarity('abc', 'xyz');
      expect(similarity).toBe(0);
    });

    it('should handle one character difference', () => {
      const similarity = calculateSimilarity('test', 'tent');
      expect(similarity).toBeGreaterThan(0.5);
    });

    it('should handle transposed characters', () => {
      const similarity = calculateSimilarity('test', 'tets');
      expect(similarity).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle partial matches', () => {
      const similarity = calculateSimilarity('hello world', 'hello');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should be case-insensitive', () => {
      expect(calculateSimilarity('TEST', 'test')).toBe(1);
    });
  });

  describe('findMatchingContacts', () => {
    const mockContacts: ContactRecord[] = [
      {
        id: '1',
        koreanName: '홍길동',
        englishName: 'Hong Gil Dong',
        address: 'Seoul, Korea',
        createdAt: Date.now(),
      },
      {
        id: '2',
        englishName: 'John Smith',
        address: 'New York, USA',
        createdAt: Date.now(),
      },
      {
        id: '3',
        koreanName: '김철수',
        englishName: 'Kim Cheol Su',
        address: 'Busan, Korea',
        createdAt: Date.now(),
      },
    ];

    it('should find exact Korean name match', () => {
      const results = findMatchingContacts('홍길동', mockContacts);
      expect(results).toHaveLength(1);
      expect(results[0].contact.id).toBe('1');
      expect(results[0].confidence).toBe(100);
      expect(results[0].matchType).toBe('exact');
    });

    it('should find exact English name match', () => {
      const results = findMatchingContacts('John Smith', mockContacts);
      expect(results).toHaveLength(1);
      expect(results[0].contact.id).toBe('2');
      expect(results[0].confidence).toBe(95);
      expect(results[0].matchType).toBe('exact');
    });

    it('should handle case-insensitive English match', () => {
      const results = findMatchingContacts('john smith', mockContacts);
      expect(results).toHaveLength(1);
      expect(results[0].contact.id).toBe('2');
    });

    it('should find fuzzy matches for typos', () => {
      const results = findMatchingContacts('Jon Smit', mockContacts);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].contact.id).toBe('2');
      expect(results[0].matchType).toBe('fuzzy');
    });

    it('should return results sorted by confidence descending', () => {
      const results = findMatchingContacts('John', mockContacts);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].confidence).toBeGreaterThanOrEqual(results[i + 1].confidence);
      }
    });

    it('should filter out low confidence matches (< 50%)', () => {
      const results = findMatchingContacts('xyz123', mockContacts);
      // No reasonable match should be found
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThanOrEqual(50);
      });
    });

    it('should return empty array for no matches', () => {
      const results = findMatchingContacts('NoSuchName', mockContacts);
      expect(results).toHaveLength(0);
    });

    it('should handle empty search term', () => {
      const results = findMatchingContacts('', mockContacts);
      expect(results).toHaveLength(0);
    });

    it('should handle empty contacts array', () => {
      const results = findMatchingContacts('John Smith', []);
      expect(results).toHaveLength(0);
    });

    it('should handle special characters in search', () => {
      const results = findMatchingContacts('Hong-Gil_Dong', mockContacts);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].contact.id).toBe('1');
    });

    it('should normalize whitespace in search', () => {
      const results = findMatchingContacts('Hong  Gil   Dong', mockContacts);
      expect(results).toHaveLength(1);
      expect(results[0].contact.id).toBe('1');
    });
  });

  describe('detectColumns', () => {
    it('should detect English name and address columns', () => {
      const headers = ['Name', 'Address', 'Phone'];
      const result = detectColumns(headers);

      expect(result).not.toBeNull();
      expect(result?.englishName).toBeDefined();
      expect(result?.address).toBeDefined();
    });

    it('should detect Korean name column', () => {
      const headers = ['한글이름', 'Name', 'Address'];
      const result = detectColumns(headers);

      expect(result).not.toBeNull();
      expect(result?.koreanName).toBeDefined();
    });

    it('should handle case-insensitive header matching', () => {
      const headers = ['NAME', 'ADDRESS'];
      const result = detectColumns(headers);

      expect(result).not.toBeNull();
    });

    it('should return null if required columns missing', () => {
      const headers = ['Phone', 'Email'];
      const result = detectColumns(headers);

      expect(result).toBeNull();
    });

    it('should detect common column name variations', () => {
      const testCases = [
        { headers: ['english_name', 'address'], expected: true },
        { headers: ['English Name', '주소'], expected: true },
        { headers: ['name', 'addr'], expected: true },
        { headers: ['Korean Name', 'Name', 'Address'], expected: true },
      ];

      testCases.forEach(({ headers, expected }) => {
        const result = detectColumns(headers);
        if (expected) {
          expect(result).not.toBeNull();
        } else {
          expect(result).toBeNull();
        }
      });
    });

    it('should require confidence >= 70%', () => {
      const headers = ['random1', 'random2', 'random3'];
      const result = detectColumns(headers);

      // Should not match columns with low confidence
      expect(result).toBeNull();
    });

    it('should handle empty headers array', () => {
      const result = detectColumns([]);

      expect(result).toBeNull();
    });

    it('should match Korean name variations', () => {
      const koreanVariations = [
        ['한글이름', 'Name', 'Address'],
        ['Korean Name', 'english_name', 'address'],
        ['이름', 'English Name', '주소'],
      ];

      koreanVariations.forEach(headers => {
        const result = detectColumns(headers);
        expect(result).not.toBeNull();
        expect(result?.koreanName).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle contacts with missing Korean name', () => {
      const contacts: ContactRecord[] = [
        {
          id: '1',
          englishName: 'John Doe',
          address: 'Test',
          createdAt: Date.now(),
        },
      ];

      const results = findMatchingContacts('John Doe', contacts);
      expect(results).toHaveLength(1);
      expect(results[0].matchType).toBe('exact');
    });

    it('should handle very long search terms', () => {
      const longSearch = 'a'.repeat(1000);
      const contacts: ContactRecord[] = [
        {
          id: '1',
          englishName: 'John',
          address: 'Test',
          createdAt: Date.now(),
        },
      ];

      const results = findMatchingContacts(longSearch, contacts);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle special Korean characters', () => {
      const contacts: ContactRecord[] = [
        {
          id: '1',
          koreanName: '김갑삼',
          englishName: 'Kim Gab Sam',
          address: 'Test',
          createdAt: Date.now(),
        },
      ];

      const results = findMatchingContacts('김갑삼', contacts);
      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBe(100);
    });
  });
});
