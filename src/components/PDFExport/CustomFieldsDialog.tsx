import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Paper,
  Box,
  type SelectChangeEvent,
} from '@mui/material';
import ColorizeIcon from '@mui/icons-material/Colorize';
import { FormField } from './FormField';
import { aggregateByMonth } from '../../utils/monthlyAggregator';
import {
  formatTodayDateGerman,
  formatAmountInGermanWords,
} from '../../utils/germanFormatter';
import type { PDFGenerationContext } from '../../types';
import type { PDFTemplate } from '../../types';

interface CustomFieldsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (customFields: Record<string, string | number>, textColor: string) => void;
  context: PDFGenerationContext;
  template: PDFTemplate;
}

export const CustomFieldsDialog: React.FC<CustomFieldsDialogProps> = ({
  open,
  onClose,
  onConfirm,
  context,
  template,
}) => {
  // State for form fields
  const [donorName, setDonorName] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [amountColumn, setAmountColumn] = useState('');
  const [monthlyAmounts, setMonthlyAmounts] = useState({
    jan: 0, feb: 0, mar: 0, apr: 0,
    may: 0, jun: 0, jul: 0, aug: 0,
    sep: 0, oct: 0, nov: 0, dec: 0,
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountInWords, setAmountInWords] = useState('');
  const [donationPeriod, setDonationPeriod] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [signatureLocation, setSignatureLocation] = useState('Kelsterbach');
  const [verzichtJa, setVerzichtJa] = useState(false);
  const [verzichtNein, setVerzichtNein] = useState(true);
  const [taxOption1, setTaxOption1] = useState(false);
  const [taxOption2, setTaxOption2] = useState(true);
  const [taxNumber1, setTaxNumber1] = useState('');
  const [taxDate1, setTaxDate1] = useState('');
  const [taxNumber2] = useState('4525057301');
  const [taxDate2] = useState('29.04.2011');
  const [taxValidFrom] = useState('27.12.2016');
  const [notMembership, setNotMembership] = useState(true);

  // Text color for PDF
  const [textColor, setTextColor] = useState('#FF0000'); // Default: red

  // Available numeric columns (internal key -> label mapping)
  const [numericColumns, setNumericColumns] = useState<Array<{id: string, label: string}>>([]);

  // Preset colors for user to choose from
  const presetColors = [
    { name: 'Red', value: '#FF0000' },
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Green', value: '#008000' },
    { name: 'Dark Blue', value: '#00008B' },
    { name: 'Brown', value: '#A52A2A' },
    { name: 'Purple', value: '#800080' },
    { name: 'Gray', value: '#808080' },
  ];

  // Initialize data when dialog opens
  useEffect(() => {
    if (open) {
      // Get numeric columns from visible headers
      // Filter to only include columns that have numeric values in the data
      const numericCols: Array<{id: string, label: string}> = [];

      const isPureNumericString = (str: string): boolean => {
        return /^[-]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(String(str).trim());
      };

      for (const header of context.visibleHeaders) {
        // Skip only specific metadata columns, not all columns starting with _
        // __EMPTY columns are valid data columns from Excel
        if (header.id === '_sourceFileName' || header.id === '_sourceSheetName') continue;

        // Check if this column has numeric values in any row
        for (const row of context.data) {
          const value = row[header.id];
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'number' || (typeof value === 'string' && isPureNumericString(value))) {
              numericCols.push({ id: header.id, label: header.label });
              break;
            }
            break; // Found a non-null value that's not a number, stop checking this column
          }
        }
      }

      setNumericColumns(numericCols);

      // Auto-select first numeric column (only if not already set)
      if (numericCols.length > 0 && !amountColumn) {
        setAmountColumn(numericCols[0].id);
      } else if (numericCols.length > 0 && amountColumn) {
        // Verify that the current amountColumn is still in the numeric columns
        const isValid = numericCols.some(col => col.id === amountColumn);
        if (!isValid) {
          // Current selection is no longer valid, reset to first numeric column
          setAmountColumn(numericCols[0].id);
        }
      }

      // Set donor name from selected names (only if not already set)
      if (!donorName) {
        if (context.selectedNames.length === 1) {
          setDonorName(context.selectedNames[0]);
        } else if (context.selectedNames.length > 1) {
          setDonorName(context.selectedNames[0]); // Default to first name
        }
      }

      // Set today's date
      setIssueDate(formatTodayDateGerman());

      // Set default values from template, falling back to hardcoded defaults
      setVerzichtNein(true);
      setVerzichtJa(false);
      setTaxOption2(true);
      setTaxOption1(false);
      setNotMembership(true);

      // Use template-specific default for signatureLocation if available
      if (template.customFieldDefaults?.signatureLocation) {
        setSignatureLocation(String(template.customFieldDefaults.signatureLocation));
      }
    }
  }, [open, context.data, context.visibleHeaders, context.selectedNames, template]);

  // Run monthly aggregation when amount column changes
  useEffect(() => {
    if (amountColumn && context.data.length > 0) {
      // Filter data to only include selected rows (use stable index on rows)
      const selectedData = context.data.filter((row: any) => context.includedIndices.has(row._stableIndex));

      // Determine if all sources are CSV files
      const allCsv = context.sourceFiles.length > 0 && context.sourceFiles.every(name => name.toLowerCase().endsWith('.csv'));

      // If CSV, prefer a column that likely contains date information.
      // Heuristics: a visible column labeled like "Source File" (data column, not metadata), or any column whose
      // values parse as dates in at least one selected row. Otherwise leave undefined to fallback to filename scan.
      let dateColumn: string | undefined = undefined;
      if (allCsv) {
        // Try a data column labeled 'Source File' but not the metadata field
        const sourceFileDataHeader = context.visibleHeaders.find(
          h => h.label.toLowerCase().includes('source file') && h.id !== '_sourceFileName'
        );

        if (sourceFileDataHeader) {
          dateColumn = sourceFileDataHeader.id;
        } else {
          // Validate by sampling rows with a simple date parse regex
          const dateLike = (val: any) => typeof val === 'string' && /(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})|(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})|(\d{8})/.test(val);
          for (const header of context.visibleHeaders) {
            if (header.id === '_sourceFileName' || header.id === '_sourceSheetName') continue;
            const anyDate = selectedData.some(row => dateLike(row[header.id]));
            if (anyDate) {
              dateColumn = header.id;
              break;
            }
          }
        }
      }

      const aggregation = aggregateByMonth(selectedData, amountColumn, dateColumn);

      setMonthlyAmounts({
        jan: aggregation.jan,
        feb: aggregation.feb,
        mar: aggregation.mar,
        apr: aggregation.apr,
        may: aggregation.may,
        jun: aggregation.jun,
        jul: aggregation.jul,
        aug: aggregation.aug,
        sep: aggregation.sep,
        oct: aggregation.oct,
        nov: aggregation.nov,
        dec: aggregation.dec,
      });

      setTotalAmount(aggregation.total);
      setDonationPeriod(aggregation.dateRange);
    }
  }, [amountColumn, context.data, context.includedIndices, context.visibleHeaders, context.sourceFiles]);

  // Update amount in words when total changes
  useEffect(() => {
    setAmountInWords(formatAmountInGermanWords(totalAmount));
  }, [totalAmount]);

  // Handle amount column change
  const handleAmountColumnChange = (event: SelectChangeEvent<string>) => {
    setAmountColumn(event.target.value);
  };

  // Donor name is handled via Autocomplete (selection or free text)

  // Handle monthly amount change
  const handleMonthlyAmountChange = (month: keyof typeof monthlyAmounts, value: number) => {
    const newAmounts = { ...monthlyAmounts, [month]: value };
    setMonthlyAmounts(newAmounts);

    // Recalculate total
    const newTotal = Object.values(newAmounts).reduce((sum, val) => sum + val, 0);
    setTotalAmount(newTotal);
  };

  // Handle confirm
  const handleConfirm = () => {
    const customFields: Record<string, string | number | boolean> = {
      donorName,
      donorAddress,
      amount: totalAmount.toFixed(2),
      amountInWords,
      donationPeriod,
      issueDate,
      signatureLocation,
      verzichtJa: String(verzichtJa),
      verzichtNein: String(verzichtNein),
      taxOption1: String(taxOption1),
      taxOption2: String(taxOption2),
      taxNumber1,
      taxDate1,
      taxNumber2,
      taxDate2,
      taxValidFrom,
      notMembership: String(notMembership),
      ...monthlyAmounts,
    };

    // Pass textColor along with customFields
    onConfirm(customFields as Record<string, string | number>, textColor);
  };

  const monthNames = [
    'Jan.', 'Feb.', 'Mär.', 'Apr.', 'Mai.', 'Jun.',
    'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'
  ];
  const monthKeys: (keyof typeof monthlyAmounts)[] = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Box sx={{ position: 'relative', pr: 20 }}>
          PDF Export - Custom Fields
          {/* Compact color picker in top right */}
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: -8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {presetColors.slice(0, 6).map((color) => (
              <Box
                key={color.value}
                onClick={() => setTextColor(color.value)}
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: color.value,
                  border: textColor === color.value ? '2px solid #1976d2' : '1px solid #ddd',
                  borderRadius: 0.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.15)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  },
                }}
                title={color.name}
              />
            ))}
            {/* Custom color option */}
            <Box
              sx={{
                position: 'relative',
                width: 24,
                height: 24,
                border: '1px dashed #999',
                borderRadius: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <ColorizeIcon sx={{ fontSize: 14, color: '#666' }} />
            </Box>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Section 1: Donor Information */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Donor Information
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {context.selectedNames.length > 1 ? (
            <Autocomplete
              freeSolo
              options={context.selectedNames}
              value={donorName}
              inputValue={donorName}
              onChange={(_, newValue) => setDonorName((newValue as string) || '')}
              onInputChange={(_, newInputValue) => setDonorName(newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Donor Name"
                  size="small"
                  sx={{ mb: 2 }}
                  InputProps={{
                    ...params.InputProps,
                    style: textColor ? { color: textColor } : undefined,
                  }}
                />
              )}
            />
          ) : (
            <FormField
              type="text"
              label="Donor Name"
              value={donorName}
              onChange={setDonorName}
              textColor={textColor}
            />
          )}
          <FormField
            type="text"
            label="Address"
            value={donorAddress}
            onChange={setDonorAddress}
            sx={{ mb: 0 }}
            textColor={textColor}
          />
        </Paper>

        {/* Section 2: Amount Column Selection */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Column Selection
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="amount-column-label">Amount Column</InputLabel>
            <Select
              labelId="amount-column-label"
              value={amountColumn}
              label="Amount Column"
              onChange={handleAmountColumnChange}
            >
              {numericColumns.map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  {col.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Select the column containing donation amounts
          </Typography>
        </Paper>

        {/* Section 3: Monthly Amounts */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Monthly Amounts (EUR)
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {monthKeys.map((key, index) => (
              <Box key={key} sx={{ width: { xs: '45%', sm: '30%', md: '23%' } }}>
                <FormField
                  type="number"
                  label={monthNames[index]}
                  value={monthlyAmounts[key]}
                  onChange={(value) => handleMonthlyAmountChange(key, value)}
                  sx={{ mb: 0 }}
                  textColor={textColor}
                />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Section 4: Totals */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Summary
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <FormField
            type="number"
            label="Total Amount (EUR)"
            value={totalAmount}
            onChange={setTotalAmount}
            fullWidth
            textColor={textColor}
          />
          <FormField
            type="text"
            label="Amount in Words"
            value={amountInWords}
            onChange={setAmountInWords}
            fullWidth
            textColor={textColor}
          />
          <FormField
            type="text"
            label="Period"
            value={donationPeriod}
            onChange={setDonationPeriod}
            sx={{ mb: 0 }}
            textColor={textColor}
          />
        </Paper>

        {/* Section 5: Tax Options */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Tax Options
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <FormField
            type="checkbox"
            label="Waiver of Reimbursement (Yes)"
            value={verzichtJa}
            onChange={setVerzichtJa}
          />
          <FormField
            type="checkbox"
            label="Waiver of Reimbursement (No)"
            value={verzichtNein}
            onChange={setVerzichtNein}
          />
          <Divider sx={{ my: 1 }} />
          <FormField
            type="checkbox"
            label="Tax Exemption According to Exemption Notice"
            value={taxOption1}
            onChange={setTaxOption1}
          />
          <FormField
            type="checkbox"
            label="Preliminary Certificate (Standard)"
            value={taxOption2}
            onChange={setTaxOption2}
          />
          {taxOption1 && (
            <>
              <FormField
                type="text"
                label="Tax Number 1"
                value={taxNumber1}
                onChange={setTaxNumber1}
              />
              <FormField
                type="text"
                label="Date 1"
                value={taxDate1}
                onChange={setTaxDate1}
                sx={{ mb: 0 }}
              />
            </>
          )}
          <FormField
            type="checkbox"
            label="Not a Membership Fee"
            value={notMembership}
            onChange={setNotMembership}
          />
        </Paper>

        {/* Section 6: Signature */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Signature
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <FormField
            type="text"
            label="Location"
            value={signatureLocation}
            onChange={setSignatureLocation}
            textColor={textColor}
          />
          <FormField
            type="text"
            label="Date"
            value={issueDate}
            onChange={setIssueDate}
            sx={{ mb: 0 }}
            textColor={textColor}
          />
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Export PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};
