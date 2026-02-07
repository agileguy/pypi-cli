/**
 * Token Management Commands
 *
 * Commands for managing PyPI API tokens
 */

import { Command } from 'commander';
import { createTokenCreateCommand } from './create.js';
import { createTokenListCommand } from './list.js';
import { createTokenRevokeCommand } from './revoke.js';

/**
 * Create the token command group
 */
export function createTokenCommand(): Command {
  const cmd = new Command('token')
    .description('Manage PyPI API tokens')
    .summary('Manage PyPI API tokens');

  // Add subcommands
  cmd.addCommand(createTokenCreateCommand());
  cmd.addCommand(createTokenListCommand());
  cmd.addCommand(createTokenRevokeCommand());

  return cmd;
}
