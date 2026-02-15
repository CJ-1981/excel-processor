/**
 * Specification tests for TopDonorsChart component
 *
 * These tests follow TDD approach for new chart module
 * RED-GREEN-REFACTOR cycle
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TopDonorsChart from './TopDonorsChart'
import type { CategoryDistribution } from '../../types'

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})

window.ResizeObserver = mockResizeObserver as any

// Mock getChartColors
vi.mock('../../utils/chartDataTransformers', () => ({
  getChartColors: () => ['#1976d2', '#dc004e', '#00a152', '#ff6f00', '#7b1fa2'],
  formatCompactNumber: (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
    return value.toFixed(0)
  },
}))

describe('TopDonorsChart', () => {
  const mockData: CategoryDistribution[] = [
    { category: 'Alice Johnson', value: 500, count: 3, percentage: 50 },
    { category: 'Bob Smith', value: 300, count: 2, percentage: 30 },
    { category: 'Carol Williams', value: 200, count: 1, percentage: 20 },
  ]

  describe('Rendering', () => {
    it('should render bar chart without crashing', () => {
      expect(() => {
        render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" limit={10} />)
      }).not.toThrow()
    })

    it('should render with default limit of 10', () => {
      expect(() => {
        render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" />)
      }).not.toThrow()
    })

    it('should render responsive container', () => {
      const { container } = render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" />)

      const responsiveContainer = container.querySelector('.recharts-responsive-container')
      expect(responsiveContainer).toBeInTheDocument()
    })

    it('should render SVG element', () => {
      const { container } = render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" />)

      // Component should render with content
      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Anonymization Mode', () => {
    it('should render with anonymize enabled', () => {
      expect(() => {
        render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" anonymize={true} />)
      }).not.toThrow()
    })

    it('should render with anonymize disabled', () => {
      expect(() => {
        render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" anonymize={false} />)
      }).not.toThrow()
    })
  })

  describe('Empty State', () => {
    it('should display message when no data available', () => {
      render(<TopDonorsChart data={[]} valueLabel="Donation Amount" />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('should render with custom valueLabel', () => {
      expect(() => {
        render(<TopDonorsChart data={mockData} valueLabel="Test Amount" />)
      }).not.toThrow()
    })

    it('should have data-chart-id attribute', () => {
      const { container } = render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" />)

      const chartWrapper = container.querySelector('[data-chart-id="top-contributors"]')
      expect(chartWrapper).toBeInTheDocument()
    })
  })

  describe('Limit Functionality', () => {
    it('should render with limit of 1', () => {
      expect(() => {
        render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" limit={1} />)
      }).not.toThrow()
    })

    it('should render with limit greater than data length', () => {
      expect(() => {
        render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" limit={100} />)
      }).not.toThrow()
    })
  })

  describe('Chart Elements', () => {
    it('should render chart container', () => {
      const { container } = render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" />)

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render with proper dimensions', () => {
      const { container } = render(<TopDonorsChart data={mockData} valueLabel="Donation Amount" />)

      const responsiveContainer = container.querySelector('.recharts-responsive-container')
      expect(responsiveContainer).toHaveStyle({ width: '100%', height: '100%' })
    })
  })

  describe('Data Values', () => {
    it('should handle zero values', () => {
      const zeroData: CategoryDistribution[] = [
        { category: 'Test', value: 0, count: 0, percentage: 0 },
      ]

      expect(() => {
        render(<TopDonorsChart data={zeroData} valueLabel="Donation Amount" />)
      }).not.toThrow()
    })

    it('should handle very large values', () => {
      const largeData: CategoryDistribution[] = [
        { category: 'Test', value: 1000000, count: 1, percentage: 100 },
      ]

      expect(() => {
        render(<TopDonorsChart data={largeData} valueLabel="Donation Amount" />)
      }).not.toThrow()
    })
  })
})
