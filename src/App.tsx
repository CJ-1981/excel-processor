import { useState, useCallback } from 'react';
import ExcelUploader from './components/ExcelUploader';
import ColumnSelector from './components/ColumnSelector';
import UniqueNameList from './components/UniqueNameList';
import DetailedDataView from './components/DetailedDataView';
import SheetSelector from './components/SheetSelector';
import FileProgressIndicator from './components/FileProgressIndicator';

import { Container, CssBaseline, Box, Typography, CircularProgress, Dialog, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import type { ParsedFile, ParseProgress } from './types';
import * as XLSX from 'xlsx';
import { processInBatches } from './utils/batchProcessor';

type AppStatus = 'ready' | 'parsing' | 'files_uploaded' | 'data_merged';

function App() {
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
  const [selectedUniqueNames, setSelectedUniqueNames] = useState<string[]>([]);
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

          // Parse Excel file
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheets = workbook.SheetNames.map(sheetName => ({
            sheetName,
            data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]),
          }));

          return { fileName: file.name, sheets };
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

      setParsedFiles(results);
      setStatus('files_uploaded');

    } catch (error) {
      console.error("Error parsing files:", error);
      setStatus('ready');
    }
  };


  const handleMergeSheets = (selectedSheetIdentifiers: string[]) => {
    console.log('Merging sheets:', selectedSheetIdentifiers);

    const sheetsToMerge: any[][][] = []; // Changed to array of arrays of objects
    selectedSheetIdentifiers.forEach(identifier => {
      const [fileName, sheetName] = identifier.split('::');
      const file = parsedFiles.find(f => f.fileName === fileName);
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
    console.log('Sample row:', combinedData[0]);
    console.log('All columns:', Object.keys(combinedData[0]));
    setStatus('data_merged');
  };

  const handleCancelMerge = () => {
    setParsedFiles([]);
    setStatus('ready');
  };

  const handleColumnSelect = useCallback((columnName: string, rowIndex: number) => {
    setSelectedNameColumn(columnName);
    setHeaderRowIndex(rowIndex);
    setSelectedUniqueNames([]);
    console.log('Selected Name Column:', columnName, 'from row', rowIndex);
  }, []);


  const handleUniqueNamesSelect = useCallback((names: string[]) => {
    setSelectedUniqueNames(names);
    console.log('Selected Unique Names:', names);
  }, []);

  const handleToggleDetailedViewFullScreen = useCallback(() => {
    setIsDetailedViewFullScreen(prev => !prev);
  }, []);


  const detailedViewContent = (
    <DetailedDataView
      data={mergedData}
      nameColumn={selectedNameColumn}
      headerRowIndex={headerRowIndex}
      selectedUniqueNames={selectedUniqueNames}
      onToggleFullScreen={handleToggleDetailedViewFullScreen}
      isFullScreen={isDetailedViewFullScreen}
      columnVisibility={detailedViewColumnVisibility}
      setColumnVisibility={handleSetColumnVisibility}
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
          Excel Data Processor
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          v1.0.1 • Last updated: {__BUILD_TIME__}
        </Typography>

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
            <Typography variant="h5" gutterBottom>Merged Data</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {mergedData.length} rows combined.
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
            Detailed Data View (Full Screen)
            <IconButton
              aria-label="close"
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