import React, { useState } from 'react';
import ExcelUploader from './components/ExcelUploader';
import ColumnSelector from './components/ColumnSelector';
import UniqueNameList from './components/UniqueNameList';
import DetailedDataView from './components/DetailedDataView';
import SheetSelector from './components/SheetSelector'; // Import SheetSelector

import { Container, CssBaseline, Box, Typography, CircularProgress, Dialog, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import type { ParsedFile, ParsedSheet } from './types.ts'; // Import from new types file
import * as XLSX from 'xlsx'; // Import xlsx library

type AppStatus = 'ready' | 'parsing' | 'files_uploaded' | 'data_merged';

function App() {
  // State for the new multi-file workflow
  const [status, setStatus] = useState<AppStatus>('ready');
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [mergedData, setMergedData] = useState<any[]>([]);

  // State for the final data processing
  const [selectedNameColumn, setSelectedNameColumn] = useState<string | null>(null);
  const [selectedUniqueNames, setSelectedUniqueNames] = useState<string[]>([]);
  const [isDetailedViewFullScreen, setIsDetailedViewFullScreen] = useState(false); // New state for full screen

  // New handler to parse multiple files
  const handleFilesUpload = async (files: FileList) => {
    setStatus('parsing');
    const filePromises = Array.from(files).map(file => {
      return new Promise<ParsedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheets = workbook.SheetNames.map(sheetName => ({
              sheetName,
              data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]),
            }));
            resolve({ fileName: file.name, sheets });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    });

    try {
      const allParsedFiles = await Promise.all(filePromises);
      setParsedFiles(allParsedFiles);
      setStatus('files_uploaded');
    } catch (error) {
      console.error("Error parsing one or more files:", error);
      setStatus('ready'); // Reset status on error
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
      allHeaders.forEach(header => {
        newRow[header] = row[header] !== undefined ? row[header] : null;
      });
      return newRow;
    });

    setMergedData(combinedData);
    setStatus('data_merged');
  };

  const handleCancelMerge = () => {
    setParsedFiles([]);
    setStatus('ready');
  };

  const handleColumnSelect = (columnName: string) => {
    setSelectedNameColumn(columnName);
    setSelectedUniqueNames([]);
    console.log('Selected Name Column:', columnName);
  };


  const handleUniqueNamesSelect = (names: string[]) => {
    setSelectedUniqueNames(names);
    console.log('Selected Unique Names:', names);
  };

  const handleToggleDetailedViewFullScreen = () => {
    setIsDetailedViewFullScreen(prev => !prev);
  };


  const detailedViewContent = (
    <DetailedDataView
      data={mergedData}
      nameColumn={selectedNameColumn}
      selectedUniqueNames={selectedUniqueNames}
      onToggleFullScreen={handleToggleDetailedViewFullScreen} // Pass the toggle function
      isFullScreen={isDetailedViewFullScreen} // Pass current full screen state
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

        <ExcelUploader onFilesUpload={handleFilesUpload} disabled={status === 'parsing'} />

        {status === 'parsing' && <CircularProgress sx={{ mt: 4 }} />}

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
            <Typography variant="h6">Detailed Data View (Full Screen)</Typography>
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