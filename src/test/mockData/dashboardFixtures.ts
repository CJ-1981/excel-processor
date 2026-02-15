import type { DashboardAnalysis } from '../../types'

/**
 * Test data fixtures for dashboard tests
 */

// Sample raw data rows
export const mockRawData = [
  {
    _sourceFileName: 'donations_20250105.csv',
    _sourceSheetName: 'Sheet1',
    donorName: 'Alice Johnson',
    amount: 100,
    date: '2025-01-05',
    category: 'One-time',
  },
  {
    _sourceFileName: 'donations_20250112.csv',
    _sourceSheetName: 'Sheet1',
    donorName: 'Bob Smith',
    amount: 250,
    date: '2025-01-12',
    category: 'Monthly',
  },
  {
    _sourceFileName: 'donations_20250119.csv',
    _sourceSheetName: 'Sheet1',
    donorName: 'Carol Williams',
    amount: 150,
    date: '2025-01-19',
    category: 'One-time',
  },
  {
    _sourceFileName: 'donations_20250126.csv',
    _sourceSheetName: 'Sheet1',
    donorName: 'David Brown',
    amount: 300,
    date: '2025-01-26',
    category: 'Monthly',
  },
  {
    _sourceFileName: 'donations_20250202.csv',
    _sourceSheetName: 'Sheet1',
    donorName: 'Eve Davis',
    amount: 200,
    date: '2025-02-02',
    category: 'One-time',
  },
]

// Numeric test values for histogram and statistics
export const mockNumericValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

// Edge case data
export const mockEmptyData: any[] = []

export const mockSingleValueData = [{ amount: 100 }]

export const mockNullValueData = [
  { amount: 100 },
  { amount: null },
  { amount: 200 },
  { amount: undefined },
  { amount: '' },
  { amount: 300 },
]

// Column mapping
export const mockColumnMapping = {
  donorName: 'Donor Name',
  amount: 'Donation Amount',
  date: 'Donation Date',
  category: 'Donation Category',
}

// Expected analysis result
export const expectedDashboardAnalysis: DashboardAnalysis = {
  numericColumns: expect.any(Array),
  timeSeries: {
    monthly: expect.any(Array),
    quarterly: expect.any(Array),
    yearly: expect.any(Array),
  },
  distributions: {
    byName: expect.any(Array),
    bySource: expect.any(Array),
  },
  topDonors: expect.any(Array),
  metadata: {
    totalRows: 5,
    filteredRows: 5,
    dateRange: expect.any(Object),
  },
}

// Time series aggregation test data
export const mockTimeSeriesData = [
  {
    donorName: 'Alice',
    amount: 100,
    date: '2025-01-15',
  },
  {
    donorName: 'Bob',
    amount: 200,
    date: '2025-01-20',
  },
  {
    donorName: 'Carol',
    amount: 150,
    date: '2025-02-10',
  },
  {
    donorName: 'David',
    amount: 300,
    date: '2025-02-25',
  },
]

// Date format variations
export const mockDateFormatVariations = [
  { value: 100, date: '2025-01-05' },        // ISO format
  { value: 200, date: '05.01.2025' },        // German format
  { value: 300, date: '01/05/2025' },        // Slash format
  { value: 400, date: '20250105' },          // YYYYMMDD format
  { value: 500, date: new Date('2025-01-05') }, // Date object
]

// Excel serial dates
export const mockExcelSerialData = [
  { value: 100, date: 45658 },  // Approx 2025-01-05
  { value: 200, date: 45689 },  // Approx 2025-02-05
]

// Category distribution data
export const mockCategoryDistribution = [
  { category: 'Monthly', value: 500, count: 2, percentage: 50 },
  { category: 'One-time', value: 300, count: 2, percentage: 30 },
  { category: 'Annual', value: 200, count: 1, percentage: 20 },
]

// Histogram bin test data
export const mockHistogramData = {
  bins: [
    { binStart: 0, binEnd: 10, count: 1, label: '0-10' },
    { binStart: 10, binEnd: 20, count: 2, label: '10-20' },
    { binStart: 20, binEnd: 30, count: 3, label: '20-30' },
    { binStart: 30, binEnd: 40, count: 2, label: '30-40' },
    { binStart: 40, binEnd: 50, count: 1, label: '40-50' },
  ],
  mean: 25,
  median: 25,
  min: 5,
  max: 45,
}

// Pareto analysis data
export const mockParetoData = [
  { category: 'Alice', value: 300, cumulativeValue: 300, cumulativePercentage: 30 },
  { category: 'Bob', value: 250, cumulativeValue: 550, cumulativePercentage: 55 },
  { category: 'Carol', value: 200, cumulativeValue: 750, cumulativePercentage: 75 },
  { category: 'David', value: 150, cumulativeValue: 900, cumulativePercentage: 90 },
  { category: 'Eve', value: 100, cumulativeValue: 1000, cumulativePercentage: 100 },
]

// Range distribution data
export const mockRangeDistribution = [
  { label: '0 EUR', count: 1, amount: 0, percentage: 0 },
  { label: '1-50 EUR', count: 3, amount: 75, percentage: 7.5 },
  { label: '51-100 EUR', count: 2, amount: 150, percentage: 15 },
  { label: '101-200 EUR', count: 4, amount: 600, percentage: 60 },
  { label: '201-500 EUR', count: 1, amount: 175, percentage: 17.5 },
]

// Multi-series time series data
export const mockMultiSeriesTimeData = {
  weekly: [
    { period: '2025-W02', amount: 100, count: 1, date: new Date('2025-01-06') },
    { period: '2025-W03', amount: 250, count: 1, date: new Date('2025-01-13') },
    { period: '2025-W04', amount: 150, count: 1, date: new Date('2025-01-20') },
  ],
  monthly: [
    { period: '2025-01', amount: 500, count: 3, date: new Date('2025-01-01') },
    { period: '2025-02', amount: 200, count: 1, date: new Date('2025-02-01') },
  ],
  quarterly: [
    { period: '2025-Q1', amount: 700, count: 4, date: new Date('2025-01-01') },
  ],
  yearly: [
    { period: '2025', amount: 700, count: 4, date: new Date('2025-01-01') },
  ],
}

// Series configuration for chart components
export const mockSeriesConfig = [
  { key: 'amount', label: 'Donation Amount', color: '#1976d2' },
  { key: 'total', label: 'Total Donations', color: '#dc004e' },
]

// Chart color palette
export const mockChartColors = [
  '#1976d2', // Blue
  '#dc004e', // Red
  '#00a152', // Green
  '#ff6f00', // Orange
  '#7b1fa2', // Purple
]
