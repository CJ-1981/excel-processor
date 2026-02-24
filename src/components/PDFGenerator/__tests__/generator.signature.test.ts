/**
 * Unit tests for signature image rendering functionality
 * Test file: generator.signature.test.ts
 *
 * These tests verify the renderSignatureImage function which handles
 * rendering of signature images on PDF documents.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jsPDF from 'jspdf';

// Mock the pdfFonts module to avoid loading actual fonts
vi.mock('../../utils/pdfFonts', () => ({
  loadKoreanFont: vi.fn(() => Promise.resolve()),
  containsKorean: vi.fn(() => false),
  setFontForText: vi.fn(() => {}),
  isKoreanFontLoaded: vi.fn(() => false),
}));

describe('renderSignatureImage', () => {
  let doc: jsPDF;
  let mockContext: any;

  beforeEach(() => {
    // Create a new jsPDF instance for each test
    doc = new jsPDF({
      orientation: 'portrait',
      format: 'a4',
    });

    // Mock context with custom fields
    mockContext = {
      data: [],
      visibleHeaders: [],
      includedIndices: new Set(),
      columnTotals: {},
      selectedNames: [],
      sourceFiles: [],
      sourceSheets: [],
      customFields: {},
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('valid signature data', () => {
    it('should render image with Base64 data URL', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        width: 50,
        height: 30,
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      renderSignatureImage(doc, section, mockContext);

      expect(addImageSpy).toHaveBeenCalledWith(
        section.imageData,
        '', // Empty string for Data URL auto-detection
        section.x,
        section.y,
        section.width,
        section.height,
        undefined,
        undefined,
        0  // No rotation (0 degrees)
      );
    });

    it('should render with rotation when specified', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        width: 50,
        height: 30,
        rotation: 90,  // 90 degrees clockwise
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      renderSignatureImage(doc, section, mockContext);

      // Verify rotation is converted to radians (90 degrees = PI/2 radians)
      expect(addImageSpy).toHaveBeenCalledWith(
        section.imageData,
        '',
        section.x,
        section.y,
        section.width,
        section.height,
        undefined,
        undefined,
        Math.PI / 2  // 90 degrees in radians
      );
    });

    it('should render image from custom fields using fieldName', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        width: 50,
        height: 30,
        fieldName: 'pastorSignature',
      };

      mockContext.customFields = {
        pastorSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      renderSignatureImage(doc, section, mockContext);

      expect(addImageSpy).toHaveBeenCalledWith(
        mockContext.customFields.pastorSignature,
        '',
        section.x,
        section.y,
        section.width,
        section.height,
        undefined,
        undefined,
        0  // No rotation
      );
    });

    it('should use default width and height when not specified', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      renderSignatureImage(doc, section, mockContext);

      expect(addImageSpy).toHaveBeenCalledWith(
        expect.any(String),
        '',
        section.x,
        section.y,
        50, // Default width
        30, // Default height
        undefined,
        undefined,
        0  // No rotation
      );
    });

    it('should substitute variables in imageData', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        imageData: 'data:image/png;base64,{{customFields.testVar}}',
      };

      mockContext.customFields = {
        testVar: 'TEST_IMAGE_DATA',
      };

      renderSignatureImage(doc, section, mockContext);

      expect(addImageSpy).toHaveBeenCalledWith(
        'data:image/png;base64,TEST_IMAGE_DATA',
        '',
        section.x,
        section.y,
        50, // Default width
        30, // Default height
        undefined,
        undefined,
        0  // No rotation
      );
    });

    it('should skip rendering when imageData is missing', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        fieldName: 'nonExistentSignature',
      };

      mockContext.customFields = {};

      renderSignatureImage(doc, section, mockContext);

      expect(addImageSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No image data found for signature field')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should skip rendering when custom field does not exist', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        fieldName: 'nonExistentSignature',
      };

      mockContext.customFields = {
        otherField: 'some data',
      };

      renderSignatureImage(doc, section, mockContext);

      expect(addImageSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No image data found for signature field')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle invalid Base64 data gracefully', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => {
        throw new Error('Invalid base64 data');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        imageData: 'invalid-base64-data',
      };

      renderSignatureImage(doc, section, mockContext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to render signature image'),
        expect.any(Error)
      );

      addImageSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should default to fieldName "signatureImage" when not specified', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
      };

      mockContext.customFields = {
        someOtherField: 'data',
      };

      renderSignatureImage(doc, section, mockContext);

      expect(addImageSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('signatureImage')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('multiple signatures', () => {
    it('should render different signatures from different custom fields', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const pastorSection = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        fieldName: 'pastorSignature',
      };

      const treasurerSection = {
        type: 'signatureImage' as const,
        x: 100,
        y: 240,
        fieldName: 'treasurerSignature',
      };

      mockContext.customFields = {
        pastorSignature: 'data:image/png;base64,PASTOR_DATA',
        treasurerSignature: 'data:image/png;base64,TREASURER_DATA',
      };

      renderSignatureImage(doc, pastorSection, mockContext);
      renderSignatureImage(doc, treasurerSection, mockContext);

      expect(addImageSpy).toHaveBeenCalledTimes(2);
      expect(addImageSpy).toHaveBeenNthCalledWith(
        1,
        mockContext.customFields.pastorSignature,
        '',
        pastorSection.x,
        pastorSection.y,
        50, // Default width
        30, // Default height
        undefined,
        undefined,
        0  // No rotation
      );
      expect(addImageSpy).toHaveBeenNthCalledWith(
        2,
        mockContext.customFields.treasurerSignature,
        '',
        treasurerSection.x,
        treasurerSection.y,
        50, // Default width
        30, // Default height
        undefined,
        undefined,
        0  // No rotation
      );
    });
  });

  describe('rotation feature', () => {
    it('should support 45 degree rotation', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        rotation: 45,  // 45 degrees clockwise
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      renderSignatureImage(doc, section, mockContext);

      // 45 degrees = PI/4 radians
      const expectedRotation = 45 * (Math.PI / 180);
      expect(addImageSpy).toHaveBeenCalledWith(
        section.imageData,
        '',
        section.x,
        section.y,
        50, // Default width
        30, // Default height
        undefined,
        undefined,
        expectedRotation
      );
    });

    it('should support 180 degree rotation (upside down)', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        rotation: 180,  // 180 degrees (upside down)
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      renderSignatureImage(doc, section, mockContext);

      // 180 degrees = PI radians
      const expectedRotation = Math.PI;
      expect(addImageSpy).toHaveBeenCalledWith(
        section.imageData,
        '',
        section.x,
        section.y,
        50, // Default width
        30, // Default height
        undefined,
        undefined,
        expectedRotation
      );
    });

    it('should support negative rotation (counter-clockwise)', async () => {
      const { renderSignatureImage } = await import('../generator');
      const addImageSpy = vi.spyOn(doc, 'addImage').mockImplementation(() => doc);

      const section = {
        type: 'signatureImage' as const,
        x: 100,
        y: 200,
        rotation: -45,  // -45 degrees (counter-clockwise)
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      renderSignatureImage(doc, section, mockContext);

      // -45 degrees = -PI/4 radians
      const expectedRotation = -45 * (Math.PI / 180);
      expect(addImageSpy).toHaveBeenCalledWith(
        section.imageData,
        '',
        section.x,
        section.y,
        50, // Default width
        30, // Default height
        undefined,
        undefined,
        expectedRotation
      );
    });
  });
});

describe('SignatureImageSection type', () => {
  it('should have correct type structure', () => {
    const section: import('../../../types').SignatureImageSection = {
      type: 'signatureImage',
      x: 100,
      y: 200,
      width: 50,
      height: 30,
      fieldName: 'pastorSignature',
      maintainAspectRatio: true,
    };

    expect(section.type).toBe('signatureImage');
    expect(section.x).toBe(100);
    expect(section.y).toBe(200);
    expect(section.fieldName).toBe('pastorSignature');
    expect(section.maintainAspectRatio).toBe(true);
  });

  it('should allow optional properties', () => {
    const section: import('../../../types').SignatureImageSection = {
      type: 'signatureImage',
      x: 100,
      y: 200,
    };

    expect(section.type).toBe('signatureImage');
    expect(section.width).toBeUndefined();
    expect(section.height).toBeUndefined();
    expect(section.fieldName).toBeUndefined();
    expect(section.maintainAspectRatio).toBeUndefined();
    expect(section.rotation).toBeUndefined();
  });

  it('should support rotation property', () => {
    const section: import('../../../types').SignatureImageSection = {
      type: 'signatureImage',
      x: 100,
      y: 200,
      rotation: 45,  // 45 degrees clockwise
    };

    expect(section.rotation).toBe(45);
  });
});
