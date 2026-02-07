/**
 * Check Command - Validate distribution files before upload
 *
 * pypi check [path]
 */

import { Command } from 'commander';
import { validateDistribution, getDistributionFiles, extractMetadataFromWheel, extractMetadataFromSdist } from '../../lib/upload.js';
import { success, error, warning, info, formatHeader } from '../../lib/output.js';
import chalk from 'chalk';

/**
 * Check command options
 */
interface CheckOptions {
  verbose?: boolean;
}

/**
 * Create the check command
 */
export function createCheckCommand(): Command {
  const command = new Command('check');

  command
    .description('Validate package distribution files before upload')
    .argument('[path]', 'Path to distribution file or directory (default: ./dist)', './dist')
    .option('-v, --verbose', 'Show detailed validation information')
    .action(checkAction);

  return command;
}

/**
 * Check command action
 */
async function checkAction(path: string, options: CheckOptions): Promise<void> {
  try {
    console.log(formatHeader('Checking Distribution Files'));

    // Determine if path is a file or directory
    const file = Bun.file(path);
    const isFile = await file.exists();

    let filesToCheck: string[] = [];

    if (isFile) {
      // Single file
      filesToCheck = [path];
    } else {
      // Directory - find all distribution files
      filesToCheck = await getDistributionFiles(path);

      if (filesToCheck.length === 0) {
        error(`No distribution files found in ${path}`);
        error('Expected files: .whl, .tar.gz, .egg, or .zip');
        process.exit(1);
      }

      info(`Found ${filesToCheck.length} distribution file(s)`);
      console.log();
    }

    // Validate each file
    let allValid = true;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const filePath of filesToCheck) {
      const filename = filePath.split('/').pop() || filePath;
      console.log(chalk.bold(`Checking ${filename}...`));

      // Validate the file
      const result = await validateDistribution(filePath);

      // Extract metadata for display
      let metadata;
      if (filePath.endsWith('.whl')) {
        metadata = await extractMetadataFromWheel(filePath);
      } else if (filePath.endsWith('.tar.gz')) {
        metadata = await extractMetadataFromSdist(filePath);
      }

      // Display validation results
      if (result.valid) {
        success('Valid distribution format');
      } else {
        error('Invalid distribution format');
        allValid = false;
      }

      // Show errors
      if (result.errors.length > 0) {
        console.log(chalk.red('  Errors:'));
        for (const err of result.errors) {
          console.log(chalk.red(`    ✗ ${err}`));
          totalErrors++;
        }
      }

      // Show warnings
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('  Warnings:'));
        for (const warn of result.warnings) {
          console.log(chalk.yellow(`    ⚠ ${warn}`));
          totalWarnings++;
        }
      }

      // Show metadata if verbose or valid
      if ((options.verbose || result.valid) && metadata) {
        console.log('  Metadata:');
        if (metadata.name) {
          console.log(chalk.green(`    ✓ Name: ${metadata.name}`));
        }
        if (metadata.version) {
          console.log(chalk.green(`    ✓ Version: ${metadata.version}`));
        }
      }

      // Show file size
      const fileStats = Bun.file(filePath);
      const size = fileStats.size;
      const sizeStr = formatBytes(size);

      if (options.verbose) {
        console.log(`  Size: ${sizeStr}`);
      }

      console.log();
    }

    // Summary
    console.log(formatHeader('Validation Summary'));
    console.log(`Files checked: ${filesToCheck.length}`);
    console.log(`Errors: ${chalk.red(totalErrors.toString())}`);
    console.log(`Warnings: ${chalk.yellow(totalWarnings.toString())}`);
    console.log();

    if (allValid && totalErrors === 0) {
      success('All checks passed. Ready to upload.');
      process.exit(0);
    } else {
      error('Validation failed. Fix errors before uploading.');
      process.exit(1);
    }
  } catch (err) {
    error(`Failed to check distribution files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    process.exit(1);
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
