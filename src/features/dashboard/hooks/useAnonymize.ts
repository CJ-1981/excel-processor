/**
 * useAnonymize Hook
 * Manages anonymize toggle state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'excel-processor-anonymize-names';

export interface UseAnonymizeResult {
  anonymize: boolean;
  setAnonymize: (value: boolean) => void;
  toggleAnonymize: () => void;
}

/**
 * Hook to manage anonymize toggle with localStorage persistence
 */
export function useAnonymize(): UseAnonymizeResult {
  const [anonymize, setAnonymizeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Persist to localStorage when value changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(anonymize));
    } catch (error) {
      console.warn('Failed to persist anonymize state:', error);
    }
  }, [anonymize]);

  const setAnonymize = useCallback((value: boolean) => {
    setAnonymizeState(value);
  }, []);

  const toggleAnonymize = useCallback(() => {
    setAnonymizeState(prev => !prev);
  }, []);

  return {
    anonymize,
    setAnonymize,
    toggleAnonymize,
  };
}
