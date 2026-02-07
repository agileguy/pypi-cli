/**
 * Custom Error Classes for PyPI CLI
 *
 * Provides specific error types for different failure scenarios
 */

/**
 * Base error class for PyPI-related errors
 */
export class PyPIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'PyPIError';
  }
}

/**
 * Error thrown when a package is not found on PyPI
 */
export class PackageNotFoundError extends PyPIError {
  constructor(packageName: string) {
    super(`Package '${packageName}' not found on PyPI`);
    this.code = 'PACKAGE_NOT_FOUND';
    this.name = 'PackageNotFoundError';
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends PyPIError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.code = 'AUTH_FAILED';
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when package upload fails
 */
export class UploadError extends PyPIError {
  constructor(message: string) {
    super(message);
    this.code = 'UPLOAD_FAILED';
    this.name = 'UploadError';
  }
}

/**
 * Error thrown when rate limited by API
 */
export class RateLimitError extends PyPIError {
  constructor(retryAfter?: number) {
    super(`Rate limited${retryAfter ? `. Retry after ${retryAfter}s` : ''}`);
    this.code = 'RATE_LIMITED';
    this.name = 'RateLimitError';
  }
}

/**
 * Error thrown when network request times out
 */
export class TimeoutError extends PyPIError {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`);
    this.code = 'TIMEOUT';
    this.name = 'TimeoutError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends PyPIError {
  constructor(message: string, public errors: string[] = []) {
    super(message);
    this.code = 'VALIDATION_FAILED';
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when network connectivity fails
 */
export class NetworkError extends PyPIError {
  constructor(message: string) {
    super(message);
    this.code = 'NETWORK_ERROR';
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when an invalid version is specified
 */
export class InvalidVersionError extends PyPIError {
  constructor(version: string) {
    super(`Invalid version: ${version}`);
    this.code = 'INVALID_VERSION';
    this.name = 'InvalidVersionError';
  }
}

/**
 * Error thrown when a file is not found
 */
export class FileNotFoundError extends PyPIError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`);
    this.code = 'FILE_NOT_FOUND';
    this.name = 'FileNotFoundError';
  }
}
