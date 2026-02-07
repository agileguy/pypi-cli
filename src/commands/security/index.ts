/**
 * Security Commands
 *
 * Commands for security and vulnerability checks
 */

import { Command } from 'commander';
import { createAuditCommand } from './audit.js';
import { createVerifyCommand } from './verify.js';

/**
 * Create the security command group
 */
export function createSecurityCommand(): Command {
  const cmd = new Command('security')
    .description('Security and vulnerability checks')
    .summary('Security and vulnerability checks');

  // Add subcommands
  cmd.addCommand(createAuditCommand());
  cmd.addCommand(createVerifyCommand());

  return cmd;
}
