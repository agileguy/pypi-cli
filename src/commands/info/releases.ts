/**
 * Releases command - Show release files for a package version
 */

import { Command } from 'commander';
import { createClient, PyPIAPIError } from '../../lib/api-client.js';
import { createTable, formatFileSize, error as logError } from '../../lib/output.js';
import chalk from 'chalk';

interface ReleasesOptions {
  json?: boolean;
}

/**
 * Create the releases command
 */
export function createReleasesCommand(): Command {
  const command = new Command('releases');

  command
    .description('Show release files for a package version')
    .argument('<package>', 'Package name')
    .argument('[version]', 'Specific version (optional, defaults to latest)')
    .option('--json', 'Output as JSON')
    .action(async (packageName: string, version: string | undefined, options: ReleasesOptions) => {
      try {
        const client = createClient();

        // Get package data
        const result = await client.getPackage(packageName, version);
        const targetVersion = version || result.data.info.version;
        const releaseFiles = result.data.urls;

        if (!releaseFiles || releaseFiles.length === 0) {
          console.log(chalk.yellow(`No release files found for ${packageName} ${targetVersion}`));
          return;
        }

        // JSON output
        if (options.json) {
          const jsonOutput = releaseFiles.map(file => ({
            filename: file.filename,
            size: file.size,
            type: file.packagetype,
            upload_date: file.upload_time.split('T')[0],
            python_version: file.python_version,
            requires_python: file.requires_python || null,
            url: file.url,
            yanked: file.yanked,
            yanked_reason: file.yanked_reason,
          }));

          console.log(JSON.stringify(jsonOutput, null, 2));
          return;
        }

        // Table output
        console.log(chalk.bold.cyan(`\nRelease files for ${packageName} ${targetVersion}\n`));

        const rows: string[][] = [];

        for (const file of releaseFiles) {
          const uploadDate = file.upload_time.split('T')[0];
          const pythonVersion = file.python_version === 'source' ? 'src' : file.python_version;

          // Format filename with yanked indicator
          let filename: string = file.filename;
          if (file.yanked) {
            filename = chalk.red(`${filename} [YANKED]`);
            if (file.yanked_reason) {
              filename += chalk.dim(` - ${file.yanked_reason}`);
            }
          }

          rows.push([
            filename,
            formatFileSize(file.size),
            file.packagetype,
            uploadDate || '',
            pythonVersion || '',
          ]);
        }

        const table = createTable(
          ['Filename', 'Size', 'Type', 'Upload Date', 'Python'],
          rows
        );

        console.log(table);

        // Show summary
        console.log(chalk.dim(`\nTotal files: ${releaseFiles.length}`));

        // Show any Python version requirements
        const requiresPython = releaseFiles[0]?.requires_python;
        if (requiresPython) {
          console.log(chalk.dim(`Python required: ${requiresPython}`));
        }
      } catch (err) {
        if (err instanceof PyPIAPIError) {
          logError(`Failed to get releases: ${err.message}`);
          if (err.statusCode === 404) {
            console.log(`\nPackage "${packageName}"${version ? ` version ${version}` : ''} not found on PyPI`);
          }
        } else {
          logError(`Failed to get releases: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}
