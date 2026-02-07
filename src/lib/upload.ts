/**
 * Package Upload Library
 *
 * Functions for uploading distribution files to PyPI/TestPyPI
 */

import { validateDistributionPath, validatePackageName, validateVersion } from './validators.js';
import type { UploadResult, ValidationResult } from '../types/api.js';

/**
 * Package metadata extracted from distribution files
 */
export interface PackageMetadata {
  name?: string;
  version?: string;
  summary?: string;
  author?: string;
  author_email?: string;
  license?: string;
  home_page?: string;
  requires_python?: string;
  description?: string;
  description_content_type?: string;
  classifiers?: string[];
  keywords?: string;
}

/**
 * Repository configuration
 */
export interface RepositoryConfig {
  name: string;
  url: string;
}

/**
 * Known PyPI repositories
 */
export const REPOSITORIES: Record<string, RepositoryConfig> = {
  pypi: {
    name: 'PyPI',
    url: 'https://upload.pypi.org/legacy/',
  },
  testpypi: {
    name: 'TestPyPI',
    url: 'https://test.pypi.org/legacy/',
  },
};

/**
 * Upload a distribution file to a PyPI repository
 *
 * @param filePath - Path to the distribution file (.whl or .tar.gz)
 * @param token - PyPI API token
 * @param repository - Repository name or URL (default: 'pypi')
 * @returns Upload result
 *
 * @example
 * ```ts
 * const result = await uploadToRepository(
 *   './dist/mypackage-1.0.0.tar.gz',
 *   'pypi-xxxxx',
 *   'pypi'
 * );
 * console.log('Success:', result.success);
 * ```
 */
