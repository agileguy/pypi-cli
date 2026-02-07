/**
 * Output formatting utilities for PyPI CLI
 * Supports JSON, pretty, and table output with color support
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import type {
  PyPIPackage,
  SearchResult,
  DownloadStats,
  OutputFormat,
} from '../types/api.js';

interface OutputOptions {
  format?: OutputFormat;
  noColor?: boolean;
}

let globalNoColor = false;

/**
 * Set global color preference
 */
export function setNoColor(value: boolean): void {
  globalNoColor = value;
}

/**
 * Get chalk instance respecting color preferences
 */
function getChalk() {
  if (globalNoColor) {
    // Return a no-op chalk instance for no-color mode
    const noopChalk = (text: string) => text;
    const noopProxy = new Proxy(noopChalk, {
      get() {
        return noopProxy;
      },
      apply(_target, _thisArg, args) {
        return String(args[0] || '');
      },
    });
    return noopProxy as unknown as typeof chalk;
  }
  return chalk;
}

/**
 * Format output based on specified format
 */
export function formatOutput(data: unknown, options: OutputOptions = {}): string {
  const format = options.format || 'pretty';

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (format === 'table') {
    return formatTable(data);
  }

  // Default to pretty format
  return formatPretty(data);
}

/**
 * Format data in a human-readable pretty format
 */
function formatPretty(data: unknown): string {
  const c = getChalk();

  if (Array.isArray(data)) {
    return data
      .map((item, index) => {
        return `${c.dim(`[${index}]`)} ${formatPrettyObject(item)}`;
      })
      .join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    return formatPrettyObject(data);
  }

  return String(data);
}

/**
 * Format an object in a key-value format
 */
function formatPrettyObject(obj: object): string {
  const c = getChalk();
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return '{}';
  }

  const maxKeyLength = Math.max(...entries.map(([key]) => key.length));

  return entries
    .map(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength);
      const formattedValue = formatValue(value);
      return `${c.cyan(paddedKey)}: ${formattedValue}`;
    })
    .join('\n');
}

/**
 * Format a value with appropriate styling
 */
