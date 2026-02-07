/**
 * PyPI JSON API Type Definitions
 *
 * Types for PyPI's JSON API responses
 * Reference: https://warehouse.pypa.io/api-reference/json.html
 */

/**
 * Complete package information from PyPI JSON API
 */
export interface PyPIPackage {
  /** Package metadata and information */
  info: PackageInfo;

  /** All releases of the package, keyed by version */
  releases: Record<string, ReleaseFile[]>;

  /** Files for the latest version */
  urls: ReleaseFile[];

  /** Timestamp of last serial number (for caching) */
  last_serial?: number;
}

/**
 * Package metadata and information
 */
export interface PackageInfo {
  /** Package name */
  name: string;

  /** Current version */
  version: string;

  /** Short description */
  summary: string;

  /** Long description (README) */
  description: string;

  /** Description content type (e.g., text/markdown) */
  description_content_type?: string;

  /** Package author */
  author: string;

  /** Author email */
  author_email: string;

  /** Package maintainer */
  maintainer?: string;

  /** Maintainer email */
  maintainer_email?: string;

  /** License */
  license: string;

  /** Home page URL */
  home_page: string;

  /** Project URL */
  project_url: string;

  /** Additional project URLs (documentation, source, etc.) */
  project_urls: Record<string, string>;

  /** Python version requirement */
  requires_python: string;

  /** Package dependencies */
  requires_dist: string[];

  /** PyPI classifiers */
  classifiers: string[];

  /** Keywords */
  keywords: string;

  /** Package URL on PyPI */
  package_url: string;

  /** Release URL on PyPI */
  release_url: string;

  /** Download URL (deprecated) */
  download_url?: string;

  /** Documentation URL */
  docs_url?: string | null;

  /** Bugtrack URL */
  bugtrack_url?: string | null;
}

/**
 * Release file information
 */
export interface ReleaseFile {
  /** Filename */
  filename: string;

  /** Download URL */
  url: string;

  /** File size in bytes */
  size: number;

  /** File digests (checksums) */
  digests: {
    md5: string;
    sha256: string;
  };

  /** Package type (sdist, bdist_wheel, etc.) */
  packagetype: string;

  /** Python version */
  python_version: string;

  /** Requires Python version */
  requires_python?: string;

  /** Upload timestamp */
  upload_time: string;

  /** Upload timestamp in ISO format */
  upload_time_iso_8601: string;

  /** Uploader username */
  uploader?: string;

  /** Uploader ID */
  uploader_id?: string;

  /** Whether the file has been yanked */
  yanked: boolean;

  /** Reason for yanking (if yanked) */
  yanked_reason: string | null;

  /** Comment text */
  comment_text?: string;
}

/**
 * Search result from PyPI
 */
export interface SearchResult {
  /** Package name */
  name: string;

  /** Current version */
  version: string;

  /** Short description */
  summary: string;

  /** Package author */
  author?: string;

  /** Keywords */
  keywords?: string;

  /** Home page */
  home_page?: string;
}

/**
 * Download statistics from PyPI Stats API
 * Reference: https://pypistats.org/api
 */
export interface DownloadStats {
  /** Statistical data points */
  data: {
    /** Date of the data point */
    date: string;

    /** Number of downloads */
    downloads: number;
  }[];

  /** Package name */
  package: string;

  /** Type of statistics (recent, overall, etc.) */
  type: string;
}

/**
 * Package release metadata for a specific version
 */
export interface PackageRelease {
  /** Version number */
  version: string;

  /** Release files */
  files: ReleaseFile[];

  /** Release date */
  releaseDate?: string;
}

/**
 * Overall download statistics
 */
export interface OverallStats {
  data: { category: string; date?: string; downloads: number }[];
  package: string;
  type: string;
}

/**
 * Python version statistics
 */
export interface PythonVersionStats {
  data: { category: string; date?: string; downloads: number }[];
  package: string;
  type: string;
}

/**
 * System/OS statistics
 */
export interface SystemStats {
  data: { category: string; date?: string; downloads: number }[];
  package: string;
  type: string;
}

/**
 * OSV vulnerability information
 */
export interface Vulnerability {
  id: string;
  summary: string;
  details: string;
  aliases?: string[];
  modified: string;
  published?: string;
  database_specific?: Record<string, unknown>;
  references?: VulnerabilityReference[];
  severity?: VulnerabilitySeverity[];
  affected?: VulnerabilityAffected[];
  schema_version?: string;
  withdrawn?: string;
}

/**
 * Vulnerability reference
 */
export interface VulnerabilityReference {
  type: string;
  url: string;
}

/**
 * Vulnerability severity rating
 */
export interface VulnerabilitySeverity {
  type: string;
  score: string;
}

/**
 * Affected package versions
 */
export interface VulnerabilityAffected {
  package: {
    name: string;
    ecosystem: string;
    purl?: string;
  };
  ranges?: Array<{
    type: string;
    events: Array<{ introduced?: string; fixed?: string; last_affected?: string }>;
  }>;
  versions?: string[];
  database_specific?: Record<string, unknown>;
  ecosystem_specific?: Record<string, unknown>;
}

/**
 * Package upload result
 */
export interface UploadResult {
  success: boolean;
  message?: string;
  url?: string;
  statusCode?: number;
}

/**
 * Distribution file validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  reset?: number;
}

/**
 * Output format options
 */
export type OutputFormat = 'json' | 'table' | 'pretty';

/**
 * API error response
 */
export interface PyPIError {
  /** Error message */
  message: string;

  /** HTTP status code */
  status?: number;

  /** Additional error details */
  details?: unknown;
}
