import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ExcelUploader from './ExcelUploader';

describe('ExcelUploader - File Removal Bug', () => {
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
    const deleteButtons = container.querySelectorAll('[aria-label="Delete"]') as NodeListOf<HTMLElement>;
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

    // Remove file
    const deleteButtons = container.querySelectorAll('[aria-label="Delete"]') as NodeListOf<HTMLElement>;
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);

      // Verify empty FileList was sent
      const afterRemoveFiles = onFilesUpload.mock.calls[1][0] as FileList;
      expect(afterRemoveFiles.length).toBe(0);
    }

    // Upload new file - this should work correctly now
    const file2 = new File([fileContent], 'test2.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(input, { target: { files: [file2] } });

    expect(onFilesUpload).toHaveBeenCalledTimes(2);
    const newUploadFiles = onFilesUpload.mock.calls[1][0] as FileList;
    expect(newUploadFiles.length).toBe(1);
    expect(newUploadFiles[0].name).toBe('test2.xlsx');
    expect(newUploadFiles[0].size).toBe(fileContent.length);
  });
});
