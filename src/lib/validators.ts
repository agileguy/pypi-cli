/**
 * Input Validation Utilities
 *
 * Functions for validating user inputs according to PyPI and PEP standards
 */

/**
 * PEP 508 package name regex
 * Package names must start/end with alphanumeric, can contain hyphens, underscores, periods
 */
const PACKAGE_NAME_REGEX = /^([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9])$/;

/**
 * PEP 440 version regex (simplified)
 * Supports: 1.0, 1.0.0, 1.0a1, 1.0.post1, 1.0.dev1, 1.0+local
 * Limits to reasonable number of version parts (e.g., 1.2.3.4 but not 1.0.0.0.0)
 */
const VERSION_REGEX = /^([1-9][0-9]*!)?(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,3}((a|b|rc)(0|[1-9][0-9]*))?(\.post(0|[1-9][0-9]*))?(\.dev(0|[1-9][0-9]*))?(\+[a-z0-9]+(\.[a-z0-9]+)*)?$/i;

/**
 * RFC 5322 compliant email validation regex
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * URL validation regex
 * Matches http and https URLs with various formats including localhost and ports
 */
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}(\.[-a-zA-Z0-9()]{1,6})?(:\d{1,5})?(\/[-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/;

/**
 * Validate a PyPI package name according to PEP 508
 *
 * @param name - Package name to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * validatePackageName('requests')           // true
 * validatePackageName('django-rest-framework') // true
 * validatePackageName('my_package')         // true
 * validatePackageName('-invalid')           // false
 * validatePackageName('invalid-')           // false
 * ```
 */
export function validatePackageName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();

  // Check length (PyPI doesn't specify, but reasonable limits)
  if (trimmed.length === 0 || trimmed.length > 214) {
    return false;
  }

  // Apply PEP 508 regex
  return PACKAGE_NAME_REGEX.test(trimmed);
}

/**
 * Validate a version string according to PEP 440
 *
 * @param version - Version string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * validateVersion('1.0.0')         // true
 * validateVersion('2.1')           // true
 * validateVersion('1.0a1')         // true
 * validateVersion('1.0.post1')     // true
 * validateVersion('1.0.dev1')      // true
 * validateVersion('1.0+local')     // true
 * validateVersion('invalid')       // false
 * ```
 */
export function validateVersion(version: string): boolean {
  if (!version || typeof version !== 'string') {
    return false;
  }

  const trimmed = version.trim();

  // Check length
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false;
  }

  // Apply PEP 440 regex
  return VERSION_REGEX.test(trimmed);
}

/**
 * Validate an email address
 *
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * validateEmail('user@example.com')     // true
 * validateEmail('name+tag@domain.co.uk') // true
 * validateEmail('invalid.email')        // false
 * ```
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim();

  // Check length constraints
  if (trimmed.length === 0 || trimmed.length > 254) {
    return false;
  }

  // Check for @ symbol
  if (!trimmed.includes('@')) {
    return false;
  }

  // Split into local and domain parts
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;

  // Validate local part length
  if (!local || local.length === 0 || local.length > 64) {
    return false;
  }

  // Validate domain part
  if (!domain || domain.length === 0 || domain.length > 253) {
    return false;
  }

  // Apply regex validation
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validation result for multiple email addresses
 */
export interface EmailValidationResult {
  /** Valid email addresses */
  valid: string[];

  /** Invalid email addresses */
  invalid: string[];

  /** All emails are valid */
  isValid: boolean;
}

/**
 * Validate multiple email addresses
 *
 * @param emails - Array of email addresses to validate
 * @returns Object containing valid and invalid email arrays
 *
 * @example
 * ```ts
 * validateEmails(['user@example.com', 'invalid', 'another@test.com'])
 * // {
 * //   valid: ['user@example.com', 'another@test.com'],
 * //   invalid: ['invalid'],
 * //   isValid: false
 * // }
 * ```
 */
export function validateEmails(emails: string[]): EmailValidationResult {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    if (validateEmail(email)) {
      valid.push(email.trim());
    } else {
      invalid.push(email);
    }
  }

  return {
    valid,
    invalid,
    isValid: invalid.length === 0,
  };
}

/**
 * Validate a URL
 *
 * @param url - URL to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * validateUrl('https://example.com')           // true
 * validateUrl('http://github.com/user/repo')   // true
 * validateUrl('invalid-url')                   // false
 * ```
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();

  // Check length
  if (trimmed.length === 0 || trimmed.length > 2048) {
    return false;
  }

  // Apply URL regex
  return URL_REGEX.test(trimmed);
}

/**
 * Normalize a package name according to PyPI standards
 * Converts to lowercase and replaces separators with hyphens
 *
 * @param name - Package name to normalize
 * @returns Normalized package name
 *
 * @example
 * ```ts
 * normalizePackageName('Django')           // 'django'
 * normalizePackageName('my_package')       // 'my-package'
 * normalizePackageName('Some.Package')     // 'some-package'
 * ```
 */
export function normalizePackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[._]+/g, '-');
}

/**
 * Check if two package names are equivalent (after normalization)
 *
 * @param name1 - First package name
 * @param name2 - Second package name
 * @returns true if names are equivalent
 *
 * @example
 * ```ts
 * arePackageNamesEquivalent('Django', 'django')        // true
 * arePackageNamesEquivalent('my_package', 'my-package') // true
 * arePackageNamesEquivalent('package1', 'package2')    // false
 * ```
 */
export function arePackageNamesEquivalent(name1: string, name2: string): boolean {
  return normalizePackageName(name1) === normalizePackageName(name2);
}

/**
 * Validate a file path for distribution files
 *
 * @param filePath - File path to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * validateDistributionPath('dist/package-1.0.0.tar.gz')  // true
 * validateDistributionPath('dist/package-1.0.0-py3-none-any.whl') // true
 * validateDistributionPath('invalid.txt')                // false
 * ```
 */
export function validateDistributionPath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  const validExtensions = ['.tar.gz', '.whl', '.egg', '.zip'];
  return validExtensions.some(ext => filePath.endsWith(ext));
}

/**
 * Validate PyPI API token format
 *
 * @param token - API token to validate
 * @returns true if valid format, false otherwise
 *
 * @example
 * ```ts
 * validateToken('pypi-AgEIcHlwaS5vcmc...')  // true
 * validateToken('invalid-token')            // false
 * ```
 */
export function validateToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const trimmed = token.trim();

  // PyPI tokens start with 'pypi-' and have a specific format
  return trimmed.startsWith('pypi-') && trimmed.length > 20;
}
