/**
 * Token List Command
 *
 * List tokens saved in configuration
 */

import { Command } from 'commander';
import { loadConfigSync, maskApiToken } from '../../lib/config.js';
import { formatSuccess, formatInfo, formatError, formatBold, formatDim } from '../../lib/output.js';

/**
 * Token list command handler
 */
async function handleTokenList(): Promise<void> {
  try {
    const config = loadConfigSync();

    console.log('\n' + formatBold('🔑 Saved PyPI Tokens'));
    console.log('═══════════════════════════════════════\n');

    if (!config.apiToken) {
      console.log(formatInfo('No tokens saved in configuration.\n'));
      console.log(formatInfo('To save a token, run:'));
      console.log(formatBold('  pypi token create\n'));
      return;
    }

    // Display saved token
    const maskedToken = maskApiToken(config.apiToken);
    const tokenName = config.tokenName || 'Default Token';

    console.log(formatSuccess('✓ Active Token'));
    console.log(formatBold(`  Name:  ${tokenName}`));
    console.log(formatDim(`  Token: ${maskedToken}`));

    // Show where it's saved
    console.log('\n' + formatDim('Location: ~/.pypi/config.json'));

    // Show environment variable override if set
    if (process.env.PYPI_API_TOKEN) {
      console.log('\n' + formatInfo('⚠️  Environment variable PYPI_API_TOKEN is set'));
      console.log(formatInfo('   This will override the saved token.'));
      console.log(formatDim(`   Token: ${maskApiToken(process.env.PYPI_API_TOKEN)}`));
    }

    console.log(); // Blank line at end
  } catch (error) {
    console.error(formatError(`Error: ${error instanceof Error ? error.message : 'unknown error'}`));
    process.exit(1);
  }
}

/**
 * Create the token list command
 */
export function createTokenListCommand(): Command {
  return new Command('list')
    .description('List saved PyPI API tokens')
    .summary('List saved PyPI API tokens')
    .action(handleTokenList);
}
