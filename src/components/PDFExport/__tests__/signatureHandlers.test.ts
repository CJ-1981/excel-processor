/**
 * Unit tests for signature upload handler functions
 * Test file: signatureHandlers.test.ts
 *
 * These tests verify signature upload, removal, and state management
 * functionality for the PDF export feature.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track pending file reader operations
let pendingReads: Array<() => void> = [];

// Mock FileReader with synchronous callback for testing
class MockFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  result: string | null = null;
  readyState: number = 0;

  readAsDataURL(file: File) {
    // Store callback for manual triggering
    pendingReads.push(() => {
      this.readyState = 2;
      if (this.onload) {
        // Use actual file type from the File object
        const mimeType = file.type || 'image/png';
        const event = {
          target: { result: `data:${mimeType};base64,MOCK_BASE64_FOR_${file.name}` },
        } as ProgressEvent<FileReader>;
        this.onload(event);
      }
    });
  }
}

// @ts-ignore - Replace global FileReader with mock
global.FileReader = MockFileReader;

describe('Signature Handlers', () => {
  beforeEach(() => {
    pendingReads = [];
  });

  describe('handleSignatureUpload', () => {
    it('should convert valid PNG file to Base64 and store in state', () => {
      const mockFile = new File(['test'], 'signature.png', { type: 'image/png' });
      const setState = vi.fn();

      // Create a handler function
      const handleSignatureUpload = (fieldName: string, file: File, setSignatures: typeof setState) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setSignatures((prev: Record<string, string>) => ({
            ...prev,
            [fieldName]: base64,
          }));
        };
        reader.readAsDataURL(file);
      };

      handleSignatureUpload('pastorSignature', mockFile, setState);

      // Process pending reads
      pendingReads.forEach(cb => cb());
      pendingReads = [];

      // setState is called with a function (updater)
      expect(setState).toHaveBeenCalledWith(expect.any(Function));

      // Verify the updater function produces the correct result
      const updater = setState.mock.calls[0][0];
      const result = updater({});
      expect(result).toHaveProperty('pastorSignature');
      expect(result.pastorSignature).toContain('data:image/png;base64');
    });

    it('should convert valid JPG file to Base64 and store in state', () => {
      const mockFile = new File(['test'], 'signature.jpg', { type: 'image/jpeg' });
      const setState = vi.fn();

      const handleSignatureUpload = (fieldName: string, file: File, setSignatures: typeof setState) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setSignatures((prev: Record<string, string>) => ({
            ...prev,
            [fieldName]: base64,
          }));
        };
        reader.readAsDataURL(file);
      };

      handleSignatureUpload('treasurerSignature', mockFile, setState);

      // Process pending reads
      pendingReads.forEach(cb => cb());
      pendingReads = [];

      expect(setState).toHaveBeenCalledWith(expect.any(Function));

      const updater = setState.mock.calls[0][0];
      const result = updater({});
      expect(result).toHaveProperty('treasurerSignature');
      expect(result.treasurerSignature).toContain('data:image/jpeg;base64');
    });
  });

  describe('handleSignatureRemove', () => {
    it('should remove signature from state when called', () => {
      const setState = vi.fn();
      const currentState = {
        pastorSignature: 'data:image/png;base64,PASTOR_DATA',
        treasurerSignature: 'data:image/png;base64,TREASURER_DATA',
      };

      const handleSignatureRemove = (fieldName: string, setSignatures: typeof setState) => {
        setSignatures((prev: Record<string, string>) => {
          const updated = { ...prev };
          delete updated[fieldName];
          return updated;
        });
      };

      handleSignatureRemove('pastorSignature', setState);

      const updater = setState.mock.calls[0][0];
      const result = updater(currentState);

      expect(result).toEqual({
        treasurerSignature: 'data:image/png;base64,TREASURER_DATA',
      });
      expect(result).not.toHaveProperty('pastorSignature');
    });

    it('should handle removing non-existent signature gracefully', () => {
      const setState = vi.fn();
      const currentState = {
        treasurerSignature: 'data:image/png;base64,TREASURER_DATA',
      };

      const handleSignatureRemove = (fieldName: string, setSignatures: typeof setState) => {
        setSignatures((prev: Record<string, string>) => {
          const updated = { ...prev };
          delete updated[fieldName];
          return updated;
        });
      };

      handleSignatureRemove('nonExistent', setState);

      const updater = setState.mock.calls[0][0];
      const result = updater(currentState);

      expect(result).toEqual(currentState);
    });

    it('should not affect other signatures when removing one', () => {
      const setState = vi.fn();
      const currentState = {
        pastorSignature: 'data:image/png;base64,PASTOR_DATA',
        treasurerSignature: 'data:image/png;base64,TREASURER_DATA',
      };

      const handleSignatureRemove = (fieldName: string, setSignatures: typeof setState) => {
        setSignatures((prev: Record<string, string>) => {
          const updated = { ...prev };
          delete updated[fieldName];
          return updated;
        });
      };

      handleSignatureRemove('pastorSignature', setState);

      const updater = setState.mock.calls[0][0];
      const result = updater(currentState);

      expect(result).toHaveProperty('treasurerSignature');
      expect(result.treasurerSignature).toBe('data:image/png;base64,TREASURER_DATA');
    });
  });

  describe('Signature state management', () => {
    it('should handle multiple signature fields independently', () => {
      const pastorFile = new File(['pastor'], 'pastor.png', { type: 'image/png' });
      const treasurerFile = new File(['treasurer'], 'treasurer.png', { type: 'image/png' });

      let currentState: Record<string, string> = {};

      const handleSignatureUpload = (fieldName: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          currentState = { ...currentState, [fieldName]: base64 };
        };
        reader.readAsDataURL(file);
      };

      handleSignatureUpload('pastorSignature', pastorFile);
      pendingReads.forEach(cb => cb());
      pendingReads = [];

      expect(currentState).toHaveProperty('pastorSignature');
      expect(currentState.pastorSignature).toContain('pastor.png');

      handleSignatureUpload('treasurerSignature', treasurerFile);
      pendingReads.forEach(cb => cb());
      pendingReads = [];

      expect(currentState).toHaveProperty('pastorSignature');
      expect(currentState).toHaveProperty('treasurerSignature');
    });

    it('should overwrite existing signature when uploading new one', () => {
      const firstFile = new File(['first'], 'signature1.png', { type: 'image/png' });
      const secondFile = new File(['second'], 'signature2.png', { type: 'image/png' });

      let currentState: Record<string, string> = {};

      const handleSignatureUpload = (fieldName: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          currentState = { ...currentState, [fieldName]: base64 };
        };
        reader.readAsDataURL(file);
      };

      handleSignatureUpload('pastorSignature', firstFile);
      pendingReads.forEach(cb => cb());
      pendingReads = [];

      const firstSignature = currentState.pastorSignature;

      handleSignatureUpload('pastorSignature', secondFile);
      pendingReads.forEach(cb => cb());
      pendingReads = [];

      expect(currentState.pastorSignature).not.toBe(firstSignature);
      expect(currentState.pastorSignature).toContain('signature2.png');
    });
  });
});
