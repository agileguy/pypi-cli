# PyPI CLI

Command-line interface for PyPI - The Python Package Index

A modern, TypeScript-based CLI tool for interacting with PyPI, built with Bun.

## Features

- **Configuration management** with secure token storage
- **Package search** - Find packages on PyPI
- **Package information** - Get detailed package metadata
- **Package publishing** - Publish packages to PyPI or TestPyPI
  - Validate distribution files before upload
  - Upload single files or entire directories
  - Support for both PyPI and TestPyPI
  - Interactive confirmation with dry-run support
- Multiple output formats (JSON, table, pretty)
- Color output support
- Built with TypeScript and Bun for maximum performance

## Installation

### From Source

```bash
git clone https://github.com/agileguy/pypi-cli.git
cd pypi-cli
bun install
bun run build
```

### Development

```bash
bun run dev
```

## Configuration

The CLI supports three configuration methods (in order of priority):

1. Command-line options (highest priority)
2. Environment variables
3. Configuration file (lowest priority)

### Interactive Setup

Initialize configuration with an interactive setup wizard:

```bash
pypi config init
```

### Configuration File

The CLI looks for configuration files in the following locations:

1. `.pypi.json` (project-specific, highest priority)
2. `~/.pypi/config.json` (user home directory)
3. `~/.pypi.json` (alternative user config)

Example configuration file:

```json
{
  "apiToken": "your-pypi-api-token",
  "repository": "https://upload.pypi.org/legacy/",
  "outputFormat": "pretty",
  "colorOutput": true
}
```

### Environment Variables

- `PYPI_API_TOKEN` - PyPI API token
- `PYPI_REPOSITORY` - PyPI repository URL
- `PYPI_OUTPUT_FORMAT` - Output format (json, table, pretty)

### Configuration Commands

View current configuration:

```bash
pypi config get
```

Set a configuration value:

```bash
pypi config set apiToken pypi-your-token-here
pypi config set outputFormat json
pypi config set colorOutput false
```

## Usage

### Global Options

All commands support these global options:

- `--api-token <token>` - PyPI API token (overrides config and env)
- `--output <format>` - Output format: json, table, or pretty (default: pretty)
- `--verbose` - Enable verbose logging
- `--no-color` - Disable colored output

### Commands

#### Configuration

Manage PyPI CLI configuration:

```bash
# Initialize configuration
pypi config init

# View current configuration
pypi config get

# Set configuration value
pypi config set <key> <value>
```

#### Search

Search for packages on PyPI:

```bash
# Search for packages
pypi search django

# Limit results
pypi search flask --limit 10

# JSON output
pypi search requests --output json
```

#### Info

Get detailed information about a package:

```bash
# Get latest version info
pypi info requests

# Get specific version
pypi info requests 2.28.0

# Show download statistics
pypi info requests --stats
```

#### Publishing

Publish packages to PyPI or TestPyPI:

```bash
# Validate distribution files
pypi publish check

# Upload a single file
pypi publish upload dist/mypackage-1.0.0.tar.gz

# Publish all files in dist/
pypi publish

# Publish to TestPyPI
pypi publish --repository testpypi

# Dry run (validate only)
pypi publish --dry-run
```

See the [Publishing Guide](docs/publishing.md) for detailed documentation.

More commands coming in future phases:

- Package download
- Statistics
- Security scanning

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- Node.js >= 18.0.0 (for runtime)
- TypeScript >= 5.0.0

### Scripts

- `bun run build` - Build the CLI for production
- `bun run dev` - Run in development mode
- `bun run test` - Run tests
- `bun run typecheck` - Type check without building
- `bun run clean` - Remove build artifacts

### Project Structure

```
pypi-cli/
├── src/
│   ├── commands/          # Command implementations
│   │   ├── config/        # Configuration commands
│   │   ├── search/        # Search commands
│   │   ├── info/          # Info commands
│   │   └── publish/       # Publishing commands
│   │       ├── check.ts   # Validate distributions
│   │       ├── upload.ts  # Upload single file
│   │       └── index.ts   # Publish all files
│   ├── lib/              # Shared utilities
│   │   ├── api-client.ts # PyPI API client
│   │   ├── config.ts     # Configuration management
│   │   ├── upload.ts     # Upload utilities
│   │   ├── validators.ts # Input validation
│   │   └── output.ts     # Output formatting
│   ├── types/            # TypeScript type definitions
│   │   ├── api.ts        # PyPI API types
│   │   ├── config.ts     # Config types
│   │   └── index.ts      # Type exports
│   └── index.ts          # CLI entry point
├── docs/                 # Documentation
│   └── publishing.md     # Publishing guide
├── dist/                 # Build output
├── package.json
├── tsconfig.json
└── README.md
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

## Contributing

Contributions are welcome. Please ensure your code:

- Follows the existing code style
- Includes appropriate tests
- Updates documentation as needed

## License

MIT

## Links

- [PyPI](https://pypi.org)
- [PyPI JSON API Documentation](https://warehouse.pypa.io/api-reference/json.html)
- [Bun](https://bun.sh)
