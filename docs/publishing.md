# Publishing Packages to PyPI

The PyPI CLI provides commands for validating and publishing Python packages to PyPI or TestPyPI.

## Prerequisites

1. **Build your package** - Use standard Python build tools to create distribution files:
   ```bash
   python -m build
   ```
   This creates `.whl` and `.tar.gz` files in the `dist/` directory.

2. **Get a PyPI API token**:
   - Go to https://pypi.org/manage/account/token/
   - Create a new API token
   - Save it securely (you'll only see it once)

3. **Configure the token**:
   ```bash
   # Option 1: Save to config
   pypi config set apiToken pypi-xxxxx

   # Option 2: Set environment variable
   export PYPI_API_TOKEN=pypi-xxxxx

   # Option 3: Pass as command option
   pypi publish --token pypi-xxxxx
   ```

## Commands

### Check - Validate Distribution Files

Validates distribution files before uploading to ensure they meet PyPI requirements.

```bash
# Check all files in dist/
pypi publish check

# Check a specific directory
pypi publish check ./my-dist

# Check a specific file
pypi publish check dist/mypackage-1.0.0.tar.gz

# Show detailed validation info
pypi publish check --verbose
```

**What it checks:**
- File exists and is readable
- File has valid extension (.whl, .tar.gz, .egg, .zip)
- File size is within PyPI's 100MB limit
- Package name follows PEP 508
- Version follows PEP 440
- Metadata can be extracted
- No suspicious patterns in filename

**Example output:**
```
Checking Distribution Files
────────────────────────────

Found 2 distribution file(s)

Checking mypackage-1.0.0-py3-none-any.whl...
✓ Valid distribution format
  Metadata:
    ✓ Name: mypackage
    ✓ Version: 1.0.0

Checking mypackage-1.0.0.tar.gz...
✓ Valid distribution format
  Metadata:
    ✓ Name: mypackage
    ✓ Version: 1.0.0

Validation Summary
──────────────────
Files checked: 2
Errors: 0
Warnings: 0

✓ All checks passed. Ready to upload.
```

### Upload - Upload a Single File

Upload a single distribution file to PyPI or TestPyPI.

```bash
# Upload to PyPI (production)
pypi publish upload dist/mypackage-1.0.0.tar.gz

# Upload to TestPyPI (for testing)
pypi publish upload dist/mypackage-1.0.0.tar.gz --repository testpypi

# Specify token explicitly
pypi publish upload dist/mypackage-1.0.0.tar.gz --token pypi-xxxxx
```

**Example output:**
```
Uploading Distribution File
────────────────────────────

ℹ File: mypackage-1.0.0.tar.gz
ℹ Repository: PyPI

✓ Validation passed

✓ Upload successful

✓ Package uploaded successfully!
ℹ View at: https://pypi.org/project/mypackage/1.0.0/
```

### Publish - Publish All Files in a Directory

Validates and uploads all distribution files in a directory (default: `dist/`).

```bash
# Publish to PyPI with confirmation
pypi publish

# Publish to TestPyPI
pypi publish --repository testpypi

# Skip confirmation prompt
pypi publish --yes

# Dry run (validate only, don't upload)
pypi publish --dry-run

# Publish from custom directory
pypi publish ./my-dist
```

**Workflow:**
1. Finds all distribution files in the directory
2. Validates each file
3. Shows summary of files to upload
4. Asks for confirmation (unless `--yes` is used)
5. Uploads each file to the repository
6. Reports results

**Example output:**
```
Publishing Package to PyPI
───────────────────────────

ℹ Repository: PyPI

✓ Found 2 distribution file(s)


Validation
──────────

✓ Validated mypackage-1.0.0-py3-none-any.whl
✓ Validated mypackage-1.0.0.tar.gz


Distribution Summary
────────────────────

  • mypackage-1.0.0-py3-none-any.whl (15.2 KB)
  • mypackage-1.0.0.tar.gz (12.1 KB)

Total files: 2
Total size: 27.3 KB

Upload to PyPI? [y/N]: y


Uploading
─────────

✓ Uploaded mypackage-1.0.0-py3-none-any.whl
✓ Uploaded mypackage-1.0.0.tar.gz

✓ Published successfully!
ℹ View at: https://pypi.org/project/mypackage/1.0.0/
```

## Repositories

### PyPI (Production)

- **Name:** `pypi` (default)
- **URL:** https://upload.pypi.org/legacy/
- **Web:** https://pypi.org
- **Token:** Get from https://pypi.org/manage/account/token/

Packages published here are **permanent and public**. You cannot delete or replace a version once published.

```bash
pypi publish --repository pypi
```

### TestPyPI (Testing)

- **Name:** `testpypi`
- **URL:** https://test.pypi.org/legacy/
- **Web:** https://test.pypi.org
- **Token:** Get from https://test.pypi.org/manage/account/token/

Use TestPyPI to test the publishing process without affecting the production repository.

```bash
pypi publish --repository testpypi
```

**Note:** TestPyPI requires a separate account and API token from PyPI.

## Best Practices

### 1. Always Test First

Test your package on TestPyPI before publishing to production:

```bash
# Test on TestPyPI
pypi publish --repository testpypi

# Install and test
pip install --index-url https://test.pypi.org/simple/ mypackage

# If everything works, publish to PyPI
pypi publish --repository pypi
```

### 2. Use Dry Run

Use `--dry-run` to validate without uploading:

```bash
pypi publish --dry-run
```

### 3. Validate Before Publishing

Run the check command before publishing:

```bash
pypi publish check
pypi publish --yes
```

### 4. Version Management

- **Never reuse versions** - Once a version is published, it cannot be replaced
- **Follow semantic versioning** - MAJOR.MINOR.PATCH (e.g., 1.2.3)
- **Increment versions** - Use tools like `bump2version` or `semantic-release`

### 5. Secure Your Token

```bash
# Store in config (recommended)
pypi config set apiToken pypi-xxxxx

# Or use environment variable
export PYPI_API_TOKEN=pypi-xxxxx

# Never commit tokens to version control
echo ".pypi.json" >> .gitignore
```

## Troubleshooting

### "File already exists"

```
✗ File already exists on repository.
```

**Solution:** Increment your package version and rebuild.

### "Authentication failed"

```
✗ Authentication failed. Check your API token.
```

**Solutions:**
1. Verify your token is correct
2. Ensure the token has upload permissions
3. Check you're using the right token for the repository (PyPI vs TestPyPI)

### "Package name already taken"

If someone else owns the package name on PyPI:
1. Choose a different name
2. Contact PyPI support if you believe you have a claim to the name

### "File too large"

```
✗ File size (120 MB) exceeds PyPI limit of 100MB
```

**Solutions:**
1. Exclude unnecessary files from the package
2. Remove large data files (use PyPI data files guidelines)
3. Consider splitting into multiple packages

## Configuration

### API Token

Set your PyPI API token:

```bash
pypi config set apiToken pypi-xxxxx
```

View current config:

```bash
pypi config get apiToken
# Output: pypi-****xxxx (masked)
```

### Default Repository

Set a default repository:

```bash
pypi config set repository https://test.pypi.org/legacy/
```

## Environment Variables

- `PYPI_API_TOKEN` - API token for authentication
- `PYPI_REPOSITORY` - Default repository URL

## Security

- API tokens are stored in `~/.pypi/config.json` with permissions `600`
- Tokens are never logged or displayed in full
- Always use scoped tokens (project-specific) when possible
- Rotate tokens periodically
- Revoke tokens if compromised

## Examples

### First Time Publishing

```bash
# 1. Build your package
python -m build

# 2. Test on TestPyPI
pypi publish --repository testpypi

# 3. Install and test
pip install --index-url https://test.pypi.org/simple/ mypackage

# 4. Publish to PyPI
pypi publish
```

### Automated CI/CD

```bash
# In your CI pipeline
export PYPI_API_TOKEN=${{ secrets.PYPI_TOKEN }}
pypi publish check
pypi publish --yes
```

### Publishing a New Version

```bash
# 1. Update version in setup.py or pyproject.toml
# 2. Rebuild
python -m build

# 3. Validate
pypi publish check

# 4. Publish
pypi publish --yes
```
