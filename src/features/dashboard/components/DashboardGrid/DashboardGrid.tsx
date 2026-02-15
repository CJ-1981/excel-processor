/**
 * DashboardGrid Component
 * Wrapper for react-grid-layout Responsive component
 */

import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import type { Layouts, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GridLayout = WidthProvider(Responsive);

export interface DashboardGridProps {
  layouts: Layouts;
  onLayoutChange: (currentLayout: Layout[], newLayouts: Layouts) => void;
  onBreakpointChange?: (breakpoint: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  rowHeight?: number;
  breakpoints?: Record<string, number>;
  cols?: Record<string, number>;
  margin?: [number, number];
  compactType?: 'vertical' | 'horizontal' | null;
  preventCollision?: boolean;
  measureBeforeMount?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

const DEFAULT_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const DEFAULT_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

const DashboardGrid: React.FC<DashboardGridProps> = ({
  layouts,
  onLayoutChange,
  onBreakpointChange,
  children,
  className,
  style,
  rowHeight = 50,
  breakpoints = DEFAULT_BREAKPOINTS,
  cols = DEFAULT_COLS,
  margin = [16, 16],
  compactType = 'vertical',
  preventCollision = false,
  measureBeforeMount = false,
  isDraggable = true,
  isResizable = true,
}) => {
  return (
    <GridLayout
      className={className}
      layouts={layouts}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={rowHeight}
      onLayoutChange={onLayoutChange}
      onBreakpointChange={onBreakpointChange}
      margin={margin}
      compactType={compactType}
      preventCollision={preventCollision}
      measureBeforeMount={measureBeforeMount}
      isDraggable={isDraggable}
      isResizable={isResizable}
      style={style}
    >
      {children}
    </GridLayout>
  );
};

export default DashboardGrid;
