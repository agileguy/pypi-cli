/**
 * Info command - Get detailed package information
 */

import { Command } from 'commander';
import { createClient, PyPIAPIError } from '../../lib/api-client.js';
import { formatPackageInfo, error as logError } from '../../lib/output.js';
import { createVersionsCommand } from './versions.js';
import { createReleasesCommand } from './releases.js';
import { createDepsCommand } from './deps.js';

interface InfoOptions {
  json?: boolean;
}

/**
 * Create the info command group
 */
export function createInfoCommand(): Command {
  const command = new Command('info');

  // Main info command
  command
    .description('Get detailed package information')
    .argument('<package>', 'Package name')
    .argument('[version]', 'Specific version (optional, defaults to latest)')
    .option('--json', 'Output as JSON')
    .action(async (packageName: string, version: string | undefined, options: InfoOptions) => {
      try {
        const client = createClient();

        // Get package information
        const result = await client.getPackage(packageName, version);

        // Output format
        if (options.json) {
          console.log(JSON.stringify(result.data.info, null, 2));
        } else {
          console.log(formatPackageInfo(result.data));
        }
      } catch (err) {
        if (err instanceof PyPIAPIError) {
          logError(`Failed to get package info: ${err.message}`);
          if (err.statusCode === 404) {
            console.log(`\nPackage "${packageName}"${version ? ` version ${version}` : ''} not found on PyPI`);
            console.log('Tip: Use "pypi search" to find packages');
          }
        } else {
          logError(`Failed to get package info: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  // Add subcommands
  command.addCommand(createVersionsCommand());
  command.addCommand(createReleasesCommand());
  command.addCommand(createDepsCommand());

  return command;
}
