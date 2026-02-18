import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  IconButton,
  Button,
  Switch,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import html2canvas from 'html2canvas';

// Wrap Responsive with WidthProvider for auto-width detection
const GridLayout = WidthProvider(Responsive);
import {
  TrendingUp,
  BarChart,
  TableChart,
  ShowChart,
  AreaChart as AreaChartIcon,
  StackedLineChart,
  Close,
  PieChart as PieChartIcon,
  UnfoldMore,
  UnfoldLess,
  Add as AddIcon,
  Remove as RemoveIcon,
  Download,
} from '@mui/icons-material';
// Import modular chart components from features/dashboard
import { TrendChart, CHART_COLORS } from '../../features/dashboard/charts';
import { TopDonorsChart } from '../../features/dashboard/charts';
import { StatisticsTable } from '../../features/dashboard/charts';
import { DistributionHistogram } from '../../features/dashboard/charts';
import { ParetoChart } from '../../features/dashboard/charts';
import { RangeDistributionCharts } from '../../features/dashboard/charts';
import {
  analyzeDataForDashboard,
  detectNumericColumns,
  detectDateColumns,
  calculateDistribution,
  getTopItems,
  extractNumericValues,
  calculateHistogram,
  calculatePareto,
  calculateRangeDistribution,
} from '../../utils/statisticsAnalyzer';
import type { DashboardAnalysis } from '../../types';
import { formatDateGerman, formatCurrencyGerman } from '../../utils/germanFormatter';
import { error, warn } from '../../utils/logger';

interface DashboardViewProps {
  data: any[];
  columnMapping: Record<string, string>;
  nameColumn: string | null;
  deferRendering?: boolean; // Defer heavy rendering until Dialog is fully open
}

type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ChartType = 'line' | 'area' | 'stacked';

// Date pattern for extracting dates from filenames (YYYYMMDD format)
// Updated to be more specific - looks for 8 digits in a row
const FILENAME_DATE_PATTERN = /(\d{8})/;

