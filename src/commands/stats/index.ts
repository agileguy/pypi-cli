/**
 * Stats command - Show download statistics from pypistats.org
 */

import { Command } from 'commander';
import { createClient, PyPIAPIError } from '../../lib/api-client.js';
import { cache, TTL } from '../../lib/cache.js';
import chalk from 'chalk';
import { error as logError, formatHeader } from '../../lib/output.js';
import { createDownloadsCommand } from './downloads.js';
import { createTrendingCommand } from './trending.js';

interface StatsOptions {
  json?: boolean;
  noCache?: boolean;
}

interface StatsData {
  category: string;
  downloads: number;
  date?: string;
}

/**
 * Create the stats command group
 */
export function createStatsCommand(): Command {
  const command = new Command('stats');

  // Main stats command
  command
    .description('Show download statistics from pypistats.org')
    .argument('<package>', 'Package name')
    .option('--json', 'Output as JSON')
    .option('--no-cache', 'Skip cache and fetch fresh data')
    .action(async (packageName: string, options: StatsOptions) => {
      try {
        const client = createClient();
        const cacheKey = `stats:${packageName}`;

        // Check cache first (unless disabled)
        let overallData: StatsData[] | null = null;
        let pythonData: StatsData[] | null = null;
        let systemData: StatsData[] | null = null;
        let recentData: { date: string; downloads: number }[] | null = null;

        if (!options.noCache) {
          const cached = cache.get<{
            overall: StatsData[];
            python: StatsData[];
            system: StatsData[];
            recent: { date: string; downloads: number }[];
          }>(cacheKey);

          if (cached) {
            overallData = cached.overall;
            pythonData = cached.python;
            systemData = cached.system;
            recentData = cached.recent;
          }
        }

        // Fetch data if not cached
        if (!overallData || !pythonData || !systemData || !recentData) {
          const [overall, python, system] = await Promise.all([
            client.getOverallStats(packageName),
            client.getPythonMajorStats(packageName),
            client.getSystemStats(packageName),
          ]);

          overallData = overall.data.data;
          pythonData = python.data.data;
          systemData = system.data.data;

          // Use overall stats filtered to "without_mirrors" for recent data
          recentData = overallData
            .filter(d => d.category === 'without_mirrors')
            .map(d => ({
              date: d.date || '',
              downloads: d.downloads,
            }))
            .slice(-30); // Last 30 days

          // Cache the results (1 hour TTL)
          cache.set(cacheKey, { overall: overallData, python: pythonData, system: systemData, recent: recentData }, TTL.ONE_HOUR);
        }

        // Calculate totals
        const totalDownloads = recentData.reduce((sum, d) => sum + d.downloads, 0);
        const dailyAverage = Math.round(totalDownloads / recentData.length);

        // Find peak day
        const peakDay = recentData.length > 0 && recentData[0]
          ? recentData.reduce((max, d) => d.downloads > max.downloads ? d : max, recentData[0])
          : null;

        if (options.json) {
          console.log(JSON.stringify({
            package: packageName,
            totalDownloads,
            dailyAverage,
            peakDay,
            pythonVersions: pythonData,
            systems: systemData,
          }, null, 2));
        } else {
          // Format and display
          console.log(chalk.bold.cyan(`📊 Download Statistics: ${packageName}`));
          console.log(chalk.dim('═'.repeat(50)));
          console.log();

          console.log(chalk.bold('Total Downloads (last 30 days):'), chalk.yellow(totalDownloads.toLocaleString()));
          console.log(chalk.bold('Daily Average:'), chalk.yellow(dailyAverage.toLocaleString()));
          if (peakDay) {
            console.log(chalk.bold('Peak Day:'), chalk.yellow(`${peakDay.date} (${peakDay.downloads.toLocaleString()})`));
          }
          console.log();

          // Python versions chart
          if (pythonData && pythonData.length > 0) {
            console.log(formatHeader('Python Versions'));

            // Aggregate by category (sum all dates for each Python version)
            const pythonAggregated = pythonData.reduce((acc, d) => {
              acc[d.category] = (acc[d.category] || 0) + d.downloads;
              return acc;
            }, {} as Record<string, number>);

            const totalPython = Object.values(pythonAggregated).reduce((sum, v) => sum + v, 0);
            const pythonChart = Object.entries(pythonAggregated)
              .filter(([, downloads]) => downloads > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, downloads]) => ({
                label: `Python ${category}`,
                value: (downloads / totalPython) * 100,
              }));

            pythonChart.forEach(p => {
              const percentage = p.value;
              const bar = renderProgressBar(percentage, 20);
              console.log(`  ${p.label.padEnd(13)} ${percentage.toFixed(0).padStart(3)}%  ${bar}`);
            });
            console.log();
          }

          // Systems chart
          if (systemData && systemData.length > 0) {
            console.log(formatHeader('Systems'));

            // Aggregate by category (sum all dates for each system)
            const systemAggregated = systemData.reduce((acc, d) => {
              acc[d.category] = (acc[d.category] || 0) + d.downloads;
              return acc;
            }, {} as Record<string, number>);

            const totalSystems = Object.values(systemAggregated).reduce((sum, v) => sum + v, 0);
            const systemChart = Object.entries(systemAggregated)
              .filter(([, downloads]) => downloads > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, downloads]) => ({
                label: category,
                value: (downloads / totalSystems) * 100,
              }));

            systemChart.forEach(s => {
              const percentage = s.value;
              const bar = renderProgressBar(percentage, 20);
              console.log(`  ${s.label.padEnd(13)} ${percentage.toFixed(0).padStart(3)}%  ${bar}`);
            });
          }
        }
      } catch (err) {
        if (err instanceof PyPIAPIError) {
          logError(`Failed to get statistics: ${err.message}`);
          if (err.statusCode === 404) {
            console.log(`\nPackage "${packageName}" not found`);
            console.log('Tip: Check package name spelling');
          }
        } else {
          logError(`Failed to get statistics: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  // Add subcommands
  command.addCommand(createDownloadsCommand());
  command.addCommand(createTrendingCommand());

  return command;
}

/**
 * Render a simple progress bar
 */
function renderProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return chalk.cyan('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}
