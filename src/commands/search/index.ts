/**
 * Search command - Search PyPI for packages
 */

import { Command } from 'commander';
import { createClient, PyPIAPIError } from '../../lib/api-client.js';
import { formatSearchResults, formatOutput, error as logError } from '../../lib/output.js';
import type { OutputFormat } from '../../types/api.js';

interface SearchOptions {
  limit?: string;
  json?: boolean;
  output?: OutputFormat;
}

/**
 * Create the search command
 */
export function createSearchCommand(): Command {
  const command = new Command('search');

  command
    .description('Search PyPI for packages')
    .argument('<query>', 'Search query')
    .option('-l, --limit <number>', 'Maximum number of results to display', '20')
    .option('--json', 'Output results as JSON')
    .action(async (query: string, options: SearchOptions) => {
      try {
        const client = createClient();
        const limit = options.limit ? parseInt(options.limit, 10) : 20;

        // Validate limit
        if (isNaN(limit) || limit < 1) {
          logError('Limit must be a positive number');
          process.exit(1);
        }

        // Search for packages
        const result = await client.searchPackages(query, limit);

        // Determine output format
        const outputFormat = options.json ? 'json' : (options.output || 'pretty');

        // Format and display results
        if (options.json || outputFormat === 'json') {
          console.log(JSON.stringify(result.data, null, 2));
        } else if (outputFormat === 'table') {
          const tableData = result.data.map(pkg => ({
            name: pkg.name,
            version: pkg.version,
            summary: pkg.summary || '',
          }));
          console.log(formatOutput(tableData, { format: 'table' }));
        } else {
          // Pretty format (default)
          console.log(formatSearchResults(result.data));
        }

        // Show result count
        if (!options.json && result.data.length > 0) {
          console.log(`\nFound ${result.data.length} package${result.data.length === 1 ? '' : 's'}`);
        }
      } catch (err) {
        if (err instanceof PyPIAPIError) {
          logError(`Search failed: ${err.message}`);
          if (err.statusCode === 404) {
            console.log('\nTip: Try a different search query or check the package name spelling');
          }
        } else {
          logError(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}
