/**
 * Unit tests for validators
 */

import { describe, test, expect } from 'bun:test';
import {
  validatePackageName,
  validateVersion,
  validateEmail,
  validateEmails,
  validateUrl,
  normalizePackageName,
  arePackageNamesEquivalent,
  validateDistributionPath,
  validateToken,
} from '../../src/lib/validators.js';

describe('validatePackageName', () => {
  test('validates valid package names', () => {
    expect(validatePackageName('requests')).toBe(true);
    expect(validatePackageName('Django')).toBe(true);
    expect(validatePackageName('django-rest-framework')).toBe(true);
    expect(validatePackageName('my_package')).toBe(true);
    expect(validatePackageName('package.name')).toBe(true);
    expect(validatePackageName('package-1.2')).toBe(true);
  });

  test('rejects invalid package names', () => {
    expect(validatePackageName('')).toBe(false);
    expect(validatePackageName('-invalid')).toBe(false);
    expect(validatePackageName('invalid-')).toBe(false);
    expect(validatePackageName('_invalid')).toBe(false);
    expect(validatePackageName('invalid_')).toBe(false);
    expect(validatePackageName('.invalid')).toBe(false);
    expect(validatePackageName('invalid.')).toBe(false);
    expect(validatePackageName('package name')).toBe(false);
  });

  test('rejects names that are too long', () => {
    const longName = 'a'.repeat(215);
    expect(validatePackageName(longName)).toBe(false);
  });

  test('handles non-string inputs', () => {
    expect(validatePackageName(null as any)).toBe(false);
    expect(validatePackageName(undefined as any)).toBe(false);
    expect(validatePackageName(123 as any)).toBe(false);
  });
});

describe('validateVersion', () => {
  test('validates valid version strings', () => {
    expect(validateVersion('1.0.0')).toBe(true);
    expect(validateVersion('2.1')).toBe(true);
    expect(validateVersion('0.0.1')).toBe(true);
    expect(validateVersion('1.0a1')).toBe(true);
    expect(validateVersion('1.0b2')).toBe(true);
    expect(validateVersion('1.0rc1')).toBe(true);
    expect(validateVersion('1.0.post1')).toBe(true);
    expect(validateVersion('1.0.dev1')).toBe(true);
    expect(validateVersion('1.0+local')).toBe(true);
    expect(validateVersion('1!2.0')).toBe(true);
  });

  test('rejects invalid version strings', () => {
    expect(validateVersion('')).toBe(false);
    expect(validateVersion('invalid')).toBe(false);
    expect(validateVersion('v1.0')).toBe(false);
    expect(validateVersion('1.0.0.0.0')).toBe(false);
  });

  test('handles non-string inputs', () => {
    expect(validateVersion(null as any)).toBe(false);
    expect(validateVersion(undefined as any)).toBe(false);
    expect(validateVersion(123 as any)).toBe(false);
  });
});

describe('validateEmail', () => {
  test('validates valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('name+tag@domain.co.uk')).toBe(true);
    expect(validateEmail('first.last@example.com')).toBe(true);
    expect(validateEmail('user123@test-domain.com')).toBe(true);
  });

  test('rejects invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid.email')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@@example.com')).toBe(false);
  });

  test('rejects emails that are too long', () => {
    const longLocal = 'a'.repeat(65);
    expect(validateEmail(`${longLocal}@example.com`)).toBe(false);

    const longDomain = 'a'.repeat(254);
    expect(validateEmail(`user@${longDomain}.com`)).toBe(false);
  });

  test('handles non-string inputs', () => {
    expect(validateEmail(null as any)).toBe(false);
    expect(validateEmail(undefined as any)).toBe(false);
    expect(validateEmail(123 as any)).toBe(false);
  });
});

