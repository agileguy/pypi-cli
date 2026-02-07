/**
 * Deps command - Show package dependencies
 */

import { Command } from 'commander';
import { createClient, PyPIAPIError } from '../../lib/api-client.js';
import { error as logError } from '../../lib/output.js';
import chalk from 'chalk';

interface DepsOptions {
  tree?: boolean;
  json?: boolean;
}

/**
 * Parse a dependency string to extract package name and version requirement
 */
function parseDependency(dep: string): { name: string; requirement: string; extras: string; marker: string } {
  // Format: package-name[extra1,extra2] (>=1.0.0,<2.0.0) ; python_version >= "3.7"
  let name = dep;
  let requirement = '';
  let extras = '';
  let marker = '';

  // Extract marker (after semicolon)
  const markerMatch = dep.match(/;\s*(.+)$/);
  if (markerMatch && markerMatch[1]) {
    marker = markerMatch[1].trim();
    dep = dep.substring(0, markerMatch.index || 0);
  }

  // Extract version requirement (in parentheses)
  const reqMatch = dep.match(/\(([^)]+)\)/);
  if (reqMatch && reqMatch[1]) {
    requirement = reqMatch[1];
    dep = dep.replace(reqMatch[0], '');
  }

  // Extract extras (in square brackets)
  const extrasMatch = dep.match(/\[([^\]]+)\]/);
  if (extrasMatch && extrasMatch[1]) {
    extras = extrasMatch[1];
    dep = dep.replace(extrasMatch[0], '');
  }

  // Extract version operators without parentheses
  const opMatch = dep.match(/([<>=!~]+.*)$/);
  if (opMatch && opMatch[1] && !requirement) {
    requirement = opMatch[1].trim();
    dep = dep.substring(0, opMatch.index || 0);
  }

  name = dep.trim();

  return { name, requirement, extras, marker };
}

/**
 * Create the deps command
 */
export function createDepsCommand(): Command {
  const command = new Command('deps');

  command
    .description('Show package dependencies')
    .argument('<package>', 'Package name')
    .argument('[version]', 'Specific version (optional, defaults to latest)')
    .option('--tree', 'Display dependencies as a tree')
    .option('--json', 'Output as JSON')
    .action(async (packageName: string, version: string | undefined, options: DepsOptions) => {
      try {
        const client = createClient();

        // Get package data
        const result = await client.getPackage(packageName, version);
        const targetVersion = version || result.data.info.version;
        const dependencies = result.data.info.requires_dist || [];

        if (dependencies.length === 0) {
          console.log(chalk.dim(`\n${packageName} ${targetVersion} has no dependencies`));
          return;
        }

        // Parse dependencies
        const parsedDeps = dependencies.map(dep => {
          const parsed = parseDependency(dep);
          return {
            raw: dep,
            name: parsed.name,
            requirement: parsed.requirement,
            extras: parsed.extras,
            marker: parsed.marker,
          };
        });

        // JSON output
        if (options.json) {
          console.log(JSON.stringify(parsedDeps, null, 2));
          return;
        }

        // Display header
        console.log(chalk.bold.cyan(`\nDependencies for ${packageName} ${targetVersion}\n`));

        // Tree or list format
        if (options.tree) {
          // Tree format with proper indentation
          parsedDeps.forEach((dep, index) => {
            const isLast = index === parsedDeps.length - 1;
            const prefix = isLast ? '└── ' : '├── ';

            let line = `${prefix}${chalk.bold(dep.name)}`;

            if (dep.requirement) {
              line += chalk.dim(` ${dep.requirement}`);
            }

            if (dep.extras) {
              line += chalk.yellow(` [${dep.extras}]`);
            }

            console.log(line);

            if (dep.marker) {
              const markerPrefix = isLast ? '    ' : '│   ';
              console.log(`${markerPrefix}${chalk.gray(`when: ${dep.marker}`)}`);
            }
          });
        } else {
          // Simple list format
          parsedDeps.forEach(dep => {
            let line = `  • ${chalk.bold(dep.name)}`;

            if (dep.requirement) {
              line += chalk.dim(` ${dep.requirement}`);
            }

            if (dep.extras) {
              line += chalk.yellow(` [${dep.extras}]`);
            }

            console.log(line);

            if (dep.marker) {
              console.log(`    ${chalk.gray(`→ ${dep.marker}`)}`);
            }
          });
        }

        // Show summary
        console.log(chalk.dim(`\nTotal dependencies: ${dependencies.length}`));

        // Count conditional dependencies
        const conditionalCount = parsedDeps.filter(d => d.marker).length;
        if (conditionalCount > 0) {
          console.log(chalk.dim(`Conditional dependencies: ${conditionalCount}`));
        }
      } catch (err) {
        if (err instanceof PyPIAPIError) {
          logError(`Failed to get dependencies: ${err.message}`);
          if (err.statusCode === 404) {
            console.log(`\nPackage "${packageName}"${version ? ` version ${version}` : ''} not found on PyPI`);
          }
        } else {
          logError(`Failed to get dependencies: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        process.exit(1);
      }
    });

  return command;
}
