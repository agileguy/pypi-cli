/**
 * Publish Command - Publish all distributions in a directory to PyPI
 *
 * pypi publish [path]
 */

import { Command } from 'commander';
import {
  getDistributionFiles,
  validateDistribution,
  uploadToRepository,
  REPOSITORIES,
  extractMetadataFromWheel,
  extractMetadataFromSdist,
} from '../../lib/upload.js';
import { getApiToken } from '../../lib/config.js';
import { success, error, warning, info, formatHeader } from '../../lib/output.js';
import { createCheckCommand } from './check.js';
import { createUploadCommand } from './upload.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Publish command options
 */
interface PublishOptions {
  repository?: string;
  token?: string;
  yes?: boolean;
  dryRun?: boolean;
}

/**
 * Distribution file info
 */
interface DistributionInfo {
  path: string;
  filename: string;
  size: number;
  valid: boolean;
}

/**
 * Create the publish command group
 */
export function createPublishCommand(): Command {
  const command = new Command('publish');

  command
    .description('Publish all distributions in dist/ to PyPI')
    .argument('[path]', 'Path to distribution directory (default: ./dist)', './dist')
    .option('-r, --repository <name>', 'Repository name (pypi, testpypi) or URL', 'pypi')
    .option('-t, --token <token>', 'PyPI API token (or use PYPI_API_TOKEN env var)')
    .option('-y, --yes', 'Skip confirmation prompt')
    .option('--dry-run', 'Show what would be uploaded without uploading')
    .action(publishAction);

  // Add subcommands
  command.addCommand(createCheckCommand());
  command.addCommand(createUploadCommand());

  return command;
}

/**
 * Publish command action
 */
async function publishAction(path: string, options: PublishOptions): Promise<void> {
  try {
    console.log(formatHeader('Publishing Package to PyPI'));

    // Get API token (not needed for dry-run)
    let token: string | undefined;
    if (!options.dryRun) {
      token = getApiToken(options.token);
      if (!token) {
        error('No API token provided');
        error('Set PYPI_API_TOKEN environment variable or use --token option');
        error('Or configure with: pypi config set apiToken <your-token>');
        process.exit(1);
      }
    }

    // Get repository info
    const repository = options.repository || 'pypi';
    const repoInfo = REPOSITORIES[repository];
    if (repoInfo) {
      info(`Repository: ${repoInfo.name}`);
    } else {
      info(`Repository: ${repository}`);
    }
    console.log();

    // Step 1: Find distribution files
    const spinner = ora('Finding distribution files...').start();
    const files = await getDistributionFiles(path);

    if (files.length === 0) {
      spinner.fail('No distribution files found');
      console.log();
      error(`No distribution files found in ${path}`);
      error('Expected files: .whl, .tar.gz, .egg, or .zip');
      error('Build your package first with: python -m build');
      process.exit(1);
    }

    spinner.succeed(`Found ${files.length} distribution file(s)`);
    console.log();

    // Step 2: Validate all files
    console.log(formatHeader('Validation'));

    const distributions: DistributionInfo[] = [];
    let hasErrors = false;

    for (const filePath of files) {
      const filename = filePath.split('/').pop() || filePath;
      const fileHandle = Bun.file(filePath);
      const size = fileHandle.size;

      const validationSpinner = ora(`Checking ${filename}...`).start();
      const result = await validateDistribution(filePath);

      if (!result.valid) {
        validationSpinner.fail(`Validation failed for ${filename}`);
        for (const err of result.errors) {
          console.log(chalk.red(`  ✗ ${err}`));
        }
        hasErrors = true;
      } else if (result.warnings.length > 0) {
        validationSpinner.warn(`Validated ${filename} (with warnings)`);
        for (const warn of result.warnings) {
          console.log(chalk.yellow(`  ⚠ ${warn}`));
        }
      } else {
        validationSpinner.succeed(`Validated ${filename}`);
      }

      distributions.push({
        path: filePath,
        filename,
        size,
        valid: result.valid,
      });
    }

    console.log();

    if (hasErrors) {
      error('Validation failed. Fix errors before publishing.');
      process.exit(1);
    }

    // Step 3: Show summary
    console.log(formatHeader('Distribution Summary'));
    console.log();

    const totalSize = distributions.reduce((sum, d) => sum + d.size, 0);

    for (const dist of distributions) {
      const sizeStr = formatBytes(dist.size);
      console.log(`  ${chalk.cyan('•')} ${dist.filename} ${chalk.gray(`(${sizeStr})`)}`);
    }

    console.log();
    console.log(`Total files: ${distributions.length}`);
    console.log(`Total size: ${formatBytes(totalSize)}`);
    console.log();

    // Dry run mode - stop here
    if (options.dryRun) {
      info('Dry run mode - no files will be uploaded');
      success('Validation complete. Ready to publish.');
      return;
    }

    // Step 4: Confirm upload
    if (!options.yes) {
      const repoName = repoInfo?.name || repository;
      const question = `Upload to ${repoName}? [y/N]: `;

      // Simple confirmation using Bun's stdin
      process.stdout.write(question);

      const answer = await new Promise<string>((resolve) => {
        const stdin = process.stdin;
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        stdin.once('data', (key: string) => {
          stdin.setRawMode(false);
          stdin.pause();
          console.log(key.trim());
          resolve(key.toLowerCase());
        });
      });

      if (answer !== 'y' && answer !== 'yes') {
        info('Upload cancelled');
        process.exit(0);
      }

      console.log();
    }

    // Step 5: Upload files
    console.log(formatHeader('Uploading'));

    let uploadedCount = 0;
    let failedCount = 0;

    for (const dist of distributions) {
      const uploadSpinner = ora(`Uploading ${dist.filename}...`).start();

      const result = await uploadToRepository(dist.path, token!, repository);

      if (result.success) {
        uploadSpinner.succeed(`Uploaded ${dist.filename}`);
        uploadedCount++;
      } else {
        uploadSpinner.fail(`Failed to upload ${dist.filename}`);
        console.log(chalk.red(`  Error: ${result.message}`));
        failedCount++;

        // Don't stop on "already exists" errors, continue with other files
        if (result.statusCode !== 409) {
          // For other errors, we might want to stop
          if (result.statusCode === 403) {
            error('Authentication failed. Stopping upload.');
            break;
          }
        }
      }
    }

    console.log();

    // Step 6: Show final results
    if (failedCount === 0 && uploadedCount > 0) {
      success('Published successfully!');

      // Try to determine package name and version
      const firstFile = distributions[0];
      if (firstFile) {
        let metadata;
        if (firstFile.path.endsWith('.whl')) {
          metadata = await extractMetadataFromWheel(firstFile.path);
        } else if (firstFile.path.endsWith('.tar.gz')) {
          metadata = await extractMetadataFromSdist(firstFile.path);
        }

        if (metadata?.name) {
          const repoUrl = repository === 'testpypi'
            ? 'https://test.pypi.org'
            : 'https://pypi.org';
          const projectUrl = metadata.version
            ? `${repoUrl}/project/${metadata.name}/${metadata.version}/`
            : `${repoUrl}/project/${metadata.name}/`;

          info(`View at: ${chalk.cyan(projectUrl)}`);
        }
      }
    } else if (failedCount > 0) {
      warning(`Upload completed with errors: ${uploadedCount} succeeded, ${failedCount} failed`);
      process.exit(1);
    } else {
      error('No files were uploaded');
      process.exit(1);
    }
  } catch (err) {
    error(`Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
