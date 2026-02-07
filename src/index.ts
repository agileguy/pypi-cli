#!/usr/bin/env bun

/**
 * PyPI CLI - Command-line interface for PyPI
 * The Python Package Index
 */

import { Command } from 'commander';
import { createConfigCommand } from './commands/config/index.js';
import { createSearchCommand } from './commands/search/index.js';
import { createInfoCommand } from './commands/info/index.js';
import { createPublishCommand } from './commands/publish/index.js';
import { createStatsCommand } from './commands/stats/index.js';
import { createTokenCommand } from './commands/token/index.js';
import { createSecurityCommand } from './commands/security/index.js';
import { setNoColor } from './lib/output.js';
import type { GlobalOptions } from './types/index.js';

// Package metadata
const VERSION = '1.0.0';
const DESCRIPTION = 'CLI for PyPI - The Python Package Index';

/**
 * Main CLI program
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name('pypi')
    .description(DESCRIPTION)
    .version(VERSION, '-v, --version', 'Output the current version')
    .helpOption('-h, --help', 'Display help for command');

  // Global options
  program
    .option('--api-token <token>', 'PyPI API token (overrides config and env)')
    .option('--output <format>', 'Output format: json, table, or pretty', 'pretty')
    .option('--verbose', 'Enable verbose logging')
    .option('--no-color', 'Disable colored output');

  // Hook to process global options before command execution
  program.hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts<GlobalOptions>();

    // Set color preference globally
    if (opts.noColor) {
      setNoColor(true);
    }
  });

  return program;
}

/**
 * Register all commands
 */
function registerCommands(program: Command): void {
  // Configuration commands
  program.addCommand(createConfigCommand());

  // Package discovery commands (Phase 2)
  program.addCommand(createSearchCommand());
  program.addCommand(createInfoCommand());

  // Publishing commands (Phase 3)
  program.addCommand(createPublishCommand());

  // Statistics commands (Phase 4)
  program.addCommand(createStatsCommand());

  // Token management commands (Phase 5)
  program.addCommand(createTokenCommand());

  // Security commands (Phase 6)
  program.addCommand(createSecurityCommand());
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const program = createProgram();
  registerCommands(program);

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

// Run the CLI
main();
