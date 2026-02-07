/**
 * Upload Command - Upload a single distribution file to PyPI
 *
 * pypi upload <file>
 */

import { Command } from 'commander';
import { uploadToRepository, validateDistribution, REPOSITORIES } from '../../lib/upload.js';
import { getApiToken } from '../../lib/config.js';
import { success, error, info, formatHeader } from '../../lib/output.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Upload command options
 */
interface UploadOptions {
  repository?: string;
  token?: string;
}

/**
 * Create the upload command
 */
export function createUploadCommand(): Command {
  const command = new Command('upload');

  command
    .description('Upload a single distribution file to PyPI')
    .argument('<file>', 'Path to distribution file (.whl or .tar.gz)')
    .option('-r, --repository <name>', 'Repository name (pypi, testpypi) or URL', 'pypi')
    .option('-t, --token <token>', 'PyPI API token (or use PYPI_API_TOKEN env var)')
    .action(uploadAction);

  return command;
}

/**
 * Upload command action
 */
async function uploadAction(file: string, options: UploadOptions): Promise<void> {
  try {
    console.log(formatHeader('Uploading Distribution File'));

    // Get API token
    const token = getApiToken(options.token);
    if (!token) {
      error('No API token provided');
      error('Set PYPI_API_TOKEN environment variable or use --token option');
      error('Or configure with: pypi config set apiToken <your-token>');
      process.exit(1);
    }

    // Check if file exists
    const fileHandle = Bun.file(file);
    if (!(await fileHandle.exists())) {
      error(`File not found: ${file}`);
      process.exit(1);
    }

    const filename = file.split('/').pop() || file;
    info(`File: ${filename}`);

    // Get repository info
    const repository = options.repository || 'pypi';
    const repoInfo = REPOSITORIES[repository];
    if (repoInfo) {
      info(`Repository: ${repoInfo.name}`);
    } else {
      info(`Repository: ${repository}`);
    }
    console.log();

    // Validate the file first
    const spinner = ora('Validating distribution file...').start();
    const validation = await validateDistribution(file);

    if (!validation.valid) {
      spinner.fail('Validation failed');
      console.log();
      error('Validation errors:');
      for (const err of validation.errors) {
        console.log(chalk.red(`  ✗ ${err}`));
      }
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      spinner.warn('Validation passed with warnings');
      for (const warn of validation.warnings) {
        console.log(chalk.yellow(`  ⚠ ${warn}`));
      }
      console.log();
    } else {
      spinner.succeed('Validation passed');
      console.log();
    }

    // Upload the file
    const uploadSpinner = ora(`Uploading ${filename}...`).start();

    const result = await uploadToRepository(file, token, repository);

    if (!result.success) {
      uploadSpinner.fail('Upload failed');
      console.log();
      error(result.message || 'Unknown error');

      // Provide helpful error messages
      if (result.statusCode === 403) {
        error('Check that your API token is valid and has upload permissions');
      } else if (result.statusCode === 409) {
        error('This version already exists on the repository');
        error('Increment the version number and rebuild your package');
      }

      process.exit(1);
    }

    uploadSpinner.succeed('Upload successful');
    console.log();

    // Show success information
    success('Package uploaded successfully!');
    if (result.url) {
      info(`View at: ${chalk.cyan(result.url)}`);
    }
  } catch (err) {
    error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    process.exit(1);
  }
}
