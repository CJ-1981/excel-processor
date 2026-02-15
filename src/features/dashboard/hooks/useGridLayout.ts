/**
 * useGridLayout Hook
 * Manages grid layout state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import type { ResponsiveLayouts, Breakpoint } from 'react-grid-layout';

const LAYOUT_STORAGE_KEY = 'excel-processor-dashboard-layout';
const LAYOUT_VERSION = 10;

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface BreakpointConfigs {
  lg: GridLayoutItem[];
  md: GridLayoutItem[];
  sm: GridLayoutItem[];
  xs: GridLayoutItem[];
  xxs: GridLayoutItem[];
}

export interface UseGridLayoutParams {
  itemIds: string[];
  defaultLayouts: BreakpointConfigs;
}

export interface UseGridLayoutResult {
  layouts: ResponsiveLayouts<Breakpoint>;
  currentBreakpoint: keyof BreakpointConfigs;
  setCurrentBreakpoint: (breakpoint: keyof BreakpointConfigs) => void;
  handleLayoutChange: (currentLayout: GridLayoutItem[], allLayouts: ResponsiveLayouts<Breakpoint>) => void;
  resetLayout: () => void;
  adjustWidgetHeight: (itemId: string, delta: number) => void;
}

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const;
const COLS_BREAKPOINTS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 } as const;

/**
 * Hook to manage grid layout with localStorage persistence
 */
export function useGridLayout({
  itemIds,
  defaultLayouts,
}: UseGridLayoutParams): UseGridLayoutResult {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof BreakpointConfigs>('lg');

  const [layouts, setLayouts] = useState<ResponsiveLayouts<Breakpoint>>(() => {
    // Convert defaultLayouts to Layout[] format expected by react-grid-layout
    const layoutsMap: ResponsiveLayouts<Breakpoint> = {};
    Object.keys(defaultLayouts).forEach(breakpoint => {
      layoutsMap[breakpoint] = defaultLayouts[breakpoint as keyof BreakpointConfigs].map(item => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
      }));
    });
    return layoutsMap;
  });

  // Load saved layouts from localStorage
  useEffect(() => {
    const loadSavedLayouts = () => {
      try {
        const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ResponsiveLayouts<Breakpoint> & { _version?: number } | null;
          if (parsed && parsed._version !== LAYOUT_VERSION) {
            localStorage.removeItem(LAYOUT_STORAGE_KEY);
            return;
          }
          if (parsed) {
            setLayouts(sanitizeLayouts(parsed, itemIds));
          }
        }
      } catch (error) {
        console.warn('Could not load dashboard layout:', error);
      }
    };

    // Only load if not already loaded from initial state
    const hasInitialLayout = Object.keys(layouts).some(bp => {
      const layout = layouts[bp as Breakpoint];
      return layout !== undefined && layout.length > 0;
    });
    if (!hasInitialLayout) {
      loadSavedLayouts();
    }
  }, []); // Run once on mount

  // Persist layout changes
  useEffect(() => {
    try {
      const toSave = { ...layouts, _version: LAYOUT_VERSION };
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.warn('Could not persist dashboard layout:', error);
    }
  }, [layouts]);

  const handleLayoutChange = useCallback(
    (_currentLayout: GridLayoutItem[], newLayouts: ResponsiveLayouts<Breakpoint>) => {
      setLayouts(newLayouts);
    },
    []
  );

  const resetLayout = useCallback(() => {
    // Convert defaultLayouts to ResponsiveLayouts format
    const defaultResponsiveLayouts: ResponsiveLayouts<Breakpoint> = {};
    Object.keys(defaultLayouts).forEach(breakpoint => {
      defaultResponsiveLayouts[breakpoint] = defaultLayouts[breakpoint as keyof BreakpointConfigs];
    });
    setLayouts(defaultResponsiveLayouts);
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  }, [defaultLayouts]);

  const adjustWidgetHeight = useCallback(
    (itemId: string, delta: number) => {
      setLayouts((prev: ResponsiveLayouts<Breakpoint>) => {
        const newLayouts = { ...prev };
        const arr = newLayouts[currentBreakpoint] || [];
        newLayouts[currentBreakpoint] = arr.map((item: GridLayoutItem) =>
          item.i === itemId
            ? { ...item, h: Math.max(item.minH || 4, (item.h || 10) + delta) }
            : item
        );

        // Persist immediately
        try {
          const toSave = { ...newLayouts, _version: LAYOUT_VERSION };
          localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(toSave));
        } catch (error) {
          console.warn('Could not save dashboard layout after height adjust:', error);
        }

        return newLayouts;
      });
    },
    [currentBreakpoint]
  );

  return {
    layouts,
    currentBreakpoint,
    setCurrentBreakpoint,
    handleLayoutChange,
    resetLayout,
    adjustWidgetHeight,
  };
}

/**
 * Sanitize layouts to ensure valid configuration
 */
function sanitizeLayouts(
  layoutsObj: ResponsiveLayouts<Breakpoint> | null | undefined,
  itemIds: string[]
): ResponsiveLayouts<Breakpoint> {
  const result: ResponsiveLayouts<Breakpoint> = {};

  for (const bp of Object.keys(BREAKPOINTS)) {
    const cols = COLS_BREAKPOINTS[bp as keyof typeof COLS_BREAKPOINTS] || 12;
    const input = (layoutsObj && layoutsObj[bp]) || [];
    const byId: Record<string, GridLayoutItem> = {};

    input.forEach((raw: GridLayoutItem) => {
      if (!raw || !raw.i || !itemIds.includes(raw.i)) return;

      const item = { ...raw };
      const minW = item.minW ?? 1;
      const minH = item.minH ?? 4;

      item.w = Number.isFinite(item.w)
        ? Math.max(minW, Math.min(item.w || 6, cols))
        : Math.max(minW, Math.min(6, cols));
      item.h = Number.isFinite(item.h) ? Math.max(minH, item.h || 10) : Math.max(minH, 10);
      item.x = Number.isFinite(item.x)
        ? Math.max(0, Math.min(item.x || 0, Math.max(0, cols - 1)))
        : 0;
      item.y = Number.isFinite(item.y) ? Math.max(0, item.y || 0) : 0;

      byId[item.i] = item;
    });

    const missing = itemIds.filter(id => !byId[id]);
    const defaults = defaultLayoutsForBreakpoint(
      bp as keyof typeof BREAKPOINTS,
      itemIds
    ).filter(x => missing.includes(x.i));

    const items = [...Object.values(byId), ...defaults];
    result[bp] = items;
  }

  return result;
}

/**
 * Get default layouts for a specific breakpoint
 */
function defaultLayoutsForBreakpoint(
  breakpoint: keyof typeof BREAKPOINTS,
  itemIds: string[]
): GridLayoutItem[] {
  const cols = COLS_BREAKPOINTS[breakpoint];
  const defaultItem = { i: '', x: 0, y: 0, w: Math.min(6, cols), h: 10, minW: 2, minH: 4 };

  return itemIds.map((id, index) => ({
    ...defaultItem,
    i: id,
    y: index * 10,
  }));
}