const DashboardView: React.FC<DashboardViewProps> = ({ data, columnMapping, nameColumn, deferRendering = false }) => {
  // Track component renders to identify unnecessary re-renders
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  // State to defer heavy rendering when Dialog first opens
  const [readyToRender, setReadyToRender] = React.useState(!deferRendering);

  useEffect(() => {
    if (deferRendering && !readyToRender) {
      // Small delay to allow Dialog to render smoothly first
      const timer = setTimeout(() => {
        setReadyToRender(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [deferRendering, readyToRender]);
  const [periodType, setPeriodType] = useState<PeriodType>('weekly');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [topDonorsCount, setTopDonorsCount] = useState<number>(20);
  // Pareto donors count - will be set to unique count after data loads
  const [paretoDonorsCount, setParetoDonorsCount] = useState<number>(0);
  const [histogramBins, setHistogramBins] = useState<number>(70);
  // Initial zoom state - will be set to zoom level 1 after data loads
  const [histogramZoomMin, setHistogramZoomMin] = useState<number | null>(null);
  const [histogramZoomMax, setHistogramZoomMax] = useState<number | null>(null);
  // Track if initial zoom has been applied
  const initialZoomApplied = React.useRef(false);
  // Box plot zoom (min/max range)
  // Box plot removed
  // Anonymize unique names on X-axis ticks - default true, no persistence
  const [anonymizeNames, setAnonymizeNames] = useState<boolean>(true);

  // Grid layout state for draggable/resizable charts
  const LAYOUT_STORAGE_KEY = 'excel-processor-dashboard-layout';
  const LAYOUT_VERSION = 10; // Increment to invalidate saved layouts due to removing Box Plot panel
  const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const COLS_BREAKPOINTS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
  const ROW_HEIGHT_KEY = 'excel-processor-dashboard-rowheight';
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof typeof BREAKPOINTS>('lg');

  // Helper function to download any chart as PNG/JPG
  // Stop event propagation to prevent drag handle interference on mobile
  const downloadChartAsImage = useCallback((chartId: string, format: 'png' | 'jpg' = 'png', event?: React.MouseEvent | React.TouchEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const wrapper = document.querySelector(`[data-chart-id="${chartId}"]`) as HTMLElement | null;
    if (!wrapper) return;

    // If this panel contains multiple charts (like Range Distribution's two pies),
    // capture the entire wrapper via html2canvas so everything is included.
    const svgAll = Array.from(wrapper.querySelectorAll('svg')) as SVGSVGElement[];
    if (chartId === 'range-distribution' || chartId === 'pareto' || svgAll.length > 1) {
      (async () => {
        try {
          const canvas = await html2canvas(wrapper, {
            backgroundColor: '#ffffff',
            scale: Math.max(1, Math.floor(window.devicePixelRatio || 1)),
            useCORS: true,
          });
          const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chart-${chartId}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, mime, 0.92);
        } catch { }
      })();
      return;
    }

    // Pick the largest SVG inside the wrapper (avoid tiny icon svgs)
    const svgCandidates = svgAll;
    const svgEl = svgCandidates.length > 0
      ? svgCandidates.reduce((best, el) => {
        const r = el.getBoundingClientRect();
        const area = (r.width || 0) * (r.height || 0);
        const br = best.getBoundingClientRect();
        const bArea = (br.width || 0) * (br.height || 0);
        return area > bArea ? el : best;
      }, svgCandidates[0])
      : null;

    // If no SVG exists (or selection failed), fallback to html2canvas of wrapper
    if (!svgEl) {
      (async () => {
        try {
          const canvas = await html2canvas(wrapper, {
            backgroundColor: '#ffffff',
            scale: Math.max(1, Math.floor(window.devicePixelRatio || 1)),
            useCORS: true,
          });
          const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chart-${chartId}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, mime, 0.92);
        } catch { }
      })();
      return;
    }

    // Measure displayed size of the chart area
    const rect = wrapper.getBoundingClientRect();
    let displayWidth = Math.max(1, Math.round(rect.width));
    let displayHeight = Math.max(1, Math.round(rect.height));
    if (!displayWidth || !displayHeight) {
      // Try viewBox or bbox if wrapper has no size
      const vb = svgEl.getAttribute('viewBox');
      if (vb) {
        const parts = vb.split(/\s+/).map(Number);
        if (parts.length === 4) {
          displayWidth = parts[2];
          displayHeight = parts[3];
        }
      } else {
        try {
          const bbox = (svgEl as any).getBBox?.();
          if (bbox && bbox.width && bbox.height) {
            displayWidth = bbox.width;
            displayHeight = bbox.height;
          }
        } catch { }
      }
      if (!displayWidth || !displayHeight) {
        displayWidth = wrapper.offsetWidth || 800;
        displayHeight = wrapper.offsetHeight || 400;
      }
    }

    // Clone and enforce explicit size + namespaces for reliable rasterization
    const cloned = svgEl.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    cloned.setAttribute('width', `${displayWidth}`);
    cloned.setAttribute('height', `${displayHeight}`);
    if (!cloned.getAttribute('viewBox')) {
      cloned.setAttribute('viewBox', `0 0 ${displayWidth} ${displayHeight}`);
    }
    const svgData = new XMLSerializer().serializeToString(cloned);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      return;
    }

    // Account for device pixel ratio for sharper output
    const scale = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    img.onload = () => {
      try {
        // Always paint a white background so PNGs aren't transparent
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Draw and scale SVG image to the measured size
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chart-${chartId}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          URL.revokeObjectURL(svgUrl);
        }, mime, 0.92);
      } catch {
        URL.revokeObjectURL(svgUrl);
      }
    };

    img.onerror = async () => {
      URL.revokeObjectURL(svgUrl);
      // Fallback: rasterize the wrapper via html2canvas
      try {
        const canvas = await html2canvas(wrapper, {
          backgroundColor: '#ffffff',
          scale: Math.max(1, Math.floor(window.devicePixelRatio || 1)),
          useCORS: true,
        });
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `chart-${chartId}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, mime, 0.92);
      } catch { }
    };
    img.src = svgUrl;
  }, []);

  // Default layout configuration for all breakpoints - full width, stacked vertically
  const defaultLayout = {
    lg: [
      { i: 'trend-chart', x: 0, y: 0, w: 12, h: 16, minW: 6, minH: 10 },
      { i: 'statistics-table', x: 0, y: 16, w: 12, h: 12, minW: 6, minH: 4 },
      { i: 'top-contributors', x: 0, y: 28, w: 12, h: 18, minW: 6, minH: 10 },
      { i: 'histogram', x: 0, y: 46, w: 12, h: 16, minW: 6, minH: 8 },
      { i: 'pareto', x: 0, y: 62, w: 12, h: 14, minW: 6, minH: 8 },
      { i: 'range-distribution', x: 0, y: 76, w: 12, h: 18, minW: 6, minH: 10 },
    ],
    md: [
      { i: 'trend-chart', x: 0, y: 0, w: 10, h: 16, minW: 5, minH: 10 },
      { i: 'statistics-table', x: 0, y: 16, w: 10, h: 12, minW: 5, minH: 4 },
      { i: 'top-contributors', x: 0, y: 28, w: 10, h: 18, minW: 5, minH: 10 },
      { i: 'histogram', x: 0, y: 46, w: 10, h: 16, minW: 5, minH: 8 },
      { i: 'pareto', x: 0, y: 62, w: 10, h: 14, minW: 5, minH: 8 },
      { i: 'range-distribution', x: 0, y: 76, w: 10, h: 18, minW: 5, minH: 10 },
    ],
    sm: [
      { i: 'trend-chart', x: 0, y: 0, w: 6, h: 16, minW: 3, minH: 10 },
      { i: 'statistics-table', x: 0, y: 16, w: 6, h: 12, minW: 3, minH: 4 },
      { i: 'top-contributors', x: 0, y: 28, w: 6, h: 18, minW: 3, minH: 10 },
      { i: 'histogram', x: 0, y: 46, w: 6, h: 16, minW: 3, minH: 8 },
      { i: 'pareto', x: 0, y: 62, w: 6, h: 14, minW: 3, minH: 8 },
      { i: 'range-distribution', x: 0, y: 76, w: 6, h: 18, minW: 3, minH: 10 },
    ],
    xs: [
      { i: 'trend-chart', x: 0, y: 0, w: 4, h: 16, minW: 2, minH: 10 },
      { i: 'statistics-table', x: 0, y: 16, w: 4, h: 12, minW: 2, minH: 4 },
      { i: 'top-contributors', x: 0, y: 28, w: 4, h: 18, minW: 2, minH: 10 },
      { i: 'histogram', x: 0, y: 46, w: 4, h: 16, minW: 2, minH: 8 },
      { i: 'pareto', x: 0, y: 62, w: 4, h: 14, minW: 2, minH: 8 },
      { i: 'range-distribution', x: 0, y: 76, w: 4, h: 18, minW: 2, minH: 10 },
    ],
    xxs: [
      { i: 'trend-chart', x: 0, y: 0, w: 2, h: 16, minW: 2, minH: 10 },
      { i: 'statistics-table', x: 0, y: 16, w: 2, h: 12, minW: 2, minH: 4 },
      { i: 'top-contributors', x: 0, y: 28, w: 2, h: 18, minW: 2, minH: 10 },
      { i: 'histogram', x: 0, y: 46, w: 2, h: 16, minW: 2, minH: 8 },
      { i: 'pareto', x: 0, y: 62, w: 2, h: 14, minW: 2, minH: 8 },
      { i: 'range-distribution', x: 0, y: 76, w: 2, h: 18, minW: 2, minH: 10 },
    ],
  } as const;

  const ITEM_IDS = ['trend-chart', 'top-contributors', 'statistics-table', 'histogram', 'pareto', 'range-distribution'];

  const sanitizeLayouts = (layoutsObj: any) => {
    const result: any = {};
    // Only allow known breakpoints and known items; de-duplicate by last occurrence
    for (const bp of Object.keys(BREAKPOINTS)) {
      const cols = (COLS_BREAKPOINTS as any)[bp] || 12;
      const input = (layoutsObj && layoutsObj[bp]) ? layoutsObj[bp] : (defaultLayout as any)[bp];
      const byId: Record<string, any> = {};
      (input || []).forEach((raw: any) => {
        if (!raw || !raw.i || !ITEM_IDS.includes(raw.i)) return; // drop unknowns
        const item = { ...raw };
        // Coerce numbers and clamp into bounds (defensive)
        const minW = item.minW ?? 1;
        const minH = item.minH ?? 4;
        item.w = Number.isFinite(item.w) ? Math.max(minW, Math.min(item.w, cols)) : Math.max(minW, Math.min(6, cols));
        item.h = Number.isFinite(item.h) ? Math.max(minH, item.h) : Math.max(minH, 10);
        item.x = Number.isFinite(item.x) ? Math.max(0, Math.min(item.x, Math.max(0, cols - 1))) : 0;
        item.y = Number.isFinite(item.y) ? Math.max(0, item.y) : 0;
        byId[item.i] = item; // keep last occurrence
      });
      // Ensure all required items exist; merge with defaults for any missing ids
      const missing = ITEM_IDS.filter(id => !byId[id]);
      const defaults = (defaultLayout as any)[bp].filter((x: any) => missing.includes(x.i));
      const items = [...Object.values(byId), ...defaults];
      result[bp] = items;
    }
    return result;
  };

  // Heuristic check for obviously broken layouts
  const isLayoutBroken = (layoutsObj: any): boolean => {
    try {
      if (!layoutsObj || typeof layoutsObj !== 'object') return true;
      for (const bp of Object.keys(BREAKPOINTS)) {
        const cols = (COLS_BREAKPOINTS as any)[bp] || 12;
        const arr: any[] = layoutsObj[bp] || [];
        // Must contain exactly our known set
        const ids = new Set(arr.map(x => x?.i));
        for (const id of ITEM_IDS) if (!ids.has(id)) return true;
        if (arr.length !== ITEM_IDS.length) return true; // extras/duplicates
        for (const item of arr) {
          if (!item) return true;
          const { i, x, y, w, h, minW, minH } = item;
          if (!i || !ITEM_IDS.includes(i)) return true;
          if (![x, y, w, h].every((n) => Number.isFinite(n))) return true;
          if (w <= 0 || h <= 0) return true;
          if (typeof minW === 'number' && w < minW) return true;
          if (typeof minH === 'number' && h < minH) return true;
          if (x < 0 || y < 0) return true;
          if (x + w > cols) return true;
        }
      }
      return false;
    } catch {
      return true;
    }
  };

  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check version and invalidate if old
        if (parsed._version !== LAYOUT_VERSION) {
          console.log('Layout version mismatch, using defaults');
          localStorage.removeItem(LAYOUT_STORAGE_KEY);
          return defaultLayout;
        }
        return sanitizeLayouts(parsed);
      }
    } catch (e) {
      console.warn('Could not load dashboard layout:', e);
    }
    return defaultLayout;
  });

  // Auto-reset if layout appears broken, or when a debug flag is set.
  useEffect(() => {
    try {
      const FORCE_RESET_FLAG = 'excel-processor-dashboard-force-reset';
      const RESET_MARK_KEY = `${LAYOUT_STORAGE_KEY}-autoreset-v${LAYOUT_VERSION}`;
      const force = localStorage.getItem(FORCE_RESET_FLAG) === 'true';
      const alreadyApplied = localStorage.getItem(RESET_MARK_KEY) === 'true';
      const savedRaw = localStorage.getItem(LAYOUT_STORAGE_KEY);

      if (force) {
        warn('[Dashboard]', 'Force-reset flag detected; resetting saved layout');
      }

      if ((force || (savedRaw && isLayoutBroken(JSON.parse(savedRaw)))) && !alreadyApplied) {
        warn('[Dashboard]', 'Auto-resetting corrupted or mismatched layout');
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
        localStorage.setItem(RESET_MARK_KEY, 'true');
        setLayouts(defaultLayout);
        // Nudge layout recalculation
        setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch { } }, 50);
      }
    } catch (e) {
      console.warn('Auto-reset check failed:', e);
    }
    // We only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLayoutChange = useCallback((_layout: any, newLayouts: any) => {
    setLayouts(newLayouts);
    try {
      const toSave = { ...newLayouts, _version: LAYOUT_VERSION };
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Could not save dashboard layout:', e);
    }
  }, []);

  const handleResetLayout = useCallback(() => {
    // Calculate unique contributor count inline for reset decision
    const count = !nameColumn || data.length === 0 ? 0 : (() => {
      const uniqueNames = new Set<string>();
      for (let i = 0; i < data.length; i++) {
        const name = data[i][nameColumn];
        if (name) uniqueNames.add(String(name));
      }
      return uniqueNames.size;
    })();

    // When only 1 unique contributor, filter the default layout to exclude hidden charts
    if (count <= 1) {
      const HIDDEN_WHEN_SINGLE = ['top-contributors', 'histogram', 'pareto', 'range-distribution'];
      const filteredLayout: any = {};
      for (const bp of Object.keys(BREAKPOINTS)) {
        const items = (defaultLayout as any)[bp] || [];
        const filteredItems = items.filter((item: any) => !HIDDEN_WHEN_SINGLE.includes(item.i));

        // Compact vertically
        let currentY = 0;
        const visibleItems = filteredItems.map((item: any) => {
          const newItem = { ...item, y: currentY };
          currentY += item.h || 10;
          return newItem;
        });

        filteredLayout[bp] = visibleItems;
      }
      setLayouts(filteredLayout);
    } else {
      setLayouts(defaultLayout);
    }
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  }, [defaultLayout, data, nameColumn]);

  // Row height for grid (user adjustable)
  const [rowHeight, setRowHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ROW_HEIGHT_KEY);
      return saved ? parseInt(saved, 10) || 50 : 50;
    } catch {
      return 50;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(ROW_HEIGHT_KEY, String(rowHeight)); } catch { }
  }, [rowHeight]);

  const handleAdjustWidgetHeight = useCallback((id: string, delta: number) => {
    setLayouts((prev: any) => {
      const newLayouts = { ...prev } as any;
      const arr = newLayouts[currentBreakpoint] || [];
      newLayouts[currentBreakpoint] = arr.map((item: any) =>
        item.i === id ? { ...item, h: Math.max(item.minH || 4, (item.h || 10) + delta) } : item
      );
      // Persist immediately so manual adjustments survive reload
      try {
        const toSave = { ...newLayouts, _version: LAYOUT_VERSION };
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.warn('Could not save dashboard layout after height adjust:', e);
      }
      return newLayouts;
    });
  }, [currentBreakpoint]);

  // As a safety net, persist any layout changes whenever state updates
  useEffect(() => {
    try {
      const toSave = { ...(layouts as any), _version: LAYOUT_VERSION };
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Could not persist dashboard layout from effect:', e);
    }
  }, [layouts]);

  // Detect available columns
  const availableNumericColumns = useMemo(() => {
    let cols: string[] = [];
    try {
      cols = detectNumericColumns(data);
    } catch (e: any) {
      error('[Dashboard]', 'detectNumericColumns failed', e);
      cols = [];
    }

    return cols;
  }, [data]);

  // Note: all column keys for selection are derived on-demand by each control

  const availableDateColumns = useMemo(() => {
    let cols: string[] = [];
    try {
      cols = detectDateColumns(data);
    } catch (e: any) {
      error('[Dashboard]', 'detectDateColumns failed', e);
      cols = [];
    }

    return cols;
  }, [data]);

  // Check if dates can be extracted from filenames
  const hasFilenameDates = useMemo(() => {
    if (data.length === 0) return false;
    const sampleRow = data.find(row => row._sourceFileName);
    if (!sampleRow) return false;
    return !!sampleRow._sourceFileName.match(FILENAME_DATE_PATTERN);
  }, [data]);

  // Selected columns for charts (multiple selection)
  const [selectedValueColumns, setSelectedValueColumns] = useState<string[]>([]);
  const [selectedDateColumn, setSelectedDateColumn] = useState<string | null>(null);
  const [useFilenameDates, setUseFilenameDates] = useState<boolean>(false);
  // Track if user explicitly toggled the filename-dates switch to avoid auto-re-enabling
  const [userToggledFilenameDates, setUserToggledFilenameDates] = useState<boolean>(false);
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({});
  // Track hidden columns (chips stay visible but greyed out, data not shown in charts)
  const [hiddenValueColumns, setHiddenValueColumns] = useState<Set<string>>(new Set());
  // Track if we've done initial auto-selection to avoid re-selecting after user deselects
  const didAutoSelectValueColumns = React.useRef<string[]>([]);

  // Debug logging removed to prevent infinite loop



  // Track if we've done initial auto-selection for date columns
  const didAutoSelectDateColumn = React.useRef(false);
  const didAutoEnableFilenameDates = React.useRef(false);

  // Set defaults when columns are detected (only on initial load)
  React.useEffect(() => {
    // Auto-select all numeric columns when none selected yet
    if (didAutoSelectValueColumns.current.length === 0 && availableNumericColumns.length > 0) {
      setSelectedValueColumns(availableNumericColumns);
      didAutoSelectValueColumns.current = availableNumericColumns;
    }
  }, [availableNumericColumns]);

  React.useEffect(() => {
    if (availableDateColumns.length > 0 && !didAutoSelectDateColumn.current) {
      setSelectedDateColumn(availableDateColumns[0]);
      didAutoSelectDateColumn.current = true;
    }
    // Auto-enable filename dates if no date columns but filename dates available
    if (availableDateColumns.length === 0 && hasFilenameDates && !didAutoEnableFilenameDates.current && !userToggledFilenameDates) {
      setUseFilenameDates(true);
      didAutoEnableFilenameDates.current = true;
    }
  }, [availableDateColumns, hasFilenameDates, userToggledFilenameDates]);

  // If the underlying dataset changes identity (e.g. new file), clear manual toggle so auto behavior can apply for new data
  // We use a fingerprint of the source data rather than the data object itself to avoid resetting
  // when the user is just interactively filtering/sorting/selecting rows.
  const dataFingerprint = useMemo(() => {
    if (!data || data.length === 0) return 'empty';
    // We look at the first few items and total length to identify the dataset
    // Sorting doesn't change the dataset identity, so we avoid using sorted order if possible
    // But since 'data' here is already filtered/sorted, we'll use length and source info.
    const firstRow = data[0];
    return `${firstRow._sourceFileName || ''}-${firstRow._sourceSheetName || ''}-${data.length}`;
  }, [data.length, data[0]?._sourceFileName, data[0]?._sourceSheetName]);

  React.useEffect(() => {
    setUserToggledFilenameDates(false);
    didAutoSelectValueColumns.current = [];
    didAutoSelectDateColumn.current = false;
    didAutoEnableFilenameDates.current = false;
  }, [dataFingerprint]);

  // Create a stable data fingerprint to detect when data content actually changes
  // This prevents expensive re-analysis when the data reference changes but content is the same
  const dataContentFingerprint = useMemo(() => {
    if (!data || data.length === 0) return 'empty';
    // Sample: data length + first row structure
    const firstRow = data[0];
    const firstRowKeys = firstRow ? Object.keys(firstRow).sort().join(',') : '';
    const sampleValues = firstRow ? Object.values(firstRow).slice(0, 3).map(String).join('|') : '';
    return `${data.length}|${firstRowKeys}|${sampleValues}`;
  }, [data]);

  // Analyze data for dashboard - only re-analyze when data content actually changes
  const analysis: DashboardAnalysis = useMemo(() => {
    try {
      const result = analyzeDataForDashboard(data, columnMapping, nameColumn);
      return result;
    } catch (e: any) {
      error('[Dashboard]', 'analyzeDataForDashboard failed', e);
      return {
        numericColumns: [],
        timeSeries: {},
        distributions: {},
        topDonors: [],
        metadata: { totalRows: data.length, filteredRows: data.length },
      } as DashboardAnalysis;
    }
  }, [dataContentFingerprint, columnMapping, nameColumn]);

  // Get time series for selected columns (multi-series)
  // Use data fingerprint to avoid recalculation when data reference changes but content is the same
  const multiSeriesTimeData = useMemo(() => {
    if ((selectedValueColumns || []).length === 0) {
      return { weekly: [], monthly: [], quarterly: [], yearly: [] } as any;
    }

    // If using filename dates, extract from _sourceFileName
    if (useFilenameDates) {
      return aggregateByFilenameDateMultiple(data, selectedValueColumns);
    }

    // Otherwise use the selected date column
    if (!selectedDateColumn) {
      return { weekly: [], monthly: [], quarterly: [], yearly: [] } as any;
    }

    return aggregateByTimeMultiple(data, selectedDateColumn, selectedValueColumns);
  }, [dataContentFingerprint, selectedDateColumn, selectedValueColumns, useFilenameDates, columnMapping]);

  // Get top contributors for first selected value column (aggregated by name)
  const topContributorsData = useMemo(() => {
    if ((selectedValueColumns || []).length === 0 || !nameColumn) {
      return [];
    }

    const distribution = calculateDistribution(data, nameColumn, selectedValueColumns[0]);
    return getTopItems(distribution, topDonorsCount);
  }, [dataContentFingerprint, selectedValueColumns, nameColumn, topDonorsCount]);

  // Calculate unique contributor count for conditional chart visibility
  // Only depends on data and nameColumn, NOT on selectedValueColumns
  // This prevents recalculation when value columns selection changes
  const uniqueContributorCount = useMemo(() => {
    if (!nameColumn || data.length === 0) return 0;

    // Use Set for O(1) lookups and deduplication
    const uniqueNames = new Set<string>();
    for (let i = 0; i < data.length; i++) {
      const name = data[i][nameColumn];
      if (name) {
        uniqueNames.add(String(name));
      }
    }

    return uniqueNames.size;
  }, [data.length, nameColumn, dataFingerprint]);  // Depend on fingerprint for stability

  // Memoize the unique contributor count value to prevent prop drilling issues
  const uniqueContributorValue = React.useMemo(() => uniqueContributorCount, [uniqueContributorCount]);

  // REMOVED: All layout filtering attempts caused infinite loops
  // Charts use CSS display: none for hiding, which keeps them mounted
  // react-grid-layout will skip rendering items without corresponding DOM elements

  // Get ALL contributors aggregated by name (for donor-level statistics)
  const allContributorsData = useMemo(() => {
    if ((selectedValueColumns || []).length === 0 || !nameColumn) {
      return [];
    }
    return calculateDistribution(data, nameColumn, selectedValueColumns[0]);
  }, [dataContentFingerprint, selectedValueColumns, nameColumn]);

  // Build series configuration for TrendChart (only visible columns)
  const visibleValueColumns = useMemo(() => {
    return (selectedValueColumns || []).filter(col => !hiddenValueColumns.has(col));
  }, [selectedValueColumns, hiddenValueColumns]);

  const seriesConfig = useMemo(() => {
    return visibleValueColumns.map((col) => {
      // Use the original column's index in selectedValueColumns for consistent colors
      // This ensures colors don't change when columns are hidden/shown
      const originalIndex = (selectedValueColumns || []).indexOf(col);
      return {
        key: col,
        label: columnMapping[col] || col,
        color: colorOverrides[col] || CHART_COLORS[originalIndex % CHART_COLORS.length],
      };
    });
  }, [visibleValueColumns, selectedValueColumns, columnMapping, colorOverrides]);

  // Get values for the first selected column for distribution charts
  // IMPORTANT: For donor analysis, we aggregate by unique name first
  // This means we analyze donor totals, not individual transactions
  const distributionValues = useMemo(() => {
    if ((selectedValueColumns || []).length === 0) {
      return [];
    }

    return nameColumn
      ? allContributorsData.map(d => d.value)
      : extractNumericValues(data, selectedValueColumns[0]);
  }, [dataContentFingerprint, selectedValueColumns, nameColumn, allContributorsData]);

  // Calculate histogram data with zoom support
  const histogramData = useMemo(() => {
    if (distributionValues.length === 0) {
      return { bins: [], mean: 0, median: 0, min: 0, max: 0 };
    }

    // Apply zoom filter if set
    let filteredValues = distributionValues;
    if (histogramZoomMin !== null || histogramZoomMax !== null) {
      filteredValues = distributionValues.filter(v => {
        if (histogramZoomMin !== null && v < histogramZoomMin) return false;
        if (histogramZoomMax !== null && v > histogramZoomMax) return false;
        return true;
      });
    }

    return calculateHistogram(filteredValues, histogramBins);
  }, [distributionValues, histogramBins, histogramZoomMin, histogramZoomMax]);

  // Get overall min/max for zoom reset
  const distributionMinMax = useMemo(() => {
    if (distributionValues.length === 0) {
      return { min: 0, max: 0 };
    }
    const sorted = [...distributionValues].sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }, [distributionValues]);

  // Set initial zoom level 1 (clicked once) when data first loads
  useEffect(() => {
    if (distributionValues.length > 0 && !initialZoomApplied.current) {
      const { min, max } = distributionMinMax;
      if (max > min) {
        // Zoom level 1: keep 75% of range, starting from left (0)
        const range = max - min;
        const newRange = range * 0.75;
        setHistogramZoomMin(min);
        setHistogramZoomMax(min + newRange);
        initialZoomApplied.current = true;
      }
    }
  }, [distributionValues.length, distributionMinMax]);

  // Set Pareto donors count to unique count when data loads
  useEffect(() => {
    if (allContributorsData.length > 0 && paretoDonorsCount === 0) {
      setParetoDonorsCount(uniqueContributorCount);
    }
  }, [allContributorsData.length, uniqueContributorCount, paretoDonorsCount]);

  // Zoom in (reduce range by 25%)
  const handleHistogramZoomIn = () => {
    const currentMin = histogramZoomMin ?? distributionMinMax.min;
    const currentMax = histogramZoomMax ?? distributionMinMax.max;
    const range = currentMax - currentMin;
    const newRange = range * 0.75; // Keep 75% of current range
    const center = (currentMin + currentMax) / 2;

    setHistogramZoomMin(center - newRange / 2);
    setHistogramZoomMax(center + newRange / 2);
  };

  // Zoom out (increase range by ~33%)
  const handleHistogramZoomOut = () => {
    const currentMin = histogramZoomMin ?? distributionMinMax.min;
    const currentMax = histogramZoomMax ?? distributionMinMax.max;
    const range = currentMax - currentMin;

    // Expand by 33% on each side
    const expansion = range * 0.33;
    const newMin = Math.max(distributionMinMax.min, currentMin - expansion);
    const newMax = Math.min(distributionMinMax.max, currentMax + expansion);

    // If we're back to full range, reset zoom
    if (newMin <= distributionMinMax.min && newMax >= distributionMinMax.max) {
      setHistogramZoomMin(null);
      setHistogramZoomMax(null);
    } else {
      setHistogramZoomMin(newMin);
      setHistogramZoomMax(newMax);
    }
  };

  // Pan left (move view to the left by 20% of current range)
  const handleHistogramPanLeft = () => {
    if (histogramZoomMin === null || histogramZoomMax === null) return;

    const range = histogramZoomMax - histogramZoomMin;
    const shift = range * 0.2;
    const newMin = Math.max(distributionMinMax.min, histogramZoomMin - shift);
    const shiftDiff = histogramZoomMin - newMin;

    setHistogramZoomMin(newMin);
    setHistogramZoomMax(histogramZoomMax - shiftDiff);
  };

  // Pan right (move view to the right by 20% of current range)
  const handleHistogramPanRight = () => {
    if (histogramZoomMin === null || histogramZoomMax === null) return;

    const range = histogramZoomMax - histogramZoomMin;
    const shift = range * 0.2;
    const newMax = Math.min(distributionMinMax.max, histogramZoomMax + shift);
    const shiftDiff = newMax - histogramZoomMax;

    setHistogramZoomMin(histogramZoomMin + shiftDiff);
    setHistogramZoomMax(newMax);
  };

  // Reset zoom
  const handleHistogramZoomReset = () => {
    setHistogramZoomMin(null);
    setHistogramZoomMax(null);
  };

  // Box plot zoom handlers (mirror histogram behavior)
  // Box plot removed: zoom handlers removed

  // Calculate quartiles for box plot
  // Box plot removed: quartiles calculation removed

  // Calculate Pareto data (use configurable number of contributors)
  const paretoData = useMemo(() => {
    if (!allContributorsData || allContributorsData.length === 0) {
      return [];
    }
    return calculatePareto(allContributorsData.slice(0, paretoDonorsCount));
  }, [allContributorsData, paretoDonorsCount]);

  // Calculate range distribution
  const rangeDistributionData = useMemo(() => {
    if (distributionValues.length === 0) {
      return [];
    }
    return calculateRangeDistribution(distributionValues);
  }, [distributionValues]);



  // Handle removing a single column (now hides instead of removing)
  const handleRemoveColumn = (colToRemove: string) => {
    setHiddenValueColumns(prev => new Set(prev).add(colToRemove));
  };

  // Toggle column visibility (click on chip)
  const handleToggleColumnVisibility = useCallback((col: string) => {
    setHiddenValueColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(col)) {
        newSet.delete(col);
      } else {
        newSet.add(col);
      }
      return newSet;
    });
  }, []);

  // Handle drag-end for reordering columns
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedValueColumns || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedValueColumns(items);
  }, [selectedValueColumns]);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No data available for dashboard
        </Typography>
      </Box>
    );
  }

  // Show loading state while deferring rendering (allows Dialog to render smoothly first)
  if (!readyToRender) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // Note: NOT using useMemo here to avoid changing the hook order
  // The computation is simple enough that memoization isn't critical
  const hasTimeSeriesData = multiSeriesTimeData[periodType] && multiSeriesTimeData[periodType].length > 0;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Data Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Showing {analysis.metadata.filteredRows} rows
            {analysis.metadata.dateRange && (
              <> from {formatDateGerman(analysis.metadata.dateRange.start)} to {formatDateGerman(analysis.metadata.dateRange.end)}</>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Date column selector */}
          {!useFilenameDates && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Date Column</InputLabel>
              <Select
                value={selectedDateColumn || ''}
                label="Date Column"
                onChange={(e) => setSelectedDateColumn(e.target.value || null)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {availableDateColumns.map((col) => (
                  <MenuItem key={col} value={col}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ flex: 1 }}>
                        {columnMapping[col] || col}
                      </Typography>
                      {availableDateColumns.length > 0 && !availableDateColumns.includes(col) && (
                        <Chip
                          label="Not date"
                          size="small"
                          variant="outlined"
                          color="warning"
                          sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { fontSize: '0.65rem' } }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={anonymizeNames}
                onChange={(e) => setAnonymizeNames(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">Anonymize names</Typography>}
          />
        </Box>
      </Box>

      {/* Column Selectors */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
          Configure Dashboard Charts
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {hasFilenameDates && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={useFilenameDates}
                  onChange={(e) => {
                    setUseFilenameDates(e.target.checked);
                    setUserToggledFilenameDates(true);
                  }}
                  size="small"
                />
              }
              label="Use filename dates (YYYYMMDD)"
            />
          )}
        </Box>

        {/* Selected columns as chips with drag-drop and toggle */}
        {(selectedValueColumns || []).length > 0 && (
          <Box sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
            border: '1px dashed',
            borderColor: 'divider',
          }}>
            <Typography variant="caption" sx={{ width: '100%', mb: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Data Series (drag to reorder • click to toggle • X to hide)
            </Typography>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="columns" direction="horizontal">
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1.5,
                      alignItems: 'center',
                    }}
                  >
                    {(selectedValueColumns || []).map((col, index) => {
                      const isHidden = hiddenValueColumns.has(col);
                      const color = colorOverrides[col] || CHART_COLORS[index % CHART_COLORS.length];
                      return (
                        <Draggable key={col} draggableId={col} index={index}>
                          {(provided) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                opacity: isHidden ? 0.4 : 1,
                                transition: 'opacity 0.2s',
                              }}
                            >
                              <Box
                                {...provided.dragHandleProps}
                                sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
                              >
                                <DragHandleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              </Box>
                              <input
                                type="color"
                                value={color}
                                onChange={(e) => setColorOverrides(prev => ({ ...prev, [col]: e.target.value }))}
                                style={{ width: 20, height: 20, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                              />
                              <Chip
                                label={columnMapping[col] || col}
                                onClick={() => handleToggleColumnVisibility(col)}
                                onDelete={() => handleRemoveColumn(col)}
                                size="small"
                                sx={{
                                  bgcolor: isHidden ? 'grey.200' : color + '15',
                                  border: `1px solid ${isHidden ? 'grey.400' : color + '40'}`,
                                  color: isHidden ? 'text.secondary' : color,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  '&:hover': {
                                    bgcolor: isHidden ? 'grey.300' : color + '25',
                                  },
                                  '& .MuiChip-deleteIcon': {
                                    color: isHidden ? 'text.secondary' : color,
                                    opacity: 0.7,
                                    '&:hover': {
                                      color: isHidden ? 'text.primary' : color,
                                      opacity: 1,
                                    },
                                  },
                                }}
                                deleteIcon={<Close fontSize="small" />}
                              />
                            </Box>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
        )}

        {availableNumericColumns.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No numeric columns detected. Make sure your data contains numeric values.
          </Alert>
        )}
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Layout controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">Row height</Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select value={rowHeight} onChange={(e) => setRowHeight(Number(e.target.value))}>
              {[30, 40, 50, 60, 70, 80].map(v => (
                <MenuItem key={v} value={v}>{v}px</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={handleResetLayout}
        >
          Reset Layout
        </Button>
      </Box>

      {/* Charts Section with GridLayout */}
      <GridLayout
        className="layout"
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS_BREAKPOINTS}
        rowHeight={rowHeight}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={(bp) => {
          console.log('[DashboardView] Breakpoint changed to:', bp);
          setCurrentBreakpoint(bp as any);
        }}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        compactType="vertical"
        preventCollision={false}
        measureBeforeMount={false} // IMPORTANT: Disable to prevent layout recalc when dialog opens
        isDraggable={true}
        isResizable={true}
      >
        {/* Trend Chart */}
        <Paper key="trend-chart" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6">
                {hasTimeSeriesData ? 'Trend Over Time' : 'Trend Analysis'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }} onMouseDown={(e) => e.stopPropagation()}>
              <IconButton
                size="small"
                onClick={(e) => downloadChartAsImage('trend-chart', 'png', e as any)}
                onTouchEnd={(e) => downloadChartAsImage('trend-chart', 'png', e as any)}
                title="Download as PNG"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <Download fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => downloadChartAsImage('trend-chart', 'jpg', e as any)}
                onTouchEnd={(e) => downloadChartAsImage('trend-chart', 'jpg', e as any)}
                title="Download as JPG"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <Download fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('trend-chart', 2)} title="Taller (increase height)">
                <UnfoldMore fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('trend-chart', -2)} title="Shorter (decrease height)">
                <UnfoldLess fontSize="small" />
              </IconButton>
            </Box>
            {hasTimeSeriesData && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} onMouseDown={(e) => e.stopPropagation()}>
                <Box sx={{ minWidth: 120 }} onClick={(e) => e.stopPropagation()}>
                  <Typography variant="caption" sx={{ mb: 0.5, ml: 1.5, color: 'text.secondary' }}>
                    Period
                  </Typography>
                  <select
                    value={periodType}
                    onChange={(e) => {
                      e.stopPropagation();
                      setPeriodType(e.target.value as PeriodType);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      minWidth: 120,
                      height: 44,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      backgroundColor: 'var(--mui-palette-background-paper, #fff)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                    }}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </Box>
                <ToggleButtonGroup
                  value={chartType}
                  exclusive
                  onChange={(e, value) => {
                    e?.stopPropagation();
                    if (value) setChartType(value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    '& .MuiToggleButton-root': {
                      minWidth: 44,
                      minHeight: 44,
                      padding: '8px 12px',
                      WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)',
                      touchAction: 'manipulation',
                    },
                  }}
                >
                  <ToggleButton value="line" title="Line Chart">
                    <ShowChart />
                  </ToggleButton>
                  <ToggleButton value="area" title="Area Chart">
                    <AreaChartIcon />
                  </ToggleButton>
                  <ToggleButton value="stacked" title="Stacked Area">
                    <StackedLineChart />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
          </Box>
          <Box sx={{ flex: 1, minHeight: 200, overflow: 'hidden' }} data-chart-id="trend-chart">
            {hasTimeSeriesData && (selectedValueColumns || []).length > 0 ? (
              <Box sx={{ height: '100%', width: '100%', display: 'flex' }}>
                <TrendChart
                  data={multiSeriesTimeData[periodType]}
                  series={seriesConfig}
                  periodType={periodType}
                  type={chartType}
                />
              </Box>
            ) : (
              <Box sx={{ py: 8, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {(selectedValueColumns || []).length === 0
                    ? 'Select value columns above to see trend analysis.'
                    : !useFilenameDates && !selectedDateColumn
                      ? 'Enable "Use filename dates" or select a date column above.'
                      : 'No trend data available for the selected columns.'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Top Contributors Chart - Hidden when only 1 unique contributor (can't analyze "top" with single item) */}
        {topContributorsData.length > 0 && (
          <Paper key="top-contributors" sx={{ p: 0, height: '100%', display: uniqueContributorValue > 1 ? 'flex' : 'none', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <BarChart color="primary" />
                <Typography variant="h6">Top Contributors</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }} onMouseDown={(e) => e.stopPropagation()}>
                <IconButton
                  size="small"
                  onMouseDown={(e) => downloadChartAsImage('top-contributors', 'png', e as any)}
                  title="Download as PNG"
                >
                  <Download fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onMouseDown={(e) => downloadChartAsImage('top-contributors', 'jpg', e as any)}
                  title="Download as JPG"
                >
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('top-contributors', 2)} title="Taller (increase height)">
                  <UnfoldMore fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('top-contributors', -2)} title="Shorter (decrease height)">
                  <UnfoldLess fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setTopDonorsCount(prev => Math.max(5, prev - 5))}
                  disabled={topDonorsCount <= 5}
                  title="Show fewer"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
                  {topDonorsCount} donors
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setTopDonorsCount(prev => Math.min(allContributorsData.length, prev + 5))}
                  disabled={topDonorsCount >= allContributorsData.length}
                  title="Show more"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 200, overflow: 'hidden' }}>
              <TopDonorsChart
                data={topContributorsData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
                limit={topDonorsCount}
                anonymize={anonymizeNames}
              />
            </Box>
          </Paper>
        )}

        {/* Statistics Table */}
        <Paper key="statistics-table" sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', gap: 1, p: 2, mb: 2 }}>
            <TableChart color="primary" />
            <Typography variant="h6">Descriptive Statistics</Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('statistics-table', 2)} title="Taller (increase height)">
                <UnfoldMore fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('statistics-table', -2)} title="Shorter (decrease height)">
                <UnfoldLess fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, minHeight: 200, overflow: 'auto', width: '100%' }}>
            <StatisticsTable statistics={analysis.numericColumns} />
          </Box>
        </Paper>

        {/* Distribution Histogram - Hidden when only 1 unique contributor (not meaningful for single data point) */}
        {(selectedValueColumns || []).length > 0 && (
          <Paper key="histogram" sx={{ p: 0, height: '100%', display: uniqueContributorValue > 1 ? 'flex' : 'none', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1">
                Distribution Histogram
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }} onMouseDown={(e) => e.stopPropagation()}>
                <IconButton
                  size="small"
                  onMouseDown={(e) => downloadChartAsImage('histogram', 'png', e as any)}
                  title="Download as PNG"
                >
                  <Download fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onMouseDown={(e) => downloadChartAsImage('histogram', 'jpg', e as any)}
                  title="Download as JPG"
                >
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setHistogramBins(prev => Math.max(10, prev - 10))} disabled={histogramBins <= 10} title="Fewer bins">
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 45, textAlign: 'center' }}>
                  {histogramBins} bins
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setHistogramBins(prev => Math.min(200, prev + 10))}
                  disabled={histogramBins >= 200}
                  title="More bins"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('histogram', 2)} title="Taller (increase height)">
                  <UnfoldMore fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('histogram', -2)} title="Shorter (decrease height)">
                  <UnfoldLess fontSize="small" />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <IconButton
                  size="small"
                  onClick={handleHistogramZoomOut}
                  disabled={histogramZoomMin === null && histogramZoomMax === null}
                  title="Zoom out"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleHistogramZoomIn}
                  disabled={distributionValues.length === 0}
                  title="Zoom in"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                {(histogramZoomMin !== null || histogramZoomMax !== null) && (
                  <>
                    <IconButton
                      size="small"
                      onClick={handleHistogramPanLeft}
                      disabled={histogramZoomMin !== null && histogramZoomMin <= distributionMinMax.min}
                      title="Pan left"
                    >
                      {'<'}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleHistogramPanRight}
                      disabled={histogramZoomMax !== null && histogramZoomMax >= distributionMinMax.max}
                      title="Pan right"
                    >
                      {'>'}
                    </IconButton>
                    <Button
                      size="small"
                      onClick={handleHistogramZoomReset}
                      sx={{ ml: 0.5 }}
                    >
                      Reset
                    </Button>
                  </>
                )}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 200, overflow: 'auto', width: '100%' }}>
              <DistributionHistogram
                data={histogramData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
              />
              {(histogramZoomMin !== null || histogramZoomMax !== null) && (
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                  Zoomed: {formatCurrencyGerman(histogramZoomMin ?? distributionMinMax.min)} - {formatCurrencyGerman(histogramZoomMax ?? distributionMinMax.max)}
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        {/* Box Plot removed */}

        {/* Pareto Chart - Hidden when only 1 unique contributor (can't show 80/20 rule with one contributor) */}
        {(selectedValueColumns || []).length > 0 && paretoData.length > 0 && (
          <Paper key="pareto" sx={{ p: 0, height: '100%', display: uniqueContributorValue > 1 ? 'flex' : 'none', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1 }}>
              <Typography variant="subtitle1">
                Pareto Analysis (80/20 Rule)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }} onMouseDown={(e) => e.stopPropagation()}>
                <IconButton
                  size="small"
                  onMouseDown={(e) => downloadChartAsImage('pareto', 'png', e as any)}
                  title="Download as PNG"
                >
                  <Download fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onMouseDown={(e) => downloadChartAsImage('pareto', 'jpg', e as any)}
                  title="Download as JPG"
                >
                  <Download fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('pareto', 2)} title="Taller (increase height)">
                  <UnfoldMore fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleAdjustWidgetHeight('pareto', -2)} title="Shorter (decrease height)">
                  <UnfoldLess fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setParetoDonorsCount(prev => Math.max(5, prev - 5))} disabled={paretoDonorsCount <= 5} title="Show fewer"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center' }}>
                  {paretoDonorsCount >= allContributorsData.length ? `All ${allContributorsData.length}` : `${paretoDonorsCount} donors`}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setParetoDonorsCount(prev => Math.min(allContributorsData.length, prev + 5))}
                  disabled={paretoDonorsCount >= allContributorsData.length}
                  title="Show more"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 200, overflow: 'auto', width: '100%' }}>
              <ParetoChart
                data={paretoData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
                showTop={paretoDonorsCount}
                anonymize={anonymizeNames}
              />
            </Box>
          </Paper>
        )}

        {/* Range Distribution - Hidden when only 1 unique contributor (no range variation with single item) */}
        {(selectedValueColumns || []).length > 0 && rangeDistributionData.length > 0 && (
          <Paper key="range-distribution" sx={{ p: 0, height: '100%', display: uniqueContributorValue > 1 ? 'flex' : 'none', flexDirection: 'column' }}>
            <Box className="drag-handle" sx={{ cursor: 'move', display: 'flex', alignItems: 'center', gap: 1, p: 2, pb: 1 }}>
              <PieChartIcon color="primary" />
              <Typography variant="h6">Range Distribution</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }} onMouseDown={(e) => e.stopPropagation()}>
              <IconButton
                size="small"
                onMouseDown={(e) => downloadChartAsImage('range-distribution', 'png', e as any)}
                title="Download as PNG"
              >
                <Download fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onMouseDown={(e) => downloadChartAsImage('range-distribution', 'jpg', e as any)}
                title="Download as JPG"
              >
                <Download fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('range-distribution', 2)} title="Taller (increase height)">
                <UnfoldMore fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleAdjustWidgetHeight('range-distribution', -2)} title="Shorter (decrease height)">
                <UnfoldLess fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minHeight: 200, overflow: 'auto', width: '100%' }}>
              <RangeDistributionCharts
                data={rangeDistributionData}
                valueLabel={seriesConfig[0]?.label || 'Value'}
              />
            </Box>
          </Paper>
        )}
      </GridLayout>
    </Box>
  );
};

/**
 * Aggregate multiple value columns by time
 */
function aggregateByTimeMultiple(
  data: any[],
  dateColumn: string,
  valueColumns: string[]
): { weekly: any[]; monthly: any[]; quarterly: any[]; yearly: any[] } {
  const weeklyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const monthlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const quarterlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const yearlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();

  // Helper to parse date
  const parseDateValue = (value: any): Date | null => {
    if (value instanceof Date) return value;
    if (typeof value !== 'string') return null;
    const strValue = value.trim();

    // Try to find YYYYMMDD pattern (handles "20250105", "2025-01-05", "20250105_data.csv")
    const patternMatch = strValue.match(/(\d{4})(\d{2})(\d{2})/);
    if (patternMatch) {
      const year = parseInt(patternMatch[1], 10);
      const month = parseInt(patternMatch[2], 10) - 1;
      const day = parseInt(patternMatch[3], 10);
      return new Date(year, month, day);
    }

    // Check for YYYY-MM-DD pattern
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
      return new Date(strValue);
    }
    // Check for DD.MM.YYYY pattern (German format)
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(strValue)) {
      const parts = strValue.split('.');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    // Check for MM/DD/YYYY pattern
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
      const parts = strValue.split('/');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  };

  // Helper to get ISO week info (week-year, week number, week start Monday)
  const getISOWeekInfo = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = (date.getUTCDay() + 6) % 7; // Monday=0
    // Thursday in current week decides the year
    date.setUTCDate(date.getUTCDate() - day + 3);
    const weekYear = date.getUTCFullYear();
    // Week 1 is the week with Jan 4th
    const jan4 = new Date(Date.UTC(weekYear, 0, 4));
    const jan4Day = (jan4.getUTCDay() + 6) % 7;
    const week1Start = new Date(jan4);
    week1Start.setUTCDate(jan4.getUTCDate() - jan4Day);
    const weekNo = 1 + Math.round((date.getTime() - week1Start.getTime()) / 604800000);
    // Compute Monday of this week (based on original date)
    const monday = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const monOffset = (monday.getUTCDay() + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - monOffset);
    return { weekYear, weekNo, monday };
  };

  // Helper to extract date from filename (YYYYMMDD pattern)
  const extractDateFromFilename = (filename: string): Date | null => {
    if (!filename) return null;

    // Try to match exactly 8 digits (YYYYMMDD format)
    const exactMatch = filename.match(/\b\d{8}\b/);
    if (exactMatch) {
      const dateStr = exactMatch[0];
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      const day = parseInt(dateStr.substring(6, 8), 10);
      return new Date(year, month, day);
    }

    // Try to find YYYYMMDD pattern anywhere in filename (e.g., "data-20250105.csv")
    const patternMatch = filename.match(/(\d{4})(\d{2})(\d{2})/);
    if (patternMatch) {
      const year = parseInt(patternMatch[1], 10);
      const month = parseInt(patternMatch[2], 10) - 1;
      const day = parseInt(patternMatch[3], 10);
      return new Date(year, month, day);
    }

    return null;
  };

  data.forEach(row => {
    // Handle _sourceFileName column specially - extract date from filename
    let date: Date | null = null;
    if (dateColumn === '_sourceFileName') {
      date = extractDateFromFilename(row._sourceFileName);
    } else {
      date = parseDateValue(row[dateColumn]);
    }

    if (!date) return;

    // Get all values for this row
    const rowValues: Record<string, number> = {};
    valueColumns.forEach(col => {
      rowValues[col] = parseFloat(row[col]) || 0;
    });

    // Weekly (ISO week)
    const { weekYear, weekNo, monday } = getISOWeekInfo(date);
    const weeklyKey = `${weekYear}-W${String(weekNo).padStart(2, '0')}`;
    const weeklyDate = new Date(monday);
    if (!weeklyAggregated.has(weeklyKey)) {
      weeklyAggregated.set(weeklyKey, {
        date: weeklyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0,
        // Track the latest actual source date seen within this week for labeling
        latest: date,
      } as any);
    }
    const weeklyEntry: any = weeklyAggregated.get(weeklyKey)!;
    valueColumns.forEach(col => { weeklyEntry.values[col] += rowValues[col]; });
    weeklyEntry.count += 1;
    // Update latest source date for this week
    if (!weeklyEntry.latest || (date && date.getTime() > weeklyEntry.latest.getTime())) {
      weeklyEntry.latest = date;
    }

    // Monthly
    const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthlyDate = new Date(date.getFullYear(), date.getMonth(), 1);
    if (!monthlyAggregated.has(monthlyKey)) {
      monthlyAggregated.set(monthlyKey, {
        date: monthlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0
      });
    }
    const monthlyEntry = monthlyAggregated.get(monthlyKey)!;
    valueColumns.forEach(col => { monthlyEntry.values[col] += rowValues[col]; });
    monthlyEntry.count += 1;

    // Quarterly
    const quarter = Math.floor(date.getMonth() / 3);
    const quarterlyKey = `${date.getFullYear()}-Q${quarter + 1}`;
    const quarterlyDate = new Date(date.getFullYear(), quarter * 3, 1);
    if (!quarterlyAggregated.has(quarterlyKey)) {
      quarterlyAggregated.set(quarterlyKey, {
        date: quarterlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0
      });
    }
    const quarterlyEntry = quarterlyAggregated.get(quarterlyKey)!;
    valueColumns.forEach(col => { quarterlyEntry.values[col] += rowValues[col]; });
    quarterlyEntry.count += 1;

    // Yearly
    const yearlyKey = `${date.getFullYear()}`;
    const yearlyDate = new Date(date.getFullYear(), 0, 1);
    if (!yearlyAggregated.has(yearlyKey)) {
      yearlyAggregated.set(yearlyKey, {
        date: yearlyDate,
        values: Object.fromEntries(valueColumns.map(c => [c, 0])),
        count: 0
      });
    }
    const yearlyEntry = yearlyAggregated.get(yearlyKey)!;
    valueColumns.forEach(col => { yearlyEntry.values[col] += rowValues[col]; });
    yearlyEntry.count += 1;
  });

  // Convert to arrays and sort by date
  const sortByDate = (
    map: Map<string, { date: Date; values: Record<string, number>; count: number }>,
    labelFormatter?: (key: string, d: { date: Date }) => string
  ) =>
    Array.from(map.entries())
      .map(([key, d]) => ({
        period: labelFormatter ? labelFormatter(key, d as any) : key,
        count: d.count,
        date: d.date,
        ...d.values,
      }))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  const fmtMonthDay = (dt: Date) => {
    try {
      const m = dt.toLocaleString('en-US', { month: 'short' });
      const day = String(dt.getDate()).padStart(2, '0');
      return `${m} ${day}`;
    } catch {
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    }
  };

  return {
    weekly: sortByDate(weeklyAggregated, (key, d) => `${key}\n(${fmtMonthDay(((d as any).latest as Date) || d.date)})`),
    monthly: sortByDate(monthlyAggregated),
    quarterly: sortByDate(quarterlyAggregated),
    yearly: sortByDate(yearlyAggregated),
  };
}

/**
 * Aggregate multiple value columns by extracting dates from filenames (YYYYMMDD format)
 */
function aggregateByFilenameDateMultiple(
  data: any[],
  valueColumns: string[]
): { weekly: any[]; monthly: any[]; quarterly: any[]; yearly: any[] } {
  const weeklyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const monthlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const quarterlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();
  const yearlyAggregated = new Map<string, { date: Date; values: Record<string, number>; count: number }>();

  data.forEach(row => {
    const fileName = row._sourceFileName || '';
    const match = fileName.match(FILENAME_DATE_PATTERN);

    if (match) {
      const dateStr = match[1];
      const yearNum = parseInt(dateStr.substring(0, 4), 10);
      const monthNum = parseInt(dateStr.substring(4, 6), 10) - 1;
      const dayNum = parseInt(dateStr.substring(6, 8), 10);

      // Get all values for this row
      const rowValues: Record<string, number> = {};
      valueColumns.forEach(col => {
        rowValues[col] = parseFloat(row[col]) || 0;
      });

      // Weekly (ISO)
      const baseDate = new Date(yearNum, monthNum, dayNum || 1);
      const dUTC = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
      const day = (dUTC.getUTCDay() + 6) % 7;
      dUTC.setUTCDate(dUTC.getUTCDate() - day + 3);
      const weekYear = dUTC.getUTCFullYear();
      const jan4 = new Date(Date.UTC(weekYear, 0, 4));
      const jan4Day = (jan4.getUTCDay() + 6) % 7;
      const week1Start = new Date(jan4);
      week1Start.setUTCDate(jan4.getUTCDate() - jan4Day);
      const weekNo = 1 + Math.round((dUTC.getTime() - week1Start.getTime()) / 604800000);
      const monday = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
      const monOffset = (monday.getUTCDay() + 6) % 7;
      monday.setUTCDate(monday.getUTCDate() - monOffset);
      const weeklyKey = `${weekYear}-W${String(weekNo).padStart(2, '0')}`;
      if (!weeklyAggregated.has(weeklyKey)) {
        weeklyAggregated.set(weeklyKey, {
          date: new Date(monday),
          values: Object.fromEntries(valueColumns.map(c => [c, 0])),
          count: 0,
          latest: baseDate,
        } as any);
      }
      const wEntry: any = weeklyAggregated.get(weeklyKey)!;
      valueColumns.forEach(col => { wEntry.values[col] += rowValues[col]; });
      wEntry.count += 1;
      if (!wEntry.latest || baseDate.getTime() > wEntry.latest.getTime()) {
        wEntry.latest = baseDate;
      }

      // Monthly
      const monthlyKey = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}`;
      const monthlyDate = new Date(yearNum, monthNum, 1);
      if (!monthlyAggregated.has(monthlyKey)) {
        monthlyAggregated.set(monthlyKey, {
          date: monthlyDate,
          values: Object.fromEntries(valueColumns.map(c => [c, 0])),
          count: 0
        });
      }
      const monthlyEntry = monthlyAggregated.get(monthlyKey)!;
      valueColumns.forEach(col => { monthlyEntry.values[col] += rowValues[col]; });
      monthlyEntry.count += 1;

      // Quarterly
      const quarter = Math.floor(monthNum / 3);
      const quarterlyKey = `${yearNum}-Q${quarter + 1}`;
      const quarterlyDate = new Date(yearNum, quarter * 3, 1);
      if (!quarterlyAggregated.has(quarterlyKey)) {
        quarterlyAggregated.set(quarterlyKey, {
          date: quarterlyDate,
          values: Object.fromEntries(valueColumns.map(c => [c, 0])),
          count: 0
        });
      }
      const quarterlyEntry = quarterlyAggregated.get(quarterlyKey)!;
      valueColumns.forEach(col => { quarterlyEntry.values[col] += rowValues[col]; });
      quarterlyEntry.count += 1;

      // Yearly
      const yearlyKey = `${yearNum}`;
      const yearlyDate = new Date(yearNum, 0, 1);
      if (!yearlyAggregated.has(yearlyKey)) {
        yearlyAggregated.set(yearlyKey, {
          date: yearlyDate,
          values: Object.fromEntries(valueColumns.map(c => [c, 0])),
          count: 0
        });
      }
      const yearlyEntry = yearlyAggregated.get(yearlyKey)!;
      valueColumns.forEach(col => { yearlyEntry.values[col] += rowValues[col]; });
      yearlyEntry.count += 1;
    }
  });

  // Convert to arrays and sort by date
  const sortByDate = (
    map: Map<string, { date: Date; values: Record<string, number>; count: number }>,
    labelFormatter?: (key: string, d: { date: Date }) => string
  ) =>
    Array.from(map.entries())
      .map(([key, d]) => ({
        period: labelFormatter ? labelFormatter(key, d as any) : key,
        count: d.count,
        date: d.date,
        ...d.values,
      }))
      .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

  const fmtMonthDay = (dt: Date) => {
    try {
      const m = dt.toLocaleString('en-US', { month: 'short' });
      const day = String(dt.getDate()).padStart(2, '0');
      return `${m} ${day}`;
    } catch {
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    }
  };

  return {
    weekly: sortByDate(weeklyAggregated, (key, d) => `${key}\n(${fmtMonthDay(((d as any).latest as Date) || d.date)})`),
    monthly: sortByDate(monthlyAggregated),
    quarterly: sortByDate(quarterlyAggregated),
    yearly: sortByDate(yearlyAggregated),
  };
}

// Memoize DashboardView to prevent unnecessary re-renders when parent components update
const MemoizedDashboardView = React.memo(DashboardView, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.columnMapping === nextProps.columnMapping &&
    prevProps.nameColumn === nextProps.nameColumn
  );
});

MemoizedDashboardView.displayName = 'DashboardView';

export default MemoizedDashboardView;