/**
 * Downloads command - Show download trends over time
 */

import { Command } from 'commander';
import { createClient, PyPIAPIError } from '../../lib/api-client.js';
import { cache, TTL } from '../../lib/cache.js';
import { renderLineChart, calculatePercentageChange, formatDateShort } from '../../lib/chart.js';
import chalk from 'chalk';
import { error as logError } from '../../lib/output.js';
import Table from 'cli-table3';

interface DownloadsOptions {
  period?: string;
  version?: string;
  json?: boolean;
  noCache?: boolean;
}

type Period = 'recent' | 'last-day' | 'last-week' | 'last-month';

/**
 * Create the downloads command
 */
export function createDownloadsCommand(): Command {
  const command = new Command('downloads');

  command
    .description('Show download trends over time')
    .argument('<package>', 'Package name')
    .option('-p, --period <period>', 'Time period: recent, last-day, last-week, last-month', 'recent')
    .option('-v, --version <version>', 'Filter by package version')
    .option('--json', 'Output as JSON')
    .option('--no-cache', 'Skip cache and fetch fresh data')
    .action(async (packageName: string, options: DownloadsOptions) => {
      try {
        const client = createClient();
        const period = (options.period || 'recent') as Period;
        const cacheKey = `downloads:${packageName}:${period}:${options.version || 'all'}`;

        // Validate period
        const validPeriods: Period[] = ['recent', 'last-day', 'last-week', 'last-month'];
        if (!validPeriods.includes(period)) {
          logError(`Invalid period: ${period}`);
          console.log(`Valid periods: ${validPeriods.join(', ')}`);
          process.exit(1);
        }

        // Check cache first (unless disabled)
        let data: { date: string; downloads: number }[] | null = null;

        if (!options.noCache) {
          data = cache.get<{ date: string; downloads: number }[]>(cacheKey);
        }

        // Fetch data if not cached
        if (!data) {
          // Use overall endpoint for all periods
          const result = await client.getOverallStats(packageName);

          // Filter to "without_mirrors" and map to the format we need
          const allData = result.data.data
            .filter(d => d.category === 'without_mirrors' && d.date)
            .map(d => ({
              date: d.date || '',
              downloads: d.downloads,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

          // Apply period filter
          const now = new Date();
          const filterDate = new Date(now);

          switch (period) {
            case 'last-day':
              filterDate.setDate(now.getDate() - 1);
              break;
            case 'last-week':
              filterDate.setDate(now.getDate() - 7);
              break;
            case 'last-month':
              filterDate.setMonth(now.getMonth() - 1);
              break;
            case 'recent':
            default:
              filterDate.setDate(now.getDate() - 30);
              break;
          }

          data = allData.filter(d => new Date(d.date) >= filterDate);

          // Cache the results (1 hour TTL)
          cache.set(cacheKey, data, TTL.ONE_HOUR);
        }

        if (!data || data.length === 0) {
          console.log(chalk.yellow('No download data available for this package'));
          return;
        }

        if (options.json) {
          console.log(JSON.stringify({ package: packageName, period, data }, null, 2));
        } else {
          // Format and display
          const periodLabel = period.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          console.log(chalk.bold.cyan(`📈 Download Trends: ${packageName} (${periodLabel})`));
          console.log(chalk.dim('═'.repeat(50)));
          console.log();

          // Calculate totals and trends
          const total = data.reduce((sum, d) => sum + d.downloads, 0);
          console.log(chalk.bold('Total Downloads:'), chalk.yellow(total.toLocaleString()));
          console.log();

          // Show data table (last 15 entries)
          const tableData = new Table({
            head: [chalk.bold('Date'), chalk.bold('Downloads'), chalk.bold('Change')],
            style: {
              head: ['cyan'],
            },
          });

          const displayData = data.slice(-15);
          displayData.forEach((point, index) => {
            const previousPoint = displayData[index - 1];
            const change = index > 0 && previousPoint
              ? calculatePercentageChange(point.downloads, previousPoint.downloads)
              : '-';

            const changeColor = change.startsWith('+') ? chalk.green : change.startsWith('-') ? chalk.red : chalk.dim;

            tableData.push([
              formatDateShort(point.date),
              point.downloads.toLocaleString(),
              changeColor(change),
            ]);
          });

          console.log(tableData.toString());
          console.log();

          // ASCII chart
          if (data.length > 1) {
            console.log(chalk.bold('Trend Chart:'));
            console.log();

            const chartData = data.slice(-20).map(d => ({
              label: formatDateShort(d.date).substring(0, 6),
              value: d.downloads,
            }));

            console.log(renderLineChart(chartData, 8));
            console.log();
          }

          // Calculate growth
          if (data.length >= 2) {
            const latest = data[data.length - 1];
            const previous = data[data.length - 2];
            if (latest && previous) {
              const growth = calculatePercentageChange(latest.downloads, previous.downloads);

              const growthColor = growth.startsWith('+') ? chalk.green : growth.startsWith('-') ? chalk.red : chalk.yellow;
              console.log(chalk.bold('Latest Trend:'), growthColor(growth), 'vs previous period');
            }
          }
        }
      } catch (err) {
        if (err instanceof PyPIAPIError) {
          logError(`Failed to get download stats: ${err.message}`);
          if (err.statusCode === 404) {
            console.log(`\nPackage "${packageName}" not found`);
            console.log('Tip: Check package name spelling');
          }
        } else {
          logError(`Failed to get download stats: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}
