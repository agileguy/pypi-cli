/**
 * Unit tests for API client
 */

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { PyPIClient, PyPIUploader, PyPIAPIError } from '../../src/lib/api-client.js';

describe('PyPIClient', () => {
  let client: PyPIClient;

  beforeEach(() => {
    client = new PyPIClient();
  });

  describe('constructor', () => {
    test('creates client with default options', () => {
      const defaultClient = new PyPIClient();
      expect(defaultClient).toBeDefined();
    });

    test('creates client with custom options', () => {
      const customClient = new PyPIClient({
        timeout: 60000,
        maxRetries: 5,
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('packageExists', () => {
    test('returns true for existing packages', async () => {
      // Mock the getPackage method to simulate a successful response
      const originalGetPackage = client.getPackage;
      client.getPackage = mock(async () => ({
        data: {
          info: {
            name: 'requests',
            version: '2.28.0',
            summary: 'Python HTTP library',
            description: '',
            author: '',
            author_email: '',
            maintainer: '',
            maintainer_email: '',
            license: '',
            home_page: '',
            project_url: '',
            project_urls: {},
            requires_python: '',
            requires_dist: [],
            classifiers: [],
            keywords: '',
            package_url: '',
            release_url: '',
          },
          releases: {},
          urls: [],
        },
      }));

      const exists = await client.packageExists('requests');
      expect(exists).toBe(true);

      // Restore original method
      client.getPackage = originalGetPackage;
    });

    test('returns false for non-existent packages', async () => {
      // Mock the getPackage method to simulate a 404 error
      const originalGetPackage = client.getPackage;
      client.getPackage = mock(async () => {
        throw new PyPIAPIError('Package not found', 404);
      });

      const exists = await client.packageExists('nonexistent-package-xyz');
      expect(exists).toBe(false);

      // Restore original method
      client.getPackage = originalGetPackage;
    });
  });

  describe('error handling', () => {
    test('creates PyPIAPIError with status code', () => {
      const error = new PyPIAPIError('Test error', 404);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('PyPIAPIError');
    });

    test('creates PyPIAPIError with details', () => {
      const details = { reason: 'Not found' };
      const error = new PyPIAPIError('Test error', 404, details);
      expect(error.details).toEqual(details);
    });
  });
});

describe('PyPIUploader', () => {
  let uploader: PyPIUploader;

  beforeEach(() => {
    uploader = new PyPIUploader();
  });

  describe('constructor', () => {
    test('creates uploader with default URL', () => {
      const defaultUploader = new PyPIUploader();
      expect(defaultUploader).toBeDefined();
    });

    test('creates uploader with custom URL', () => {
      const customUploader = new PyPIUploader('https://test.pypi.org/legacy/');
      expect(customUploader).toBeDefined();
    });
  });

  describe('validateDistribution', () => {
    test('rejects non-existent files', async () => {
      const result = await uploader.validateDistribution('/nonexistent/file.tar.gz');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not found');
    });

    test('validates file existence check', async () => {
      const result = await uploader.validateDistribution('package.txt');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // File doesn't exist, so we get "File not found" error
      expect(result.errors[0]).toContain('not found');
    });
  });
});

describe('PyPIAPIError', () => {
  test('creates error with message only', () => {
    const error = new PyPIAPIError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('PyPIAPIError');
    expect(error.statusCode).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  test('creates error with status code', () => {
    const error = new PyPIAPIError('Not found', 404);
    expect(error.statusCode).toBe(404);
  });

  test('creates error with details', () => {
    const details = { field: 'value' };
    const error = new PyPIAPIError('Error', 400, details);
    expect(error.details).toEqual(details);
  });

  test('inherits from Error', () => {
    const error = new PyPIAPIError('Test');
    expect(error instanceof Error).toBe(true);
  });
});
