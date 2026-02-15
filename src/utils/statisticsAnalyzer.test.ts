/**
 * Characterization tests for statisticsAnalyzer utility functions
 *
 * These tests preserve existing behavior before refactoring (DDD approach)
 * Following the PRESERVE phase of the DDD cycle
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePercentile,
  calculateColumnStatistics,
  detectNumericColumns,
  detectDateColumns,
  parseDate,
  aggregateByTime,
  calculateDistribution,
  getTopItems,
  analyzeDataForDashboard,
  extractNumericValues,
  calculateHistogram,
  calculateQuartiles,
  calculatePareto,
  calculateRangeDistribution,
  DEFAULT_VALUE_RANGES,
} from './statisticsAnalyzer'
import type { CategoryDistribution } from '../types'

describe('statisticsAnalyzer - Characterization Tests', () => {
  describe('calculatePercentile', () => {
    it('should return 0 for empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0)
    })

    it('should return the single value for array with one element', () => {
      expect(calculatePercentile([42], 50)).toBe(42)
    })

    it('should calculate median (50th percentile) correctly for odd number of elements', () => {
      const sorted = [1, 2, 3, 4, 5]
      expect(calculatePercentile(sorted, 50)).toBe(3)
    })

    it('should calculate median (50th percentile) correctly for even number of elements', () => {
      const sorted = [1, 2, 3, 4]
      expect(calculatePercentile(sorted, 50)).toBe(2.5)
    })

    it('should calculate 25th percentile correctly', () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8]
      expect(calculatePercentile(sorted, 25)).toBe(2.75)
    })

    it('should calculate 75th percentile correctly', () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8]
      expect(calculatePercentile(sorted, 75)).toBe(6.25)
    })

    it('should handle edge cases at boundaries (0th and 100th percentile)', () => {
      const sorted = [1, 2, 3, 4, 5]
      expect(calculatePercentile(sorted, 0)).toBe(1)
      expect(calculatePercentile(sorted, 100)).toBe(5)
    })
  })

  describe('calculateColumnStatistics', () => {
    const mockData = [
      { amount: 100 },
      { amount: 200 },
      { amount: 300 },
      { amount: 400 },
      { amount: 500 },
    ]

    it('should calculate all statistics correctly', () => {
      const result = calculateColumnStatistics(mockData, 'amount', 'Amount')

      expect(result.columnName).toBe('amount')
      expect(result.columnLabel).toBe('Amount')
      expect(result.sum).toBe(1500)
      expect(result.avg).toBe(300)
      expect(result.min).toBe(100)
      expect(result.max).toBe(500)
      expect(result.median).toBe(300)
      expect(result.stdDev).toBeCloseTo(141.42, 1)
      expect(result.count).toBe(5)
      expect(result.nonNullCount).toBe(5)
    })

    it('should calculate percentiles correctly', () => {
      const result = calculateColumnStatistics(mockData, 'amount', 'Amount')

      expect(result.percentile25).toBe(200)
      expect(result.percentile75).toBe(400)
      expect(result.percentile90).toBe(460)
      expect(result.percentile95).toBeCloseTo(480, 0)
    })

    it('should handle null and undefined values', () => {
      const dataWithNulls = [
        { amount: 100 },
        { amount: null },
        { amount: 300 },
        { amount: undefined },
        { amount: '' },
        { amount: 500 },
      ]

      const result = calculateColumnStatistics(dataWithNulls, 'amount', 'Amount')

      expect(result.nonNullCount).toBe(3)
      expect(result.sum).toBe(900)
      expect(result.avg).toBe(300)
      expect(result.count).toBe(6) // Total rows including nulls
    })

    it('should return zero statistics for empty column', () => {
      const result = calculateColumnStatistics([], 'amount', 'Amount')

      expect(result.sum).toBe(0)
      expect(result.avg).toBe(0)
      expect(result.min).toBe(0)
      expect(result.max).toBe(0)
      expect(result.median).toBe(0)
      expect(result.stdDev).toBe(0)
      expect(result.nonNullCount).toBe(0)
    })

    it('should handle string numeric values', () => {
      const dataWithStrings = [
        { amount: '100' },
        { amount: '200' },
        { amount: '300' },
      ]

      const result = calculateColumnStatistics(dataWithStrings, 'amount', 'Amount')

      expect(result.sum).toBe(600)
      expect(result.avg).toBe(200)
      expect(result.nonNullCount).toBe(3)
    })
  })

  describe('detectNumericColumns', () => {
    it('should detect columns with numeric values', () => {
      const data = [
        { amount: 100, name: 'Alice', score: 95.5 },
        { amount: 200, name: 'Bob', score: 87.3 },
        { amount: 300, name: 'Carol', score: 92.1 },
      ]

      const result = detectNumericColumns(data)

      expect(result).toContain('amount')
      expect(result).toContain('score')
      expect(result).not.toContain('name')
    })

    it('should exclude metadata columns', () => {
      const data = [
        { _sourceFileName: 'test.csv', amount: 100 },
        { _sourceSheetName: 'Sheet1', amount: 200 },
      ]

      const result = detectNumericColumns(data)

      expect(result).toContain('amount')
      expect(result).not.toContain('_sourceFileName')
      expect(result).not.toContain('_sourceSheetName')
    })

    it('should handle columns with 50%+ numeric values', () => {
      const data = [
        { mixed: 100 },
        { mixed: 200 },
        { mixed: 'text' },
        { mixed: 300 },
      ]

      const result = detectNumericColumns(data)

      expect(result).toContain('mixed')
    })

    it('should exclude columns with less than 50% numeric values', () => {
      const data = [
        { mixed: 100 },
        { mixed: 'text' },
        { mixed: 'text2' },
        { mixed: 'text3' },
      ]

      const result = detectNumericColumns(data)

      expect(result).not.toContain('mixed')
    })

    it('should return empty array for empty data', () => {
      expect(detectNumericColumns([])).toEqual([])
    })
  })

  describe('detectDateColumns', () => {
    it('should detect ISO date format (YYYY-MM-DD)', () => {
      const data = [
        { date: '2025-01-05', value: 100 },
        { date: '2025-02-10', value: 200 },
      ]

      const result = detectDateColumns(data)

      expect(result).toContain('date')
    })

    it('should detect German date format (DD.MM.YYYY)', () => {
      const data = [
        { date: '05.01.2025', value: 100 },
        { date: '10.02.2025', value: 200 },
      ]

      const result = detectDateColumns(data)

      expect(result).toContain('date')
    })

    it('should detect slash date format (MM/DD/YYYY)', () => {
      const data = [
        { date: '01/05/2025', value: 100 },
        { date: '02/10/2025', value: 200 },
      ]

      const result = detectDateColumns(data)

      expect(result).toContain('date')
    })

    it('should detect YYYYMMDD format', () => {
      const data = [
        { date: '20250105', value: 100 },
        { date: '20250210', value: 200 },
      ]

      const result = detectDateColumns(data)

      expect(result).toContain('date')
    })

    it('should detect Date objects', () => {
      const data = [
        { date: new Date('2025-01-05'), value: 100 },
        { date: new Date('2025-02-10'), value: 200 },
      ]

      const result = detectDateColumns(data)

      expect(result).toContain('date')
    })

    it('should detect embedded YYYYMMDD in strings', () => {
      const data = [
        { filename: 'data_20250105.csv', value: 100 },
        { filename: 'export_20250210.xlsx', value: 200 },
      ]

      const result = detectDateColumns(data)

      expect(result).toContain('filename')
    })

    it('should exclude metadata columns', () => {
      const data = [
        { _sourceFileName: 'data_20250105.csv', date: '2025-01-05' },
      ]

      const result = detectDateColumns(data)

      expect(result).toContain('date')
      expect(result).not.toContain('_sourceFileName')
    })

    it('should return empty array for empty data', () => {
      expect(detectDateColumns([])).toEqual([])
    })
  })

  describe('parseDate', () => {
    it('should parse ISO date format (YYYY-MM-DD)', () => {
      const result = parseDate('2025-01-05')
      expect(result).toEqual(new Date(2025, 0, 5))
    })

    it('should parse German date format (DD.MM.YYYY)', () => {
      const result = parseDate('05.01.2025')
      expect(result).toEqual(new Date(2025, 0, 5))
    })

    it('should parse slash date format (MM/DD/YYYY)', () => {
      const result = parseDate('01/05/2025')
      // The code assumes DD/MM/YYYY (European format)
      expect(result).toEqual(new Date(2025, 4, 1))
    })

    it('should parse YYYYMMDD format', () => {
      const result = parseDate('20250105')
      expect(result).toEqual(new Date(2025, 0, 5))
    })

    it('should parse embedded YYYYMMDD in strings', () => {
      const result = parseDate('data_20250105_export')
      expect(result).toEqual(new Date(2025, 0, 5))
    })

    it('should return Date object unchanged', () => {
      const input = new Date('2025-01-05')
      const result = parseDate(input)
      expect(result).toEqual(input)
    })

    it('should return null for invalid date strings', () => {
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('')).toBeNull()
    })

    it('should return null for non-string, non-Date, non-number input', () => {
      expect(parseDate(null)).toBeNull()
      expect(parseDate(undefined)).toBeNull()
    })
  })

  describe('aggregateByTime', () => {
    const mockData = [
      { date: '2025-01-05', amount: 100 },
      { date: '2025-01-15', amount: 200 },
      { date: '2025-02-10', amount: 150 },
      { date: '2025-02-20', amount: 250 },
      { date: '2025-03-05', amount: 300 },
    ]

    it('should aggregate monthly correctly', () => {
      const result = aggregateByTime(mockData, 'date', 'amount', 'monthly')

      expect(result).toHaveLength(3)
      expect(result[0].period).toBe('2025-01')
      expect(result[0].value).toBe(300)
      expect(result[1].period).toBe('2025-02')
      expect(result[1].value).toBe(400)
      expect(result[2].period).toBe('2025-03')
      expect(result[2].value).toBe(300)
    })

    it('should aggregate quarterly correctly', () => {
      const result = aggregateByTime(mockData, 'date', 'amount', 'quarterly')

      expect(result).toHaveLength(1)
      expect(result[0].period).toBe('2025-Q1')
      expect(result[0].value).toBe(1000)
    })

    it('should aggregate yearly correctly', () => {
      const result = aggregateByTime(mockData, 'date', 'amount', 'yearly')

      expect(result).toHaveLength(1)
      expect(result[0].period).toBe('2025')
      expect(result[0].value).toBe(1000)
    })

    it('should include count in aggregated data', () => {
      const result = aggregateByTime(mockData, 'date', 'amount', 'monthly')

      expect(result[0].count).toBe(2)
      expect(result[1].count).toBe(2)
      expect(result[2].count).toBe(1)
    })

    it('should include date object for sorting', () => {
      const result = aggregateByTime(mockData, 'date', 'amount', 'monthly')

      expect(result[0].date).toEqual(new Date(2025, 0, 1))
      expect(result[1].date).toEqual(new Date(2025, 1, 1))
    })

    it('should skip invalid dates', () => {
      const dataWithInvalid = [
        ...mockData,
        { date: 'invalid', amount: 999 },
      ]

      const result = aggregateByTime(dataWithInvalid, 'date', 'amount', 'monthly')

      expect(result[0].value).toBe(300) // Should not include invalid
    })

    it('should return empty array for empty data', () => {
      const result = aggregateByTime([], 'date', 'amount', 'monthly')
      expect(result).toEqual([])
    })
  })

  describe('calculateDistribution', () => {
    const mockData = [
      { name: 'Alice', amount: 100 },
      { name: 'Bob', amount: 200 },
      { name: 'Alice', amount: 150 },
      { name: 'Carol', amount: 300 },
      { name: 'Bob', amount: 250 },
    ]

    it('should calculate distribution by category', () => {
      const result = calculateDistribution(mockData, 'name', 'amount')

      expect(result).toHaveLength(3)
      expect(result[0].category).toBe('Bob')
      expect(result[0].value).toBe(450)
      expect(result[0].count).toBe(2)
      expect(result[1].category).toBe('Carol')
      expect(result[1].value).toBe(300)
    })

    it('should calculate percentages correctly', () => {
      const result = calculateDistribution(mockData, 'name', 'amount')
      const total = 1000

      expect(result[0].percentage).toBe((450 / total) * 100)
      expect(result[1].percentage).toBe((300 / total) * 100)
      expect(result[2].percentage).toBe((250 / total) * 100)
    })

    it('should sort by value descending', () => {
      const result = calculateDistribution(mockData, 'name', 'amount')

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].value).toBeGreaterThanOrEqual(result[i + 1].value)
      }
    })

    it('should count occurrences when no value column specified', () => {
      const result = calculateDistribution(mockData, 'name')

      expect(result[0].category).toBe('Alice')
      expect(result[0].value).toBe(2)
      expect(result[0].count).toBe(2)
    })

    it('should skip null/empty values', () => {
      const dataWithNulls = [
        ...mockData,
        { name: null, amount: 999 },
        { name: '', amount: 888 },
        { name: undefined, amount: 777 },
      ]

      const result = calculateDistribution(dataWithNulls, 'name', 'amount')

      expect(result).toHaveLength(3)
    })

    it('should return empty array for empty data', () => {
      const result = calculateDistribution([], 'name', 'amount')
      expect(result).toEqual([])
    })
  })

  describe('getTopItems', () => {
    const mockDistribution: CategoryDistribution[] = [
      { category: 'Alice', value: 100, count: 1, percentage: 10 },
      { category: 'Bob', value: 200, count: 2, percentage: 20 },
      { category: 'Carol', value: 300, count: 3, percentage: 30 },
      { category: 'David', value: 400, count: 4, percentage: 40 },
    ]

    it('should return top N items', () => {
      const result = getTopItems(mockDistribution, 2)

      expect(result).toHaveLength(2)
      expect(result[0].category).toBe('Alice')
      expect(result[1].category).toBe('Bob')
    })

    it('should default to limit of 10', () => {
      const result = getTopItems(mockDistribution)

      expect(result).toHaveLength(4)
    })

    it('should handle limit larger than array length', () => {
      const result = getTopItems(mockDistribution, 100)

      expect(result).toHaveLength(4)
    })
  })

  describe('extractNumericValues', () => {
    const mockData = [
      { amount: 100 },
      { amount: 200 },
      { amount: null },
      { amount: undefined },
      { amount: '' },
      { amount: 300 },
    ]

    it('should extract numeric values from column', () => {
      const result = extractNumericValues(mockData, 'amount')

      expect(result).toEqual([100, 200, 300])
    })

    it('should handle string numeric values', () => {
      const dataWithStrings = [
        { amount: '100' },
        { amount: '200' },
        { amount: 'invalid' },
      ]

      const result = extractNumericValues(dataWithStrings, 'amount')

      expect(result).toEqual([100, 200])
    })

    it('should return empty array for empty data', () => {
      const result = extractNumericValues([], 'amount')
      expect(result).toEqual([])
    })
  })

  describe('calculateHistogram', () => {
    const mockValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

    it('should calculate histogram with default bin count', () => {
      const result = calculateHistogram(mockValues, 10)

      expect(result.bins).toHaveLength(10)
      expect(result.mean).toBe(55)
      expect(result.median).toBe(55)
      expect(result.min).toBe(10)
      expect(result.max).toBe(100)
    })

    it('should distribute values across bins correctly', () => {
      const result = calculateHistogram(mockValues, 5)

      expect(result.bins).toHaveLength(5)

      // Check that total count matches
      const totalCount = result.bins.reduce((sum, bin) => sum + bin.count, 0)
      expect(totalCount).toBe(mockValues.length)
    })

    it('should handle edge case where all values are the same', () => {
      const sameValues = [50, 50, 50, 50, 50]
      const result = calculateHistogram(sameValues, 10)

      expect(result.bins).toHaveLength(1)
      expect(result.bins[0].count).toBe(5)
      expect(result.min).toBe(50)
      expect(result.max).toBe(50)
    })

    it('should return empty histogram for empty values', () => {
      const result = calculateHistogram([], 10)

      expect(result.bins).toEqual([])
      expect(result.mean).toBe(0)
      expect(result.median).toBe(0)
    })

    it('should handle single value', () => {
      const result = calculateHistogram([42], 10)

      expect(result.bins).toHaveLength(1)
      expect(result.bins[0].count).toBe(1)
      expect(result.mean).toBe(42)
    })
  })

  describe('calculateQuartiles', () => {
    const mockValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

    it('should calculate quartiles correctly', () => {
      const result = calculateQuartiles(mockValues)

      expect(result.min).toBe(10)
      expect(result.max).toBe(100)
      expect(result.median).toBe(55)
      expect(result.q1).toBe(32.5)
      expect(result.q3).toBe(77.5)
      expect(result.iqr).toBe(45)
    })

    it('should identify outliers using 1.5 * IQR rule', () => {
      const valuesWithOutliers = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300]
      const result = calculateQuartiles(valuesWithOutliers)

      expect(result.outliers).toContain(200)
      expect(result.outliers).toContain(300)
    })

    it('should return zero quartiles for empty array', () => {
      const result = calculateQuartiles([])

      expect(result.min).toBe(0)
      expect(result.max).toBe(0)
      expect(result.median).toBe(0)
      expect(result.q1).toBe(0)
      expect(result.q3).toBe(0)
      expect(result.iqr).toBe(0)
      expect(result.outliers).toEqual([])
    })
  })

  describe('calculatePareto', () => {
    const mockDistribution: CategoryDistribution[] = [
      { category: 'Alice', value: 100, count: 1, percentage: 10 },
      { category: 'Bob', value: 200, count: 2, percentage: 20 },
      { category: 'Carol', value: 300, count: 3, percentage: 30 },
      { category: 'David', value: 400, count: 4, percentage: 40 },
    ]

    it('should calculate cumulative values', () => {
      const result = calculatePareto(mockDistribution)

      expect(result[0].cumulativeValue).toBe(400)
      expect(result[1].cumulativeValue).toBe(700)
      expect(result[2].cumulativeValue).toBe(900)
      expect(result[3].cumulativeValue).toBe(1000)
    })

    it('should calculate cumulative percentages', () => {
      const result = calculatePareto(mockDistribution)

      expect(result[0].cumulativePercentage).toBe(40)
      expect(result[1].cumulativePercentage).toBe(70)
      expect(result[2].cumulativePercentage).toBe(90)
      expect(result[3].cumulativePercentage).toBe(100)
    })

    it('should preserve category and value from input', () => {
      const result = calculatePareto(mockDistribution)

      expect(result[0].category).toBe('David')
      expect(result[0].value).toBe(400)
    })

    it('should return empty array for empty input', () => {
      const result = calculatePareto([])
      expect(result).toEqual([])
    })

    it('should sort by value descending if not already sorted', () => {
      const unsorted: CategoryDistribution[] = [
        { category: 'Alice', value: 100, count: 1, percentage: 10 },
        { category: 'Bob', value: 400, count: 2, percentage: 40 },
        { category: 'Carol', value: 200, count: 3, percentage: 20 },
      ]

      const result = calculatePareto(unsorted)

      expect(result[0].category).toBe('Bob')
      expect(result[1].category).toBe('Carol')
      expect(result[2].category).toBe('Alice')
    })
  })

  describe('calculateRangeDistribution', () => {
    const mockValues = [0, 25, 75, 125, 225, 600, 1500]

    it('should categorize values into ranges', () => {
      const result = calculateRangeDistribution(mockValues, DEFAULT_VALUE_RANGES)

      expect(result.length).toBeGreaterThan(0)

      // Find the 1-50 EUR range
      const range1_50 = result.find(r => r.label === '1-50 EUR')
      expect(range1_50).toBeDefined()
      expect(range1_50?.count).toBe(1) // 25 only
    })

    it('should calculate counts correctly', () => {
      const result = calculateRangeDistribution(mockValues, DEFAULT_VALUE_RANGES)

      const totalCount = result.reduce((sum, r) => sum + r.count, 0)
      expect(totalCount).toBe(mockValues.length)
    })

    it('should calculate amounts correctly', () => {
      const result = calculateRangeDistribution(mockValues, DEFAULT_VALUE_RANGES)

      const totalAmount = result.reduce((sum, r) => sum + r.amount, 0)
      expect(totalAmount).toBe(mockValues.reduce((sum, v) => sum + v, 0))
    })

    it('should calculate percentages correctly', () => {
      const result = calculateRangeDistribution(mockValues, DEFAULT_VALUE_RANGES)

      const totalPercentage = result.reduce((sum, r) => sum + r.percentage, 0)
      expect(totalPercentage).toBeCloseTo(100, 1)
    })

    it('should filter out empty ranges', () => {
      const smallValues = [10, 20]
      const result = calculateRangeDistribution(smallValues, DEFAULT_VALUE_RANGES)

      // Should only have non-empty ranges
      result.forEach(range => {
        expect(range.count).toBeGreaterThan(0)
      })
    })

    it('should return empty array for empty values', () => {
      const result = calculateRangeDistribution([], DEFAULT_VALUE_RANGES)
      expect(result).toEqual([])
    })

    it('should handle infinity in range max', () => {
      const largeValues = [2000, 5000, 10000]
      const result = calculateRangeDistribution(largeValues, DEFAULT_VALUE_RANGES)

      const highRange = result.find(r => r.label === '1001+ EUR')
      expect(highRange).toBeDefined()
      expect(highRange?.count).toBe(3)
    })
  })

  describe('analyzeDataForDashboard - Integration', () => {
    const mockData = [
      {
        _sourceFileName: 'donations_20250105.csv',
        donorName: 'Alice',
        amount: 100,
        date: '2025-01-05',
      },
      {
        _sourceFileName: 'donations_20250112.csv',
        donorName: 'Bob',
        amount: 200,
        date: '2025-01-12',
      },
      {
        _sourceFileName: 'donations_20250202.csv',
        donorName: 'Carol',
        amount: 150,
        date: '2025-02-02',
      },
    ]

    const columnMapping = {
      donorName: 'Donor Name',
      amount: 'Amount',
      date: 'Date',
    }

    it('should analyze data and return complete dashboard analysis', () => {
      const result = analyzeDataForDashboard(mockData, columnMapping, 'donorName')

      expect(result.numericColumns.length).toBeGreaterThan(0)
      expect(result.numericColumns[0].columnName).toBe('amount')
      expect(result.metadata.totalRows).toBe(3)
      expect(result.metadata.filteredRows).toBe(3)
    })

    it('should calculate time series for date columns', () => {
      const result = analyzeDataForDashboard(mockData, columnMapping, 'donorName')

      expect(result.timeSeries.monthly).toBeDefined()
      expect(result.timeSeries.monthly?.length).toBeGreaterThan(0)
    })

    it('should calculate distribution by name column', () => {
      const result = analyzeDataForDashboard(mockData, columnMapping, 'donorName')

      expect(result.distributions.byName).toBeDefined()
      expect(result.distributions.byName?.length).toBe(3)
    })

    it('should include top donors in result', () => {
      const result = analyzeDataForDashboard(mockData, columnMapping, 'donorName')

      expect(result.topDonors).toBeDefined()
      expect(result.topDonors.length).toBe(3)
    })

    it('should detect date range from data', () => {
      const result = analyzeDataForDashboard(mockData, columnMapping, 'donorName')

      expect(result.metadata.dateRange).toBeDefined()
      expect(result.metadata.dateRange?.start).toEqual(new Date(2025, 0, 5))
      expect(result.metadata.dateRange?.end).toEqual(new Date(2025, 1, 2))
    })

    it('should handle empty data gracefully', () => {
      const result = analyzeDataForDashboard([], {}, null)

      expect(result.numericColumns).toEqual([])
      expect(result.metadata.totalRows).toBe(0)
    })

    it('should handle data without name column', () => {
      const result = analyzeDataForDashboard(mockData, columnMapping, null)

      expect(result.distributions.byName).toBeUndefined()
    })
  })
})
