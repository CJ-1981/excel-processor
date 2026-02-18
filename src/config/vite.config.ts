/**
 * Vite configuration utilities for environment-aware base path resolution.
 *
 * This module provides utilities to determine the correct base path for
 * GitHub Pages deployment based on the environment and repository name.
 */

import packageJson from '../../package.json'

/**
 * Determines the base path for Vite based on the current environment.
 *
 * In production, the base path includes the repository name for GitHub Pages.
 * In development and test environments, the base path is the root.
 *
 * @returns The base path to use for the application
 */
export function getBasePath(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const repositoryName = packageJson.name

  if (isProduction) {
    // GitHub Pages serves from repository subdirectory
    return `/${repositoryName}/`
  }

  // Development and test environments use root path
  return '/'
}

/**
 * Validates that a base path is correctly formatted.
 *
 * @param basePath - The base path to validate
 * @returns True if the base path is valid
 */
export function isValidBasePath(basePath: string): boolean {
  // Must start with /
  if (!basePath.startsWith('/')) {
    return false
  }

  // Must end with /
  if (!basePath.endsWith('/')) {
    return false
  }

  // Must not contain double slashes
  if (basePath.includes('//')) {
    return false
  }

  return true
}
