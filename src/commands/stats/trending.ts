/**
 * Trending command - Show trending packages
 */

import { Command } from 'commander';
import { createClient, PyPIAPIError } from '../../lib/api-client.js';
import { cache, TTL } from '../../lib/cache.js';
import { formatNumber, calculatePercentageChange } from '../../lib/chart.js';
import chalk from 'chalk';
import { error as logError } from '../../lib/output.js';
import Table from 'cli-table3';
import ora from 'ora';

interface TrendingOptions {
  limit?: number;
  category?: string;
  json?: boolean;
  noCache?: boolean;
}

interface TrendingPackage {
  rank: number;
  name: string;
  downloads: number;
  growth: string;
  description?: string;
}

/**
 * Popular packages to check for trending
 * These are well-known packages across different categories
 */
const POPULAR_PACKAGES = [
  // Web frameworks
  'django', 'flask', 'fastapi', 'tornado', 'pyramid',
  // Data science
  'numpy', 'pandas', 'scipy', 'matplotlib', 'scikit-learn',
  // ML/AI
  'tensorflow', 'torch', 'keras', 'transformers', 'opencv-python',
  // DevOps
  'ansible', 'fabric', 'paramiko', 'docker', 'kubernetes',
  // Testing
  'pytest', 'unittest2', 'nose2', 'tox', 'coverage',
  // HTTP clients
  'requests', 'httpx', 'aiohttp', 'urllib3', 'certifi',
  // CLI tools
  'click', 'typer', 'argparse', 'rich', 'colorama',
  // Async
  'asyncio', 'trio', 'anyio', 'gevent', 'eventlet',
  // Utilities
  'python-dateutil', 'pytz', 'six', 'setuptools', 'wheel',
];

/**
 * Create the trending command
 */
export function createTrendingCommand(): Command {
  const command = new Command('trending');

  command
    .description('Show trending packages with high download growth')
    .option('-l, --limit <number>', 'Number of packages to show', '10')
    .option('-c, --category <category>', 'Filter by category (web, data, ml, devops, testing, http, cli, async, utils)')
    .option('--json', 'Output as JSON')
    .option('--no-cache', 'Skip cache and fetch fresh data')
    .action(async (options: TrendingOptions) => {
      try {
        const limit = parseInt(String(options.limit || 10), 10);
        const cacheKey = `trending:${options.category || 'all'}`;

        // Check cache first (unless disabled)
        let trendingPackages: TrendingPackage[] | null = null;

        if (!options.noCache) {
          trendingPackages = cache.get<TrendingPackage[]>(cacheKey);
        }

        // Fetch data if not cached
        if (!trendingPackages) {
          const spinner = ora('Fetching trending packages...').start();

          try {
            trendingPackages = await fetchTrendingPackages(options.category);
            spinner.succeed('Fetched trending data');

            // Cache the results (1 hour TTL)
            cache.set(cacheKey, trendingPackages, TTL.ONE_HOUR);
          } catch (err) {
            spinner.fail('Failed to fetch trending data');
            throw err;
          }
        }

        if (!trendingPackages || trendingPackages.length === 0) {
          console.log(chalk.yellow('No trending packages found'));
          return;
        }

        // Limit results
        const displayPackages = trendingPackages.slice(0, limit);

        if (options.json) {
          console.log(JSON.stringify({ trending: displayPackages }, null, 2));
        } else {
          // Format and display
          console.log(chalk.bold.cyan('🔥 Trending Python Packages'));
          console.log(chalk.dim('═'.repeat(70)));
          console.log();

          const table = new Table({
            head: [
              chalk.bold('#'),
              chalk.bold('Package'),
              chalk.bold('Downloads'),
              chalk.bold('Growth'),
            ],
            colWidths: [5, 25, 15, 12],
            style: {
              head: ['cyan'],
            },
          });

          displayPackages.forEach((pkg) => {
            const growthColor = pkg.growth.startsWith('+')
              ? chalk.green
              : pkg.growth.startsWith('-')
              ? chalk.red
              : chalk.yellow;

            table.push([
              pkg.rank.toString(),
              pkg.name,
              formatNumber(pkg.downloads),
              growthColor(pkg.growth),
            ]);
          });

          console.log(table.toString());
          console.log();
          console.log(chalk.dim('Note: Growth is calculated vs previous period'));
          console.log(chalk.dim('Data refreshed hourly from pypistats.org'));
        }
      } catch (err) {
        if (err instanceof PyPIAPIError) {
          logError(`Failed to get trending packages: ${err.message}`);
        } else {
          logError(`Failed to get trending packages: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}

/**
 * Fetch trending packages by checking popular packages
 */
async function fetchTrendingPackages(category?: string): Promise<TrendingPackage[]> {
  const client = createClient();

  // Filter packages by category if specified
  let packagesToCheck = POPULAR_PACKAGES;

  if (category) {
    const categoryMap: Record<string, string[]> = {
      web: ['django', 'flask', 'fastapi', 'tornado', 'pyramid'],
      data: ['numpy', 'pandas', 'scipy', 'matplotlib', 'scikit-learn'],
      ml: ['tensorflow', 'torch', 'keras', 'transformers', 'opencv-python'],
      devops: ['ansible', 'fabric', 'paramiko', 'docker', 'kubernetes'],
      testing: ['pytest', 'unittest2', 'nose2', 'tox', 'coverage'],
      http: ['requests', 'httpx', 'aiohttp', 'urllib3', 'certifi'],
      cli: ['click', 'typer', 'argparse', 'rich', 'colorama'],
      async: ['asyncio', 'trio', 'anyio', 'gevent', 'eventlet'],
      utils: ['python-dateutil', 'pytz', 'six', 'setuptools', 'wheel'],
    };

    packagesToCheck = categoryMap[category.toLowerCase()] || POPULAR_PACKAGES;
  }

  // Fetch stats for all packages in parallel
  const statsPromises = packagesToCheck.map(async (name) => {
    try {
      const result = await client.getOverallStats(name);

      // Filter to "without_mirrors" and extract recent data
      const data = result.data.data
        .filter(d => d.category === 'without_mirrors' && d.date)
        .map(d => ({
          date: d.date || '',
          downloads: d.downloads,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (data.length < 2) {
        return null;
      }

      const latest = data[data.length - 1];
      const previous = data[data.length - 2];

      if (!latest || !previous) {
        return null;
      }

      return {
        name,
        downloads: latest.downloads,
        growth: calculatePercentageChange(latest.downloads, previous.downloads),
        previousDownloads: previous.downloads,
      };
    } catch {
      return null;
    }
  });

  const stats = (await Promise.all(statsPromises)).filter((s): s is NonNullable<typeof s> => s !== null);

  // Sort by growth (parse percentage string)
  const sorted = stats
    .map(s => ({
      ...s,
      growthValue: parseFloat(s.growth.replace(/[+%]/g, '')),
    }))
    .sort((a, b) => b.growthValue - a.growthValue);

  // Format as trending packages with rank
  return sorted.map((pkg, index) => ({
    rank: index + 1,
    name: pkg.name,
    downloads: pkg.downloads,
    growth: pkg.growth,
  }));
}
