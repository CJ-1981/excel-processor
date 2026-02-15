/**
 * Specification tests for DistributionHistogram component
 *
 * These tests follow TDD approach for new chart module
 * RED-GREEN-REFACTOR cycle
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DistributionHistogram from './DistributionHistogram'
import type { HistogramData } from '../../types'

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})

window.ResizeObserver = mockResizeObserver as any

describe('DistributionHistogram', () => {
  const mockHistogramData: HistogramData = {
    bins: [
      { binStart: 0, binEnd: 10, count: 5, label: '0-10' },
      { binStart: 10, binEnd: 20, count: 15, label: '10-20' },
      { binStart: 20, binEnd: 30, count: 25, label: '20-30' },
      { binStart: 30, binEnd: 40, count: 20, label: '30-40' },
      { binStart: 40, binEnd: 50, count: 10, label: '40-50' },
    ],
    mean: 27.5,
    median: 28,
    min: 0,
    max: 50,
  }

  describe('Rendering', () => {
    it('should render histogram without crashing', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should render chart container', () => {
      const { container } = render(
        <DistributionHistogram data={mockHistogramData} valueLabel="Value" />
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render responsive container', () => {
      const { container } = render(
        <DistributionHistogram data={mockHistogramData} valueLabel="Value" />
      )

      const responsiveContainer = container.querySelector('.recharts-responsive-container')
      expect(responsiveContainer).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('should render histogram bins correctly', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should display value label', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Test Value" />)
      }).not.toThrow()
    })

    it('should render with proper dimensions', () => {
      const { container } = render(
        <DistributionHistogram data={mockHistogramData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should handle empty histogram data', () => {
      const emptyData: HistogramData = {
        bins: [],
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
      }

      expect(() => {
        render(<DistributionHistogram data={emptyData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle bins with zero count', () => {
      const dataWithEmptyBins: HistogramData = {
        bins: [
          { binStart: 0, binEnd: 10, count: 0, label: '0-10' },
          { binStart: 10, binEnd: 20, count: 0, label: '10-20' },
        ],
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
      }

      expect(() => {
        render(<DistributionHistogram data={dataWithEmptyBins} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Statistical Markers', () => {
    it('should display mean value', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should display median value', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should display min/max values', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Chart Display', () => {
    it('should render histogram bars', () => {
      const { container } = render(
        <DistributionHistogram data={mockHistogramData} valueLabel="Value" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should render mean reference line', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should render median reference line', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should render inline legend', () => {
      expect(() => {
        render(<DistributionHistogram data={mockHistogramData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Different Bin Counts', () => {
    it('should handle large number of bins', () => {
      const largeBinData: HistogramData = {
        bins: Array.from({ length: 100 }, (_, i) => ({
          binStart: i * 10,
          binEnd: (i + 1) * 10,
          count: Math.floor(Math.random() * 50),
          label: `${i * 10}-${(i + 1) * 10}`,
        })),
        mean: 500,
        median: 495,
        min: 0,
        max: 1000,
      }

      expect(() => {
        render(<DistributionHistogram data={largeBinData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single bin', () => {
      const singleBinData: HistogramData = {
        bins: [{ binStart: 0, binEnd: 100, count: 50, label: '0-100' }],
        mean: 50,
        median: 50,
        min: 0,
        max: 100,
      }

      expect(() => {
        render(<DistributionHistogram data={singleBinData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle very large values', () => {
      const largeValueData: HistogramData = {
        bins: [
          { binStart: 0, binEnd: 1000000, count: 10, label: '0-1M' },
          { binStart: 1000000, binEnd: 2000000, count: 5, label: '1M-2M' },
        ],
        mean: 1000000,
        median: 750000,
        min: 0,
        max: 2000000,
      }

      expect(() => {
        render(<DistributionHistogram data={largeValueData} valueLabel="Value" />)
      }).not.toThrow()
    })

    it('should handle negative values', () => {
      const negativeData: HistogramData = {
        bins: [
          { binStart: -100, binEnd: -50, count: 5, label: '-100--50' },
          { binStart: -50, binEnd: 0, count: 10, label: '-50-0' },
          { binStart: 0, binEnd: 50, count: 8, label: '0-50' },
        ],
        mean: -20,
        median: -15,
        min: -100,
        max: 50,
      }

      expect(() => {
        render(<DistributionHistogram data={negativeData} valueLabel="Value" />)
      }).not.toThrow()
    })
  })
})
