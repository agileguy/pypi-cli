/**
 * Type definitions export
 */

export type {
  Config,
  ConfigLocation,
  EnvironmentConfig,
  OutputFormat,
  ResolvedConfig,
} from './config.js';

export {
  CONFIG_FILE_PATHS,
  CONFIG_PATH,
  DEFAULT_CONFIG,
} from './config.js';

export type {
  DownloadStats,
  PackageInfo,
  PackageRelease,
  PyPIError,
  PyPIPackage,
  ReleaseFile,
  SearchResult,
} from './api.js';

/**
 * Global CLI options available on all commands
 */
export interface GlobalOptions {
  /** API token override */
  apiToken?: string;

  /** Output format */
  output?: 'json' | 'pretty' | 'table';

  /** Disable colored output */
  noColor?: boolean;

  /** Enable verbose logging */
  verbose?: boolean;
}
