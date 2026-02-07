/**
 * PyPI API Client
 *
 * HTTP client for interacting with PyPI JSON API, PyPI Stats API, and package upload
 */

import type {
  PyPIPackage,
  SearchResult,
  DownloadStats,
  OverallStats,
  PythonVersionStats,
  SystemStats,
  UploadResult,
  ValidationResult,
  RateLimitInfo,
  Vulnerability,
} from '../types/api.js';

/**
 * Custom error class for PyPI API errors
 */
export class PyPIAPIError extends Error {
  public statusCode?: number;
  public details?: Record<string, unknown>;

  constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'PyPIAPIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Options for the PyPI API client
 */
export interface PyPIClientOptions {
  /** Base URL for PyPI JSON API (default: https://pypi.org) */
  jsonApiBase?: string;

  /** Base URL for PyPI Stats API (default: https://pypistats.org) */
  statsApiBase?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Maximum retry attempts for 5xx errors (default: 3) */
  maxRetries?: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * PyPI API Client for package information and search
 */
export class PyPIClient {
  private jsonApiBase: string;
  private statsApiBase: string;
  private osvApiBase: string;
  private timeout: number;
  private maxRetries: number;

  constructor(options: PyPIClientOptions = {}) {
    this.jsonApiBase = options.jsonApiBase || 'https://pypi.org/pypi';
    this.statsApiBase = options.statsApiBase || 'https://pypistats.org/api';
    this.osvApiBase = 'https://api.osv.dev/v1';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Make an HTTP request with retry logic
   */
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ data: T; rateLimit?: RateLimitInfo }> {
    let lastError: Error | null = null;

    // Retry loop for 5xx errors
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'pypi-cli/1.0.0',
            'Accept': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse rate limit headers if available
        const rateLimit = this.parseRateLimitHeaders(response.headers);

        // Handle non-2xx responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
          const errorMessage =
            (typeof errorData.message === 'string' ? errorData.message : undefined) ||
            `API request failed with status ${response.status}`;

          // For 5xx errors, retry
          if (response.status >= 500 && attempt < this.maxRetries - 1) {
            lastError = new PyPIAPIError(errorMessage, response.status, errorData);
            const delay = this.calculateBackoff(attempt);
            await sleep(delay);
            continue;
          }

          // For 404, provide helpful message
          if (response.status === 404) {
            throw new PyPIAPIError('Package not found', response.status, errorData);
          }

          // For 429 rate limit
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            throw new PyPIAPIError(
              `Rate limited${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
              response.status,
              errorData
            );
          }

          // For other errors, throw immediately
          throw new PyPIAPIError(errorMessage, response.status, errorData);
        }

        // Parse successful response
        const data = await response.json();
        return { data: data as T, rateLimit };
      } catch (error) {
        // Handle timeout and network errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw new PyPIAPIError(
            `Request timeout after ${this.timeout}ms`,
            0,
            { timeout: this.timeout }
          );
        }

        // If it's already a PyPIAPIError, check if we should retry
        if (error instanceof PyPIAPIError && error.statusCode && error.statusCode >= 500) {
          lastError = error;
          if (attempt < this.maxRetries - 1) {
            const delay = this.calculateBackoff(attempt);
            await sleep(delay);
            continue;
          }
        }

        // Re-throw non-retryable errors
        throw error;
      }
    }

    // If we've exhausted all retries, throw the last error
    throw lastError || new PyPIAPIError('Request failed after maximum retries');
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attempt), 4000);
  }

  /**
   * Parse rate limit headers from response
   */
  private parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }

    return undefined;
  }

  /**
   * Get package information
   *
   * @param name - Package name
   * @param version - Specific version (optional)
   * @returns Package metadata and release information
   *
   * @example
   * ```ts
   * const pkg = await client.getPackage('requests');
   * console.log('Latest version:', pkg.data.info.version);
   * ```
   */
  async getPackage(name: string, version?: string): Promise<{ data: PyPIPackage; rateLimit?: RateLimitInfo }> {
    const endpoint = version ? `${name}/${version}` : name;
    const url = `${this.jsonApiBase}/${endpoint}/json`;
    return this.request<PyPIPackage>(url);
  }

  /**
   * Search for packages
   *
   * Note: PyPI's official search API has been removed. This implementation
   * tries exact package name matching as a simple fallback.
   *
   * @param query - Search query (package name)
   * @param limit - Maximum number of results (default: 20)
   * @returns Array of search results
   *
   * @example
   * ```ts
   * const results = await client.searchPackages('requests');
   * console.log('Found', results.data.length, 'packages');
   * ```
   */
  async searchPackages(
    query: string,
    _limit: number = 20
  ): Promise<{ data: SearchResult[]; rateLimit?: RateLimitInfo }> {
    // Try exact package name match
    try {
      const pkg = await this.getPackage(query);
      return {
        data: [{
          name: pkg.data.info.name,
          version: pkg.data.info.version,
          summary: pkg.data.info.summary,
          author: pkg.data.info.author,
          keywords: pkg.data.info.keywords,
          home_page: pkg.data.info.home_page,
        }],
        rateLimit: pkg.rateLimit,
      };
    } catch (error) {
      // If exact match fails, return empty results
      // Note: A full search implementation would require HTML scraping
      // or using a third-party search service
      if (error instanceof PyPIAPIError && error.statusCode === 404) {
        return { data: [] };
      }
      throw error;
    }
  }

  /**
   * Get download statistics for a package
   *
   * @param name - Package name
   * @param period - Time period (recent, last-day, last-week, last-month)
   * @returns Download statistics
   *
   * @example
   * ```ts
   * const stats = await client.getDownloadStats('requests', 'last-month');
   * console.log('Total downloads:', stats.data.data.reduce((sum, d) => sum + d.downloads, 0));
   * ```
   */
  async getDownloadStats(
    name: string,
    period: string = 'recent'
  ): Promise<{ data: DownloadStats; rateLimit?: RateLimitInfo }> {
    const url = `${this.statsApiBase}/packages/${name}/${period}`;
    return this.request<DownloadStats>(url);
  }

  /**
   * Get overall download statistics
   *
   * @param name - Package name
   * @returns Overall statistics with category breakdown
   *
   * @example
   * ```ts
   * const stats = await client.getOverallStats('requests');
   * console.log('Total downloads:', stats.data.data.reduce((sum, d) => sum + d.downloads, 0));
   * ```
   */
  async getOverallStats(name: string): Promise<{ data: OverallStats; rateLimit?: RateLimitInfo }> {
    const url = `${this.statsApiBase}/packages/${name}/overall`;
    return this.request<OverallStats>(url);
  }

  /**
   * Get Python version statistics
   *
   * @param name - Package name
   * @returns Python version breakdown
   *
   * @example
   * ```ts
   * const stats = await client.getPythonMajorStats('requests');
   * stats.data.data.forEach(d => console.log(`${d.category}: ${d.downloads}`));
   * ```
   */
  async getPythonMajorStats(name: string): Promise<{ data: PythonVersionStats; rateLimit?: RateLimitInfo }> {
    const url = `${this.statsApiBase}/packages/${name}/python_major`;
    return this.request<PythonVersionStats>(url);
  }

  /**
   * Get system/OS statistics
   *
   * @param name - Package name
   * @returns System/OS breakdown
   *
   * @example
   * ```ts
   * const stats = await client.getSystemStats('requests');
   * stats.data.data.forEach(d => console.log(`${d.category}: ${d.downloads}`));
   * ```
   */
  async getSystemStats(name: string): Promise<{ data: SystemStats; rateLimit?: RateLimitInfo }> {
    const url = `${this.statsApiBase}/packages/${name}/system`;
    return this.request<SystemStats>(url);
  }

  /**
   * Check if a package exists on PyPI
   *
   * @param name - Package name
   * @returns true if package exists
   *
   * @example
   * ```ts
   * const exists = await client.packageExists('requests');
   * console.log('Package exists:', exists);
   * ```
   */
  async packageExists(name: string): Promise<boolean> {
    try {
      await this.getPackage(name);
      return true;
    } catch (error) {
      if (error instanceof PyPIAPIError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get vulnerabilities for a package from OSV database
   *
   * @param name - Package name
   * @param version - Specific version (optional)
   * @returns Array of vulnerabilities
   *
   * @example
   * ```ts
   * const vulns = await client.getVulnerabilities('requests', '2.25.0');
   * console.log('Found', vulns.data.length, 'vulnerabilities');
   * ```
   */
  async getVulnerabilities(
    name: string,
    version?: string
  ): Promise<{ data: Vulnerability[]; rateLimit?: RateLimitInfo }> {
    const url = `${this.osvApiBase}/query`;
    const body = {
      package: { name, ecosystem: 'PyPI' },
      ...(version && { version }),
    };

    try {
      const response = await this.request<{ vulns: Vulnerability[] }>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return {
        data: response.data.vulns || [],
        rateLimit: response.rateLimit,
      };
    } catch (error) {
      // OSV returns empty response if no vulnerabilities found
      return { data: [] };
    }
  }

  /**
   * Get all versions of a package
   *
   * @param name - Package name
   * @returns Array of version strings
   */
  async getVersions(name: string): Promise<string[]> {
    const pkg = await this.getPackage(name);
    return Object.keys(pkg.data.releases).sort().reverse();
  }

  /**
   * Get latest version of a package
   *
   * @param name - Package name
   * @returns Latest version string
   */
  async getLatestVersion(name: string): Promise<string> {
    const pkg = await this.getPackage(name);
    return pkg.data.info.version;
  }
}

/**
 * PyPI Uploader for publishing packages
 */
export class PyPIUploader {
  private uploadUrl: string;
  private timeout: number;

  constructor(uploadUrl: string = 'https://upload.pypi.org/legacy/') {
    this.uploadUrl = uploadUrl;
    this.timeout = 60000; // 60 seconds for uploads
  }

  /**
   * Upload a distribution file to PyPI
   *
   * @param filePath - Path to the distribution file (.whl or .tar.gz)
   * @param token - PyPI API token
   * @returns Upload result
   *
   * @example
   * ```ts
   * const result = await uploader.upload('./dist/mypackage-1.0.0.tar.gz', token);
   * console.log('Upload successful:', result.success);
   * ```
   */
  async upload(filePath: string, token: string): Promise<UploadResult> {
    try {
      // Read file
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        return {
          success: false,
          message: `File not found: ${filePath}`,
        };
      }

      // Create form data
      const formData = new FormData();
      formData.append('content', file);
      formData.append(':action', 'file_upload');
      formData.append('protocol_version', '1');

      // Upload with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'pypi-cli/1.0.0',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: errorText || `Upload failed with status ${response.status}`,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        message: 'Package uploaded successfully',
        url: `https://pypi.org/project/${filePath.split('-')[0]}/`,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Upload timeout',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Validate a distribution file before upload
   *
   * @param filePath - Path to the distribution file
   * @returns Validation result
   *
   * @example
   * ```ts
   * const result = await uploader.validateDistribution('./dist/mypackage-1.0.0.tar.gz');
   * if (!result.valid) {
   *   console.error('Validation errors:', result.errors);
   * }
   * ```
   */
  async validateDistribution(filePath: string): Promise<ValidationResult> {
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
      const validExtensions = ['.tar.gz', '.whl', '.egg', '.zip'];
      const hasValidExtension = validExtensions.some(ext => filePath.endsWith(ext));

      if (!hasValidExtension) {
        errors.push(`Invalid file extension. Expected one of: ${validExtensions.join(', ')}`);
      }

      // Check file size (PyPI has a 100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        errors.push(`File size (${file.size} bytes) exceeds PyPI limit of 100MB`);
      }

      // Warn about small files
      if (file.size < 1024) {
        warnings.push(`File size (${file.size} bytes) is very small`);
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
}

/**
 * Create a new PyPI client instance
 */
export function createClient(options: PyPIClientOptions = {}): PyPIClient {
  return new PyPIClient(options);
}
