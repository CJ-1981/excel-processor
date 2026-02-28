# Product Documentation

## Project Overview

**Project Name:** Excel Data Processor

**Version:** 1.5.1

**Purpose:** Client-side web application for processing, analyzing, and visualizing Excel/CSV data with advanced dashboard analytics and PDF export capabilities.

**Mission:** Provide an intuitive, privacy-focused data analysis tool that runs entirely in the browser, enabling users to process sensitive data without server uploads.

## Target Users

### Primary Users
- **Non-profit Organizations:** Process donation data, generate tax-compliant receipts (German Zuwendungsbestätigung)
- **Small Business Owners:** Analyze sales data, track trends, generate reports
- **Data Analysts:** Quick exploratory data analysis without spreadsheet software limitations
- **Financial Administrators:** Merge multi-file financial data, create summary reports

### User Scenarios
1. **Donation Processing:** Load monthly Excel exports, merge by donor name, generate annual donation receipts
2. **Sales Analysis:** Combine regional sales reports, analyze trends by time period, identify top performers
3. **Data Audit:** Filter records by specific criteria, export findings for compliance documentation
4. **Quick Analytics:** Visualize data distributions, detect outliers, understand data patterns

## Core Features

### 1. Multi-File Data Processing
- **Upload:** Drag-and-drop or select multiple Excel/CSV files simultaneously
- **Sheet Selection:** Visual interface showing all sheets across all files
- **Smart Merging:** Combine data from selected sheets, handling differing column structures
- **Progress Tracking:** Real-time feedback during file parsing and merging

### 2. Data Filtering & Selection
- **Column Selection:** Choose key column (e.g., donor name) for record identification
- **Unique Names List:** Searchable, sortable list of unique values from selected column
- **Name Merging:** Group similar names (e.g., "John Smith" + "J. Smith") into single entity
- **Row Selection:** Checkbox selection for granular data inclusion

### 3. Advanced Dashboard Analytics
- **Descriptive Statistics:** Mean, median, standard deviation, min/max, percentiles
- **Trend Analysis:** Time-series charts (weekly/monthly/quarterly/yearly aggregation)
- **Top Performers:** Bar charts showing top N entities by value
- **Distribution Analysis:** Histograms with configurable bin counts
- **Pareto Analysis:** Identify vital few contributors (80/20 rule)
- **Range Distribution:** Categorical analysis by value ranges
- **Draggable Layout:** Customize dashboard widget arrangement

### 4. Data Visualization
- **Responsive Charts:** Line, area, stacked charts with zoom capabilities
- **Interactive Tables:** Sort, filter, paginate large datasets
- **Column Visibility:** Toggle displayed columns
- **Numeric Sums:** Automatic calculation of column totals
- **Full-Screen Mode:** Expand views for focused analysis

### 5. Export Capabilities
- **CSV Export:** Export filtered/selected data respecting column visibility
- **PDF Generation:** Customizable template system with:
  - German donation receipt template (Zuwendungsbestätigung)
  - Auto-filled fields from Excel data
  - Monthly aggregation from filename dates
  - Color customization for form fields
  - Multi-page support with headers/footers

## Key Differentiators

### vs. Traditional Spreadsheet Software
- **No Installation:** Runs in any modern web browser
- **Multi-File Efficiency:** Process dozens of files simultaneously
- **Specialized Analytics:** Built-in statistical charts not available in standard spreadsheets
- **Privacy-First:** All processing happens client-side, no data leaves the browser

### vs. Business Intelligence Tools
- **No Setup:** Instant use, no database configuration
- **Cost-Effective:** Free and open source
- **Lightweight:** Handles datasets up to 100K rows efficiently
- **Targeted Features:** Purpose-built for donation/sales analysis workflows

### vs. Online Data Tools
- **Privacy:** Zero data transmission to servers
- **No Registration:** Immediate use without account creation
- **Offline Capable:** Works without internet connection after initial load
- **Customizable PDF Export:** Template system for branded reports

## Business Goals & Success Metrics

### Primary Objectives
1. **Data Privacy:** Ensure 100% client-side processing with zero server data transmission
2. **User Efficiency:** Reduce multi-file processing time from hours to minutes
3. **Accessibility:** Support users with minimal technical expertise
4. **Compliance:** Enable tax-compliant documentation generation (German market)

### Success Indicators
- **Usage Metrics:** Average files processed per session (>3 files indicates utility)
- **Feature Adoption:** Dashboard view usage rate (>60% of users)
- **Export Usage:** PDF generation frequency (>40% of sessions)
- **User Retention:** Return user percentage (>30% monthly)
- **Performance:** <3 second load time for 50-file uploads
- **Error Rate:** <2% parsing failures across common file formats

### Current Limitations (Known)
- **Dataset Size:** Optimal performance up to 100K rows, degrades beyond
- **Browser Compatibility:** Requires modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- **File Formats:** Supports Excel (.xlsx, .xls) and CSV, no legacy formats
- **Real-time Collaboration:** Single-user only, no multi-user editing
- **Advanced Analytics:** No predictive modeling or machine learning features

## Technology Constraints

### Non-Negotiable Requirements
- **Client-Side Only:** No backend processing due to privacy requirements
- **No Data Transmission:** All analytics must run in browser
- **PDF Generation:** Must support German legal formatting requirements
- **Excel Compatibility:** Must handle SheetJS-parsed data structures

### Technical Constraints
- **Browser Memory:** Limited by available RAM (typical 2-4GB heap)
- **JavaScript Performance:** V8 engine optimization boundaries
- **File Size:** Individual files >50MB may cause browser tab crashes
- **Chart Rendering:** Canvas-based Recharts limit on data points

## Future Roadmap

### Short Term (3 Months)
- [ ] DDD refactoring of DashboardView (current monolithic 1,698 LOC)
- [ ] Unit test coverage increase to 85%
- [ ] Performance optimization for large datasets
- [ ] Additional chart types (scatter, box plot)

### Medium Term (6-12 Months)
- [ ] Custom dashboard template system
- [ ] Advanced filtering (date ranges, value thresholds)
- [ ] Data transformation tools (pivot tables, calculated columns)
- [ ] Additional language support (French, Spanish)

### Long Term (12+ Months)
- [ ] Progressive Web App (PWA) with offline-first architecture
- [ ] Plugin system for custom chart types
- [ ] Collaborative features (shared dashboard views)
- [ ] Machine learning integration (anomaly detection, forecasting)

## Compliance & Legal

### Data Privacy
- **GDPR Compliant:** No personal data transmitted or stored
- **Cookie-Free:** No tracking or user identification
- **Open Source:** Full code transparency at GitHub repository

### Legal Requirements
- **German Tax Law:** Zuwendungsbestätigung template meets § 10b EStG requirements
- **Digital Signature:** Support for qualified electronic signatures (planned)
- **Audit Trail:** Export metadata logging for compliance verification

---

**Last Updated:** 2026-02-15
**Document Version:** 1.0