describe('validateEmails', () => {
  test('validates array of emails', () => {
    const result = validateEmails([
      'user1@example.com',
      'user2@example.com',
    ]);

    expect(result.valid).toEqual(['user1@example.com', 'user2@example.com']);
    expect(result.invalid).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  test('separates valid and invalid emails', () => {
    const result = validateEmails([
      'user@example.com',
      'invalid',
      'another@test.com',
      'bad-email',
    ]);

    expect(result.valid).toEqual(['user@example.com', 'another@test.com']);
    expect(result.invalid).toEqual(['invalid', 'bad-email']);
    expect(result.isValid).toBe(false);
  });

  test('handles empty array', () => {
    const result = validateEmails([]);

    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(result.isValid).toBe(true);
  });
});

describe('validateUrl', () => {
  test('validates valid URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://github.com/user/repo')).toBe(true);
    expect(validateUrl('https://sub.domain.example.com/path')).toBe(true);
    expect(validateUrl('http://localhost:8080')).toBe(true);
  });

  test('rejects invalid URLs', () => {
    expect(validateUrl('')).toBe(false);
    expect(validateUrl('invalid-url')).toBe(false);
    expect(validateUrl('ftp://example.com')).toBe(false);
    expect(validateUrl('://example.com')).toBe(false);
  });

  test('handles non-string inputs', () => {
    expect(validateUrl(null as any)).toBe(false);
    expect(validateUrl(undefined as any)).toBe(false);
    expect(validateUrl(123 as any)).toBe(false);
  });
});

describe('normalizePackageName', () => {
  test('normalizes package names', () => {
    expect(normalizePackageName('Django')).toBe('django');
    expect(normalizePackageName('my_package')).toBe('my-package');
    expect(normalizePackageName('Some.Package')).toBe('some-package');
    expect(normalizePackageName('UPPER_CASE')).toBe('upper-case');
  });

  test('handles already normalized names', () => {
    expect(normalizePackageName('requests')).toBe('requests');
    expect(normalizePackageName('django-rest-framework')).toBe('django-rest-framework');
  });
});

describe('arePackageNamesEquivalent', () => {
  test('identifies equivalent package names', () => {
    expect(arePackageNamesEquivalent('Django', 'django')).toBe(true);
    expect(arePackageNamesEquivalent('my_package', 'my-package')).toBe(true);
    expect(arePackageNamesEquivalent('Some.Package', 'some-package')).toBe(true);
  });

  test('identifies non-equivalent package names', () => {
    expect(arePackageNamesEquivalent('package1', 'package2')).toBe(false);
    expect(arePackageNamesEquivalent('django', 'flask')).toBe(false);
  });
});

describe('validateDistributionPath', () => {
  test('validates valid distribution file paths', () => {
    expect(validateDistributionPath('dist/package-1.0.0.tar.gz')).toBe(true);
    expect(validateDistributionPath('dist/package-1.0.0-py3-none-any.whl')).toBe(true);
    expect(validateDistributionPath('package.egg')).toBe(true);
    expect(validateDistributionPath('package.zip')).toBe(true);
  });

  test('rejects invalid distribution file paths', () => {
    expect(validateDistributionPath('invalid.txt')).toBe(false);
    expect(validateDistributionPath('package.py')).toBe(false);
    expect(validateDistributionPath('')).toBe(false);
  });

  test('handles non-string inputs', () => {
    expect(validateDistributionPath(null as any)).toBe(false);
    expect(validateDistributionPath(undefined as any)).toBe(false);
  });
});

describe('validateToken', () => {
  test('validates valid PyPI tokens', () => {
    expect(validateToken('pypi-AgEIcHlwaS5vcmcCJGNiOGI4YzI3LWE1YzMtNDY2YS1iODQwLTdlOGQyOGE4ZjU3MAACJXsicGVybWlzc2lvbnMiOiAidXNlciIsICJ2ZXJzaW9uIjogMX0AAAYgYj')).toBe(true);
  });

  test('rejects invalid tokens', () => {
    expect(validateToken('invalid-token')).toBe(false);
    expect(validateToken('pypi-short')).toBe(false);
    expect(validateToken('')).toBe(false);
    expect(validateToken('AgEIcHlwaS5vcmcCJGNiOGI')).toBe(false);
  });

  test('handles non-string inputs', () => {
    expect(validateToken(null as any)).toBe(false);
    expect(validateToken(undefined as any)).toBe(false);
  });
});
