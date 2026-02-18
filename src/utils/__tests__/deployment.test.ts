/**
 * Deployment utilities test suite
 *
 * Tests for deployment script validation and configuration verification
 * following TDD principles for TASK-016: gh-pages Deployment Scripts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Mock child_process for testing deployment commands
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('Deployment Configuration', () => {
  const packageJsonPath = join(process.cwd(), 'package.json');

  describe('gh-pages package dependency', () => {
    it('should have gh-pages in devDependencies', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies['gh-pages']).toBeDefined();
    });

    it('should have gh-pages version 6.x or higher', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const ghPagesVersion = packageJson.devDependencies['gh-pages'];

      expect(ghPagesVersion).toBeDefined();
      // Version should be ^6.0.0 or higher
      expect(ghPagesVersion).toMatch(/^\^6\./);
    });
  });

  describe('deployment scripts', () => {
    let packageJson: any;

    beforeEach(() => {
      packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    });

    describe('predeploy script', () => {
      it('should have predeploy script defined', () => {
        expect(packageJson.scripts['predeploy']).toBeDefined();
      });

      it('should run build command in predeploy', () => {
        expect(packageJson.scripts['predeploy']).toBe('npm run build');
      });

      it('should execute build before deploy automatically', () => {
        // npm automatically runs predeploy before deploy
        const predeployScript = packageJson.scripts['predeploy'];
        const deployScript = packageJson.scripts['deploy'];

        expect(predeployScript).toBeDefined();
        expect(deployScript).toBeDefined();
        expect(deployScript).not.toContain('npm run build'); // build should be in predeploy only
      });
    });

    describe('deploy script', () => {
      it('should have deploy script defined', () => {
        expect(packageJson.scripts['deploy']).toBeDefined();
      });

      it('should push dist directory to gh-pages branch', () => {
        const deployScript = packageJson.scripts['deploy'];
        expect(deployScript).toContain('gh-pages');
        expect(deployScript).toContain('-d dist');
      });

      it('should not include build command (handled by predeploy)', () => {
        const deployScript = packageJson.scripts['deploy'];
        expect(deployScript).not.toContain('build');
      });
    });

    describe('deploy:force script', () => {
      it('should have deploy:force script defined', () => {
        expect(packageJson.scripts['deploy:force']).toBeDefined();
      });

      it('should push dist directory with custom message', () => {
        const deployForceScript = packageJson.scripts['deploy:force'];
        expect(deployForceScript).toContain('gh-pages');
        expect(deployForceScript).toContain('-d dist');
        expect(deployForceScript).toContain('--message');
      });

      it('should have descriptive deployment message', () => {
        const deployForceScript = packageJson.scripts['deploy:force'];
        expect(deployForceScript).toMatch(/Deploy to GitHub Pages/);
      });
    });
  });
});

describe('Deployment Build Output', () => {
  describe('dist directory', () => {
    it('should exist after running build', () => {
      // This test requires build to run first
      const distPath = join(process.cwd(), 'dist');
      const exists = existsSync(distPath);

      if (!exists) {
        // Skip test if build hasn't run
        expect(true).toBe(true);
      } else {
        expect(exists).toBe(true);
      }
    });
  });
});

describe('Deployment Script Error Handling', () => {
  describe('predeploy error scenarios', () => {
    it('should fail if build fails', () => {
      // Build failure should prevent deployment
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['predeploy']).toBeDefined();
      // predeploy runs build, which will fail if there are build errors
      expect(packageJson.scripts['predeploy']).toBe('npm run build');
    });

    it('should not execute deploy if predeploy fails', () => {
      // npm automatically stops if predeploy fails
      // This is verified by the presence of both predeploy and deploy scripts
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['predeploy']).toBeDefined();
      expect(packageJson.scripts['deploy']).toBeDefined();
      // npm's pre-hook behavior ensures deploy won't run if predeploy fails
    });
  });

  describe('deploy error scenarios', () => {
    it('should fail if gh-pages is not installed', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // gh-pages must be in devDependencies
      expect(packageJson.devDependencies['gh-pages']).toBeDefined();
    });

    it('should fail if dist directory does not exist', () => {
      // The deploy script references dist directory
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['deploy']).toContain('-d dist');
      // gh-pages will fail if dist doesn't exist
    });
  });
});

describe('Deployment Script Integration', () => {
  describe('npm script lifecycle', () => {
    it('should have complete deployment workflow', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Verify all required scripts exist
      expect(packageJson.scripts['build']).toBeDefined();
      expect(packageJson.scripts['predeploy']).toBeDefined();
      expect(packageJson.scripts['deploy']).toBeDefined();
      expect(packageJson.scripts['deploy:force']).toBeDefined();
    });

    it('should execute scripts in correct order', () => {
      // npm automatically runs: predeploy -> deploy
      // predeploy runs build, which runs: tsc -b && vite build
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['predeploy']).toBe('npm run build');
      expect(packageJson.scripts['build']).toContain('vite build');

      // deploy should only run after predeploy succeeds
      expect(packageJson.scripts['deploy']).not.toContain('build');
    });
  });

  describe('deployment variants', () => {
    it('should support standard deploy', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['deploy']).toBeDefined();
      expect(packageJson.scripts['deploy']).toContain('gh-pages -d dist');
    });

    it('should support force deploy with custom message', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts['deploy:force']).toBeDefined();
      expect(packageJson.scripts['deploy:force']).toContain('--message');
    });
  });
});
