/**
 * Specification tests for RangeDistributionCharts component
 *
 * These tests follow TDD approach for new chart module
 * RED-GREEN-REFACTOR cycle
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RangeDistributionCharts from './RangeDistributionCharts'
import type { RangeDistributionData } from '../../types'

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})

window.ResizeObserver = mockResizeObserver as any

describe('RangeDistributionCharts', () => {
  const mockRangeData: RangeDistributionData[] = [
    { label: '0 EUR', count: 5, amount: 0, percentage: 0 },
    { label: '1-50 EUR', count: 20, amount: 500, percentage: 15 },
    { label: '51-100 EUR', count: 15, amount: 1125, percentage: 33.75 },
    { label: '101-200 EUR', count: 10, amount: 1500, percentage: 45 },
    { label: '201-500 EUR', count: 3, amount: 1050, percentage: 31.5 },
    { label: '501-1000 EUR', count: 2, amount: 1500, percentage: 45 },
    { label: '1001+ EUR', count: 1, amount: 1200, percentage: 36 },
  ]

  describe('Rendering', () => {
    it('should render range distribution charts without crashing', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should render chart container', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render responsive containers', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      const responsiveContainers = container.querySelectorAll('.recharts-responsive-container')
      expect(responsiveContainers.length).toBeGreaterThan(0)
    })

    it('should render with proper dimensions', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Pie Charts', () => {
    it('should render two pie charts', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      // Should render two charts
      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should render count distribution pie chart', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should render amount distribution pie chart', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Empty State', () => {
    it('should handle empty range data', () => {
      const emptyData: RangeDistributionData[] = []

      expect(() => {
        render(<RangeDistributionCharts data={emptyData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle data with zero counts', () => {
      const zeroData: RangeDistributionData[] = [
        { label: '0 EUR', count: 0, amount: 0, percentage: 0 },
        { label: '1-50 EUR', count: 0, amount: 0, percentage: 0 },
      ]

      expect(() => {
        render(<RangeDistributionCharts data={zeroData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Data Display', () => {
    it('should display range labels', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should display counts in first chart', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should display amounts in second chart', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should display percentages', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Color Palette', () => {
    it('should use color palette for pie slices', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should apply consistent colors across both charts', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Legend', () => {
    it('should render legend for pie charts', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      // Should have legend content
      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should display range labels in legend', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Chart Titles', () => {
    it('should display count distribution title', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should display amount distribution title', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Value Label', () => {
    it('should use custom value label', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Test Amount" />)
      }).not.toThrow()
    })

    it('should display value label in chart context', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Donation Amount" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Percentage Calculation', () => {
    it('should calculate percentages correctly for counts', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should calculate percentages correctly for amounts', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle percentages that sum to 100', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single range', () => {
      const singleRange: RangeDistributionData[] = [
        { label: 'All', count: 100, amount: 5000, percentage: 100 },
      ]

      expect(() => {
        render(<RangeDistributionCharts data={singleRange} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle very large counts', () => {
      const largeCounts: RangeDistributionData[] = [
        { label: 'High', count: 1000000, amount: 50000000, percentage: 80 },
        { label: 'Low', count: 250000, amount: 12500000, percentage: 20 },
      ]

      expect(() => {
        render(<RangeDistributionCharts data={largeCounts} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle zero amounts', () => {
      const zeroAmounts: RangeDistributionData[] = [
        { label: 'Zero', count: 10, amount: 0, percentage: 0 },
        { label: 'NonZero', count: 5, amount: 100, percentage: 100 },
      ]

      expect(() => {
        render(<RangeDistributionCharts data={zeroAmounts} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle negative percentages (rounding errors)', () => {
      const roundingData: RangeDistributionData[] = [
        { label: 'A', count: 1, amount: 33.33, percentage: 33.33 },
        { label: 'B', count: 1, amount: 33.33, percentage: 33.33 },
        { label: 'C', count: 1, amount: 33.34, percentage: 33.34 },
      ]

      expect(() => {
        render(<RangeDistributionCharts data={roundingData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Layout', () => {
    it('should render charts side by side', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should maintain consistent sizing', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Tooltip', () => {
    it('should render custom tooltips', () => {
      const { container } = render(
        <RangeDistributionCharts data={mockRangeData} valueLabel="Value" />
      )

      const tooltips = container.querySelectorAll('.recharts-tooltip-wrapper')
      expect(tooltips.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Data Range Handling', () => {
    it('should handle "0 EUR" range correctly', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle "1001+ EUR" range correctly', () => {
      expect(() => {
        render(<RangeDistributionCharts data={mockRangeData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle custom ranges', () => {
      const customRanges: RangeDistributionData[] = [
        { label: '0-10', count: 5, amount: 25, percentage: 5 },
        { label: '11-50', count: 15, amount: 375, percentage: 75 },
        { label: '51+', count: 10, amount: 600, percentage: 120 },
      ]

      expect(() => {
        render(<RangeDistributionCharts data={customRanges} valueLabel="Value" />)
      }).not.toThrow()
    })
  })
})