export async function uploadToRepository(
  filePath: string,
  token: string,
  repository: string = 'pypi'
): Promise<UploadResult> {
  try {
    // Determine upload URL
    const uploadUrl = REPOSITORIES[repository]?.url || repository;

    // Check if file exists
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return {
        success: false,
        message: `File not found: ${filePath}`,
      };
    }

    // Extract metadata based on file type
    let metadata: PackageMetadata = {};
    if (filePath.endsWith('.whl')) {
      metadata = await extractMetadataFromWheel(filePath);
    } else if (filePath.endsWith('.tar.gz')) {
      metadata = await extractMetadataFromSdist(filePath);
    }

    // Create multipart form data
    const formData = new FormData();
    formData.append('content', file);
    formData.append(':action', 'file_upload');
    formData.append('protocol_version', '1');

    // Add metadata fields
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.version) formData.append('version', metadata.version);
    if (metadata.summary) formData.append('summary', metadata.summary);
    if (metadata.author) formData.append('author', metadata.author);
    if (metadata.author_email) formData.append('author_email', metadata.author_email);
    if (metadata.license) formData.append('license', metadata.license);
    if (metadata.home_page) formData.append('home_page', metadata.home_page);
    if (metadata.requires_python) formData.append('requires_python', metadata.requires_python);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.description_content_type) {
      formData.append('description_content_type', metadata.description_content_type);
    }
    if (metadata.keywords) formData.append('keywords', metadata.keywords);
    if (metadata.classifiers) {
      for (const classifier of metadata.classifiers) {
        formData.append('classifiers', classifier);
      }
    }

    // Upload with timeout (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    // Create Basic Auth header: username = '__token__', password = token
    const authString = btoa(`__token__:${token}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'pypi-cli/1.0.0',
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();

      // Handle specific error cases
      if (response.status === 403) {
        return {
          success: false,
          message: 'Authentication failed. Check your API token.',
          statusCode: response.status,
        };
      }

      if (response.status === 409) {
        return {
          success: false,
          message: 'File already exists on repository.',
          statusCode: response.status,
        };
      }

      return {
        success: false,
        message: errorText || `Upload failed with status ${response.status}`,
        statusCode: response.status,
      };
    }

    // Extract package name and version for URL
    const packageName = metadata.name || filePath.split('/').pop()?.split('-')[0] || 'unknown';
    const version = metadata.version || '';
    const repoUrl = repository === 'testpypi'
      ? 'https://test.pypi.org'
      : 'https://pypi.org';
    const projectUrl = version
      ? `${repoUrl}/project/${packageName}/${version}/`
      : `${repoUrl}/project/${packageName}/`;

    return {
      success: true,
      message: 'Package uploaded successfully',
      url: projectUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        message: 'Upload timeout after 60 seconds',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Extract metadata from a wheel (.whl) file
 *
 * @param filePath - Path to the .whl file
 * @returns Package metadata
 *
 * @example
 * ```ts
 * const metadata = await extractMetadataFromWheel('./dist/mypackage-1.0.0-py3-none-any.whl');
 * console.log('Package:', metadata.name, metadata.version);
 * ```
 */
export async function extractMetadataFromWheel(filePath: string): Promise<PackageMetadata> {
  try {
    // Wheel format: {name}-{version}[-{build}]-{python}-{abi}-{platform}.whl
    const filename = filePath.split('/').pop() || '';
    const parts = filename.replace('.whl', '').split('-');

    if (parts.length < 5) {
      return {};
    }

    const name = parts[0];
    const version = parts[1];

    // Try to extract METADATA file from wheel (it's a ZIP archive)
    // For now, return basic metadata from filename
    // Full implementation would extract .dist-info/METADATA file

    return {
      name: name?.replace(/_/g, '-'),
      version,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Extract metadata from a source distribution (.tar.gz) file
 *
 * @param filePath - Path to the .tar.gz file
 * @returns Package metadata
 *
 * @example
 * ```ts
 * const metadata = await extractMetadataFromSdist('./dist/mypackage-1.0.0.tar.gz');
 * console.log('Package:', metadata.name, metadata.version);
 * ```
 */
export async function extractMetadataFromSdist(filePath: string): Promise<PackageMetadata> {
  try {
    // Source dist format: {name}-{version}.tar.gz
    const filename = filePath.split('/').pop() || '';
    const nameVersion = filename.replace('.tar.gz', '');
    const lastDash = nameVersion.lastIndexOf('-');

    if (lastDash === -1) {
      return {};
    }

    const name = nameVersion.slice(0, lastDash);
    const version = nameVersion.slice(lastDash + 1);

    // Full implementation would extract PKG-INFO file from tarball
    // For now, return basic metadata from filename

    return {
      name: name.replace(/_/g, '-'),
      version,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Validate a distribution file before upload
 *
 * @param filePath - Path to the distribution file
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```ts
 * const result = await validateDistribution('./dist/mypackage-1.0.0.tar.gz');
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export async function validateDistribution(filePath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check file exists
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      errors.push(`File not found: ${filePath}`);
      return { valid: false, errors, warnings };
    }

    // Check file extension
    if (!validateDistributionPath(filePath)) {
      errors.push('Invalid file extension. Expected .tar.gz, .whl, .egg, or .zip');
    }

    // Check file size (PyPI has a 100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      errors.push(`File size (${formatBytes(file.size)}) exceeds PyPI limit of 100MB`);
    }

    // Warn about small files (less than 1KB is suspicious)
    if (file.size < 1024) {
      warnings.push(`File size (${formatBytes(file.size)}) is very small`);
    }

    // Extract and validate metadata
    let metadata: PackageMetadata = {};
    if (filePath.endsWith('.whl')) {
      metadata = await extractMetadataFromWheel(filePath);
    } else if (filePath.endsWith('.tar.gz')) {
      metadata = await extractMetadataFromSdist(filePath);
    }

    // Validate package name
    if (metadata.name) {
      if (!validatePackageName(metadata.name)) {
        errors.push(`Invalid package name: ${metadata.name}`);
      }
    } else {
      warnings.push('Could not extract package name from file');
    }

    // Validate version
    if (metadata.version) {
      if (!validateVersion(metadata.version)) {
        errors.push(`Invalid version (not PEP 440 compliant): ${metadata.version}`);
      }
    } else {
      warnings.push('Could not extract version from file');
    }

    // Check for common issues
    const filename = filePath.split('/').pop() || '';
    if (filename.includes(' ')) {
      errors.push('Filename contains spaces');
    }

    // Warn about potential sensitive files (this is a basic check)
    const suspiciousPatterns = ['.env', 'credentials', 'secret', 'password', '.key'];
    const lowerFilename = filename.toLowerCase();
    for (const pattern of suspiciousPatterns) {
      if (lowerFilename.includes(pattern)) {
        warnings.push(`Filename contains suspicious pattern: ${pattern}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Validation failed');
    return { valid: false, errors, warnings };
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get all distribution files in a directory
 *
 * @param dirPath - Directory path (default: './dist')
 * @returns Array of file paths
 *
 * @example
 * ```ts
 * const files = await getDistributionFiles('./dist');
 * console.log('Found', files.length, 'distribution files');
 * ```
 */
export async function getDistributionFiles(dirPath: string = './dist'): Promise<string[]> {
  try {
    const validExtensions = ['.tar.gz', '.whl', '.egg', '.zip'];
    const files: string[] = [];

    // Use Bun's glob to find files
    const glob = new Bun.Glob('**/*.{tar.gz,whl,egg,zip}');
    for await (const file of glob.scan(dirPath)) {
      files.push(`${dirPath}/${file}`);
    }

    // Sort by filename
    return files.sort();
  } catch (error) {
    return [];
  }
}
