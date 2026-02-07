/**
 * Config command group
 *
 * Commands for managing PyPI CLI configuration
 */

import { Command } from 'commander';
import {
  getConfigPath,
  loadConfigSync,
  saveConfig,
  maskApiToken,
  initConfig,
} from '../../lib/config.js';
import { formatSuccess, error, success, info } from '../../lib/output.js';
import type { Config } from '../../types/index.js';

/**
 * Config init command - Interactive configuration setup
 */
async function initCommand(): Promise<void> {
  try {
    info('PyPI CLI Configuration Setup');
    console.log();

    // Prompt for API token
    console.log('PyPI API Token (optional, press Enter to skip):');
    console.log('Get your token from: https://pypi.org/manage/account/token/');
    console.log();

    // Read from stdin
    const apiToken = await readLine('API Token: ');

    // Initialize config
    const configPath = await initConfig(apiToken?.trim() || undefined);

    console.log();
    success(`Configuration saved to ${configPath}`);

    if (!apiToken?.trim()) {
      console.log();
      info('You can set your API token later with:');
      console.log('  pypi config set apiToken <your-token>');
      console.log('Or set the PYPI_API_TOKEN environment variable');
    }
  } catch (err) {
    error(`Failed to initialize configuration: ${err instanceof Error ? err.message : 'unknown error'}`);
    process.exit(1);
  }
}

/**
 * Config get command - Show current configuration
 */
function getCommand(): void {
  try {
    const config = loadConfigSync();
    const configPath = getConfigPath();

    console.log(formatSuccess(`Configuration from ${configPath}`));
    console.log();

    if (Object.keys(config).length === 0) {
      info('No configuration found. Run "pypi config init" to create one.');
      return;
    }

    // Display config with masked token
    const displayConfig = { ...config };
    if (displayConfig.apiToken) {
      displayConfig.apiToken = maskApiToken(displayConfig.apiToken);
    }

    for (const [key, value] of Object.entries(displayConfig)) {
      console.log(`${key}: ${JSON.stringify(value)}`);
    }
  } catch (err) {
    error(`Failed to read configuration: ${err instanceof Error ? err.message : 'unknown error'}`);
    process.exit(1);
  }
}

/**
 * Config set command - Set a configuration value
 */
async function setCommand(key: string, value: string): Promise<void> {
  try {
    const config = loadConfigSync();

    // Validate key
    const validKeys = ['apiToken', 'repository', 'outputFormat', 'colorOutput', 'timeout', 'retries'];
    if (!validKeys.includes(key)) {
      error(`Invalid configuration key: ${key}`);
      console.log(`Valid keys: ${validKeys.join(', ')}`);
      process.exit(1);
    }

    // Parse value based on key
    let parsedValue: any = value;
    if (key === 'colorOutput') {
      parsedValue = value.toLowerCase() === 'true';
    } else if (key === 'timeout' || key === 'retries') {
      parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue)) {
        error(`Invalid number: ${value}`);
        process.exit(1);
      }
    }

    // Update config
    const updatedConfig: Config = { ...config, [key]: parsedValue };
    await saveConfig(updatedConfig);

    success(`Configuration updated: ${key} = ${key === 'apiToken' ? maskApiToken(String(parsedValue)) : parsedValue}`);
  } catch (err) {
    error(`Failed to update configuration: ${err instanceof Error ? err.message : 'unknown error'}`);
    process.exit(1);
  }
}

/**
 * Helper function to read a line from stdin
 */
async function readLine(prompt: string): Promise<string> {
  process.stdout.write(prompt);

  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.setRawMode(false);
    process.stdin.resume();

    const onData = (chunk: string) => {
      data += chunk;
      if (data.includes('\n')) {
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        resolve(data.trim());
      }
    };

    process.stdin.on('data', onData);
  });
}

/**
 * Create config command group
 */
export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Manage PyPI CLI configuration');

  // Config init
  config
    .command('init')
    .description('Initialize configuration with interactive setup')
    .action(initCommand);

  // Config get
  config
    .command('get')
    .description('Show current configuration')
    .action(getCommand);

  // Config set
  config
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Configuration key')
    .argument('<value>', 'Configuration value')
    .action(setCommand);

  return config;
}