function formatValue(value: unknown): string {
  const c = getChalk();

  if (value === null) {
    return c.dim('null');
  }

  if (value === undefined) {
    return c.dim('undefined');
  }

  if (typeof value === 'boolean') {
    return value ? c.green('true') : c.red('false');
  }

  if (typeof value === 'number') {
    return c.yellow(String(value));
  }

  if (typeof value === 'string') {
    return c.white(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((v) => formatValue(v)).join(', ')}]`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

/**
 * Format data as a table
 */
function formatTable(data: unknown): string {
  if (!Array.isArray(data) || data.length === 0) {
    return 'No data to display';
  }

  const c = getChalk();
  const firstItem = data[0];

  if (typeof firstItem !== 'object' || firstItem === null) {
    // Simple array, display as single column
    const table = new Table({
      head: [c.bold('Value')],
    });

    data.forEach((item) => {
      table.push([String(item)]);
    });

    return table.toString();
  }

  // Array of objects, display as multi-column table
  const keys = Object.keys(firstItem);
  const table = new Table({
    head: keys.map((key) => c.bold(key)),
  });

  data.forEach((item: any) => {
    const row = keys.map((key) => String(item[key] || ''));
    table.push(row);
  });

  return table.toString();
}

/**
 * Format a success message string
 */
export function formatSuccess(message: string): string {
  const c = getChalk();
  return `${c.green('✓')} ${message}`;
}

/**
 * Format an error message string
 */
export function formatError(message: string): string {
  const c = getChalk();
  return `${c.red('✗')} ${message}`;
}

/**
 * Print success message
 */
export function success(message: string): void {
  console.log(formatSuccess(message));
}

/**
 * Print error message
 */
export function error(message: string): void {
  const c = getChalk();
  console.error(c.red('✗'), message);
}

/**
 * Print warning message
 */
export function warning(message: string): void {
  const c = getChalk();
  console.warn(c.yellow('⚠'), message);
}

/**
 * Print info message
 */
export function info(message: string): void {
  const c = getChalk();
  console.log(c.blue('ℹ'), message);
}

/**
 * Print verbose/debug message
 */
export function verbose(message: string, isVerbose = false): void {
  if (!isVerbose) return;
  const c = getChalk();
  console.log(c.dim('→'), c.dim(message));
}

/**
 * Print table from array of objects
 */
export function table(data: Array<Record<string, unknown>>): void {
  console.log(formatTable(data));
}

/**
 * Format warning message string
 */
export function formatWarning(message: string): string {
  const c = getChalk();
  return `${c.yellow('⚠')} ${message}`;
}

/**
 * Format info message string
 */
export function formatInfo(message: string): string {
  const c = getChalk();
  return `${c.blue('ℹ')} ${message}`;
}

/**
 * Format package information for display
 */
export function formatPackageInfo(pkg: PyPIPackage): string {
  const c = getChalk();
  const info = pkg.info;

  const sections: string[] = [];

  // Header
  sections.push(c.bold.cyan(`${info.name} ${info.version}`));
  sections.push(c.dim('─'.repeat(50)));

  // Basic info
  if (info.summary) {
    sections.push(`${c.bold('Summary:')} ${info.summary}`);
  }

  if (info.author) {
    sections.push(`${c.bold('Author:')} ${info.author}${info.author_email ? ` <${info.author_email}>` : ''}`);
  }

  if (info.license) {
    sections.push(`${c.bold('License:')} ${info.license}`);
  }

  if (info.home_page) {
    sections.push(`${c.bold('Homepage:')} ${c.underline(info.home_page)}`);
  }

  // Requirements
  if (info.requires_python) {
    sections.push(`${c.bold('Python:')} ${info.requires_python}`);
  }

  // Dependencies
  if (info.requires_dist && info.requires_dist.length > 0) {
    sections.push('');
    sections.push(c.bold('Dependencies:'));
    info.requires_dist.slice(0, 10).forEach(dep => {
      sections.push(`  • ${dep}`);
    });
    if (info.requires_dist.length > 10) {
      sections.push(c.dim(`  ... and ${info.requires_dist.length - 10} more`));
    }
  }

  // Project URLs
  if (info.project_urls && Object.keys(info.project_urls).length > 0) {
    sections.push('');
    sections.push(c.bold('Project URLs:'));
    Object.entries(info.project_urls).forEach(([key, url]) => {
      sections.push(`  ${key}: ${c.underline(url)}`);
    });
  }

  // Classifiers (show first 5)
  if (info.classifiers && info.classifiers.length > 0) {
    sections.push('');
    sections.push(c.bold('Classifiers:'));
    info.classifiers.slice(0, 5).forEach(classifier => {
      sections.push(c.dim(`  ${classifier}`));
    });
    if (info.classifiers.length > 5) {
      sections.push(c.dim(`  ... and ${info.classifiers.length - 5} more`));
    }
  }

  return sections.join('\n');
}

/**
 * Format search results for display
 */
export function formatSearchResults(results: SearchResult[]): string {
  const c = getChalk();

  if (results.length === 0) {
    return formatInfo('No packages found');
  }

  return results.map(result => {
    const parts = [
      c.bold.cyan(result.name),
      c.dim(`v${result.version}`),
    ];

    if (result.summary) {
      parts.push(`\n  ${result.summary}`);
    }

    if (result.author) {
      parts.push(c.dim(`\n  by ${result.author}`));
    }

    return parts.join(' ');
  }).join('\n\n');
}

/**
 * Format version list for display
 */
export function formatVersionList(versions: string[], current: string): string {
  const c = getChalk();

  return versions.map(version => {
    const isCurrent = version === current;
    const marker = isCurrent ? c.green('●') : c.dim('○');
    const text = isCurrent ? c.bold.green(version) : version;
    return `${marker} ${text}`;
  }).join('\n');
}

/**
 * Format dependencies for display
 */
export function formatDependencies(deps: string[]): string {
  const c = getChalk();

  if (deps.length === 0) {
    return c.dim('No dependencies');
  }

  return deps.map(dep => `  • ${dep}`).join('\n');
}

/**
 * Format download statistics for display
 */
export function formatDownloadStats(stats: DownloadStats): string {
  const c = getChalk();

  const sections: string[] = [];

  sections.push(c.bold.cyan(`Download Statistics: ${stats.package}`));
  sections.push(c.dim('─'.repeat(50)));

  // Calculate total downloads if data has downloads property
  if (stats.data.length > 0 && stats.data[0] && 'downloads' in stats.data[0]) {
    const total = stats.data.reduce((sum, point) => {
      return sum + (typeof point === 'object' && 'downloads' in point && typeof point.downloads === 'number' ? point.downloads : 0);
    }, 0);
    sections.push(`${c.bold('Total Downloads:')} ${c.yellow(total.toLocaleString())}`);

    sections.push('');
    sections.push(c.bold('Recent Data:'));

    const tableData = new Table({
      head: ['Date', 'Downloads'],
      style: {
        head: globalNoColor ? [] : ['cyan'],
      },
    });

    // Show last 10 data points
    stats.data.slice(-10).forEach(point => {
      if (typeof point === 'object' && 'date' in point && 'downloads' in point) {
        tableData.push([
          String(point.date || ''),
          typeof point.downloads === 'number' ? point.downloads.toLocaleString() : '0'
        ]);
      }
    });

    sections.push(tableData.toString());
  }

  return sections.join('\n');
}

/**
 * Create a table from headers and rows
 */
export function createTable(headers: string[], rows: string[][]): string {
  const tableData = new Table({
    head: headers,
    style: {
      head: globalNoColor ? [] : ['cyan'],
    },
  });

  rows.forEach(row => {
    tableData.push(row);
  });

  return tableData.toString();
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format a section header
 */
export function formatHeader(title: string): string {
  const c = getChalk();
  return c.bold.cyan(`\n${title}\n${'─'.repeat(title.length)}`);
}

/**
 * Format text as bold
 */
export function formatBold(text: string): string {
  const c = getChalk();
  return c.bold(text);
}

/**
 * Format text as dim/faded
 */
export function formatDim(text: string): string {
  const c = getChalk();
  return c.dim(text);
}
