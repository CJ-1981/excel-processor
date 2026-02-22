/**
 * Specification tests for ContactMatchBanner component
 *
 * TDD approach: RED-GREEN-REFACTOR cycle
 * Tests define expected behavior for contact match suggestion banner
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactMatchBanner } from './ContactMatchBanner';
import type { MatchResult } from '../../types';

// Mock useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      // Simple mock translation function
      if (params?.name && params?.confidence) {
        return `Found matching contact: ${params.name} (${params.confidence}% match)`;
      }
      const translations: Record<string, string> = {
        'pdfExport.contacts.matchBanner.apply': 'Apply',
        'pdfExport.contacts.matchBanner.ignore': 'Ignore',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ContactMatchBanner', () => {
  const mockContact = {
    id: '1',
    englishName: 'John Doe',
    address: '123 Main St, City, Country',
    createdAt: Date.now(),
  };

  const mockMatch: MatchResult = {
    contact: mockContact,
    confidence: 95,
    matchType: 'exact',
  };

  describe('Rendering', () => {
    it('should not render when match is null', () => {
      render(
        <ContactMatchBanner
          match={null}
          
          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.queryByText(/found matching contact/i)).not.toBeInTheDocument();
    });

    it('should render suggestion when match is provided', () => {
      render(
        <ContactMatchBanner
          match={mockMatch}
          
          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByText(/found matching contact/i)).toBeInTheDocument();
    });

    it('should display contact name in suggestion', () => {
      render(
        <ContactMatchBanner
          match={mockMatch}
          
          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByText('Found matching contact: John Doe (95% match)')).toBeInTheDocument();
    });

    it('should display confidence score', () => {
      render(
        <ContactMatchBanner
          match={mockMatch}

          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByText(/\(95% match\)/)).toBeInTheDocument();
    });

    it('should display Apply button', () => {
      render(
        <ContactMatchBanner
          match={mockMatch}
          
          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
    });

    it('should display Ignore button', () => {
      render(
        <ContactMatchBanner
          match={mockMatch}
          
          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /ignore/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onApply when Apply button is clicked', async () => {
      const onApplyMock = vi.fn();
      const user = userEvent.setup();

      render(
        <ContactMatchBanner
          match={mockMatch}
          
          onApply={onApplyMock}
          onIgnore={vi.fn()}
        />
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      expect(onApplyMock).toHaveBeenCalledTimes(1);
    });

    it('should call onIgnore when Ignore button is clicked', async () => {
      const onIgnoreMock = vi.fn();
      const user = userEvent.setup();

      render(
        <ContactMatchBanner
          match={mockMatch}
          
          onApply={vi.fn()}
          onIgnore={onIgnoreMock}
        />
      );

      const ignoreButton = screen.getByRole('button', { name: /ignore/i });
      await user.click(ignoreButton);

      expect(onIgnoreMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Match Type Display', () => {
    it('should display exact match', () => {
      const exactMatch: MatchResult = {
        ...mockMatch,
        matchType: 'exact',
      };

      render(
        <ContactMatchBanner
          match={exactMatch}

          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByText(/\(95% match\)/)).toBeInTheDocument();
    });

    it('should display fuzzy match', () => {
      const fuzzyMatch: MatchResult = {
        ...mockMatch,
        confidence: 75,
        matchType: 'fuzzy',
      };

      render(
        <ContactMatchBanner
          match={fuzzyMatch}

          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByText(/\(75% match\)/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle contacts with Korean names', () => {
      const koreanContact = {
        id: '2',
        koreanName: '홍길동',
        englishName: 'Hong Gil Dong',
        address: 'Seoul, Korea',
        createdAt: Date.now(),
      };

      const koreanMatch: MatchResult = {
        contact: koreanContact,
        confidence: 100,
        matchType: 'exact',
      };

      render(
        <ContactMatchBanner
          match={koreanMatch}
          
          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByText('Found matching contact: 홍길동 (Hong Gil Dong) (100% match)')).toBeInTheDocument();
    });

    it('should handle contacts without Korean names', () => {
      const englishOnlyContact = {
        id: '3',
        englishName: 'Jane Smith',
        address: '456 Oak Ave, Town, Country',
        createdAt: Date.now(),
      };

      const englishMatch: MatchResult = {
        contact: englishOnlyContact,
        confidence: 90,
        matchType: 'exact',
      };

      render(
        <ContactMatchBanner
          match={englishMatch}
          
          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByText('Found matching contact: Jane Smith (90% match)')).toBeInTheDocument();
    });

    it('should handle very long addresses', () => {
      const longAddressContact = {
        ...mockContact,
        address: '123 Very Long Street Name, Apt 456, Building 789, Complex Name, District, City, Province, Postal Code, Country',
      };

      const longAddressMatch: MatchResult = {
        contact: longAddressContact,
        confidence: 85,
        matchType: 'fuzzy',
      };

      render(
        <ContactMatchBanner
          match={longAddressMatch}
          
          onApply={vi.fn()}
          onIgnore={vi.fn()}
        />
      );

      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });
  });
});
