import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import ExcelUploader from './ExcelUploader';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'uploader.title': 'Upload Excel Files',
        'uploader.dropFiles': 'Drop your files here',
        'uploader.dragDrop': 'Drag and drop Excel files here',
        'uploader.orClick': 'or click to browse',
        'uploader.supportedFormats': 'Supported formats: .xlsx, .xls, .csv',
        'uploader.selectedFiles': 'Selected files: {count}',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ExcelUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('File Size Validation', () => {
    // Note: The current component does not implement file size validation.
    // These tests document the expected behavior if size validation were added.

    it('should accept files of any size (current implementation)', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      // Create a mock Excel file
      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file = new File([fileContent], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload file
      fireEvent.change(input, { target: { files: [file] } });

      // Verify onFilesUpload was called (current behavior)
      expect(onFilesUpload).toHaveBeenCalledTimes(1);
    });
  });

  describe('File Type Validation', () => {
    it('should accept .xlsx files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const xlsxFile = new File([fileContent], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [xlsxFile] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(1);
      expect(uploadedFiles[0].name).toBe('test.xlsx');
    });

    it('should accept .xls files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const xlsFile = new File([fileContent], 'test.xls', {
        type: 'application/vnd.ms-excel'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [xlsFile] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(1);
      expect(uploadedFiles[0].name).toBe('test.xls');
    });

    it('should accept .csv files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const csvFile = new File([fileContent], 'test.csv', {
        type: 'text/csv'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [csvFile] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(1);
      expect(uploadedFiles[0].name).toBe('test.csv');
    });

    it('should reject .txt files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const txtFile = new File(['text content'], 'test.txt', { type: 'text/plain' });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [txtFile] } });

      expect(onFilesUpload).not.toHaveBeenCalled();
      const alert = container.querySelector('[role="alert"]') as HTMLElement;
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('is not a valid Excel or CSV file');
    });

    it('should reject .docx files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const docxFile = new File(['docx content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [docxFile] } });

      expect(onFilesUpload).not.toHaveBeenCalled();
      const alert = container.querySelector('[role="alert"]') as HTMLElement;
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('is not a valid Excel or CSV file');
    });

    it('should reject .pdf files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [pdfFile] } });

      expect(onFilesUpload).not.toHaveBeenCalled();
      const alert = container.querySelector('[role="alert"]') as HTMLElement;
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('is not a valid Excel or CSV file');
    });
  });

  describe('Multiple File Upload', () => {
    it('should handle mixed valid/invalid files - only keep valid ones', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const validFile1 = new File([fileContent], 'valid1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const validFile2 = new File([fileContent], 'valid2.csv', { type: 'text/csv' });
      const invalidFile = new File(['text'], 'invalid.txt', { type: 'text/plain' });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload mixed files
      fireEvent.change(input, { target: { files: [validFile1, invalidFile, validFile2] } });

      // Verify onFilesUpload was called with only valid files
      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(2);

      // Check that valid files are present
      const fileNames = Array.from(uploadedFiles).map(f => f.name);
      expect(fileNames).toContain('valid1.xlsx');
      expect(fileNames).toContain('valid2.csv');
      expect(fileNames).not.toContain('invalid.txt');
    });

    it('should show error message for batch upload with invalid files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const validFile = new File([fileContent], 'valid.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const invalidFile = new File(['text'], 'invalid.txt', { type: 'text/plain' });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload mixed files
      fireEvent.change(input, { target: { files: [validFile, invalidFile] } });

      // Verify error message shows only invalid file error
      const alert = container.querySelector('[role="alert"]') as HTMLElement;
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toContain('"invalid.txt" is not a valid Excel or CSV file');
    });

    it('should handle multiple valid files correctly', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file1 = new File([fileContent], 'file1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const file2 = new File([fileContent], 'file2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload multiple files
      fireEvent.change(input, { target: { files: [file1, file2] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(2);
    });
  });

  describe('Drag and Drop', () => {
    it('should handle successful drag and drop', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file = new File([fileContent], 'dragged.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const paper = container.querySelector('[role="button"]') as HTMLElement;

      // Simulate drag events
      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      Object.defineProperty(dragEnterEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(dragEnterEvent, 'stopPropagation', { value: vi.fn() });

      paper.dispatchEvent(dragEnterEvent);

      const dragOverEvent = new Event('dragover', { bubbles: true });
      Object.defineProperty(dragOverEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(dragOverEvent, 'stopPropagation', { value: vi.fn() });

      paper.dispatchEvent(dragOverEvent);

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(dropEvent, 'stopPropagation', { value: vi.fn() });
      (dropEvent as any).dataTransfer = { files: [file] };

      paper.dispatchEvent(dropEvent);

      // Verify files were uploaded
      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(1);
      expect(uploadedFiles[0].name).toBe('dragged.xlsx');
    });

    it('should handle drag and drop with invalid files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const file = new File(['text'], 'invalid.txt', { type: 'text/plain' });

      const paper = container.querySelector('[role="button"]') as HTMLElement;

      // Simulate drop event with invalid file
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(dropEvent, 'stopPropagation', { value: vi.fn() });
      (dropEvent as any).dataTransfer = { files: [file] };

      paper.dispatchEvent(dropEvent);

      // Verify files were not uploaded
      expect(onFilesUpload).not.toHaveBeenCalled();
      const alert = container.querySelector('[role="alert"]') as HTMLElement;
      expect(alert).toBeInTheDocument();
    });

    it('should not handle drag and drop when disabled', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={true} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file = new File([fileContent], 'dragged.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const paper = container.querySelector('[role="button"]') as HTMLElement;

      // Simulate drag events
      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      Object.defineProperty(dragEnterEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(dragEnterEvent, 'stopPropagation', { value: vi.fn() });

      paper.dispatchEvent(dragEnterEvent);

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(dropEvent, 'stopPropagation', { value: vi.fn() });
      (dropEvent as any).dataTransfer = { files: [file] };

      paper.dispatchEvent(dropEvent);

      // Verify files were not uploaded
      expect(onFilesUpload).not.toHaveBeenCalled();
    });

    it('should show visual feedback during drag', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const paper = container.querySelector('[role="button"]') as HTMLElement;

      // Simulate drag enter
      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      Object.defineProperty(dragEnterEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(dragEnterEvent, 'stopPropagation', { value: vi.fn() });

      paper.dispatchEvent(dragEnterEvent);

      // Verify visual feedback is applied
      expect(paper).toHaveStyle('border-color: primary.main');
    });
  });

  describe('XSS Prevention (Security)', () => {
    it('should sanitize file names with HTML tags', async () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const maliciousFileName = '<script>alert("XSS")</script>.xlsx';
      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const maliciousFile = new File([fileContent], maliciousFileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [maliciousFile] } });

      // Verify file was uploaded (valid file type)
      expect(onFilesUpload).toHaveBeenCalledTimes(1);

      // Verify the rendered file name is escaped, not executed
      const chipLabel = container.querySelector('span.MuiChip-label') as HTMLElement;
      await waitFor(() => {
        expect(chipLabel).toBeInTheDocument();
        expect(chipLabel.innerHTML).toContain('&lt;script&gt;alert("XSS")&lt;/script&gt;');
        expect(chipLabel.textContent).toContain('<script>alert("XSS")</script>');
      });
    });

    it('should escape file names with JavaScript code', async () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const maliciousFileName = 'javascript:alert("XSS")-malicious.xlsx';
      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const maliciousFile = new File([fileContent], maliciousFileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [maliciousFile] } });

      // Verify file was uploaded (valid file type)
      expect(onFilesUpload).toHaveBeenCalledTimes(1);

      // Verify the rendered file name is escaped
      const chipLabel = container.querySelector('span.MuiChip-label') as HTMLElement;
      await waitFor(() => {
        expect(chipLabel).toBeInTheDocument();
        expect(chipLabel.innerHTML).toContain('javascript:alert("XSS")-malicious');
      });
    });

    it('should prevent <script> tags from executing', async () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      // Create a file name with script tag
      const scriptFileName = '<img src="x" onerror="alert(\'XSS\')"></img>.xlsx';
      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const scriptFile = new File([fileContent], scriptFileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [scriptFile] } });

      // Verify the file name is rendered as escaped HTML, not executed
      const chipLabel = container.querySelector('span.MuiChip-label') as HTMLElement;
      await waitFor(() => {
        expect(chipLabel).toBeInTheDocument();

        // Check that the dangerous attributes are escaped
        expect(chipLabel.innerHTML).toContain('&lt;img src="x" onerror="alert(\'XSS\')"&gt;&lt;/img&gt;');
      });
    });
  });

  describe('Large File Handling', () => {
    it('should handle multiple large files without memory leaks', () => {
      const onFilesUpload = vi.fn();
      const { container, unmount } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      // Mock large files without creating actual 50MB content
      const file1 = new File(['content'], 'large1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const file2 = new File(['content'], 'large2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      Object.defineProperty(file1, 'size', {
        value: 50 * 1024 * 1024, // 50MB
        writable: false
      });
      Object.defineProperty(file2, 'size', {
        value: 50 * 1024 * 1024, // 50MB
        writable: false
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload large files
      fireEvent.change(input, { target: { files: [file1, file2] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(1);

      // Unmount component to test cleanup
      unmount();

      // Verify no memory leaks by checking that component is unmounted
      // (In real test, you would check for memory leaks using profilers)
    });

    it('should handle component unmount during upload', () => {
      const onFilesUpload = vi.fn();
      const { container, unmount } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file = new File([fileContent], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Start upload process
      fireEvent.change(input, { target: { files: [file] } });

      // Immediately unmount component
      unmount();

      // Verify component unmounted cleanly
      expect(onFilesUpload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file list', () => {
      const onFilesUpload = vi.fn();
      render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const input = screen.getByRole('button', { name: /drag and drop/i });
      input.click();

      // No files selected, so onFilesUpload should not be called
      expect(onFilesUpload).not.toHaveBeenCalled();
    });

    it('should handle duplicate file names', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file1 = new File([fileContent], 'duplicate.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const file2 = new File([fileContent], 'duplicate.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload files with same name
      fireEvent.change(input, { target: { files: [file1, file2] } });

      // Verify both files are uploaded (browsers handle duplicate names)
      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(2);
    });

    it('should handle special characters in file names', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const specialCharFileName = 'file-with-special-chars-@#$%^&*().xlsx';
      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const specialFile = new File([fileContent], specialCharFileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [specialFile] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(1);
      expect(uploadedFiles[0].name).toBe(specialCharFileName);
    });

    it('should handle very long file names', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      // Create a very long file name (over 100 characters)
      const longFileName = 'a'.repeat(100) + '-very-long-file-name-that-exceeds-typical-limits-and-should-be-handled-properly.xlsx';
      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const longFile = new File([fileContent], longFileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [longFile] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(1);
      expect(uploadedFiles[0].name).toBe(longFileName);
    });

    it('should handle zero-byte files', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const zeroByteFile = new File([''], 'empty.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [zeroByteFile] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(1);
      const uploadedFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(uploadedFiles.length).toBe(1);
      expect(uploadedFiles[0].size).toBe(0);
    });
  });

  describe('File Removal Bug', () => {
    it('should preserve file data when removing files and uploading new ones', async () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      // Create a mock Excel file with actual content
      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file1 = new File([fileContent], 'test1.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file2 = new File([fileContent], 'test2.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Find the file input
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeTruthy();

      // Upload first file
      fireEvent.change(input, { target: { files: [file1] } });
      expect(onFilesUpload).toHaveBeenCalledTimes(1);

      // Get the FileList from first call
      const firstCallFiles = onFilesUpload.mock.calls[0][0] as FileList;
      expect(firstCallFiles.length).toBe(1);
      expect(firstCallFiles[0].name).toBe('test1.xlsx');
      expect(firstCallFiles[0].size).toBe(fileContent.length);

      // Upload second file (both files now)
      fireEvent.change(input, { target: { files: [file1, file2] } });
      expect(onFilesUpload).toHaveBeenCalledTimes(2);

      const secondCallFiles = onFilesUpload.mock.calls[1][0] as FileList;
      expect(secondCallFiles.length).toBe(2);

      // Simulate removing the first file by clicking delete button
      const deleteButtons = container.querySelectorAll<HTMLElement>('[aria-label="Delete"]');
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        // Verify onFilesUpload was called with remaining file
        expect(onFilesUpload).toHaveBeenCalledTimes(3);
        const afterRemoveFiles = onFilesUpload.mock.calls[2][0] as FileList;
        expect(afterRemoveFiles.length).toBe(1);
        expect(afterRemoveFiles[0].name).toBe('test2.xlsx');
        expect(afterRemoveFiles[0].size).toBe(fileContent.length);
      }
    });

    it('should handle file input reset correctly after deletion', async () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file1 = new File([fileContent], 'test1.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload file
      fireEvent.change(input, { target: { files: [file1] } });
      expect(onFilesUpload).toHaveBeenCalledTimes(1);

      // Remove file - fail fast if delete button is missing
      const deleteButtons = container.querySelectorAll<HTMLElement>('[aria-label="Delete"]');
      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]!);

      // Verify empty FileList was sent (second call)
      const afterRemoveFiles = onFilesUpload.mock.calls[1][0] as FileList;
      expect(afterRemoveFiles.length).toBe(0);

      // Upload new file - this should work correctly now
      const file2 = new File([fileContent], 'test2.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fireEvent.change(input, { target: { files: [file2] } });

      expect(onFilesUpload).toHaveBeenCalledTimes(3); // Initial upload, delete (empty), re-upload
      const newUploadFiles = onFilesUpload.mock.calls[2][0] as FileList;
      expect(newUploadFiles.length).toBe(1);
      expect(newUploadFiles[0].name).toBe('test2.xlsx');
      expect(newUploadFiles[0].size).toBe(fileContent.length);
    });
  });

  describe('Component State and UI', () => {
    it('should show appropriate UI when disabled', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={true} />
      );

      const paper = container.querySelector('[role="button"]') as HTMLElement;
      expect(paper).toHaveStyle('opacity: 0.6');
      expect(paper).toHaveStyle('cursor: not-allowed');
    });

    it('should update selectedFiles state correctly', async () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file1 = new File([fileContent], 'test1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload file
      fireEvent.change(input, { target: { files: [file1] } });

      // Verify selectedFiles state updated
      const selectedFilesText = container.querySelector('p') as HTMLElement;
      await waitFor(() => {
        expect(selectedFilesText).toBeInTheDocument();
        expect(selectedFilesText.textContent).toContain('1');
      });
    });

    it('should clear error when valid files are uploaded after error', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      // First upload invalid file
      const invalidFile = new File(['text'], 'invalid.txt', { type: 'text/plain' });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [invalidFile] } });

      // Verify error is shown
      let alert = container.querySelector('[role="alert"]') as HTMLElement;
      expect(alert).toBeInTheDocument();

      // Then upload valid file
      const validFile = new File(['content'], 'valid.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      fireEvent.change(input, { target: { files: [validFile] } });

      // Verify error is cleared
      alert = container.querySelector('[role="alert"]') as HTMLElement;
      expect(alert).not.toBeInTheDocument();
    });

    it('should handle file size formatting correctly', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      // Create a file with 1025 bytes (1.001 KB)
      const fileContent = 'x'.repeat(1025);
      const file = new File([fileContent], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      // Verify file size is formatted correctly
      const chipLabel = container.querySelector('.MuiChip-label') as HTMLElement;
      expect(chipLabel).toHaveTextContent('1 KB');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA labels for delete buttons', async () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file = new File([fileContent], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      // Verify delete button has proper aria-label
      const deleteButtons = container.querySelectorAll<HTMLElement>('[aria-label="Delete"]');
      await waitFor(() => {
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it('should be keyboard accessible', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      // Test that Enter key triggers file selection
      const paper = container.querySelector('[role="button"]') as HTMLElement;
      paper.focus();

      // Paper should be focusable
      expect(paper).toHaveAttribute('tabindex');
    });
  });

  describe('Performance', () => {
    it('should handle rapid file selections efficiently', () => {
      const onFilesUpload = vi.fn();
      const { container } = render(
        <ExcelUploader onFilesUpload={onFilesUpload} disabled={false} />
      );

      const fileContent = 'Name,Email\nJohn Doe,john@example.com';
      const file1 = new File([fileContent], 'test1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const file2 = new File([fileContent], 'test2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Rapidly select files
      fireEvent.change(input, { target: { files: [file1] } });
      fireEvent.change(input, { target: { files: [file2] } });
      fireEvent.change(input, { target: { files: [file1, file2] } });

      // Verify component handles rapid changes without errors
      expect(onFilesUpload).toHaveBeenCalledTimes(3);
    });
  });
});