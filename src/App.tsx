import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ExcelUploader from './components/ExcelUploader';
import ColumnSelector from './components/ColumnSelector';
import UniqueNameList from './components/UniqueNameList';
import DetailedDataView from './components/DetailedDataView';
import SheetSelector from './components/SheetSelector';
import FileProgressIndicator from './components/FileProgressIndicator';
import NameMergingPanel from './components/NameMergingPanel';
import LanguageSwitcher from './components/LanguageSwitcher';

import { Container, CssBaseline, Box, Typography, CircularProgress, Dialog, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import type { ParsedFile, ParseProgress, NameMergeState, ExcelDataArray, ExcelRowData } from './types';
import * as XLSX from 'xlsx';
import { processInBatches } from './utils/batchProcessor';
import { APP_VERSION } from './version';
import { loadNameMergeState, applyNameMerging } from './utils/nameMergeUtils';

type AppStatus = 'ready' | 'parsing' | 'files_uploaded' | 'data_merged';

function App() {
  const { t } = useTranslation();

  // State for the new multi-file workflow
  const [status, setStatus] = useState<AppStatus>('ready');
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [mergedData, setMergedData] = useState<any[]>([]);
  const [parseProgress, setParseProgress] = useState<ParseProgress>({
    total: 0,
    completed: 0,
    stage: 'reading',
    errors: []
  });

  // State for the final data processing
  const [selectedNameColumn, setSelectedNameColumn] = useState<string | null>(null);
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(1); // Track which row has the actual headers (1-indexed)
  const [baseSelectedNames, setBaseSelectedNames] = useState<string[]>([]); // Original names selected by user
  const [isDetailedViewFullScreen, setIsDetailedViewFullScreen] = useState(false); // New state for full screen

  // State for DetailedDataView that needs to persist across full-screen toggle
  // Load from localStorage on mount
  const [detailedViewColumnVisibility, setDetailedViewColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('excel-processor-column-visibility');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // State for name merging
  const [nameMergeState, setNameMergeState] = useState<NameMergeState>(() => {
    return loadNameMergeState();
  });

  // Derive the actual selected names including merged display names for active groups
  const selectedUniqueNames = useMemo(() => {
    const expandedNames = new Set<string>();

    baseSelectedNames.forEach(name => {
      expandedNames.add(name);

      // Check if this name is part of an active merge group
      const groupId = nameMergeState.nameToGroupId[name];
      if (groupId) {
        const group = nameMergeState.mergeGroups.find(g => g.id === groupId);
        if (group && group.active) {
          // This name is part of an active merge group
          // Include both the original name and the merged display name
          expandedNames.add(group.displayName);
        }
      }
    });

    return Array.from(expandedNames);
  }, [baseSelectedNames, nameMergeState]);

  // Create a new dataset with name merging applied. This is the source of truth for downstream components.
  const dataWithMerging = useMemo(() => {
    if (mergedData.length === 0) return [];
    return applyNameMerging(mergedData, selectedNameColumn, nameMergeState);
  }, [mergedData, selectedNameColumn, nameMergeState]);

  // Wrapper to save column visibility to localStorage whenever it changes
  const handleSetColumnVisibility = (newVisibility: React.SetStateAction<Record<string, boolean>>) => {
    setDetailedViewColumnVisibility((prev) => {
      const updated = typeof newVisibility === 'function' ? newVisibility(prev) : newVisibility;
      try {
        localStorage.setItem('excel-processor-column-visibility', JSON.stringify(updated));
      } catch (error) {
        console.warn('Could not save column visibility to localStorage:', error);
      }
      return updated;
    });
  };

  /**
   * Parse multiple Excel files using batch processing with progress tracking.
   * Processes files in batches of 3 to prevent memory overload and maintain UI responsiveness.
   */
  const handleFilesUpload = async (files: FileList) => {
    setStatus('parsing');
    const fileArray = Array.from(files);

    // Initialize progress state
    setParseProgress({
      total: fileArray.length,
      completed: 0,
      stage: 'reading',
      errors: []
    });

    try {
      // Process files in batches of 3 for optimal performance
      const results = await processInBatches(
        fileArray,
        async (file): Promise<ParsedFile> => {
          // Read file as ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();

          // Detect if file is CSV
          const isCSV = file.name.toLowerCase().endsWith('.csv');

          // Parse Excel/CSV file
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          // Use column-letter headers so header rows remain in data (user can pick which row is header)
          // This keeps behavior consistent across Excel and CSV files
          const sheets = workbook.SheetNames.map(sheetName => ({
            sheetName,
            data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
              header: 'A',      // keys like A, B, C ... so header rows are preserved as data
              defval: '',       // fill empty cells with empty string to avoid undefined
              blankrows: false, // skip completely blank rows
            }),
          }));

          return {
            fileName: file.name,
            sheets: sheets.map(sheet => ({
              ...sheet,
              data: sheet.data as ExcelDataArray
            })),
            isCSV
          };
        },
        {
          concurrency: 3,
          onProgress: (completed) => {
            setParseProgress(prev => ({
              ...prev,
              completed,
              stage: 'parsing'
            }));
          }
        }
      );

      // If one file with one sheet is uploaded, auto-merge and skip selection
      if (results.length === 1 && results[0].sheets.length === 1) {
        const singleSheet = results[0];
        const sheetIdentifier = `${singleSheet.fileName}::${singleSheet.sheets[0].sheetName}`;
        
        // We need to set the parsed files so that the rest of the app can use it
        setParsedFiles(results);
        
        // Directly call merge with the results to avoid state update race conditions
        handleMergeSheets([sheetIdentifier], results);

      } else {
        setParsedFiles(results);
        setStatus('files_uploaded');
      }
    } catch (error) {
      console.error("Error parsing files:", error);
      setStatus('ready');
    }
  };


  const handleMergeSheets = (selectedSheetIdentifiers: string[], files?: ParsedFile[]) => {
    console.log('Merging sheets:', selectedSheetIdentifiers);
    const fileSource = files || parsedFiles; // Use direct files if provided, else from state

    const sheetsToMerge: ExcelRowData[][] = []; // Array of arrays of row objects
    selectedSheetIdentifiers.forEach(identifier => {
      const [fileName, sheetName] = identifier.split('::');
      const file = fileSource.find(f => f.fileName === fileName);
      const sheet = file?.sheets.find(s => s.sheetName === sheetName);
      if (sheet?.data) {
        // Augment each row with source file and sheet name
        const dataWithSource = sheet.data.map(row => ({
          ...row,
          _sourceFileName: fileName,
          _sourceSheetName: sheetName,
        }));
        sheetsToMerge.push(dataWithSource);
      }
    });

    // Union merge logic
    const allHeaders = new Set<string>();
    allHeaders.add('_sourceFileName'); // Add source filename as a default header
    allHeaders.add('_sourceSheetName'); // Add source sheet name as a default header

    sheetsToMerge.flat().forEach(row => {
      Object.keys(row).forEach(header => allHeaders.add(header));
    });

    const combinedData = sheetsToMerge.flat().map(row => {
      const newRow: { [key: string]: any } = {};
      allHeaders.forEach((header) => {
        newRow[header] = (row as Record<string, any>)[header] !== undefined ? (row as Record<string, any>)[header] : null;
      });
      return newRow;
    });

    setMergedData(combinedData);
    console.log('Merged data created. Total rows:', combinedData.length);
    
    // Add a check to prevent error on empty data
    if (combinedData.length > 0) {
      console.log('Sample row:', combinedData[0]);
      console.log('All columns:', Object.keys(combinedData[0]));
    }
    
    setStatus('data_merged');
  };

  const handleCancelMerge = () => {
    setParsedFiles([]);
    setStatus('ready');
  };

  const handleColumnSelect = useCallback((columnName: string, rowIndex: number) => {
    setSelectedNameColumn(columnName);
    setHeaderRowIndex(rowIndex);
    setBaseSelectedNames([]);
    console.log('Selected Name Column:', columnName, 'from row', rowIndex);
  }, []);


  const handleUniqueNamesSelect = useCallback((names: string[]) => {
    // Simply update baseSelectedNames - the derived selectedUniqueNames
    // will automatically include merged display names for active groups
    setBaseSelectedNames(names);
    console.log('Selected Base Names:', names);
  }, []);

  const handleToggleDetailedViewFullScreen = useCallback(() => {
    setIsDetailedViewFullScreen(prev => !prev);
  }, []);

  // Helper to get the actual column name from the header row
  const getActualColumnName = useMemo(() => {
    if (!selectedNameColumn || mergedData.length === 0) return selectedNameColumn;
    const isPlaceholder = (k: string) => /^[A-Z]+$/.test(k) || /^__EMPTY/.test(k);
    if (!isPlaceholder(selectedNameColumn)) return selectedNameColumn;
    const headerRowIdx = headerRowIndex - 1;
    if (headerRowIdx >= 0 && headerRowIdx < mergedData.length) {
      const headerRow = mergedData[headerRowIdx];
      const headerValue = headerRow[selectedNameColumn];
      if (headerValue !== undefined && headerValue !== null && headerValue !== '') {
        return String(headerValue);
      }
    }
    return selectedNameColumn;
  }, [mergedData, selectedNameColumn, headerRowIndex]);

  // Helper to get value from a row, trying both actual name and original key
  const getRowValue = (row: any, originalKey: string | null, actualName: string | null) => {
    if (actualName && actualName in row) return row[actualName];
    if (originalKey) return row[originalKey];
    return undefined;
  };

  // (deprecated) legacy columnMapping removed; see new mapping logic below

  // Compute filtered data for details view
  const filteredData = useMemo(() => {
    if (!selectedNameColumn || selectedUniqueNames.length === 0 || dataWithMerging.length === 0) {
      return [];
    }
    const headerRowIdx = headerRowIndex - 1;

    return dataWithMerging
      .filter((_, idx) => idx !== headerRowIdx) // Exclude header row
      .filter(row => {
        const value = getRowValue(row, selectedNameColumn, getActualColumnName);
        // Check against original name (before merging) or merged display name
        const originalName = row._originalName;
        const mergedDisplayName = row._mergedDisplayName;

        // Check if this row belongs to a merge group that has selected names
        const isInSelectedMergeGroup = mergedDisplayName && nameMergeState.mergeGroups.some(group => {
          if (!group.active) return false;
          if (group.displayName === mergedDisplayName) {
            // If any name in this merge group is selected, include all entries
            return group.originalNames.some(name => selectedUniqueNames.includes(name)) ||
                   selectedUniqueNames.includes(group.displayName);
          }
          return false;
        });

        // Match if: selected name matches current value (merged or not),
        // or if selected name matches the original name before merging,
        // or if this row is in a merge group where one of the names is selected
        return selectedUniqueNames.includes(value) ||
               (originalName && selectedUniqueNames.includes(originalName)) ||
               (mergedDisplayName && selectedUniqueNames.includes(mergedDisplayName)) ||
               isInSelectedMergeGroup;
      });
  }, [dataWithMerging, selectedNameColumn, headerRowIndex, selectedUniqueNames, getActualColumnName, nameMergeState]);

  // Get available unique names for the name merging panel
  const availableUniqueNames = useMemo(() => {
    if (!selectedNameColumn || mergedData.length === 0) {
      return [];
    }
    const headerRowIdx = headerRowIndex - 1;
    const names = new Set<string>();

    mergedData
      .filter((_, idx) => idx !== headerRowIdx)
      .forEach(row => {
        const value = row[selectedNameColumn];
        if (value !== undefined && value !== null && value !== '') {
          names.add(String(value));
        }
      });

    return Array.from(names).sort();
  }, [mergedData, selectedNameColumn, headerRowIndex]);

  // Build a column mapping for DetailedDataView. If keys are already human-readable
  // (not placeholder letters like A, B, C or __EMPTY_*), use identity mapping.
  const columnMapping = useMemo(() => {
    if (mergedData.length === 0) return {};
    const headerRowIdx = headerRowIndex - 1;

    const firstRow = mergedData[0];
    // Exclude all metadata/system keys (starting with underscore) from detection
    const nonMetaKeys = Object.keys(firstRow).filter(k => !k.startsWith('_'));
    const isPlaceholder = (k: string) => /^[A-Z]+$/.test(k) || /^__EMPTY/.test(k);
    const allPlaceholders = nonMetaKeys.length > 0 && nonMetaKeys.every(isPlaceholder);

    const mapping: Record<string, string> = {};

    if (!allPlaceholders) {
      // Keys are already meaningful headers; map identity
      Object.keys(firstRow).forEach(key => { mapping[key] = key; });
      return mapping;
    }

    // Fallback: use selected header row's values to map original keys to display labels
    if (headerRowIdx >= 0 && headerRowIdx < mergedData.length) {
      const headerRow = mergedData[headerRowIdx];
      Object.keys(headerRow).forEach(key => {
        const value = headerRow[key];
        if (value !== undefined && value !== null && value !== '') {
          mapping[key] = String(value);
        } else {
          mapping[key] = key;
        }
      });
      return mapping;
    }

    return mapping;
  }, [mergedData, headerRowIndex]);


  const detailedViewContent = (
    <DetailedDataView
      data={mergedData}
      filteredData={filteredData}
      nameColumn={selectedNameColumn}
      headerRowIndex={headerRowIndex}
      selectedUniqueNames={selectedUniqueNames}
      onToggleFullScreen={handleToggleDetailedViewFullScreen}
      isFullScreen={isDetailedViewFullScreen}
      columnVisibility={detailedViewColumnVisibility}
      setColumnVisibility={handleSetColumnVisibility}
      columnMapping={columnMapping}
    />
  );


  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          {t('app.title')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('app.version')} {APP_VERSION} • {t('app.lastUpdated')}: {__BUILD_TIME__}
          </Typography>
          <LanguageSwitcher />
        </Box>

        <ExcelUploader onFilesUpload={handleFilesUpload} disabled={status === 'parsing'} />

        {status === 'parsing' && (
          <>
            <FileProgressIndicator progress={parseProgress} />
            <CircularProgress sx={{ mt: 2 }} />
          </>
        )}

        {status === 'files_uploaded' && (
          <SheetSelector
            files={parsedFiles}
            onMerge={handleMergeSheets}
            onCancel={handleCancelMerge}
          />
        )}

        {status === 'data_merged' && mergedData.length > 0 && (
          <Box sx={{ mt: 4, width: '100%' }}>
            <Typography variant="h5" gutterBottom>{t('mergedData.title')}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {t('mergedData.rowsCombined', { count: mergedData.length })}
            </Typography>
            <ColumnSelector data={mergedData} onColumnSelect={handleColumnSelect} />

            {selectedNameColumn && (
              <>
                <UniqueNameList
                  data={mergedData}
                  nameColumn={selectedNameColumn}
                  headerRowIndex={headerRowIndex}
                  selectedNames={selectedUniqueNames}
                  onNamesSelect={handleUniqueNamesSelect}
                />

                {/* Name Merging Panel */}
                <Box sx={{ mt: 2, mb: 2 }}>
                  <NameMergingPanel
                    availableNames={availableUniqueNames}
                    mergeState={nameMergeState}
                    onMergeStateChange={setNameMergeState}
                  />
                </Box>
              </>
            )}

            {selectedUniqueNames.length > 0 && selectedNameColumn && (
              // Render DetailedDataView normally if not full screen
              !isDetailedViewFullScreen && detailedViewContent
            )}
          </Box>
        )}

        {/* Full screen dialog for DetailedDataView */}
        <Dialog
          fullScreen
          open={isDetailedViewFullScreen}
          onClose={handleToggleDetailedViewFullScreen}
        >
          <DialogTitle sx={{ m: 0, p: 2 }}>
            {t('detailedView.fullScreen')}
            <IconButton
              aria-label={t('detailedView.close')}
              onClick={handleToggleDetailedViewFullScreen}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
             {/* Render DetailedDataView inside the dialog */}
            {detailedViewContent}
          </Box>
        </Dialog>
      </Box>
    </Container>
  );
}

export default App;
