# PyPI CLI

[![npm version](https://img.shields.io/npm/v/pypi-cli.svg)](https://www.npmjs.com/package/pypi-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful command-line interface for [PyPI](https://pypi.org) - The Python Package Index. Search packages, view statistics, check security vulnerabilities, publish packages, and manage API tokens directly from your terminal.

## Features

- **Package Discovery** - Search and explore packages with filters
- **Package Information** - Detailed metadata, versions, releases, and dependencies
- **Statistics & Analytics** - Download trends, charts, and trending packages
- **Publishing** - Validate and upload packages to PyPI or TestPyPI
- **Security Scanning** - Vulnerability auditing via OSV API
- **Token Management** - Create, list, and revoke API tokens
- **Multiple Output Formats** - JSON, table, or pretty-printed output
- **Scriptable** - Perfect for CI/CD pipelines and automation

## Installation

```bash
# Using npm
npm install -g pypi-cli

# Using bun
bun install -g pypi-cli
```

## Quick Start

### 1. Configure your API token (optional, for publishing)

```bash
# Interactive setup
pypi config init

# Or set directly
pypi config set apiToken pypi-xxxxxxxxxxxxx

# Or use environment variable
export PYPI_API_TOKEN=pypi-xxxxxxxxxxxxx
```

### 2. Search for packages

```bash
pypi search django --limit 10
```

### 3. Get package information

```bash
pypi info requests
```

## Commands

### Configuration

```bash
pypi config init              # Interactive configuration setup
pypi config get               # Show current configuration
pypi config set <key> <value> # Set a configuration value
```

### Package Discovery

```bash
# Search for packages
pypi search django
pypi search "web framework" --limit 20

# Get package information
pypi info requests
pypi info flask --version 2.3.0

# List all versions
pypi versions numpy
pypi versions pandas --include-yanked

# Show release history
pypi releases django --limit 10

# View dependencies
pypi deps requests
pypi deps flask --extras async
```

### Statistics

```bash
# Get download statistics
pypi stats requests
pypi stats numpy --period month

# Detailed download breakdown
pypi downloads pandas
pypi downloads flask --by-python-version

# Discover trending packages
pypi trending
pypi trending --category web --limit 20
```

### Publishing

```bash
# Validate distribution files
pypi check
pypi check dist/mypackage-1.0.0.tar.gz

# Upload a single file
pypi upload dist/mypackage-1.0.0.tar.gz

# Publish all files in dist/
pypi publish
pypi publish --repository testpypi

# Dry run (validate only)
pypi publish --dry-run
```

### Token Management

```bash
# Create a new API token
pypi token create --name "CI/CD Token" --scope project:mypackage

# List all tokens
pypi token list

# Revoke a token
pypi token revoke <token-id>
```

### Security

```bash
# Audit package for vulnerabilities
pypi audit requests
pypi audit flask --version 2.3.0

# Verify package integrity
pypi verify requests
pypi verify numpy --version 1.24.0
```

## Global Options

All commands support these global options:

| Option | Description |
|--------|-------------|
| `--api-token <token>` | Use a specific API token (overrides config) |
| `--output <format>` | Output format: `json`, `table`, or `pretty` (default: `pretty`) |
| `--verbose` | Enable verbose logging |
| `--no-color` | Disable colored output |
| `-h, --help` | Display help for command |

## Configuration

The CLI stores configuration in `~/.pypi/config.json`. Configuration priority:

1. Command-line flags (`--api-token`)
2. Environment variables (`PYPI_API_TOKEN`)
3. Configuration file

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PYPI_API_TOKEN` | Your PyPI API token |
| `PYPI_REPOSITORY` | Repository URL (default: https://upload.pypi.org/legacy/) |
| `PYPI_OUTPUT_FORMAT` | Output format (json, table, pretty) |

### Configuration File

```json
{
  "apiToken": "pypi-xxxxxxxxxxxxx",
  "repository": "https://upload.pypi.org/legacy/",
  "outputFormat": "pretty",
  "colorOutput": true
}
```

## Examples

### Search and filter packages

```bash
# Search for packages
pypi search "machine learning" --limit 20

# Get detailed package info
pypi info tensorflow --stats
```

### View download statistics

```bash
# Get download stats with ASCII chart
pypi stats pandas --period week

# Compare download trends
pypi downloads numpy --by-python-version
```

### Security audit before installing

```bash
# Check for known vulnerabilities
pypi audit django

# Verify package integrity
pypi verify requests --version 2.28.0
```

### Publish a package

```bash
# Build your package
python -m build

# Validate before upload
pypi check

# Upload to TestPyPI first
pypi publish --repository testpypi

# Then publish to PyPI
pypi publish
```

### CI/CD Integration

```bash
# Use environment variable for token
PYPI_API_TOKEN=$PYPI_TOKEN pypi publish --output json

# Check for vulnerabilities in CI
pypi audit mypackage --output json | jq '.vulnerabilities | length'
```

## API Token

To use authenticated PyPI features, you'll need an API token:

1. Visit https://pypi.org/manage/account/token/
2. Create a new API token
3. Configure it using:
   - `pypi config init` (interactive)
   - `pypi config set apiToken <token>` (direct)
   - Set `PYPI_API_TOKEN` environment variable

The token will be stored securely in `~/.pypi/config.json` with appropriate file permissions.

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- Node.js >= 18.0.0 (for runtime)
- TypeScript >= 5.0.0

### Scripts

```bash
bun run build     # Build the CLI for production
bun run dev       # Run in development mode
bun run test      # Run tests
bun run typecheck # Type check without building
bun run clean     # Remove build artifacts
```

### Project Structure

```
pypi-cli/
├── src/
│   ├── commands/
│   │   ├── config/     # Configuration commands
│   │   ├── search/     # Package search
│   │   ├── info/       # Package info, versions, releases, deps
│   │   ├── publish/    # check, upload, publish
│   │   ├── stats/      # stats, downloads, trending
│   │   ├── token/      # create, list, revoke
│   │   └── security/   # audit, verify
│   ├── lib/
│   │   ├── api-client.ts  # PyPI API client
│   │   ├── config.ts      # Configuration management
│   │   ├── upload.ts      # Upload utilities
│   │   ├── cache.ts       # Statistics caching
│   │   ├── chart.ts       # ASCII chart rendering
│   │   ├── validators.ts  # PEP 440/508 validation
│   │   └── output.ts      # Output formatting
│   ├── types/
│   │   ├── api.ts      # PyPI API types
│   │   └── config.ts   # Config types
│   └── index.ts        # CLI entry point
├── tests/
│   └── unit/           # Unit tests
├── docs/
│   └── publishing.md   # Publishing guide
└── package.json
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [PyPI](https://pypi.org)
- [PyPI JSON API](https://warehouse.pypa.io/api-reference/json.html)
- [pypistats.org API](https://pypistats.org/api/)
- [OSV Vulnerability Database](https://osv.dev/)
- [GitHub Repository](https://github.com/agileguy/pypi-cli)
- [npm Package](https://www.npmjs.com/package/pypi-cli)
