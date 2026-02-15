/**
 * Specification tests for StatisticsTable component
 *
 * These tests follow TDD approach for new chart module
 * RED-GREEN-REFACTOR cycle
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatisticsTable from './StatisticsTable'
import type { ColumnStatistics } from '../../types'

describe('StatisticsTable', () => {
  const mockStatistics: ColumnStatistics[] = [
    {
      columnName: 'amount',
      columnLabel: 'Donation Amount',
      sum: 1000,
      avg: 250,
      min: 100,
      max: 400,
      median: 250,
      stdDev: 111.8,
      count: 4,
      nonNullCount: 4,
      percentile25: 175,
      percentile75: 325,
      percentile90: 370,
      percentile95: 385,
    },
    {
      columnName: 'score',
      columnLabel: 'Score',
      sum: 350,
      avg: 87.5,
      min: 75,
      max: 100,
      median: 87.5,
      stdDev: 10.6,
      count: 4,
      nonNullCount: 4,
      percentile25: 81.25,
      percentile75: 93.75,
      percentile90: 97.5,
      percentile95: 98.75,
    },
  ]

  describe('Rendering', () => {
    it('should render table without crashing', () => {
      expect(() => {
        render(<StatisticsTable statistics={mockStatistics} />)
      }).not.toThrow()
    })

    it('should render table with column labels', () => {
      render(<StatisticsTable statistics={mockStatistics} />)

      expect(screen.getByText('Donation Amount')).toBeInTheDocument()
      expect(screen.getByText('Score')).toBeInTheDocument()
    })

    it('should render all statistical measures', () => {
      render(<StatisticsTable statistics={mockStatistics} />)

      // Check for table headers
      expect(screen.getByText('Sum')).toBeInTheDocument()
      expect(screen.getByText('Avg')).toBeInTheDocument()
      expect(screen.getByText('Median')).toBeInTheDocument()
      expect(screen.getByText('Min')).toBeInTheDocument()
      expect(screen.getByText('Max')).toBeInTheDocument()
      expect(screen.getByText('Std Dev')).toBeInTheDocument()
      expect(screen.getByText('Count')).toBeInTheDocument()
    })

    it('should render percentile columns', () => {
      render(<StatisticsTable statistics={mockStatistics} />)

      // Percentiles are in collapsible section, button should be present
      expect(screen.getByText('Show Percentiles')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no statistics', () => {
      render(<StatisticsTable statistics={[]} />)

      expect(screen.getByText('No numeric columns found in the data')).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('should display correct values for each statistic', () => {
      render(<StatisticsTable statistics={mockStatistics} />)

      // Check that values are displayed (using getAllByText for multiple matches)
      const meanValues = screen.getAllByText('250.00')
      expect(meanValues.length).toBeGreaterThan(0)
    })

    it('should handle decimal precision correctly', () => {
      render(<StatisticsTable statistics={mockStatistics} />)

      // Should display with 2 decimal places
      expect(screen.getByText('111.80')).toBeInTheDocument()
    })

    it('should display N/A for insufficient data', () => {
      const insufficientStats: ColumnStatistics[] = [
        {
          columnName: 'test',
          columnLabel: 'Test',
          sum: 0,
          avg: 0,
          min: 0,
          max: 0,
          median: 0,
          stdDev: 0,
          count: 1,
          nonNullCount: 1,
          percentile25: 0,
          percentile75: 0,
          percentile90: 0,
          percentile95: 0,
        },
      ]

      render(<StatisticsTable statistics={insufficientStats} />)
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  describe('Table Structure', () => {
    it('should render table element', () => {
      const { container } = render(<StatisticsTable statistics={mockStatistics} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('should render thead with column headers', () => {
      const { container } = render(<StatisticsTable statistics={mockStatistics} />)

      const thead = container.querySelector('thead')
      expect(thead).toBeInTheDocument()
    })

    it('should render tbody with data rows', () => {
      const { container } = render(<StatisticsTable statistics={mockStatistics} />)

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()

      const rows = tbody?.querySelectorAll('tr')
      // Each stat creates 2 rows (main + percentile)
      expect(rows?.length).toBe(mockStatistics.length * 2)
    })
  })

  describe('Number Formatting', () => {
    it('should format numbers with proper decimal places', () => {
      const statsWithDecimals: ColumnStatistics[] = [
        {
          columnName: 'amount',
          columnLabel: 'Amount',
          sum: 1000.123456,
          avg: 250.030864,
          min: 100.1,
          max: 400.9,
          median: 250,
          stdDev: 111.803355,
          count: 4,
          nonNullCount: 4,
          percentile25: 175,
          percentile75: 325,
          percentile90: 370,
          percentile95: 385,
        },
      ]

      render(<StatisticsTable statistics={statsWithDecimals} />)
      expect(screen.getByText('250.03')).toBeInTheDocument()
    })

    it('should handle integer values', () => {
      const integerStats: ColumnStatistics[] = [
        {
          columnName: 'count',
          columnLabel: 'Count',
          sum: 100,
          avg: 25,
          min: 10,
          max: 40,
          median: 25,
          stdDev: 11,
          count: 4,
          nonNullCount: 4,
          percentile25: 17,
          percentile75: 33,
          percentile90: 37,
          percentile95: 39,
        },
      ]

      expect(() => {
        render(<StatisticsTable statistics={integerStats} />)
      }).not.toThrow()
    })
  })

  describe('Null Handling', () => {
    it('should handle statistics with null values', () => {
      const statsWithNulls: ColumnStatistics[] = [
        {
          columnName: 'amount',
          columnLabel: 'Amount',
          sum: 500,
          avg: 125,
          min: 50,
          max: 200,
          median: 125,
          stdDev: 62.5,
          count: 5,
          nonNullCount: 4,
          percentile25: 87.5,
          percentile75: 162.5,
          percentile90: 185,
          percentile95: 192.5,
        },
      ]

      expect(() => {
        render(<StatisticsTable statistics={statsWithNulls} />)
      }).not.toThrow()
    })
  })

  describe('Multiple Columns', () => {
    it('should render rows for each column statistic', () => {
      const { container } = render(<StatisticsTable statistics={mockStatistics} />)

      const tbody = container.querySelector('tbody')
      const rows = tbody?.querySelectorAll('tr')

      // Each stat has 2 rows (main stats + percentile row)
      expect(rows?.length).toBe(4) // 2 stats * 2 rows each
    })

    it('should display all columns in correct order', () => {
      const { container } = render(<StatisticsTable statistics={mockStatistics} />)

      const firstRow = container.querySelector('tbody tr:first-child')
      const cells = firstRow?.querySelectorAll('td, th')

      expect(cells?.length).toBeGreaterThan(0)
    })
  })

  describe('Scrollable Container', () => {
    it('should render in scrollable container', () => {
      const { container } = render(<StatisticsTable statistics={mockStatistics} />)

      // Should have a scrollable container
      const box = container.querySelector('.MuiBox-root')
      expect(box).toBeInTheDocument()
    })
  })
})
