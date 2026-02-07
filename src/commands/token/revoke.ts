/**
 * Token Revoke Command
 *
 * Display instructions for revoking a PyPI API token and remove from config
 */

import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';
import { saveConfig, loadConfigSync } from '../../lib/config.js';
import { formatSuccess, formatInfo, formatError, formatBold, formatWarning } from '../../lib/output.js';

const execAsync = promisify(exec);

interface RevokeOptions {
  open?: boolean;
  force?: boolean;
}

/**
 * Open browser to PyPI token management page
 */
async function openTokenPage(): Promise<void> {
  const url = 'https://pypi.org/manage/account/';

  try {
    // Detect platform and use appropriate open command
    const command = process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
      ? `start "${url}"`
      : `xdg-open "${url}"`;

    await execAsync(command);
    console.log(formatInfo('Opening browser to PyPI account management...'));
  } catch (error) {
    console.log(formatError('Failed to open browser. Please visit:'));
    console.log(formatBold(url));
  }
}

/**
 * Display token revocation instructions
 */
function displayInstructions(tokenName?: string): void {
  console.log('\n' + formatBold('🔐 Revoke PyPI API Token'));
  console.log('═══════════════════════════════════════\n');
  console.log(formatInfo('To revoke your API token:\n'));
  console.log('1. Go to https://pypi.org/manage/account/');
  console.log('2. Scroll to "API tokens" section');

  if (tokenName) {
    console.log(`3. Find the token named "${tokenName}"`);
  } else {
    console.log('3. Find your token in the list');
  }

  console.log('4. Click "Remove" or "Revoke"');
  console.log('5. Confirm the revocation\n');
  console.log(formatWarning('⚠️  This action cannot be undone.\n'));
}

/**
 * Token revoke command handler
 */
async function handleTokenRevoke(tokenName: string | undefined, options: RevokeOptions): Promise<void> {
  try {
    const config = loadConfigSync();

    // Check if a token exists
    if (!config.apiToken && !options.force) {
      console.log(formatInfo('No token saved in configuration.\n'));
      console.log(formatInfo('If you have a token on PyPI, you can revoke it at:'));
      console.log(formatBold('  https://pypi.org/manage/account/\n'));
      return;
    }

    // Display instructions
    displayInstructions(tokenName || config.tokenName);

    // Optionally open browser
    if (options.open) {
      await openTokenPage();
      console.log(); // Blank line
    }

    // Ask for confirmation before removing from config
    if (config.apiToken && !options.force) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const shouldRemove = await new Promise<boolean>((resolve) => {
        rl.question(
          formatWarning('Remove token from local config? (y/n): '),
          (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
          }
        );
      });

      if (!shouldRemove) {
        console.log(formatInfo('\nToken kept in local config.'));
        console.log(formatInfo('Remember to revoke it on PyPI to disable it completely.\n'));
        return;
      }
    }

    // Remove token from config
    if (config.apiToken) {
      delete config.apiToken;
      delete config.tokenName;
      await saveConfig(config);

      console.log(formatSuccess('\n✓ Token removed from ~/.pypi/config.json'));
      console.log(formatInfo('\nMake sure to also revoke the token on PyPI to disable it completely.\n'));
    } else {
      console.log(formatInfo('\nNo token to remove from config.\n'));
    }
  } catch (error) {
    console.error(formatError(`Error: ${error instanceof Error ? error.message : 'unknown error'}`));
    process.exit(1);
  }
}

/**
 * Create the token revoke command
 */
export function createTokenRevokeCommand(): Command {
  return new Command('revoke')
    .description('Revoke a PyPI API token')
    .summary('Revoke a PyPI API token')
    .argument('[token-name]', 'Optional name of the token to revoke')
    .option('--open', 'Open browser to PyPI account management page')
    .option('--force', 'Skip confirmation prompt')
    .action(handleTokenRevoke);
}
