/**
 * DashboardGrid Component
 * Wrapper for react-grid-layout v2 ResponsiveGridLayout
 */

import { useContainerWidth, ResponsiveGridLayout, getCompactor } from 'react-grid-layout';
import type { Layout, ResponsiveLayouts, Breakpoint } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export interface DashboardGridProps {
  layouts: ResponsiveLayouts<Breakpoint>;
  onLayoutChange: (currentLayout: Layout, layouts: ResponsiveLayouts<Breakpoint>) => void;
  onBreakpointChange?: (breakpoint: Breakpoint, cols: number) => void;
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
  // Use useContainerWidth to track container width
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount,
  });

  // Create compactor based on compactType and preventCollision
  const compactor = getCompactor(compactType, false, preventCollision);

  // Don't render until width is measured if measureBeforeMount is true
  if (measureBeforeMount && !mounted) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <ResponsiveGridLayout
        width={width}
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        compactor={compactor}
        dragConfig={{ enabled: isDraggable }}
        resizeConfig={{ enabled: isResizable }}
        onLayoutChange={onLayoutChange}
        onBreakpointChange={onBreakpointChange}
      >
        {children}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardGrid;
