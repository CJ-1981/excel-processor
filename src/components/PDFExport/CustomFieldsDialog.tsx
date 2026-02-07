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
  Paper,
  Box,
  type SelectChangeEvent,
} from '@mui/material';
import { FormField } from './FormField';
import { aggregateByMonth } from '../../utils/monthlyAggregator';
import {
  formatTodayDateGerman,
  formatAmountInGermanWords,
} from '../../utils/germanFormatter';
import type { PDFGenerationContext } from '../../types';

interface CustomFieldsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (customFields: Record<string, string | number>) => void;
  context: PDFGenerationContext;
}

export const CustomFieldsDialog: React.FC<CustomFieldsDialogProps> = ({
  open,
  onClose,
  onConfirm,
  context,
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

  // Available numeric columns (internal key -> label mapping)
  const [numericColumns, setNumericColumns] = useState<Array<{id: string, label: string}>>([]);

  // Initialize data when dialog opens
  useEffect(() => {
    if (open) {
      console.log('CustomFieldsDialog - Initializing:', {
        visibleHeadersCount: context.visibleHeaders.length,
        visibleHeaders: context.visibleHeaders,
        dataRowCount: context.data.length,
        sampleDataRow: context.data[0],
      });

      // Get numeric columns from visible headers
      // Filter to only include columns that have numeric values in the data
      const numericCols: Array<{id: string, label: string}> = [];

      for (const header of context.visibleHeaders) {
        // Skip only specific metadata columns, not all columns starting with _
        // __EMPTY columns are valid data columns from Excel
        if (header.id === '_sourceFileName' || header.id === '_sourceSheetName') continue;

        console.log('Checking column:', header.id, header.label);

        // Check if this column has numeric values in any row
        for (const row of context.data) {
          const value = row[header.id];
          console.log('  Row value:', { id: header.id, value, type: typeof value });
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'number') {
              console.log('  -> Found numeric column:', header.label);
              numericCols.push({ id: header.id, label: header.label });
              break;
            }
            break; // Found a non-null value that's not a number, stop checking this column
          }
        }
      }

      console.log('Final numeric columns:', numericCols);
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

      // Set default values
      setVerzichtNein(true);
      setVerzichtJa(false);
      setTaxOption2(true);
      setTaxOption1(false);
      setNotMembership(true);
    }
  }, [open, context.data, context.visibleHeaders, context.selectedNames]);

  // Run monthly aggregation when amount column changes
  useEffect(() => {
    if (amountColumn && context.data.length > 0) {
      // Filter data to only include selected rows
      const selectedData = context.data.filter((_, idx) => context.includedIndices.has(idx));

      console.log('CustomFieldsDialog - Aggregating data:', {
        totalDataRows: context.data.length,
        includedIndices: context.includedIndices.size,
        selectedDataRows: selectedData.length,
        amountColumn,
        sampleRow: selectedData[0],
        sampleFileName: selectedData[0]?._sourceFileName,
      });

      const aggregation = aggregateByMonth(selectedData, amountColumn);

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
  }, [amountColumn, context.data, context.includedIndices]);

  // Update amount in words when total changes
  useEffect(() => {
    setAmountInWords(formatAmountInGermanWords(totalAmount));
  }, [totalAmount]);

  // Handle amount column change
  const handleAmountColumnChange = (event: SelectChangeEvent<string>) => {
    setAmountColumn(event.target.value);
  };

  // Handle donor name change
  const handleDonorNameChange = (event: SelectChangeEvent<string>) => {
    setDonorName(event.target.value);
  };

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

    onConfirm(customFields as Record<string, string | number>);
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
      <DialogTitle>PDF Export - Custom Fields</DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Section 1: Donor Information */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Spender Informationen
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {context.selectedNames.length > 1 ? (
            <FormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel id="donor-name-label">Spender Name</InputLabel>
              <Select
                labelId="donor-name-label"
                value={donorName}
                label="Spender Name"
                onChange={handleDonorNameChange}
              >
                {context.selectedNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <FormField
              type="text"
              label="Spender Name"
              value={donorName}
              onChange={setDonorName}
            />
          )}
          <FormField
            type="text"
            label="Adresse"
            value={donorAddress}
            onChange={setDonorAddress}
            sx={{ mb: 0 }}
          />
        </Paper>

        {/* Section 2: Amount Column Selection */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Spaltenauswahl
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="amount-column-label">Betrag Spalte</InputLabel>
            <Select
              labelId="amount-column-label"
              value={amountColumn}
              label="Betrag Spalte"
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
            Wählen Sie die Spalte, die die Spendenbeträge enthält
          </Typography>
        </Paper>

        {/* Section 3: Monthly Amounts */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Monatliche Beträge (EUR)
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
                />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Section 4: Totals */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Zusammenfassung
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <FormField
            type="number"
            label="Gesamtbetrag (EUR)"
            value={totalAmount}
            onChange={setTotalAmount}
            fullWidth
          />
          <FormField
            type="text"
            label="Betrag in Worten"
            value={amountInWords}
            onChange={setAmountInWords}
            fullWidth
          />
          <FormField
            type="text"
            label="Zeitraum"
            value={donationPeriod}
            onChange={setDonationPeriod}
            sx={{ mb: 0 }}
          />
        </Paper>

        {/* Section 5: Tax Options */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Steueroptionen
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <FormField
            type="checkbox"
            label="Verzicht auf Erstattung (Ja)"
            value={verzichtJa}
            onChange={setVerzichtJa}
          />
          <FormField
            type="checkbox"
            label="Verzicht auf Erstattung (Nein)"
            value={verzichtNein}
            onChange={setVerzichtNein}
          />
          <Divider sx={{ my: 1 }} />
          <FormField
            type="checkbox"
            label="Steuerbefreiung nach Freistellungsbescheid"
            value={taxOption1}
            onChange={setTaxOption1}
          />
          <FormField
            type="checkbox"
            label="Vorläufige Bescheinigung (Standard)"
            value={taxOption2}
            onChange={setTaxOption2}
          />
          {taxOption1 && (
            <>
              <FormField
                type="text"
                label="Steuernummer 1"
                value={taxNumber1}
                onChange={setTaxNumber1}
              />
              <FormField
                type="text"
                label="Datum 1"
                value={taxDate1}
                onChange={setTaxDate1}
                sx={{ mb: 0 }}
              />
            </>
          )}
          <FormField
            type="checkbox"
            label="Kein Mitgliedsbeitrag"
            value={notMembership}
            onChange={setNotMembership}
          />
        </Paper>

        {/* Section 6: Signature */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          Unterschrift
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <FormField
            type="text"
            label="Ort"
            value={signatureLocation}
            onChange={setSignatureLocation}
          />
          <FormField
            type="text"
            label="Datum"
            value={issueDate}
            onChange={setIssueDate}
            sx={{ mb: 0 }}
          />
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={handleConfirm}>
          PDF Exportieren
        </Button>
      </DialogActions>
    </Dialog>
  );
};
