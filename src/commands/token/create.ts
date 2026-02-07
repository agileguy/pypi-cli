/**
 * Token Create Command
 *
 * Display instructions for creating a PyPI API token and optionally save it
 */

import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';
import { saveConfig, loadConfigSync } from '../../lib/config.js';
import { formatSuccess, formatInfo, formatError, formatBold } from '../../lib/output.js';

const execAsync = promisify(exec);

interface CreateOptions {
  open?: boolean;
  name?: string;
}

/**
 * Read hidden input from stdin (for token entry)
 */
async function readHiddenInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Disable terminal echo for password input
    const stdin = process.stdin as any;
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    let input = '';
    console.log(prompt);

    stdin.on('data', (char: Buffer) => {
      const c = char.toString('utf8');

      if (c === '\n' || c === '\r' || c === '\u0004') {
        // Enter or Ctrl+D
        stdin.setRawMode(false);
        stdin.pause();
        console.log(); // New line after hidden input
        rl.close();
        resolve(input);
      } else if (c === '\u0003') {
        // Ctrl+C
        stdin.setRawMode(false);
        stdin.pause();
        rl.close();
        process.exit(0);
      } else if (c === '\u007F' || c === '\b') {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
        }
      } else {
        input += c;
      }
    });
  });
}

/**
 * Open browser to PyPI token creation page
 */
async function openTokenPage(): Promise<void> {
  const url = 'https://pypi.org/manage/account/token/';

  try {
    // Detect platform and use appropriate open command
    const command = process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
      ? `start "${url}"`
      : `xdg-open "${url}"`;

    await execAsync(command);
    console.log(formatInfo('Opening browser to PyPI token creation page...'));
  } catch (error) {
    console.log(formatError('Failed to open browser. Please visit:'));
    console.log(formatBold(url));
  }
}

/**
 * Display token creation instructions
 */
function displayInstructions(): void {
  console.log('\n' + formatBold('🔐 Create PyPI API Token'));
  console.log('═══════════════════════════════════════\n');
  console.log(formatInfo('To create an API token:\n'));
  console.log('1. Go to https://pypi.org/manage/account/token/');
  console.log('2. Enter a token name (e.g., "pypi-cli")');
  console.log('3. Select scope (entire account or specific project)');
  console.log('4. Click "Create token"');
  console.log('5. Copy the token (starts with pypi-)\n');
}

/**
 * Token create command handler
 */
async function handleTokenCreate(options: CreateOptions): Promise<void> {
  try {
    // Display instructions
    displayInstructions();

    // Optionally open browser
    if (options.open) {
      await openTokenPage();
      console.log(); // Blank line
    }

    // Ask if user wants to save token
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const shouldSave = await new Promise<boolean>((resolve) => {
      rl.question(formatInfo('Would you like to save your token to config? (y/n): '), (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (!shouldSave) {
      console.log(formatInfo('\nToken not saved. You can set it later with:'));
      console.log(formatBold('  pypi config set apiToken <your-token>'));
      return;
    }

    // Get token from user
    const token = await readHiddenInput('\nPaste your token here (hidden): ');

    if (!token || !token.trim()) {
      console.log(formatError('\nNo token provided.'));
      return;
    }

    // Validate token format (should start with pypi-)
    if (!token.startsWith('pypi-')) {
      console.log(formatError('\nWarning: Token should start with "pypi-". The token may be invalid.'));
    }

    // Load existing config and save token
    const config = loadConfigSync();
    config.apiToken = token.trim();

    // Save optional token name
    if (options.name) {
      config.tokenName = options.name;
    }

    await saveConfig(config);

    console.log(formatSuccess('\n✓ Token saved to ~/.pypi/config.json'));

    if (options.name) {
      console.log(formatInfo(`Token name: ${options.name}`));
    }

    console.log(formatInfo('\nYou can now use pypi commands that require authentication.'));
  } catch (error) {
    console.error(formatError(`Error: ${error instanceof Error ? error.message : 'unknown error'}`));
    process.exit(1);
  }
}

/**
 * Create the token create command
 */
export function createTokenCreateCommand(): Command {
  return new Command('create')
    .description('Create a new PyPI API token')
    .summary('Create a new PyPI API token')
    .option('--open', 'Open browser to PyPI token creation page')
    .option('--name <name>', 'Optional name for the token')
    .action(handleTokenCreate);
}
