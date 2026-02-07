/**
 * Versions command - List all versions of a package
 */

import { Command } from 'commander';
import { createClient, PyPIAPIError } from '../../lib/api-client.js';
import { createTable, error as logError } from '../../lib/output.js';
import chalk from 'chalk';

interface VersionsOptions {
  limit?: string;
  json?: boolean;
}

/**
 * Create the versions command
 */
export function createVersionsCommand(): Command {
  const command = new Command('versions');

  command
    .description('List all versions of a package')
    .argument('<package>', 'Package name')
    .option('-l, --limit <number>', 'Maximum number of versions to display')
    .option('--json', 'Output as JSON')
    .action(async (packageName: string, options: VersionsOptions) => {
      try {
        const client = createClient();

        // Get package data
        const result = await client.getPackage(packageName);
        const latestVersion = result.data.info.version;
        const releases = result.data.releases;

        // Get all version strings and sort (newest first)
        const versions = Object.keys(releases).sort((a, b) => {
          // Simple reverse alphabetical sort (works for most semantic versions)
          return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Apply limit if specified
        const limit = options.limit ? parseInt(options.limit, 10) : versions.length;
        if (isNaN(limit) || limit < 1) {
          logError('Limit must be a positive number');
          process.exit(1);
        }

        const displayVersions = versions.slice(0, limit);

        // JSON output
        if (options.json) {
          const jsonOutput = displayVersions.map(version => {
            const release = releases[version];
            const hasFiles = release && release.length > 0;
            const releaseDate = hasFiles && release[0] ? release[0].upload_time.split('T')[0] : null;
            const requiresPython = hasFiles && release[0] ? release[0].requires_python || null : null;
            const isYanked = hasFiles ? release.some(f => f.yanked) : false;

            return {
              version,
              released: releaseDate,
              python: requiresPython,
              yanked: isYanked,
              is_latest: version === latestVersion,
            };
          });

          console.log(JSON.stringify(jsonOutput, null, 2));
          return;
        }

        // Table output
        const rows: string[][] = [];

        for (const version of displayVersions) {
          const release = releases[version];
          const hasFiles = release && release.length > 0;
          const releaseDate = hasFiles && release[0] ? release[0].upload_time.split('T')[0] : 'N/A';
          const requiresPython = hasFiles && release[0] ? release[0].requires_python || 'any' : 'any';
          const isYanked = hasFiles ? release.some(f => f.yanked) : false;
          const isLatest = version === latestVersion;

          // Format version with highlighting
          let versionDisplay: string = version;
          if (isLatest) {
            versionDisplay = chalk.green.bold(version);
          }

          rows.push([
            versionDisplay,
            releaseDate || '',
            requiresPython || '',
            isYanked ? chalk.red('Yes') : '',
          ]);
        }

        const table = createTable(
          ['Version', 'Released', 'Python', 'Yanked'],
          rows
        );

        console.log(table);

        // Show summary
        if (versions.length > displayVersions.length) {
          console.log(chalk.dim(`\nShowing ${displayVersions.length} of ${versions.length} versions`));
          console.log(chalk.dim(`Use --limit to show more versions`));
        } else {
          console.log(chalk.dim(`\nTotal versions: ${versions.length}`));
        }
      } catch (err) {
        if (err instanceof PyPIAPIError) {
          logError(`Failed to get versions: ${err.message}`);
          if (err.statusCode === 404) {
            console.log(`\nPackage "${packageName}" not found on PyPI`);
          }
        } else {
          logError(`Failed to get versions: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}
