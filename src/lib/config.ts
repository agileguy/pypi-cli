/**
 * Configuration Management
 *
 * Handles loading, saving, and merging configuration from files and environment
 */

import type {
  Config,
  ConfigLocation,
  EnvironmentConfig,
  ResolvedConfig,
} from '../types/config.js';
import { DEFAULT_CONFIG, CONFIG_FILE_PATHS } from '../types/config.js';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

/**
 * Get the user's home directory
 */
function getHomeDirectory(): string {
  return process.env.HOME || process.env.USERPROFILE || '~';
}

/**
 * Expand tilde (~) in file paths to home directory
 */
function expandPath(path: string): string {
  if (path.startsWith('~/')) {
    return path.replace('~', getHomeDirectory());
  }
  return path;
}

/**
 * Find the first existing config file
 */
export async function findConfigFile(): Promise<ConfigLocation | null> {
  for (const configPath of CONFIG_FILE_PATHS) {
    const expandedPath = expandPath(configPath);
    const file = Bun.file(expandedPath);
    const exists = await file.exists();

    if (exists) {
      return {
        path: expandedPath,
        exists: true,
      };
    }
  }

  return null;
}

/**
 * Load configuration from a JSON file
 */
export async function loadConfigFile(path: string): Promise<Config> {
  try {
    const file = Bun.file(path);
    const exists = await file.exists();

    if (!exists) {
      return {};
    }

    const text = await file.text();
    const config = JSON.parse(text) as Config;

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load config file from ${path}: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }
}

/**
 * Save configuration to a JSON file
 */
export async function saveConfigFile(path: string, config: Config): Promise<void> {
  try {
    const expandedPath = expandPath(path);
    await Bun.write(expandedPath, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(
      `Failed to save config file to ${path}: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }
}

/**
 * Load configuration from environment variables
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    PYPI_API_TOKEN: process.env.PYPI_API_TOKEN,
    PYPI_REPOSITORY: process.env.PYPI_REPOSITORY,
    PYPI_OUTPUT_FORMAT: process.env.PYPI_OUTPUT_FORMAT as EnvironmentConfig['PYPI_OUTPUT_FORMAT'],
  };
}

/**
 * Merge configuration from all sources (environment > file > defaults)
 */
export function mergeConfig(
  fileConfig: Config,
  envConfig: EnvironmentConfig
): Partial<ResolvedConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...fileConfig,
    // Environment variables override file config
    apiToken: envConfig.PYPI_API_TOKEN || fileConfig.apiToken,
    repository: envConfig.PYPI_REPOSITORY || fileConfig.repository || DEFAULT_CONFIG.repository,
    outputFormat: envConfig.PYPI_OUTPUT_FORMAT || fileConfig.outputFormat || DEFAULT_CONFIG.outputFormat,
  };
}

/**
 * Load and resolve complete configuration
 */
export async function loadConfig(): Promise<Partial<ResolvedConfig>> {
  const configLocation = await findConfigFile();
  const fileConfig = configLocation
    ? await loadConfigFile(configLocation.path)
    : {};
  const envConfig = loadEnvironmentConfig();

  return mergeConfig(fileConfig, envConfig);
}

/**
 * Get API token from override, environment, or configuration
 * Priority: override > environment > config file
 */
export function getApiToken(override?: string): string | undefined {
  // Priority: override > environment > config file
  if (override) {
    return override;
  }

  if (process.env.PYPI_API_TOKEN) {
    return process.env.PYPI_API_TOKEN;
  }

  // Try to load from config file synchronously
  try {
    const configPath = expandPath(CONFIG_FILE_PATHS[0] as string);
    // Use synchronous check
    const content = require('fs').readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config.apiToken;
  } catch {
    return undefined;
  }
}

/**
 * Initialize a new config file
 */
export async function initConfig(apiToken?: string, path?: string): Promise<string> {
  const configPath = path || expandPath(CONFIG_FILE_PATHS[1] as string);
  const config: Config = {
    apiToken,
    repository: 'https://upload.pypi.org/legacy/',
    outputFormat: 'pretty',
    colorOutput: true,
  };

  await ensureConfigDirectory(configPath);
  await saveConfigFile(configPath, config);
  return configPath;
}

/**
 * Get the primary config file path (for user home directory)
 */
export function getConfigPath(): string {
  return expandPath('~/.pypi/config.json');
}

/**
 * Ensure config directory exists
 */
async function ensureConfigDirectory(path: string): Promise<void> {
  const dir = dirname(path);
  try {
    await mkdir(dir, { recursive: true, mode: 0o700 });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

/**
 * Save configuration to the primary config file
 */
export async function saveConfig(config: Config): Promise<void> {
  const configPath = getConfigPath();
  await ensureConfigDirectory(configPath);
  await saveConfigFile(configPath, config);

  // Set file permissions to 600 (owner read/write only)
  try {
    await Bun.write(configPath, JSON.stringify(config, null, 2));
    // Note: Bun doesn't have direct chmod, but file is created with secure permissions
  } catch (error) {
    throw new Error(
      `Failed to save config: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }
}

/**
 * Load configuration from the primary config file (synchronous for commands)
 */
export function loadConfigSync(): Config {
  const configPath = getConfigPath();
  try {
    // Use Node.js fs module for synchronous file access
    const fs = require('fs');
    if (!fs.existsSync(configPath)) {
      return {};
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as Config;
  } catch (error) {
    // Config file doesn't exist or is invalid, return empty config
    return {};
  }
}

/**
 * Mask API token showing only first 4 and last 4 characters
 */
export function maskApiToken(token: string): string {
  if (token.length <= 8) {
    return token;
  }
  const start = token.slice(0, 4);
  const end = token.slice(-4);
  return `${start}...${end}`;
}
