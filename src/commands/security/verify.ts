/**
 * Security Verify Command
 *
 * Verify package integrity by checking SHA256 hashes
 */

import { Command } from 'commander';
import { createHash } from 'crypto';
import { formatError, formatBold, formatInfo, formatSuccess, formatDim } from '../../lib/output.js';
import type { PyPIPackage, ReleaseFile } from '../../types/index.js';

interface VerifyOptions {
  algorithm?: 'sha256' | 'md5';
}

/**
 * Fetch package information from PyPI
 */
async function fetchPackageInfo(packageName: string, version?: string): Promise<PyPIPackage> {
  const url = `https://pypi.org/pypi/${packageName}/json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`PyPI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as PyPIPackage;

    // If version specified, filter to that version
    if (version && data.releases) {
      const versionReleases = data.releases[version];
      if (!versionReleases) {
        throw new Error(`Version ${version} not found for package ${packageName}`);
      }
      data.releases = { [version]: versionReleases };
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to fetch package info: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Download file and compute hash
 */
async function downloadAndHash(url: string, algorithm: string = 'sha256'): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    // Get the file data as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute hash
    const hash = createHash(algorithm);
    hash.update(buffer);
    return hash.digest('hex');
  } catch (error) {
    throw new Error(`Failed to download and hash file: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Get expected hash from digests
 */
function getExpectedHash(file: ReleaseFile, algorithm: string): string | null {
  if (!file.digests) return null;

  if (algorithm === 'sha256' && file.digests.sha256) {
    return file.digests.sha256;
  }

  if (algorithm === 'md5' && file.digests.md5) {
    return file.digests.md5;
  }

  return null;
}

/**
 * Security verify command handler
 */
async function handleVerify(packageName: string, version: string | undefined, options: VerifyOptions): Promise<void> {
  try {
    const algorithm = options.algorithm || 'sha256';

    console.log('\n' + formatBold('🔒 Verifying: ' + packageName));
    console.log('═══════════════════════════════════════\n');

    // Fetch package info
    const packageInfo = await fetchPackageInfo(packageName, version);

    // Get the version to verify
    let targetVersion = version;
    if (!targetVersion && packageInfo.info && packageInfo.info.version) {
      targetVersion = packageInfo.info.version;
    }

    if (!targetVersion) {
      throw new Error('Could not determine package version');
    }

    console.log(formatInfo(`Version: ${targetVersion}\n`));

    // Get release files
    const releases = packageInfo.releases && packageInfo.releases[targetVersion];
    if (!releases || releases.length === 0) {
      throw new Error(`No release files found for version ${targetVersion}`);
    }

    console.log(formatInfo(`Found ${releases.length} file(s) to verify\n`));

    // Verify each file
    let allVerified = true;
    let verifiedCount = 0;

    for (const file of releases) {
      console.log(formatBold(`Checking ${file.filename}...`));

      const expectedHash = getExpectedHash(file, algorithm);
      if (!expectedHash) {
        console.log(formatError(`  ✗ No ${algorithm} hash available`));
        allVerified = false;
        continue;
      }

      console.log(formatDim(`  Expected ${algorithm.toUpperCase()}: ${expectedHash.substring(0, 16)}...`));

      // Download and compute hash
      try {
        const computedHash = await downloadAndHash(file.url, algorithm);
        console.log(formatDim(`  Computed ${algorithm.toUpperCase()}: ${computedHash.substring(0, 16)}...`));

        if (computedHash === expectedHash) {
          console.log(formatSuccess('  ✓ Hash verified\n'));
          verifiedCount++;
        } else {
          console.log(formatError('  ✗ Hash mismatch!\n'));
          allVerified = false;
        }
      } catch (error) {
        console.log(formatError(`  ✗ Failed to verify: ${error instanceof Error ? error.message : 'unknown error'}\n`));
        allVerified = false;
      }
    }

    // Summary
    if (allVerified) {
      console.log(formatSuccess(`✓ All ${verifiedCount} file(s) verified successfully\n`));
    } else {
      console.log(formatError(`✗ Verification failed for some files\n`));
      process.exit(1);
    }
  } catch (error) {
    console.error(formatError(`Error: ${error instanceof Error ? error.message : 'unknown error'}`));
    process.exit(1);
  }
}

/**
 * Create the verify command
 */
export function createVerifyCommand(): Command {
  return new Command('verify')
    .description('Verify package integrity')
    .summary('Verify package integrity by checking hashes')
    .argument('<package>', 'Package name to verify')
    .argument('[version]', 'Specific version to verify (defaults to latest)')
    .option('--algorithm <type>', 'Hash algorithm (sha256 or md5)', 'sha256')
    .action(handleVerify);
}
