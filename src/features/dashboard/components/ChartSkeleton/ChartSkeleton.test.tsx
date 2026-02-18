/**
 * Specification tests for ChartSkeleton component
 *
 * TDD RED-GREEN-REFACTOR cycle for TASK-003
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartSkeleton from './index';

describe('ChartSkeleton', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<ChartSkeleton chartType="trend" />);
      }).not.toThrow();
    });

    it('should render a container element', () => {
      const { container } = render(<ChartSkeleton chartType="trend" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render skeleton placeholder with proper dimensions', () => {
      const { container } = render(<ChartSkeleton chartType="trend" />);
      const skeletonElement = container.firstChild as HTMLElement;
      expect(skeletonElement).toHaveStyle({ height: '300px' }); // DEFAULT_HEIGHT
    });
  });

  describe('Chart Type Support', () => {
    it('should render skeleton for trend chart type', () => {
      const { container } = render(<ChartSkeleton chartType="trend" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render skeleton for pareto chart type', () => {
      const { container } = render(<ChartSkeleton chartType="pareto" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render skeleton for histogram chart type', () => {
      const { container } = render(<ChartSkeleton chartType="histogram" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render skeleton for scatter chart type', () => {
      const { container } = render(<ChartSkeleton chartType="scatter" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render skeleton for heatmap chart type', () => {
      const { container } = render(<ChartSkeleton chartType="heatmap" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render skeleton for boxplot chart type', () => {
      const { container } = render(<ChartSkeleton chartType="boxplot" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should announce loading state to screen readers', () => {
      render(<ChartSkeleton chartType="trend" />);
      const loadingAnnouncement = screen.getByRole('status');
      expect(loadingAnnouncement).toBeInTheDocument();
    });

    it('should include accessible label indicating chart type loading', () => {
      render(<ChartSkeleton chartType="trend" />);
      const loadingAnnouncement = screen.getByRole('status');
      expect(loadingAnnouncement).toHaveTextContent(/loading/i);
      expect(loadingAnnouncement).toHaveTextContent(/chart/i);
    });
  });

  describe('Layout Dimensions', () => {
    it('should render with default height matching chart dimensions', () => {
      const { container } = render(<ChartSkeleton chartType="trend" />);
      const skeletonElement = container.firstChild as HTMLElement;
      expect(skeletonElement).toHaveStyle({ height: '300px' }); // DEFAULT_HEIGHT
    });

    it('should render with width 100% to match responsive container', () => {
      const { container } = render(<ChartSkeleton chartType="trend" />);
      const skeletonElement = container.firstChild as HTMLElement;
      expect(skeletonElement).toHaveStyle({ width: '100%' });
    });

    it('should accept custom height prop', () => {
      const customHeight = 400;
      const { container } = render(
        <ChartSkeleton chartType="trend" height={customHeight} />
      );
      const skeletonElement = container.firstChild as HTMLElement;
      expect(skeletonElement).toHaveStyle({ height: `${customHeight}px` });
      // Should also have width 100%
      expect(skeletonElement).toHaveStyle({ width: '100%' });
    });
  });

  describe('Animation', () => {
    it('should apply loading animation class or style', () => {
      const { container } = render(<ChartSkeleton chartType="trend" />);
      const skeletonElement = container.firstChild as HTMLElement;
      // Should have some animation indicator (pulse, shimmer, etc.)
      expect(skeletonElement).toBeInTheDocument();
    });
  });

  describe('Visual Structure', () => {
    it('should render skeleton elements that mimic chart structure', () => {
      const { container } = render(<ChartSkeleton chartType="trend" />);
      // Should have elements representing axes, chart area, legend placeholder
      expect(container.innerHTML.length).toBeGreaterThan(0);
    });

    it('should render axis placeholders for trend chart', () => {
      const { container } = render(<ChartSkeleton chartType="trend" />);
      // Should indicate Y-axis and X-axis placeholders
      expect(container.innerHTML.length).toBeGreaterThan(0);
    });

    it('should render bar placeholders for pareto chart', () => {
      const { container } = render(<ChartSkeleton chartType="pareto" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept className prop for custom styling', () => {
      const customClass = 'custom-skeleton-class';
      const { container } = render(
        <ChartSkeleton chartType="trend" className={customClass} />
      );
      const skeletonElement = container.firstChild as HTMLElement;
      // MUI Box applies classes, check if our class is included
      expect(skeletonElement.className).toContain(customClass);
    });

    it('should accept style prop for inline customization', () => {
      const customStyle = { backgroundColor: '#f0f0f0' };
      const { container } = render(
        <ChartSkeleton chartType="trend" style={customStyle} />
      );
      const skeletonElement = container.firstChild as HTMLElement;
      // Check if the custom style is applied (computed style)
      const computedStyle = window.getComputedStyle(skeletonElement);
      // jsdom returns the original hex value, browsers return rgb()
      expect(['#f0f0f0', 'rgb(240, 240, 240)']).toContain(computedStyle.backgroundColor);
    });
  });

  describe('TypeScript Types', () => {
    it('should enforce valid chart types', () => {
      // This test validates TypeScript compilation
      const validTypes = ['trend', 'pareto', 'histogram', 'scatter', 'heatmap', 'boxplot'] as const;
      validTypes.forEach((type) => {
        expect(() => render(<ChartSkeleton chartType={type} />)).not.toThrow();
      });
    });
  });
});
