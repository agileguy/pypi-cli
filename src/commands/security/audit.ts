/**
 * Security Audit Command
 *
 * Check for known vulnerabilities using the OSV (Open Source Vulnerabilities) API
 */

import { Command } from 'commander';
import { formatError, formatBold, formatInfo, formatWarning, formatSuccess, formatDim } from '../../lib/output.js';

interface AuditOptions {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  json?: boolean;
}

interface OSVVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: Array<{
    type: string;
    score: string;
  }>;
  affected?: Array<{
    package: {
      name: string;
      ecosystem: string;
    };
    ranges?: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
      }>;
    }>;
    versions?: string[];
  }>;
  references?: Array<{
    type: string;
    url: string;
  }>;
  database_specific?: {
    severity?: string;
  };
}

interface OSVResponse {
  vulns?: OSVVulnerability[];
}

/**
 * Map severity to numeric value for filtering
 */
function severityToNumber(severity: string): number {
  const map: Record<string, number> = {
    low: 1,
    medium: 2,
    moderate: 2,
    high: 3,
    critical: 4,
  };
  return map[severity.toLowerCase()] || 0;
}

/**
 * Get severity from vulnerability data
 */
function getVulnerabilitySeverity(vuln: OSVVulnerability): string {
  // Check database_specific first
  if (vuln.database_specific?.severity) {
    return vuln.database_specific.severity;
  }

  // Check severity array
  if (vuln.severity && vuln.severity.length > 0) {
    const cvss = vuln.severity.find((s) => s.type === 'CVSS_V3');
    if (cvss) {
      const score = parseFloat(cvss.score);
      if (score >= 9.0) return 'Critical';
      if (score >= 7.0) return 'High';
      if (score >= 4.0) return 'Medium';
      return 'Low';
    }
  }

  return 'Unknown';
}

/**
 * Format severity with color
 */
function formatSeverity(severity: string): string {
  const sev = severity.toLowerCase();
  if (sev === 'critical') return '🔴 Critical';
  if (sev === 'high') return '🟠 High';
  if (sev === 'medium' || sev === 'moderate') return '🟡 Medium';
  if (sev === 'low') return '🟢 Low';
  return '⚪ Unknown';
}

/**
 * Get fixed version from vulnerability data
 */
function getFixedVersion(vuln: OSVVulnerability): string | null {
  if (!vuln.affected || vuln.affected.length === 0) return null;

  for (const affected of vuln.affected) {
    if (affected.ranges) {
      for (const range of affected.ranges) {
        if (range.events) {
          for (const event of range.events) {
            if (event.fixed) {
              return event.fixed;
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Get CVE/GHSA URL
 */
function getVulnerabilityUrl(id: string): string {
  if (id.startsWith('CVE-')) {
    return `https://nvd.nist.gov/vuln/detail/${id}`;
  }
  if (id.startsWith('GHSA-')) {
    return `https://github.com/advisories/${id}`;
  }
  return `https://osv.dev/vulnerability/${id}`;
}

/**
 * Query OSV API for vulnerabilities
 */
async function queryOSV(packageName: string, version?: string): Promise<OSVResponse> {
  const url = 'https://api.osv.dev/v1/query';

  const body: any = {
    package: {
      name: packageName,
      ecosystem: 'PyPI',
    },
  };

  if (version) {
    body.version = version;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OSV API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as OSVResponse;
  } catch (error) {
    throw new Error(`Failed to query OSV API: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Filter vulnerabilities by minimum severity
 */
function filterBySeverity(vulns: OSVVulnerability[], minSeverity?: string): OSVVulnerability[] {
  if (!minSeverity) return vulns;

  const minLevel = severityToNumber(minSeverity);

  return vulns.filter((vuln) => {
    const severity = getVulnerabilitySeverity(vuln);
    const level = severityToNumber(severity);
    return level >= minLevel;
  });
}

/**
 * Security audit command handler
 */
async function handleAudit(packageName: string, version: string | undefined, options: AuditOptions): Promise<void> {
  try {
    console.log('\n' + formatBold('🔍 Security Audit: ' + packageName));
    console.log('═══════════════════════════════════════\n');

    if (version) {
      console.log(formatInfo(`Checking version: ${version}\n`));
    } else {
      console.log(formatInfo('Checking all versions\n'));
    }

    // Query OSV API
    const result = await queryOSV(packageName, version);

    if (!result.vulns || result.vulns.length === 0) {
      console.log(formatSuccess('✓ No known vulnerabilities found.\n'));
      return;
    }

    // Filter by severity if specified
    let vulnerabilities = result.vulns;
    if (options.severity) {
      vulnerabilities = filterBySeverity(vulnerabilities, options.severity);
    }

    if (vulnerabilities.length === 0) {
      console.log(formatSuccess(`✓ No vulnerabilities with severity >= ${options.severity} found.\n`));
      return;
    }

    // Output as JSON if requested
    if (options.json) {
      console.log(JSON.stringify(vulnerabilities, null, 2));
      return;
    }

    // Display vulnerabilities
    console.log(formatWarning(`Found ${vulnerabilities.length} vulnerabilit${vulnerabilities.length === 1 ? 'y' : 'ies'}:\n`));

    for (const vuln of vulnerabilities) {
      const severity = getVulnerabilitySeverity(vuln);
      const fixedVersion = getFixedVersion(vuln);
      const url = getVulnerabilityUrl(vuln.id);

      console.log(formatSeverity(severity) + ' ' + formatBold(vuln.id));

      if (vuln.summary) {
        console.log(formatDim('    ' + vuln.summary));
      }

      if (fixedVersion) {
        console.log(formatInfo(`    Fixed in: ${fixedVersion}`));
      }

      console.log(formatDim(`    ${url}`));
      console.log(); // Blank line between vulnerabilities
    }

    // Show recommendation
    const latestFix = vulnerabilities
      .map((v) => getFixedVersion(v))
      .filter((v): v is string => v !== null)
      .sort()
      .pop();

    if (latestFix) {
      console.log(formatBold('Recommendation: ') + formatInfo(`Upgrade to ${packageName}>=${latestFix}\n`));
    }
  } catch (error) {
    console.error(formatError(`Error: ${error instanceof Error ? error.message : 'unknown error'}`));
    process.exit(1);
  }
}

/**
 * Create the audit command
 */
export function createAuditCommand(): Command {
  return new Command('audit')
    .description('Check for known vulnerabilities')
    .summary('Check for known vulnerabilities using OSV API')
    .argument('<package>', 'Package name to audit')
    .argument('[version]', 'Specific version to check (optional)')
    .option('--severity <level>', 'Filter by minimum severity (low, medium, high, critical)')
    .option('--json', 'Output as JSON')
    .action(handleAudit);
}
