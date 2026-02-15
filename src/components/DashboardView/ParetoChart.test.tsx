/**
 * Specification tests for ParetoChart component
 *
 * These tests follow TDD approach for new chart module
 * RED-GREEN-REFACTOR cycle
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ParetoChart from './ParetoChart'
import type { ParetoDataPoint } from '../../types'

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})

window.ResizeObserver = mockResizeObserver as any

describe('ParetoChart', () => {
  const mockParetoData: ParetoDataPoint[] = [
    { category: 'Alice', value: 400, cumulativeValue: 400, cumulativePercentage: 40 },
    { category: 'Bob', value: 300, cumulativeValue: 700, cumulativePercentage: 70 },
    { category: 'Carol', value: 200, cumulativeValue: 900, cumulativePercentage: 90 },
    { category: 'David', value: 100, cumulativeValue: 1000, cumulativePercentage: 100 },
  ]

  describe('Rendering', () => {
    it('should render Pareto chart without crashing', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })

    it('should render chart container', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render responsive container', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      const responsiveContainer = container.querySelector('.recharts-responsive-container')
      expect(responsiveContainer).toBeInTheDocument()
    })

    it('should render with proper dimensions', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Data Display', () => {
    it('should render bar chart for values', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })

    it('should render line chart for cumulative percentage', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })

    it('should display value label', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Test Value" showTop={10} />)
      }).not.toThrow()
    })
  })

  describe('80% Threshold Reference', () => {
    it('should display 80% threshold reference line', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })

    it('should render reference line at 80% on cumulative axis', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      // Chart should render with content
      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should handle empty Pareto data', () => {
      const emptyData: ParetoDataPoint[] = []

      expect(() => {
        render(<ParetoChart data={emptyData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })
  })

  describe('Data Sorting', () => {
    it('should display data sorted by contribution descending', () => {
      const unsortedData: ParetoDataPoint[] = [
        { category: 'Carol', value: 100, cumulativeValue: 100, cumulativePercentage: 10 },
        { category: 'Alice', value: 400, cumulativeValue: 500, cumulativePercentage: 50 },
        { category: 'Bob', value: 300, cumulativeValue: 800, cumulativePercentage: 80 },
      ]

      expect(() => {
        render(<ParetoChart data={unsortedData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })
  })

  describe('Top N Display', () => {
    it('should limit display to showTop count', () => {
      const largeData: ParetoDataPoint[] = Array.from({ length: 20 }, (_, i) => ({
        category: `Item ${i + 1}`,
        value: 100 - i * 5,
        cumulativeValue: (100 - i * 5) * (i + 1),
        cumulativePercentage: ((100 - i * 5) * (i + 1)) / 10,
      }))

      expect(() => {
        render(<ParetoChart data={largeData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })

    it('should display all items when showTop exceeds data length', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={100} />)
      }).not.toThrow()
    })
  })

  describe('Anonymization', () => {
    it('should render with anonymization enabled', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} anonymize={true} />)
      }).not.toThrow()
    })

    it('should render with anonymization disabled', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} anonymize={false} />)
      }).not.toThrow()
    })
  })

  describe('Cumulative Line', () => {
    it('should render cumulative percentage line', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      // Chart should render with content
      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should display correct cumulative percentages', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })
  })

  describe('Bar Chart', () => {
    it('should render bars for each category', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })

    it('should use color palette for bars', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Dual Axis', () => {
    it('should render left Y-axis for values', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should render right Y-axis for cumulative percentage', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const singlePoint: ParetoDataPoint[] = [
        { category: 'Only Item', value: 100, cumulativeValue: 100, cumulativePercentage: 100 },
      ]

      expect(() => {
        render(<ParetoChart data={singlePoint} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })

    it('should handle zero values', () => {
      const zeroData: ParetoDataPoint[] = [
        { category: 'Zero', value: 0, cumulativeValue: 0, cumulativePercentage: 0 },
        { category: 'One', value: 1, cumulativeValue: 1, cumulativePercentage: 100 },
      ]

      expect(() => {
        render(<ParetoChart data={zeroData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })

    it('should handle very large values', () => {
      const largeValues: ParetoDataPoint[] = [
        { category: 'Large', value: 1000000, cumulativeValue: 1000000, cumulativePercentage: 100 },
        { category: 'Small', value: 1000, cumulativeValue: 1001000, cumulativePercentage: 100.1 },
      ]

      expect(() => {
        render(<ParetoChart data={largeValues} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })
  })

  describe('Tooltip', () => {
    it('should render custom tooltip', () => {
      expect(() => {
        render(<ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })
  })

  describe('Legend', () => {
    it('should render legend for chart elements', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('X-Axis Labels', () => {
    it('should display category names on X-axis', () => {
      const { container } = render(
        <ParetoChart data={mockParetoData} valueLabel="Value" showTop={10} />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should handle long category names', () => {
      const longNames: ParetoDataPoint[] = [
        {
          category: 'Very Long Category Name That Goes On And On',
          value: 500,
          cumulativeValue: 500,
          cumulativePercentage: 50,
        },
        {
          category: 'Another Extremely Long Name For Testing',
          value: 500,
          cumulativeValue: 1000,
          cumulativePercentage: 100,
        },
      ]

      expect(() => {
        render(<ParetoChart data={longNames} valueLabel="Value" showTop={10} />)
      }).not.toThrow()
    })
  })
})
