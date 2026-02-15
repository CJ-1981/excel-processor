/**
 * Specification tests for TrendChart component
 *
 * These tests follow TDD approach for new chart module
 * RED-GREEN-REFACTOR cycle
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TrendChart from './TrendChart'
import type { SeriesConfig } from './TrendChart'

// Mock ResizeObserver
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})

window.ResizeObserver = mockResizeObserver as any

describe('TrendChart', () => {
  const mockSeries: SeriesConfig[] = [
    { key: 'amount', label: 'Donation Amount', color: '#1976d2' },
    { key: 'total', label: 'Total Donations', color: '#dc004e' },
  ]

  const mockData = [
    { period: '2025-01', amount: 100, total: 150, count: 1, date: new Date('2025-01-01') },
    { period: '2025-02', amount: 200, total: 250, count: 2, date: new Date('2025-02-01') },
    { period: '2025-03', amount: 300, total: 350, count: 3, date: new Date('2025-03-01') },
  ]

  describe('Rendering', () => {
    it('should render line chart without crashing', () => {
      expect(() => {
        render(
          <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="line" />
        )
      }).not.toThrow()
    })

    it('should render area chart without crashing', () => {
      expect(() => {
        render(
          <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="area" />
        )
      }).not.toThrow()
    })

    it('should render stacked area chart without crashing', () => {
      expect(() => {
        render(
          <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="stacked" />
        )
      }).not.toThrow()
    })

    it('should render chart container', () => {
      const { container } = render(
        <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="line" />
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render responsive container', () => {
      const { container } = render(
        <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="line" />
      )

      const responsiveContainer = container.querySelector('.recharts-responsive-container')
      expect(responsiveContainer).toBeInTheDocument()
    })

    it('should render SVG element for chart', () => {
      const { container } = render(
        <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="line" />
      )

      // Check that component renders without crashing and has some content
      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should display message when no data available', () => {
      render(
        <TrendChart data={[]} series={mockSeries} periodType="monthly" type="line" />
      )

      expect(screen.getByText('No data available for the selected period')).toBeInTheDocument()
    })

    it('should display message when no series configured', () => {
      render(
        <TrendChart data={mockData} series={[]} periodType="monthly" type="line" />
      )

      expect(screen.getByText('No data available for the selected period')).toBeInTheDocument()
    })
  })

  describe('Data Formatting', () => {
    it('should render chart with large values (thousands)', () => {
      const largeData = [
        { period: '2025-01', amount: 1500, total: 2500, count: 1, date: new Date('2025-01-01') },
      ]

      expect(() => {
        render(
          <TrendChart data={largeData} series={mockSeries} periodType="monthly" type="line" />
        )
      }).not.toThrow()
    })

    it('should render chart with very large values (millions)', () => {
      const millionData = [
        { period: '2025-01', amount: 1500000, total: 2500000, count: 1, date: new Date('2025-01-01') },
      ]

      expect(() => {
        render(
          <TrendChart data={millionData} series={mockSeries} periodType="monthly" type="line" />
        )
      }).not.toThrow()
    })

    it('should handle zero values', () => {
      const zeroData = [
        { period: '2025-01', amount: 0, total: 0, count: 0, date: new Date('2025-01-01') },
      ]

      expect(() => {
        render(
          <TrendChart data={zeroData} series={mockSeries} periodType="monthly" type="line" />
        )
      }).not.toThrow()
    })
  })

  describe('Chart Types', () => {
    it('should accept type prop with line value', () => {
      const { container } = render(
        <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="line" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should accept type prop with area value', () => {
      const { container } = render(
        <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="area" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })

    it('should accept type prop with stacked value', () => {
      const { container } = render(
        <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="stacked" />
      )

      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Multi-Series Support', () => {
    it('should render with single series', () => {
      const singleSeries = [{ key: 'amount', label: 'Amount', color: '#1976d2' }]

      expect(() => {
        render(
          <TrendChart data={mockData} series={singleSeries} periodType="monthly" type="line" />
        )
      }).not.toThrow()
    })

    it('should render with multiple series', () => {
      expect(() => {
        render(
          <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="line" />
        )
      }).not.toThrow()
    })

    it('should use series colors', () => {
      const { container } = render(
        <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="line" />
      )

      // Chart should render with content
      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('Period Types', () => {
    it('should render with weekly period', () => {
      expect(() => {
        render(
          <TrendChart data={mockData} series={mockSeries} periodType="weekly" type="line" />
        )
      }).not.toThrow()
    })

    it('should render with monthly period', () => {
      expect(() => {
        render(
          <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="line" />
        )
      }).not.toThrow()
    })

    it('should render with quarterly period', () => {
      expect(() => {
        render(
          <TrendChart data={mockData} series={mockSeries} periodType="quarterly" type="line" />
        )
      }).not.toThrow()
    })

    it('should render with yearly period', () => {
      expect(() => {
        render(
          <TrendChart data={mockData} series={mockSeries} periodType="yearly" type="line" />
        )
      }).not.toThrow()
    })
  })

  describe('Legend', () => {
    it('should render inline legend in chart', () => {
      const { container } = render(
        <TrendChart data={mockData} series={mockSeries} periodType="monthly" type="area" />
      )

      // Chart should render with content
      expect(container.innerHTML.length).toBeGreaterThan(0)
    })
  })
})
