/**
 * Configuration Types
 *
 * Type definitions for CLI configuration and environment
 */

/**
 * Output format options for command responses
 */
export type OutputFormat = 'json' | 'pretty' | 'table';

/**
 * CLI configuration file structure
 */
export interface Config {
  /** PyPI API token for authenticated operations */
  apiToken?: string;

  /** Optional name for the API token */
  tokenName?: string;

  /** PyPI repository URL for uploads */
  repository?: string;

  /** Preferred output format */
  outputFormat?: OutputFormat;

  /** Enable colored output */
  colorOutput?: boolean;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Number of retry attempts for failed requests */
  retries?: number;
}

/**
 * Configuration file location options
 */
export interface ConfigLocation {
  /** Path to config file */
  path: string;

  /** Whether the file exists */
  exists: boolean;
}

/**
 * Environment variables for configuration
 */
export interface EnvironmentConfig {
  /** PyPI API token from environment */
  PYPI_API_TOKEN?: string;

  /** PyPI repository URL from environment */
  PYPI_REPOSITORY?: string;

  /** Output format from environment */
  PYPI_OUTPUT_FORMAT?: OutputFormat;
}

/**
 * Merged configuration from all sources
 * (environment variables override config file)
 */
export interface ResolvedConfig {
  /** PyPI API token */
  apiToken?: string;

  /** PyPI repository URL (default: 'https://upload.pypi.org/legacy/') */
  repository: string;

  /** Output format (default: 'pretty') */
  outputFormat: OutputFormat;

  /** Enable colored output (default: true) */
  colorOutput: boolean;

  /** Request timeout in milliseconds (default: 30000) */
  timeout: number;

  /** Number of retry attempts (default: 3) */
  retries: number;
}

/**
 * Configuration defaults
 */
export const DEFAULT_CONFIG: Partial<ResolvedConfig> = {
  repository: 'https://upload.pypi.org/legacy/',
  outputFormat: 'pretty',
  colorOutput: true,
  timeout: 30000,
  retries: 3,
};

/**
 * Configuration file paths by priority
 */
export const CONFIG_FILE_PATHS = [
  '.pypi.json',          // Project-specific config (highest priority)
  '~/.pypi/config.json', // User home directory config
  '~/.pypi.json',        // Alternative user config
] as const;

/**
 * Primary config path (for user home directory)
 */
export const CONFIG_PATH = '~/.pypi/config.json';
