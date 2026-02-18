/**
 * Test suite for Vite configuration base path settings.
 *
 * These tests ensure that the base path is correctly configured for:
 * - Development: Root path '/'
 * - Production: GitHub Pages repository path '/excel-processor/'
 *
 * This is critical for GitHub Pages deployment where the app is served
 * from a subdirectory rather than the domain root.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getBasePath, isValidBasePath } from './src/config/vite.config'

describe('Vite Base Path Configuration', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    // Reset to original environment before each test
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  afterEach(() => {
    // Clean up after each test
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  describe('Base path resolution', () => {
    it('should use root path "/" in development mode', () => {
      // Arrange: Set development environment
      process.env.NODE_ENV = 'development'

      // Act: Get base path
      const basePath = getBasePath()

      // Assert: Base path should be root for development
      expect(basePath).toBe('/')
    })

    it('should use repository path "/excel-processor/" in production mode', () => {
      // Arrange: Set production environment
      process.env.NODE_ENV = 'production'

      // Act: Get base path
      const basePath = getBasePath()

      // Assert: Base path should include repository name for GitHub Pages
      expect(basePath).toBe('/excel-processor/')
    })

    it('should default to root path when NODE_ENV is undefined', () => {
      // Arrange: Remove NODE_ENV
      delete process.env.NODE_ENV

      // Act: Get base path
      const basePath = getBasePath()

      // Assert: Should default to root path
      expect(basePath).toBe('/')
    })

    it('should default to root path for test environment', () => {
      // Arrange: Set test environment
      process.env.NODE_ENV = 'test'

      // Act: Get base path
      const basePath = getBasePath()

      // Assert: Should use root path for testing
      expect(basePath).toBe('/')
    })
  })

  describe('Base path format validation', () => {
    it('should ensure production base path starts with forward slash', () => {
      // Arrange: Set production environment
      process.env.NODE_ENV = 'production'

      // Act: Get base path
      const basePath = getBasePath()

      // Assert: Must start with /
      expect(basePath.startsWith('/')).toBe(true)
    })

    it('should ensure production base path ends with forward slash', () => {
      // Arrange: Set production environment
      process.env.NODE_ENV = 'production'

      // Act: Get base path
      const basePath = getBasePath()

      // Assert: Must end with / for proper path resolution
      expect(basePath.endsWith('/')).toBe(true)
    })

    it('should not have double slashes in base path', () => {
      // Arrange: Set production environment
      process.env.NODE_ENV = 'production'

      // Act: Get base path
      const basePath = getBasePath()

      // Assert: Should not contain //
      expect(basePath).not.toContain('//')
    })
  })

  describe('Base path validation function', () => {
    it('should validate correct base path', () => {
      // Arrange & Act & Assert: Various valid base paths
      expect(isValidBasePath('/')).toBe(true)
      expect(isValidBasePath('/excel-processor/')).toBe(true)
      expect(isValidBasePath('/my-repo/')).toBe(true)
    })

    it('should reject invalid base paths', () => {
      // Arrange & Act & Assert: Invalid base paths
      expect(isValidBasePath('')).toBe(false) // Empty
      expect(isValidBasePath('excel-processor/')).toBe(false) // Missing leading slash
      expect(isValidBasePath('/excel-processor')).toBe(false) // Missing trailing slash
      expect(isValidBasePath('//excel-processor/')).toBe(false) // Double slash
    })
  })

  describe('GitHub Pages compatibility', () => {
    it('should use repository name from package.json', () => {
      // Arrange: Set production environment
      process.env.NODE_ENV = 'production'

      // Act: Get base path
      const basePath = getBasePath()

      // Assert: Should match repository name from package.json
      expect(basePath).toBe('/excel-processor/')
    })

    it('should ensure all assets are resolved with base path prefix', () => {
      // Arrange: Set production environment
      process.env.NODE_ENV = 'production'
      const basePath = getBasePath()

      // Act & Assert: Common asset paths should be prefixed correctly
      const assetPath = '/assets/main.js'
      const resolvedPath = basePath + assetPath.substring(1)

      expect(resolvedPath).toBe('/excel-processor/assets/main.js')
    })

    it('should validate production base path using validator function', () => {
      // Arrange: Set production environment
      process.env.NODE_ENV = 'production'

      // Act: Get and validate base path
      const basePath = getBasePath()
      const isValid = isValidBasePath(basePath)

      // Assert: Production base path should be valid
      expect(isValid).toBe(true)
    })

    it('should validate development base path using validator function', () => {
      // Arrange: Set development environment
      process.env.NODE_ENV = 'development'

      // Act: Get and validate base path
      const basePath = getBasePath()
      const isValid = isValidBasePath(basePath)

      // Assert: Development base path should be valid
      expect(isValid).toBe(true)
    })
  })
})
