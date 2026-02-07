# PyPI CLI - Software Requirements Document

**Version:** 1.0.0
**Date:** February 7, 2026
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Project Overview

The PyPI CLI is a command-line interface tool designed to provide developers with a fast, intuitive, and powerful way to interact with PyPI (Python Package Index) directly from their terminal. PyPI is the official repository for Python packages, containing over 500,000 projects used by millions of developers worldwide.

This CLI tool will enable developers to:
- Search and discover Python packages without opening a browser
- View detailed package information, versions, dependencies, and metadata
- Publish and upload packages to PyPI with validation and safety checks
- Manage PyPI API tokens securely from the command line
- Monitor package download statistics and trends
- Check packages for known security vulnerabilities
- Verify package integrity and signatures
- Automate package publishing workflows through CI/CD pipelines

### 1.2 Target Users

**Primary Users:**
- **Python Developers** - Publishing and managing their own packages
- **Backend Developers** - Researching packages for project dependencies
- **DevOps Engineers** - Automating package publishing in deployment pipelines
- **Security Engineers** - Auditing dependencies for vulnerabilities
- **Data Scientists** - Finding specialized packages for data analysis

**Secondary Users:**
- **Technical Writers** - Researching package documentation
- **Open Source Maintainers** - Managing multiple package releases
- **Package Researchers** - Analyzing package ecosystems and trends
- **Compliance Officers** - Verifying package licenses and provenance

### 1.3 Success Metrics

**Technical Success Criteria:**
- CLI responds to commands in under 500ms for simple operations
- Support all major PyPI APIs (JSON API, Simple API, Upload API)
- 100% test coverage for package upload functionality
- Zero-config installation with automatic credential management
- Offline caching of package metadata for faster subsequent queries

**User Experience Success Criteria:**
- Unix-style command structure (verb-noun pattern)
- Comprehensive help documentation accessible via `--help`
- Meaningful error messages with actionable suggestions
- Support for both interactive and non-interactive (scripting) modes
- Color-coded output for better readability
- Table, JSON, and pretty-print output formats

### 1.4 Technical Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Runtime** | Bun (v1.0+) | Fastest JavaScript runtime, built-in TypeScript support, single binary distribution |
| **Language** | TypeScript | Type safety, excellent IDE support, maintainability |
| **CLI Framework** | Commander.js | Industry standard, excellent documentation, flexible command structure |
| **HTTP Client** | Built-in `fetch` | Native to Bun, no dependencies, standards-compliant |
| **Configuration** | JSON + Environment Variables | Simple, widely understood, easy to automate |
| **Testing** | Bun Test | Built-in, fast, TypeScript-native |
| **Distribution** | npm package + standalone binary | Maximum accessibility for all users |

### 1.5 Timeline Estimate

**Phase 1 (Core Foundation):** 2-3 days
- Project setup, configuration management, basic package info

**Phase 2 (Package Discovery):** 2-3 days
- Search, info, versions, dependencies, releases

**Phase 3 (Publishing):** 3-4 days
- Upload, publish, package validation

**Phase 4 (Statistics):** 2-3 days
- Download statistics, trending packages

**Phase 5 (Token Management):** 1-2 days
- Create, list, revoke API tokens

**Phase 6 (Security & Polish):** 2-3 days
- Vulnerability scanning, signature verification, documentation, npm publish

**Total Development Time:** 12-18 days (single developer)

### 1.6 Resource Requirements

**Team Composition:**
- 1x Senior TypeScript Developer (CLI development, API integration)
- 1x QA Engineer (testing, validation, edge cases) - optional but recommended
- 1x Technical Writer (documentation, examples) - can be same as developer

**Infrastructure:**
- PyPI account for testing package uploads (free)
- TestPyPI account for safe testing (free)
- GitHub repository for version control and CI/CD
- npm account for package distribution

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     PyPI CLI Tool                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Command    │  │  API Client  │  │    Config    │  │
│  │   Parser     │──│   (fetch)    │──│   Manager    │  │
│  │ (Commander)  │  │              │  │   (JSON)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         │                  │                  │         │
│  ┌──────▼──────────────────▼──────────────────▼──────┐  │
│  │      Output Formatter & Error Handler             │  │
│  │     (JSON, Table, Pretty Print, Colors)           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Cache Layer (Package Metadata)            │  │
│  │           (Optional, for performance)             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
              ┌──────────────────────┐
              │   PyPI API Servers   │
              ├──────────────────────┤
              │ • pypi.org/pypi      │
              │ • pypi.org/simple    │
              │ • upload.pypi.org    │
              │ • pypistats.org      │
              └──────────────────────┘
```

### 2.2 Project Structure

```
pypi-cli/
├── src/
│   ├── index.ts                 # Entry point, CLI setup
│   ├── commands/                # Command implementations
│   │   ├── search/              # Package search
│   │   │   └── index.ts         # Search packages
│   │   ├── info/                # Package information
│   │   │   ├── index.ts         # Get package details
│   │   │   ├── versions.ts      # List package versions
│   │   │   ├── releases.ts      # Show release history
│   │   │   └── deps.ts          # Show dependencies
│   │   ├── publish/             # Package publishing
│   │   │   ├── index.ts         # Publish package
│   │   │   ├── upload.ts        # Upload distribution file
│   │   │   └── check.ts         # Validate package
│   │   ├── stats/               # Statistics and analytics
│   │   │   ├── index.ts         # Package statistics
│   │   │   ├── downloads.ts     # Download counts
│   │   │   └── trending.ts      # Trending packages
│   │   ├── token/               # Token management
│   │   │   ├── create.ts        # Create API token
│   │   │   ├── list.ts          # List tokens
│   │   │   └── revoke.ts        # Revoke token
│   │   ├── config/              # Configuration
│   │   │   ├── init.ts          # Initialize config
│   │   │   ├── get.ts           # Show config
│   │   │   └── set.ts           # Set config value
│   │   └── security/            # Security features
│   │       ├── audit.ts         # Vulnerability check
│   │       └── verify.ts        # Verify signatures
│   ├── lib/                     # Shared utilities
│   │   ├── api-client.ts        # PyPI API wrapper
│   │   ├── config.ts            # Config file management
│   │   ├── formatters.ts        # Output formatting
│   │   ├── validators.ts        # Input validation
│   │   ├── errors.ts            # Error handling
│   │   ├── cache.ts             # Caching layer
│   │   └── upload.ts            # Package upload helpers
│   ├── types/                   # TypeScript type definitions
│   │   ├── api.ts               # API request/response types
│   │   ├── config.ts            # Configuration types
│   │   ├── package.ts           # Package metadata types
│   │   └── commands.ts          # Command option types
│   └── constants/               # Constants and enums
│       ├── api.ts               # API endpoints, defaults
│       └── messages.ts          # User-facing messages
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── fixtures/                # Test data
├── docs/                        # Documentation
│   ├── SRD.md                   # This document
│   ├── API.md                   # API reference
│   ├── EXAMPLES.md              # Usage examples
│   └── CONTRIBUTING.md          # Contribution guide
├── package.json
├── tsconfig.json
├── bun.lockb
├── .env.example                 # Example environment variables
└── README.md
```

### 2.3 Data Flow Diagrams

#### Package Search Flow

```
User Command                API Client              PyPI API
    │                           │                       │
    │ pypi search "requests"    │                       │
    ├──────────────────────────>│                       │
    │                           │                       │
    │                           │ 1. Validate query     │
    │                           │ 2. Build request      │
    │                           │                       │
    │                           │ GET /pypi?%3Aaction=search&term=requests
    │                           ├──────────────────────>│
    │                           │                       │
    │                           │                       │ 3. Search index
    │                           │                       │ 4. Return results
    │                           │                       │
    │                           │ 200 OK                │
    │                           │ [search results]      │
    │                           │<──────────────────────┤
    │                           │                       │
    │                           │ 5. Format as table    │
    │ [Table of packages]       │                       │
    │<──────────────────────────┤                       │
    │                           │                       │
```

#### Package Publishing Flow

```
User Command                Upload Handler           PyPI Upload API
    │                           │                       │
    │ pypi publish              │                       │
    ├──────────────────────────>│                       │
    │                           │                       │
    │                           │ 1. Find dist files    │
    │                           │ 2. Validate package   │
    │                           │ 3. Check metadata     │
    │                           │ 4. Load API token     │
    │                           │                       │
    │                           │ POST /legacy/         │
    │                           │ (multipart/form-data) │
    │                           ├──────────────────────>│
    │                           │ Authorization: Basic  │
    │                           │ Content: .whl/.tar.gz │
    │                           │                       │
    │                           │                       │ 5. Validate upload
    │                           │                       │ 6. Process package
    │                           │                       │ 7. Update index
    │                           │                       │
    │                           │ 200 OK                │
    │                           │<──────────────────────┤
    │                           │                       │
    │                           │ 8. Confirm success    │
    │ ✓ Package published!      │                       │
    │<──────────────────────────┤                       │
    │                           │                       │
```

#### Configuration Management Flow

```
┌─────────────────────────────────────────────────────────┐
│              Configuration Priority Order                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Command-line flags (highest priority)                │
│     └─> --token pypi-xxx                                │
│                                                          │
│  2. Environment variables                                │
│     └─> PYPI_TOKEN=pypi-xxx                             │
│                                                          │
│  3. Config file (~/.pypirc or ~/.pypi/config.json)      │
│     └─> { "token": "pypi-xxx" }                         │
│                                                          │
│  4. Interactive prompt (if no config found)              │
│     └─> "Enter your PyPI API token:"                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.4 Technology Decisions

#### Why Bun?

**Performance:**
- 3x faster startup time compared to Node.js
- Built-in TypeScript compilation (no separate build step)
- Fast package installation and test execution
- Native HTTP/2 support for API calls

**Developer Experience:**
- Single binary distribution (easy installation)
- Built-in test runner (no Jest/Mocha dependency)
- Native TypeScript support (no ts-node required)
- Built-in bundler for creating standalone executables

**Production Ready:**
- Stable 1.0+ release
- Growing ecosystem and community
- Compatible with most npm packages
- Excellent Node.js compatibility layer

#### Why Commander.js?

**Industry Standard:**
- Used by 10M+ npm downloads per week
- Battle-tested in thousands of CLI tools
- Excellent documentation and examples

**Feature Rich:**
- Git-style subcommands
- Automatic help generation
- Option parsing with validation
- TypeScript type definitions included

**Developer Friendly:**
- Intuitive API design
- Chainable command definitions
- Built-in error handling
- Flexible argument parsing

### 2.5 Security Architecture

#### API Token Management

```
┌──────────────────────────────────────────────────────┐
│              API Token Security Model                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Storage Location: ~/.pypi/config.json               │
│  Alternative: ~/.pypirc (Python standard)            │
│  Permissions: 600 (owner read/write only)            │
│                                                       │
│  Config File Format (.pypi/config.json):             │
│  {                                                    │
│    "token": "pypi-xxxxxxxxxxxx",                     │
│    "repository": "https://upload.pypi.org/legacy/",  │
│    "index": "https://pypi.org/simple/"               │
│  }                                                    │
│                                                       │
│  Alternative Format (.pypirc):                        │
│  [pypi]                                               │
│  username = __token__                                 │
│  password = pypi-xxxxxxxxxxxx                         │
│                                                       │
│  Never Log:                                           │
│  - Full API token values (mask to pypi-xxx...xxx)    │
│  - Package contents in debug mode                    │
│                                                       │
│  Validate:                                            │
│  - API token format (pypi- prefix)                   │
│  - HTTPS connections only                            │
│  - Certificate verification enabled                  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

#### Error Handling Security

- Never expose full API tokens in error messages
- Sanitize file paths before logging
- Mask sensitive package metadata in public logs
- Rate limit suggestions on 429 errors
- Clear guidance on authentication failures
- Warn about uploading to production PyPI vs TestPyPI

### 2.6 Integration Points

#### PyPI APIs

1. **JSON API** (Package Metadata)
   - **Base URL:** `https://pypi.org/pypi/<package>/json`
   - **Authentication:** Not required for read operations
   - **Rate Limits:** No official limits, but be respectful
   - **Use Cases:** Package info, versions, dependencies, metadata

2. **Simple API** (Package Index)
   - **Base URL:** `https://pypi.org/simple/<package>/`
   - **Authentication:** Not required
   - **Format:** HTML with package file links
   - **Use Cases:** Finding download URLs, version listings

3. **Upload API** (Legacy)
   - **Base URL:** `https://upload.pypi.org/legacy/`
   - **Authentication:** API token (Basic Auth with `__token__` username)
   - **Content-Type:** `multipart/form-data`
   - **Rate Limits:** Per-user limits (undocumented)
   - **Use Cases:** Package upload, publishing

4. **XML-RPC API** (Legacy Search and Operations)
   - **Base URL:** `https://pypi.org/pypi`
   - **Authentication:** Not required for search
   - **Status:** Deprecated but still functional
   - **Use Cases:** Package search (until JSON search is available)

5. **PyPI Stats API** (Download Statistics)
   - **Base URL:** `https://pypistats.org/api/`
   - **Authentication:** Not required
   - **Rate Limits:** 300 requests per 5 minutes
   - **Use Cases:** Download counts, trending packages

6. **OSV API** (Vulnerability Database)
   - **Base URL:** `https://api.osv.dev/v1/`
   - **Authentication:** Not required
   - **Use Cases:** Security vulnerability checks

#### External Dependencies

| Dependency | Purpose | License | Optional |
|------------|---------|---------|----------|
| commander | CLI framework | MIT | Required |
| chalk | Terminal colors | MIT | Optional |
| cli-table3 | Table formatting | MIT | Optional |
| ora | Spinners for async ops | MIT | Optional |
| semver | Version comparison | ISC | Optional |
| archiver | Package file handling | MIT | Optional |

**Design Decision:** Minimize dependencies where possible. Use Bun's built-in capabilities for:
- File I/O
- HTTP requests (fetch)
- JSON parsing
- Path manipulation
- Environment variables
- Compression (if supported)

---

## 3. Feature Breakdown

### 3.1 Package Discovery

#### 3.1.1 Search Packages

**User Story:**
As a developer, I want to search for Python packages by keyword so that I can discover packages relevant to my needs.

**Command Syntax:**
```bash
pypi search <query> [options]
```

**Options:**
```
Required:
  <query>                  Search query (package name, keywords, description)

Optional:
  --limit <n>              Number of results to show (default: 20, max: 100)
  --sort <field>           Sort by: relevance, name, downloads, updated (default: relevance)
  --output <format>        Output format: json, table, pretty (default: table)
  --color                  Enable colored output (default: auto)
```

**Examples:**
```bash
# Simple search
pypi search requests

# Search with custom limit
pypi search "web framework" --limit 50

# Search sorted by downloads
pypi search django --sort downloads

# JSON output for scripting
pypi search numpy --output json
```

**Response Format (Table):**
```
┌─────────────────────┬──────────────────────────────────────────┬─────────────┬──────────────┐
│ Package             │ Description                              │ Version     │ Downloads/mo │
├─────────────────────┼──────────────────────────────────────────┼─────────────┼──────────────┤
│ requests            │ Python HTTP for Humans.                  │ 2.31.0      │ 180M         │
│ requests-toolbelt   │ A toolbelt of useful classes and ...     │ 1.0.0       │ 12M          │
│ requests-oauthlib   │ OAuthlib authentication support for ...  │ 1.3.1       │ 45M          │
└─────────────────────┴──────────────────────────────────────────┴─────────────┴──────────────┘

Found 45 packages matching "requests" (showing 3)
```

**Response Format (Pretty):**
```
🔍 Search results for "requests":

1. requests (2.31.0)
   Python HTTP for Humans.
   Downloads: 180M/month
   https://pypi.org/project/requests/

2. requests-toolbelt (1.0.0)
   A toolbelt of useful classes and functions to be used with python-requests
   Downloads: 12M/month
   https://pypi.org/project/requests-toolbelt/

3. requests-oauthlib (1.3.1)
   OAuthlib authentication support for Requests.
   Downloads: 45M/month
   https://pypi.org/project/requests-oauthlib/

Found 45 packages matching "requests" (showing 3)
```

**Response Format (JSON):**
```json
{
  "query": "requests",
  "total": 45,
  "showing": 3,
  "results": [
    {
      "name": "requests",
      "version": "2.31.0",
      "description": "Python HTTP for Humans.",
      "downloads": 180000000,
      "url": "https://pypi.org/project/requests/"
    }
  ]
}
```

**Functional Requirements:**
- FR-SEARCH-001: Search package names, descriptions, and keywords
- FR-SEARCH-002: Support partial and fuzzy matching
- FR-SEARCH-003: Highlight search terms in results (in pretty format)
- FR-SEARCH-004: Show download counts when available
- FR-SEARCH-005: Include package URLs for quick browser access
- FR-SEARCH-006: Support pagination for large result sets
- FR-SEARCH-007: Cache search results locally for performance

**Non-Functional Requirements:**
- NFR-SEARCH-001: Return results within 2 seconds
- NFR-SEARCH-002: Handle network errors gracefully
- NFR-SEARCH-003: Provide suggestions for typos or no results
- NFR-SEARCH-004: Respect PyPI rate limits

**API Integration:**
- Use XML-RPC API: `search()` method
- Fallback to scraping PyPI web search if XML-RPC unavailable
- Consider integrating with pypistats.org for download counts

---

#### 3.1.2 Get Package Information

**User Story:**
As a developer, I want to view detailed information about a package so that I can evaluate whether to use it in my project.

**Command Syntax:**
```bash
pypi info <package> [options]
```

**Options:**
```
Required:
  <package>                Package name

Optional:
  --version <version>      Specific version (default: latest)
  --output <format>        Output format: json, pretty (default: pretty)
  --show-files             Include downloadable files list
  --show-deps              Include dependencies
  --color                  Enable colored output (default: auto)
```

**Examples:**
```bash
# Get latest package info
pypi info requests

# Get specific version info
pypi info requests --version 2.28.0

# Show with dependencies
pypi info django --show-deps

# JSON output
pypi info flask --output json
```

**Response Format (Pretty):**
```
📦 requests 2.31.0

Description:
  Python HTTP for Humans.

Author: Kenneth Reitz
Maintainer: Nate Prewitt
License: Apache 2.0
Homepage: https://requests.readthedocs.io
Repository: https://github.com/psf/requests

Python Requires: >=3.7
Latest Release: 2.31.0 (2023-05-22)
Downloads: 180M/month

Dependencies:
  • charset-normalizer >=2, <4
  • idna >=2.5, <4
  • urllib3 >=1.21.1, <3
  • certifi >=2017.4.17

Classifiers:
  • Development Status :: 5 - Production/Stable
  • Intended Audience :: Developers
  • License :: OSI Approved :: Apache Software License
  • Programming Language :: Python :: 3
  • Programming Language :: Python :: 3.7
  • Programming Language :: Python :: 3.8
  • Programming Language :: Python :: 3.9
  • Programming Language :: Python :: 3.10
  • Programming Language :: Python :: 3.11

Install:
  pip install requests==2.31.0

PyPI: https://pypi.org/project/requests/2.31.0/
```

**Response Format (JSON):**
```json
{
  "name": "requests",
  "version": "2.31.0",
  "description": "Python HTTP for Humans.",
  "author": "Kenneth Reitz",
  "author_email": "me@kennethreitz.org",
  "maintainer": "Nate Prewitt",
  "maintainer_email": "nate.prewitt@gmail.com",
  "license": "Apache 2.0",
  "homepage": "https://requests.readthedocs.io",
  "repository": "https://github.com/psf/requests",
  "python_requires": ">=3.7",
  "release_date": "2023-05-22T14:30:00Z",
  "dependencies": {
    "charset-normalizer": ">=2, <4",
    "idna": ">=2.5, <4",
    "urllib3": ">=1.21.1, <3",
    "certifi": ">=2017.4.17"
  },
  "classifiers": [
    "Development Status :: 5 - Production/Stable",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: Apache Software License"
  ],
  "downloads_last_month": 180000000,
  "pypi_url": "https://pypi.org/project/requests/2.31.0/"
}
```

**Functional Requirements:**
- FR-INFO-001: Retrieve package metadata from PyPI JSON API
- FR-INFO-002: Display package description, author, license
- FR-INFO-003: Show Python version requirements
- FR-INFO-004: List all dependencies with version constraints
- FR-INFO-005: Include download statistics from pypistats.org
- FR-INFO-006: Show links to homepage, repository, documentation
- FR-INFO-007: Display package classifiers
- FR-INFO-008: Provide installation command
- FR-INFO-009: Support viewing specific version information
- FR-INFO-010: Cache package metadata locally

**Non-Functional Requirements:**
- NFR-INFO-001: Fetch and display info within 1 second
- NFR-INFO-002: Handle package not found errors gracefully
- NFR-INFO-003: Suggest similar packages if package not found
- NFR-INFO-004: Color-code important information (version, license)

**API Integration:**
- Primary: PyPI JSON API - `https://pypi.org/pypi/<package>/json`
- Secondary: PyPI JSON API with version - `https://pypi.org/pypi/<package>/<version>/json`
- Stats: pypistats.org API for download counts

---

#### 3.1.3 List Package Versions

**User Story:**
As a developer, I want to see all available versions of a package so that I can choose the appropriate version for my project.

**Command Syntax:**
```bash
pypi versions <package> [options]
```

**Options:**
```
Required:
  <package>                Package name

Optional:
  --limit <n>              Number of versions to show (default: 20, all: 0)
  --stable-only            Show only stable versions (exclude pre-releases)
  --output <format>        Output format: json, table, pretty (default: table)
  --sort <order>           Sort order: desc, asc (default: desc)
  --color                  Enable colored output (default: auto)
```

**Examples:**
```bash
# List recent versions
pypi versions django

# List all versions
pypi versions flask --limit 0

# Stable versions only
pypi versions numpy --stable-only

# JSON output
pypi versions requests --output json
```

**Response Format (Table):**
```
┌────────────┬─────────────┬───────────────────────┬──────────────┐
│ Version    │ Python      │ Release Date          │ Status       │
├────────────┼─────────────┼───────────────────────┼──────────────┤
│ 2.31.0     │ >=3.7       │ 2023-05-22            │ latest       │
│ 2.30.0     │ >=3.7       │ 2023-05-03            │ stable       │
│ 2.29.0     │ >=3.7       │ 2023-01-12            │ stable       │
│ 2.28.2     │ >=3.7       │ 2023-01-12            │ stable       │
│ 2.28.1     │ >=3.7       │ 2022-07-13            │ stable       │
└────────────┴─────────────┴───────────────────────┴──────────────┘

Package: requests
Total versions: 125 (showing 5 most recent)
```

**Response Format (Pretty):**
```
📦 requests - Version History

Latest: 2.31.0 (2023-05-22) ⭐
  Python: >=3.7
  pip install requests==2.31.0

2.30.0 (2023-05-03)
  Python: >=3.7

2.29.0 (2023-01-12)
  Python: >=3.7

2.28.2 (2023-01-12)
  Python: >=3.7

2.28.1 (2022-07-13)
  Python: >=3.7

Total versions: 125 (showing 5 most recent)
Use --limit 0 to show all versions
```

**Functional Requirements:**
- FR-VERSIONS-001: List all versions from PyPI JSON API
- FR-VERSIONS-002: Sort versions by semver (newest first by default)
- FR-VERSIONS-003: Highlight latest stable version
- FR-VERSIONS-004: Filter out pre-release versions with --stable-only
- FR-VERSIONS-005: Show Python version requirements for each version
- FR-VERSIONS-006: Display release dates
- FR-VERSIONS-007: Support pagination or limiting results
- FR-VERSIONS-008: Indicate yanked/removed versions

**Non-Functional Requirements:**
- NFR-VERSIONS-001: Fast retrieval using cached metadata
- NFR-VERSIONS-002: Handle packages with 100+ versions efficiently
- NFR-VERSIONS-003: Clear visual distinction between stable and pre-release

**API Integration:**
- PyPI JSON API - `https://pypi.org/pypi/<package>/json`
- Parse `releases` object for version list

---

#### 3.1.4 Show Release History

**User Story:**
As a developer, I want to see detailed release history including changelogs so that I can understand what changed between versions.

**Command Syntax:**
```bash
pypi releases <package> [options]
```

**Options:**
```
Required:
  <package>                Package name

Optional:
  --limit <n>              Number of releases to show (default: 10)
  --version <version>      Show specific release details
  --output <format>        Output format: json, pretty (default: pretty)
  --color                  Enable colored output (default: auto)
```

**Examples:**
```bash
# Show recent releases
pypi releases django

# Show specific release details
pypi releases flask --version 3.0.0

# JSON output
pypi releases requests --output json --limit 5
```

**Response Format (Pretty):**
```
📋 requests - Release History

═══════════════════════════════════════════════════════════
Version 2.31.0 - May 22, 2023 ⭐ LATEST

Python: >=3.7

Files:
  • requests-2.31.0-py3-none-any.whl (62 kB)
  • requests-2.31.0.tar.gz (110 kB)

Changelog:
  [Release notes not available in PyPI metadata]
  Visit: https://github.com/psf/requests/releases/tag/v2.31.0

═══════════════════════════════════════════════════════════
Version 2.30.0 - May 3, 2023

Python: >=3.7

Files:
  • requests-2.30.0-py3-none-any.whl (61 kB)
  • requests-2.30.0.tar.gz (109 kB)

═══════════════════════════════════════════════════════════

Showing 2 of 125 releases
```

**Functional Requirements:**
- FR-RELEASES-001: Display release metadata from PyPI
- FR-RELEASES-002: Show downloadable files for each release
- FR-RELEASES-003: Include file sizes and types
- FR-RELEASES-004: Link to external changelog/release notes if available
- FR-RELEASES-005: Highlight latest release
- FR-RELEASES-006: Show upload timestamps
- FR-RELEASES-007: Display Python version compatibility

**Non-Functional Requirements:**
- NFR-RELEASES-001: Clearly separate each release visually
- NFR-RELEASES-002: Provide links to GitHub releases if available

**API Integration:**
- PyPI JSON API - `https://pypi.org/pypi/<package>/json`
- Parse `releases` object for detailed information
- Optionally scrape GitHub releases for changelog

---

#### 3.1.5 Show Package Dependencies

**User Story:**
As a developer, I want to see a package's dependencies and dependency tree so that I can understand its requirements and potential conflicts.

**Command Syntax:**
```bash
pypi deps <package> [options]
```

**Options:**
```
Required:
  <package>                Package name

Optional:
  --version <version>      Specific version (default: latest)
  --tree                   Show full dependency tree (recursive)
  --output <format>        Output format: json, tree, table (default: tree)
  --dev                    Include development dependencies
  --extras <extra>         Show dependencies for specific extra
  --color                  Enable colored output (default: auto)
```

**Examples:**
```bash
# Show direct dependencies
pypi deps django

# Show full dependency tree
pypi deps flask --tree

# Show dependencies for specific version
pypi deps requests --version 2.28.0

# Show dependencies with extras
pypi deps celery --extras redis

# JSON output
pypi deps numpy --output json
```

**Response Format (Tree):**
```
📦 django 5.0.0

Dependencies:
├── asgiref >=3.7.0, <4
│   └── (no dependencies)
├── sqlparse >=0.3.1
│   └── (no dependencies)
└── tzdata
    └── (no dependencies)

Optional Dependencies (extras):
├── [argon2] argon2-cffi >=19.1.0
├── [bcrypt] bcrypt
└── [pgsql] psycopg2 >=2.8

3 required dependencies
```

**Response Format (Tree - Recursive):**
```
📦 celery[redis] 5.3.4

Dependencies:
├── kombu >=5.3.4, <6.0
│   ├── amqp >=5.1.1, <6.0
│   │   └── vine >=5.0.0, <6.0
│   ├── vine >=5.0.0, <6.0
│   └── (cached) pytz >0dev
├── billiard >=4.2.0, <5.0
├── click >=8.1.3, <9.0
│   └── colorama (platform: Windows)
├── click-didyoumean >=0.3.0
│   └── (cached) click >=8.0
├── click-repl >=0.2.0
│   ├── (cached) click >=7.1.2
│   └── prompt-toolkit >=3.0.36
│       └── wcwidth
└── redis >=4.5.2, <6.0  [extra: redis]
    └── async-timeout >=4.0.2 (Python <3.11.3)

Total: 12 dependencies (including transitive)
```

**Response Format (Table):**
```
┌─────────────────────┬──────────────────────┬────────────┬────────────┐
│ Package             │ Version Constraint   │ Type       │ Required   │
├─────────────────────┼──────────────────────┼────────────┼────────────┤
│ asgiref             │ >=3.7.0, <4          │ runtime    │ yes        │
│ sqlparse            │ >=0.3.1              │ runtime    │ yes        │
│ tzdata              │ (any)                │ runtime    │ yes        │
│ argon2-cffi         │ >=19.1.0             │ extra      │ no         │
│ bcrypt              │ (any)                │ extra      │ no         │
└─────────────────────┴──────────────────────┴────────────┴────────────┘
```

**Functional Requirements:**
- FR-DEPS-001: Parse `requires_dist` from package metadata
- FR-DEPS-002: Display direct dependencies with version constraints
- FR-DEPS-003: Show optional dependencies (extras)
- FR-DEPS-004: Recursively resolve dependency tree with --tree
- FR-DEPS-005: Handle circular dependencies gracefully
- FR-DEPS-006: Show platform-specific dependencies
- FR-DEPS-007: Indicate dependency depth in tree view
- FR-DEPS-008: Cache resolved dependency trees

**Non-Functional Requirements:**
- NFR-DEPS-001: Limit tree depth to prevent excessive output
- NFR-DEPS-002: Clearly indicate cached/duplicate dependencies
- NFR-DEPS-003: Handle missing dependency metadata

**API Integration:**
- PyPI JSON API - parse `requires_dist` from package metadata
- Recursively fetch dependencies for tree view

---

### 3.2 Package Publishing

#### 3.2.1 Publish Package

**User Story:**
As a package maintainer, I want to publish my package to PyPI so that others can install it.

**Command Syntax:**
```bash
pypi publish [options]
```

**Options:**
```
Optional:
  --dist-dir <dir>         Distribution directory (default: ./dist)
  --repository <url>       Repository URL (default: PyPI, use test.pypi.org for testing)
  --token <token>          API token (overrides config)
  --username <user>        Username (legacy auth)
  --password <pass>        Password (legacy auth)
  --skip-existing          Skip files that already exist
  --dry-run                Validate without uploading
  --verbose                Show detailed upload progress
  --sign                   Sign with GPG before upload
```

**Examples:**
```bash
# Publish from default dist/ directory
pypi publish

# Publish to TestPyPI
pypi publish --repository https://test.pypi.org/legacy/

# Dry run to validate
pypi publish --dry-run

# Publish with specific token
pypi publish --token pypi-xxx...

# Skip existing files
pypi publish --skip-existing
```

**Response Format (Interactive):**
```
🔍 Validating package...

Found distribution files:
  ✓ dist/mypackage-1.0.0-py3-none-any.whl (12.5 kB)
  ✓ dist/mypackage-1.0.0.tar.gz (15.2 kB)

Package metadata:
  Name: mypackage
  Version: 1.0.0
  Author: John Doe
  License: MIT
  Python: >=3.8

Uploading to PyPI...
  ↑ mypackage-1.0.0-py3-none-any.whl ████████████ 100% (12.5 kB/12.5 kB)
  ↑ mypackage-1.0.0.tar.gz          ████████████ 100% (15.2 kB/15.2 kB)

✓ Successfully uploaded 2 files!

View your package:
  https://pypi.org/project/mypackage/1.0.0/

Install with:
  pip install mypackage
```

**Response Format (Dry Run):**
```
🔍 Validating package (dry run - no upload)...

Found distribution files:
  ✓ dist/mypackage-1.0.0-py3-none-any.whl (12.5 kB)
  ✓ dist/mypackage-1.0.0.tar.gz (15.2 kB)

Validation checks:
  ✓ Package name is valid
  ✓ Version format is correct (1.0.0)
  ✓ Metadata is complete
  ✓ README file exists
  ✓ License is specified
  ✓ No known security issues
  ⚠ Long description might render poorly (use 'pypi check' for details)

Package is ready for upload!
Run 'pypi publish' without --dry-run to upload.
```

**Response Format (Errors):**
```
✗ Validation failed!

Errors:
  ✗ No distribution files found in dist/
    Run 'python -m build' to create distribution files

  ✗ Package metadata is incomplete
    Missing required field: 'author'

  ✗ Version 1.0.0 already exists on PyPI
    Bump version in pyproject.toml or setup.py

Fix these errors and try again.
```

**Functional Requirements:**
- FR-PUBLISH-001: Find distribution files (.whl, .tar.gz) in dist directory
- FR-PUBLISH-002: Validate package metadata before upload
- FR-PUBLISH-003: Support API token authentication
- FR-PUBLISH-004: Support legacy username/password authentication
- FR-PUBLISH-005: Upload files using multipart/form-data POST
- FR-PUBLISH-006: Show upload progress with progress bar
- FR-PUBLISH-007: Handle upload errors with clear messages
- FR-PUBLISH-008: Support TestPyPI for testing
- FR-PUBLISH-009: Dry run mode for validation without upload
- FR-PUBLISH-010: Skip existing files option
- FR-PUBLISH-011: GPG signing support
- FR-PUBLISH-012: Read credentials from .pypirc

**Non-Functional Requirements:**
- NFR-PUBLISH-001: Display clear progress during upload
- NFR-PUBLISH-002: Warn about common mistakes (wrong repository, duplicate version)
- NFR-PUBLISH-003: Provide actionable error messages
- NFR-PUBLISH-004: Confirm before uploading to production PyPI
- NFR-PUBLISH-005: Support resumable uploads for large files

**API Integration:**
- PyPI Upload API - `https://upload.pypi.org/legacy/`
- TestPyPI Upload API - `https://test.pypi.org/legacy/`
- Use multipart/form-data encoding
- Basic auth with `__token__` username and token as password

---

#### 3.2.2 Upload Specific File

**User Story:**
As a package maintainer, I want to upload a specific distribution file so that I can control exactly what gets published.

**Command Syntax:**
```bash
pypi upload <file> [options]
```

**Options:**
```
Required:
  <file>                   Path to distribution file (.whl, .tar.gz, .egg)

Optional:
  --repository <url>       Repository URL (default: PyPI)
  --token <token>          API token (overrides config)
  --skip-existing          Skip if file already exists
  --sign                   Sign with GPG before upload
  --verbose                Show detailed upload progress
```

**Examples:**
```bash
# Upload specific wheel file
pypi upload dist/mypackage-1.0.0-py3-none-any.whl

# Upload to TestPyPI
pypi upload dist/mypackage-1.0.0.tar.gz --repository https://test.pypi.org/legacy/

# Upload with signing
pypi upload dist/mypackage-1.0.0-py3-none-any.whl --sign
```

**Response Format:**
```
🔍 Validating file...

File: mypackage-1.0.0-py3-none-any.whl
Size: 12.5 kB
Type: wheel
Package: mypackage
Version: 1.0.0

Uploading to PyPI...
  ↑ mypackage-1.0.0-py3-none-any.whl ████████████ 100% (12.5 kB/12.5 kB)

✓ Successfully uploaded!

View at: https://pypi.org/project/mypackage/1.0.0/
```

**Functional Requirements:**
- FR-UPLOAD-001: Validate file format (.whl, .tar.gz, .zip, .egg)
- FR-UPLOAD-002: Extract metadata from distribution file
- FR-UPLOAD-003: Upload single file to PyPI
- FR-UPLOAD-004: Support GPG signature upload (.asc file)
- FR-UPLOAD-005: Show upload progress
- FR-UPLOAD-006: Handle file already exists error

**Non-Functional Requirements:**
- NFR-UPLOAD-001: Validate file integrity before upload
- NFR-UPLOAD-002: Support large files (100MB+)
- NFR-UPLOAD-003: Resume interrupted uploads if possible

**API Integration:**
- Same as publish command
- Upload single file with metadata

---

#### 3.2.3 Validate Package

**User Story:**
As a package maintainer, I want to validate my package before publishing so that I can catch errors early.

**Command Syntax:**
```bash
pypi check [options]
```

**Options:**
```
Optional:
  --dist-dir <dir>         Distribution directory (default: ./dist)
  --strict                 Fail on warnings
  --output <format>        Output format: json, pretty (default: pretty)
```

**Examples:**
```bash
# Check package in current directory
pypi check

# Check with strict mode
pypi check --strict

# JSON output
pypi check --output json
```

**Response Format (Success):**
```
🔍 Validating package...

Distribution Files:
  ✓ mypackage-1.0.0-py3-none-any.whl (12.5 kB)
  ✓ mypackage-1.0.0.tar.gz (15.2 kB)

Metadata Checks:
  ✓ Package name is valid (mypackage)
  ✓ Version follows PEP 440 (1.0.0)
  ✓ Author is specified (John Doe)
  ✓ License is specified (MIT)
  ✓ Description exists
  ✓ Long description will render correctly (reStructuredText)
  ✓ Classifiers are valid (12 total)
  ✓ Python version specified (>=3.8)
  ✓ Dependencies are valid (5 total)
  ✓ URLs are valid (3 total)

Build Checks:
  ✓ setup.py/pyproject.toml exists
  ✓ README.md exists
  ✓ LICENSE exists
  ✓ MANIFEST.in is not needed

Security Checks:
  ✓ No known vulnerabilities in dependencies
  ✓ No sensitive files in package

✓ Package is ready for upload!
```

**Response Format (Errors/Warnings):**
```
🔍 Validating package...

Distribution Files:
  ✓ mypackage-1.0.0-py3-none-any.whl (12.5 kB)
  ✗ mypackage-1.0.0.tar.gz NOT FOUND
    Run 'python -m build --sdist' to create source distribution

Metadata Checks:
  ✓ Package name is valid (mypackage)
  ✓ Version follows PEP 440 (1.0.0)
  ✗ Author is missing
    Add 'author' field to pyproject.toml or setup.py
  ⚠ License is not specified
    Add 'license' field to metadata
  ✗ Long description rendering failed
    Invalid reStructuredText syntax at line 15
  ⚠ Only 3 classifiers specified
    Consider adding more for better discoverability

Build Checks:
  ✓ pyproject.toml exists
  ✓ README.md exists
  ⚠ LICENSE file not found
    Consider adding a LICENSE file

Security Checks:
  ⚠ Dependency 'requests' has known vulnerability (CVE-2023-XXXXX)
    Update to requests>=2.31.0

✗ Validation failed with 3 errors and 4 warnings
```

**Functional Requirements:**
- FR-CHECK-001: Validate distribution files exist and are readable
- FR-CHECK-002: Validate package metadata completeness
- FR-CHECK-003: Check version format (PEP 440)
- FR-CHECK-004: Validate classifiers against official list
- FR-CHECK-005: Check long description rendering (RST/Markdown)
- FR-CHECK-006: Validate dependency specifications
- FR-CHECK-007: Check for required files (README, LICENSE)
- FR-CHECK-008: Scan for sensitive files (keys, secrets)
- FR-CHECK-009: Check dependencies for known vulnerabilities
- FR-CHECK-010: Validate URLs in metadata

**Non-Functional Requirements:**
- NFR-CHECK-001: Complete validation in under 5 seconds
- NFR-CHECK-002: Provide actionable fix suggestions
- NFR-CHECK-003: Separate errors from warnings clearly

**Implementation:**
- Parse pyproject.toml or setup.py
- Extract metadata from built distributions
- Validate against PyPI requirements
- Check long description with readme_renderer
- Query OSV API for vulnerability scanning

---

### 3.3 Statistics & Analytics

#### 3.3.1 Package Statistics

**User Story:**
As a package maintainer, I want to view comprehensive statistics about my package so that I can track its adoption and usage.

**Command Syntax:**
```bash
pypi stats <package> [options]
```

**Options:**
```
Required:
  <package>                Package name

Optional:
  --period <period>        Time period: day, week, month, year, all (default: month)
  --output <format>        Output format: json, pretty (default: pretty)
  --color                  Enable colored output (default: auto)
```

**Examples:**
```bash
# Show monthly stats
pypi stats requests

# Show all-time stats
pypi stats django --period all

# JSON output
pypi stats flask --output json
```

**Response Format (Pretty):**
```
📊 requests - Statistics

Period: Last 30 days

Downloads:
  Total: 182,543,291
  Daily Average: 6,084,776
  Peak Day: 8,234,567 (2026-01-15)

Download Breakdown by Version:
  2.31.0: 165,234,123 (90.5%)
  2.30.0: 12,345,678 (6.8%)
  2.29.0: 3,456,789 (1.9%)
  Other: 1,506,701 (0.8%)

Python Version Usage:
  3.11: 45.2%
  3.10: 28.5%
  3.9: 15.3%
  3.8: 8.7%
  Other: 2.3%

System Distribution:
  Linux: 72.3%
  Windows: 18.5%
  macOS: 9.2%

Geographic Distribution (Top 5):
  1. United States: 35.2%
  2. China: 12.8%
  3. Germany: 7.5%
  4. India: 6.9%
  5. United Kingdom: 5.3%

All-Time Statistics:
  Total Downloads: 18.5B
  First Release: 2011-02-13
  Latest Release: 2023-05-22
  Total Releases: 125
  Stars (GitHub): 51.2k
  Forks (GitHub): 9.3k

Data source: pypistats.org
Last updated: 2026-02-07 10:30:00 UTC
```

**Functional Requirements:**
- FR-STATS-001: Retrieve download statistics from pypistats.org
- FR-STATS-002: Show total downloads for specified period
- FR-STATS-003: Break down downloads by version
- FR-STATS-004: Show downloads by Python version
- FR-STATS-005: Display system/platform distribution
- FR-STATS-006: Show geographic distribution (top countries)
- FR-STATS-007: Include all-time statistics
- FR-STATS-008: Link to GitHub for additional stats if available
- FR-STATS-009: Cache statistics for performance

**Non-Functional Requirements:**
- NFR-STATS-001: Fetch stats within 3 seconds
- NFR-STATS-002: Handle pypistats.org API rate limits
- NFR-STATS-003: Clear visual representation of percentages

**API Integration:**
- pypistats.org API - `https://pypistats.org/api/packages/<package>/overall`
- pypistats.org API - `https://pypistats.org/api/packages/<package>/python_major`
- pypistats.org API - `https://pypistats.org/api/packages/<package>/system`

---

#### 3.3.2 Download Counts

**User Story:**
As a package maintainer, I want to view detailed download trends over time so that I can understand usage patterns.

**Command Syntax:**
```bash
pypi downloads <package> [options]
```

**Options:**
```
Required:
  <package>                Package name

Optional:
  --period <period>        Time period: day, week, month, year (default: month)
  --version <version>      Filter by specific version
  --python <version>       Filter by Python version (e.g., 3.11)
  --output <format>        Output format: json, chart, table (default: chart)
  --color                  Enable colored output (default: auto)
```

**Examples:**
```bash
# Show monthly download trends
pypi downloads requests

# Show downloads for specific version
pypi downloads django --version 4.2.0

# Filter by Python version
pypi downloads numpy --python 3.11

# Show daily trend for past week
pypi downloads flask --period week
```

**Response Format (Chart):**
```
📈 requests - Download Trend (Last 30 days)

8.5M │                                              ⢀⡤⠊
8.0M │                                        ⢀⣀⣤⠖⠋
7.5M │                                  ⢀⣀⡤⠖⠋⠁
7.0M │                            ⢀⣀⡤⠖⠋⠁
6.5M │                      ⢀⣀⡤⠖⠋⠁
6.0M │                ⢀⣀⡤⠖⠋⠁
5.5M │          ⢀⣀⡤⠖⠋⠁
5.0M │    ⢀⣀⡤⠖⠋⠁
4.5M │⣀⡤⠖⠋⠁
     └────────────────────────────────────────────────
      Jan 8        Jan 15       Jan 22       Jan 29    Feb 5

Total: 182.5M downloads
Average: 6.1M/day
Peak: 8.2M (Jan 15)
Trend: ↑ 12.5% vs previous month
```

**Response Format (Table):**
```
┌────────────┬─────────────┬──────────┬───────────┐
│ Date       │ Downloads   │ Change   │ Trend     │
├────────────┼─────────────┼──────────┼───────────┤
│ 2026-02-06 │ 7,234,567   │ +2.3%    │ ↑         │
│ 2026-02-05 │ 7,089,123   │ +5.6%    │ ↑         │
│ 2026-02-04 │ 6,712,456   │ -3.2%    │ ↓         │
│ 2026-02-03 │ 6,933,789   │ +1.8%    │ ↑         │
│ 2026-02-02 │ 6,811,234   │ +0.5%    │ →         │
└────────────┴─────────────┴──────────┴───────────┘

30-day total: 182.5M
```

**Functional Requirements:**
- FR-DOWNLOADS-001: Fetch time-series download data
- FR-DOWNLOADS-002: Generate ASCII chart visualization
- FR-DOWNLOADS-003: Show daily/weekly/monthly aggregations
- FR-DOWNLOADS-004: Calculate trends and percentage changes
- FR-DOWNLOADS-005: Filter by package version
- FR-DOWNLOADS-006: Filter by Python version
- FR-DOWNLOADS-007: Compare with previous period

**Non-Functional Requirements:**
- NFR-DOWNLOADS-001: Clear ASCII chart rendering
- NFR-DOWNLOADS-002: Handle missing data gracefully
- NFR-DOWNLOADS-003: Responsive to terminal width

**API Integration:**
- pypistats.org API - `https://pypistats.org/api/packages/<package>/recent`

---

#### 3.3.3 Trending Packages

**User Story:**
As a developer, I want to discover trending packages so that I can stay updated on popular new projects.

**Command Syntax:**
```bash
pypi trending [options]
```

**Options:**
```
Optional:
  --period <period>        Time period: day, week, month (default: week)
  --category <category>    Filter by category (web, data, ml, etc.)
  --limit <n>              Number of packages to show (default: 20, max: 100)
  --output <format>        Output format: json, table (default: table)
  --color                  Enable colored output (default: auto)
```

**Examples:**
```bash
# Show trending packages this week
pypi trending

# Show daily trending
pypi trending --period day

# Filter by category
pypi trending --category ml --limit 10

# JSON output
pypi trending --output json
```

**Response Format (Table):**
```
🔥 Trending Python Packages (Last 7 days)

┌──────┬─────────────────────┬─────────────────────────────────────┬─────────────┬──────────┐
│ Rank │ Package             │ Description                         │ Downloads   │ Growth   │
├──────┼─────────────────────┼─────────────────────────────────────┼─────────────┼──────────┤
│ 1    │ polars              │ Blazingly fast DataFrame library    │ 2.5M        │ +245%    │
│ 2    │ ruff                │ An extremely fast Python linter     │ 3.2M        │ +189%    │
│ 3    │ uv                  │ An extremely fast Python package... │ 890K        │ +156%    │
│ 4    │ pydantic-ai         │ Agent framework built on Pydantic   │ 450K        │ +134%    │
│ 5    │ langchain           │ Building applications with LLMs     │ 4.5M        │ +98%     │
└──────┴─────────────────────┴─────────────────────────────────────┴─────────────┴──────────┘

Trending = highest download growth vs previous period
Data updated: 2026-02-07 10:00:00 UTC
```

**Functional Requirements:**
- FR-TRENDING-001: Calculate trending packages by growth percentage
- FR-TRENDING-002: Support different time periods (day, week, month)
- FR-TRENDING-003: Filter by package category/classifier
- FR-TRENDING-004: Show absolute downloads and growth percentage
- FR-TRENDING-005: Include package description
- FR-TRENDING-006: Link to package page

**Non-Functional Requirements:**
- NFR-TRENDING-001: Update trending data regularly (cache for 1 hour)
- NFR-TRENDING-002: Fast response from cached data

**Implementation:**
- Fetch download stats for top packages
- Calculate growth percentage
- Sort by growth rate
- Cache results for performance

---

### 3.4 Token Management

#### 3.4.1 Create API Token

**User Story:**
As a package maintainer, I want to create API tokens so that I can securely authenticate with PyPI.

**Command Syntax:**
```bash
pypi token create <name> [options]
```

**Options:**
```
Required:
  <name>                   Token name/description

Optional:
  --scope <scope>          Scope: user, project:<name> (default: user)
  --output <format>        Output format: json, pretty (default: pretty)
```

**Examples:**
```bash
# Create user-scoped token
pypi token create "CI/CD Pipeline"

# Create project-scoped token
pypi token create "MyProject Release" --scope project:myproject

# JSON output
pypi token create "Production" --output json
```

**Response Format (Pretty):**
```
⚠️  This operation requires authentication.

Opening browser for PyPI login...
(Or visit: https://pypi.org/manage/account/token/create/)

✓ Token created successfully!

Name: CI/CD Pipeline
Scope: User (all projects)
Token: pypi-AgEIcHlwaS5vcmc...

⚠️  IMPORTANT: Save this token now. You won't be able to see it again!

Save to config:
  pypi config set token pypi-AgEIcHlwaS5vcmc...

Or set environment variable:
  export PYPI_TOKEN="pypi-AgEIcHlwaS5vcmc..."

Or add to .pypirc:
  [pypi]
  username = __token__
  password = pypi-AgEIcHlwaS5vcmc...
```

**Functional Requirements:**
- FR-TOKEN-CREATE-001: Open browser to PyPI token creation page
- FR-TOKEN-CREATE-002: Support OAuth flow for authentication
- FR-TOKEN-CREATE-003: Allow user-scoped and project-scoped tokens
- FR-TOKEN-CREATE-004: Display created token once
- FR-TOKEN-CREATE-005: Provide usage instructions
- FR-TOKEN-CREATE-006: Optionally save to config automatically

**Non-Functional Requirements:**
- NFR-TOKEN-CREATE-001: Clear security warnings
- NFR-TOKEN-CREATE-002: Provide multiple storage options

**Note:** PyPI API doesn't support programmatic token creation. This command opens the browser to the PyPI token creation page and provides instructions.

---

#### 3.4.2 List API Tokens

**User Story:**
As a package maintainer, I want to list my API tokens so that I can audit access.

**Command Syntax:**
```bash
pypi token list [options]
```

**Options:**
```
Optional:
  --output <format>        Output format: json, table (default: table)
  --show-masked            Show masked token values
```

**Examples:**
```bash
# List tokens
pypi token list

# Show with masked values
pypi token list --show-masked

# JSON output
pypi token list --output json
```

**Response Format (Table):**
```
⚠️  This operation requires authentication.

Opening browser for PyPI token management...
(Or visit: https://pypi.org/manage/account/token/)

Alternatively, view tokens saved in config:

┌─────────────────────┬──────────────────────┬─────────────────────┐
│ Name                │ Scope                │ Saved In            │
├─────────────────────┼──────────────────────┼─────────────────────┤
│ (current)           │ user                 │ ~/.pypi/config.json │
└─────────────────────┴──────────────────────┴─────────────────────┘

To view all tokens, visit: https://pypi.org/manage/account/token/
```

**Functional Requirements:**
- FR-TOKEN-LIST-001: Open browser to PyPI token management
- FR-TOKEN-LIST-002: Show locally saved tokens from config
- FR-TOKEN-LIST-003: Never show full token values
- FR-TOKEN-LIST-004: Indicate which token is currently active

**Note:** PyPI API doesn't provide token listing. This command shows locally saved tokens and opens browser to PyPI for full list.

---

#### 3.4.3 Revoke API Token

**User Story:**
As a package maintainer, I want to revoke API tokens so that I can remove compromised or unused tokens.

**Command Syntax:**
```bash
pypi token revoke <token-id> [options]
```

**Options:**
```
Required:
  <token-id>               Token ID or name

Optional:
  --force                  Skip confirmation prompt
```

**Examples:**
```bash
# Revoke token
pypi token revoke "CI/CD Pipeline"

# Revoke without confirmation
pypi token revoke token-id-123 --force
```

**Response Format:**
```
⚠️  This operation must be done via PyPI web interface.

Opening browser to revoke token...
Visit: https://pypi.org/manage/account/token/

To revoke a token:
1. Find the token in the list
2. Click "Remove" or "Options" → "Remove"
3. Confirm removal

If this token is saved in your config, run:
  pypi config set token <new-token>
```

**Functional Requirements:**
- FR-TOKEN-REVOKE-001: Open browser to PyPI token management
- FR-TOKEN-REVOKE-002: Provide instructions for revocation
- FR-TOKEN-REVOKE-003: Optionally remove from local config

**Note:** PyPI API doesn't support programmatic token revocation. This command provides instructions and opens browser.

---

### 3.5 Configuration Management

#### 3.5.1 Initialize Configuration

**User Story:**
As a developer, I want to initialize PyPI CLI configuration so that I can set up credentials and preferences.

**Command Syntax:**
```bash
pypi config init [options]
```

**Options:**
```
Optional:
  --interactive            Interactive setup (default: true)
  --token <token>          Set API token
  --repository <url>       Set repository URL
  --force                  Overwrite existing config
```

**Examples:**
```bash
# Interactive initialization
pypi config init

# Non-interactive with token
pypi config init --token pypi-xxx...

# Force overwrite
pypi config init --force
```

**Response Format (Interactive):**
```
🔧 PyPI CLI Configuration Setup

This wizard will help you set up PyPI CLI.

[1/4] API Token
Do you have a PyPI API token? (y/n): y
Enter your API token (pypi-xxx...): **********************
✓ Token saved

[2/4] Default Repository
Which repository do you want to use by default?
  1) PyPI (https://upload.pypi.org/legacy/)
  2) TestPyPI (https://test.pypi.org/legacy/)
  3) Custom
Select (1-3): 1
✓ Repository set to PyPI

[3/4] Upload Preferences
Skip existing files during upload? (y/n): y
✓ Skip existing enabled

[4/4] Output Preferences
Enable colored output? (y/n): y
✓ Colors enabled

Configuration saved to ~/.pypi/config.json

You're all set! Try these commands:
  pypi search requests
  pypi info django
  pypi publish --dry-run
```

**Functional Requirements:**
- FR-CONFIG-INIT-001: Create config directory if not exists
- FR-CONFIG-INIT-002: Interactive prompts for configuration
- FR-CONFIG-INIT-003: Validate API token format
- FR-CONFIG-INIT-004: Set file permissions to 600
- FR-CONFIG-INIT-005: Create .pypirc compatibility
- FR-CONFIG-INIT-006: Provide usage examples after setup

---

#### 3.5.2 Get Configuration

**User Story:**
As a developer, I want to view my current configuration so that I can verify settings.

**Command Syntax:**
```bash
pypi config get [key] [options]
```

**Options:**
```
Optional:
  [key]                    Specific config key to show
  --output <format>        Output format: json, pretty (default: pretty)
  --show-token             Show full token value (masked by default)
```

**Examples:**
```bash
# Show all config
pypi config get

# Show specific key
pypi config get repository

# JSON output
pypi config get --output json
```

**Response Format (Pretty):**
```
🔧 PyPI CLI Configuration

Location: ~/.pypi/config.json

Settings:
  token: pypi-AgE***...***7wQ (masked)
  repository: https://upload.pypi.org/legacy/
  skip_existing: true
  colors: true

To change settings:
  pypi config set <key> <value>

To show full token:
  pypi config get --show-token
```

**Functional Requirements:**
- FR-CONFIG-GET-001: Read config from file
- FR-CONFIG-GET-002: Show all or specific key
- FR-CONFIG-GET-003: Mask sensitive values by default
- FR-CONFIG-GET-004: Support JSON output

---

#### 3.5.3 Set Configuration

**User Story:**
As a developer, I want to update configuration values so that I can change settings without editing files.

**Command Syntax:**
```bash
pypi config set <key> <value> [options]
```

**Options:**
```
Required:
  <key>                    Configuration key
  <value>                  Configuration value

Optional:
  --global                 Set globally (default: user config)
```

**Examples:**
```bash
# Set API token
pypi config set token pypi-xxx...

# Set repository
pypi config set repository https://test.pypi.org/legacy/

# Enable skip existing
pypi config set skip_existing true
```

**Response Format:**
```
✓ Configuration updated

Key: repository
New Value: https://test.pypi.org/legacy/
Location: ~/.pypi/config.json

Current configuration:
  token: pypi-AgE***...***7wQ (masked)
  repository: https://test.pypi.org/legacy/
  skip_existing: true
  colors: true
```

**Functional Requirements:**
- FR-CONFIG-SET-001: Update config file
- FR-CONFIG-SET-002: Validate values before saving
- FR-CONFIG-SET-003: Create config if not exists
- FR-CONFIG-SET-004: Show updated configuration

---

### 3.6 Security Features

#### 3.6.1 Audit Package Vulnerabilities

**User Story:**
As a developer, I want to check packages for known vulnerabilities so that I can avoid security issues.

**Command Syntax:**
```bash
pypi audit <package> [options]
```

**Options:**
```
Required:
  <package>                Package name

Optional:
  --version <version>      Specific version (default: latest)
  --recursive              Check all dependencies
  --output <format>        Output format: json, pretty (default: pretty)
  --severity <level>       Minimum severity: low, medium, high, critical (default: medium)
```

**Examples:**
```bash
# Audit package
pypi audit requests

# Audit specific version
pypi audit django --version 3.2.0

# Audit with dependencies
pypi audit flask --recursive

# JSON output
pypi audit numpy --output json
```

**Response Format (No Vulnerabilities):**
```
🔒 Security Audit: requests 2.31.0

✓ No known vulnerabilities found

Checked against:
  • OSV Database (Open Source Vulnerabilities)
  • PyPI Advisory Database
  • GitHub Security Advisories

Last updated: 2026-02-07 10:00:00 UTC

Package is safe to use!
```

**Response Format (Vulnerabilities Found):**
```
🔒 Security Audit: requests 2.28.0

⚠️  2 vulnerabilities found

╔═══════════════════════════════════════════════════════════════════════════
║ CRITICAL: CVE-2023-32681
╠═══════════════════════════════════════════════════════════════════════════
║ Package: requests
║ Affected: <2.31.0
║ Fixed in: 2.31.0
║
║ Description:
║ Requests is a HTTP library. Since Requests 2.3.0, Requests has been
║ leaking Proxy-Authorization headers to destination servers when redirected
║ to an HTTPS endpoint.
║
║ Severity: CRITICAL (CVSS 9.1)
║ Published: 2023-05-26
║
║ Fix: Upgrade to requests>=2.31.0
║ References:
║   • https://nvd.nist.gov/vuln/detail/CVE-2023-32681
║   • https://github.com/psf/requests/security/advisories/GHSA-j8r2-6x86-q33q
╚═══════════════════════════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════════════════════════
║ HIGH: GHSA-x84v-xcm2-53pg
╠═══════════════════════════════════════════════════════════════════════════
║ Package: requests
║ Affected: <2.29.0
║ Fixed in: 2.29.0
║
║ Description:
║ Requests `Proxy-Authorization` headers are not stripped during redirects
║ to non-HTTPS domains.
║
║ Severity: HIGH (CVSS 7.5)
║ Published: 2023-01-12
║
║ Fix: Upgrade to requests>=2.29.0
║ References:
║   • https://github.com/advisories/GHSA-x84v-xcm2-53pg
╚═══════════════════════════════════════════════════════════════════════════

Recommendation:
  ⚠️  UPGRADE TO requests>=2.31.0 IMMEDIATELY

Install safe version:
  pip install --upgrade "requests>=2.31.0"
```

**Functional Requirements:**
- FR-AUDIT-001: Query OSV API for vulnerabilities
- FR-AUDIT-002: Check specific package version
- FR-AUDIT-003: Recursively check all dependencies
- FR-AUDIT-004: Display CVE/GHSA details
- FR-AUDIT-005: Show severity levels (CVSS scores)
- FR-AUDIT-006: Provide fix recommendations
- FR-AUDIT-007: Include reference links
- FR-AUDIT-008: Filter by minimum severity

**Non-Functional Requirements:**
- NFR-AUDIT-001: Complete audit in under 3 seconds
- NFR-AUDIT-002: Clear visual hierarchy for vulnerabilities
- NFR-AUDIT-003: Cache vulnerability data

**API Integration:**
- OSV API - `https://api.osv.dev/v1/query`
- PyPI JSON API for dependency resolution

---

#### 3.6.2 Verify Package Signatures

**User Story:**
As a developer, I want to verify package signatures so that I can ensure package authenticity.

**Command Syntax:**
```bash
pypi verify <package> [options]
```

**Options:**
```
Required:
  <package>                Package name or path to file

Optional:
  --version <version>      Specific version (default: latest)
  --signature <path>       Path to .asc signature file
  --output <format>        Output format: json, pretty (default: pretty)
```

**Examples:**
```bash
# Verify package from PyPI
pypi verify requests

# Verify local file with signature
pypi verify dist/mypackage-1.0.0.tar.gz --signature dist/mypackage-1.0.0.tar.gz.asc

# Verify specific version
pypi verify django --version 4.2.0
```

**Response Format (Verified):**
```
🔐 Signature Verification: requests 2.31.0

✓ Package signature verified successfully!

File: requests-2.31.0-py3-none-any.whl
Size: 62,794 bytes
SHA256: 942c5a758f98d49ba87eba67fa36f1c...

GPG Signature:
  Signer: Kenneth Reitz <me@kennethreitz.org>
  Key ID: 0x1234567890ABCDEF
  Key Fingerprint: ABCD 1234 EFGH 5678 IJKL...
  Signed: 2023-05-22 14:30:00 UTC
  Status: ✓ Valid signature

Trust Level: Ultimate (in your keyring)

Package is authentic and has not been tampered with.
```

**Response Format (Failed):**
```
🔐 Signature Verification: requests 2.31.0

✗ Signature verification FAILED!

File: requests-2.31.0-py3-none-any.whl
Size: 62,794 bytes

Issues:
  ✗ No GPG signature found for this release
  ⚠️  Most PyPI packages are not signed

Alternative verification:
  ✓ SHA256 hash matches PyPI: 942c5a758f98d49ba87eba67fa36f1c...
  ✓ File integrity confirmed

Note: While this package is not GPG-signed, the SHA256 hash matches
the official PyPI record, confirming file integrity.
```

**Functional Requirements:**
- FR-VERIFY-001: Download package and signature from PyPI
- FR-VERIFY-002: Verify GPG signatures using system GPG
- FR-VERIFY-003: Verify SHA256 hashes against PyPI
- FR-VERIFY-004: Check file integrity
- FR-VERIFY-005: Display signer information
- FR-VERIFY-006: Show trust level
- FR-VERIFY-007: Support local file verification

**Non-Functional Requirements:**
- NFR-VERIFY-001: Clear pass/fail indication
- NFR-VERIFY-002: Explain when signature not available
- NFR-VERIFY-003: Provide alternative verification methods

**Implementation:**
- Use system GPG command
- Download .asc files from PyPI if available
- Compare SHA256 from PyPI metadata
- Most packages won't have GPG signatures (inform user)

---

## 4. Implementation Checklists

### 4.1 Phase 1: Core Foundation

**Duration:** 2-3 days

#### Project Setup
- [ ] Initialize Bun project with TypeScript
- [ ] Configure `package.json` with bin entry
- [ ] Set up `tsconfig.json` for strict TypeScript
- [ ] Create project directory structure
- [ ] Initialize Git repository
- [ ] Create `.gitignore` for node_modules, dist, etc.
- [ ] Set up EditorConfig for consistent formatting

#### CLI Framework Setup
- [ ] Install Commander.js
- [ ] Create main CLI entry point (`src/index.ts`)
- [ ] Configure command structure and routing
- [ ] Set up help text generation
- [ ] Implement version flag (`--version`)
- [ ] Add global options (--output, --color, --verbose)

#### Configuration Management
- [ ] Create config type definitions (`src/types/config.ts`)
- [ ] Implement config file manager (`src/lib/config.ts`)
- [ ] Support `~/.pypi/config.json` format
- [ ] Support `~/.pypirc` format (read-only for compatibility)
- [ ] Implement config priority: CLI flags > env vars > config file
- [ ] Set config file permissions to 600
- [ ] Implement `pypi config init` command
- [ ] Implement `pypi config get` command
- [ ] Implement `pypi config set` command
- [ ] Validate config values
- [ ] Mask sensitive values in output

#### API Client Foundation
- [ ] Create API client types (`src/types/api.ts`)
- [ ] Create base API client (`src/lib/api-client.ts`)
- [ ] Implement fetch wrapper with error handling
- [ ] Add request timeout support
- [ ] Implement retry logic for transient failures
- [ ] Add rate limiting support
- [ ] Implement user-agent header
- [ ] Support HTTPS proxy configuration

#### Output Formatting
- [ ] Create formatters module (`src/lib/formatters.ts`)
- [ ] Implement JSON formatter
- [ ] Implement pretty-print formatter
- [ ] Implement table formatter (using cli-table3)
- [ ] Add color support (using chalk)
- [ ] Implement auto-detect for TTY vs pipe
- [ ] Add spinner/progress indicators (using ora)

#### Error Handling
- [ ] Create error types (`src/lib/errors.ts`)
- [ ] Implement custom error classes
- [ ] Add API error handling
- [ ] Add network error handling
- [ ] Add validation error handling
- [ ] Implement user-friendly error messages
- [ ] Add debug mode for verbose errors

#### Testing Setup
- [ ] Configure Bun test framework
- [ ] Create test directory structure
- [ ] Set up test fixtures
- [ ] Create mock API responses
- [ ] Write unit tests for config manager
- [ ] Write unit tests for API client
- [ ] Write unit tests for formatters
- [ ] Set up CI pipeline (GitHub Actions)

---

### 4.2 Phase 2: Package Discovery

**Duration:** 2-3 days

#### Search Command
- [ ] Create search command (`src/commands/search/index.ts`)
- [ ] Implement XML-RPC API integration for search
- [ ] Parse search results
- [ ] Format results as table
- [ ] Format results as pretty output
- [ ] Implement pagination
- [ ] Add sorting options (relevance, downloads, name)
- [ ] Highlight search terms in results
- [ ] Add download counts from pypistats.org
- [ ] Implement result caching
- [ ] Handle "no results" gracefully
- [ ] Add spell-check suggestions
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update help documentation

#### Info Command
- [ ] Create info command (`src/commands/info/index.ts`)
- [ ] Integrate with PyPI JSON API
- [ ] Parse package metadata
- [ ] Display package description
- [ ] Show author and maintainer info
- [ ] Display license information
- [ ] Show Python version requirements
- [ ] List dependencies
- [ ] Display classifiers
- [ ] Show homepage/repository URLs
- [ ] Add download statistics
- [ ] Format output prettily
- [ ] Support JSON output
- [ ] Handle package not found
- [ ] Suggest similar packages
- [ ] Cache package metadata
- [ ] Write unit tests
- [ ] Write integration tests

#### Versions Command
- [ ] Create versions command (`src/commands/info/versions.ts`)
- [ ] Fetch version list from PyPI JSON API
- [ ] Parse version information
- [ ] Sort versions using semver
- [ ] Filter stable vs pre-release versions
- [ ] Display release dates
- [ ] Show Python version requirements per version
- [ ] Highlight latest version
- [ ] Indicate yanked versions
- [ ] Support table format
- [ ] Support pretty format
- [ ] Implement pagination
- [ ] Write unit tests
- [ ] Write integration tests

#### Releases Command
- [ ] Create releases command (`src/commands/info/releases.ts`)
- [ ] Fetch release details from PyPI JSON API
- [ ] Display release metadata
- [ ] Show downloadable files
- [ ] Include file sizes and types
- [ ] Show upload timestamps
- [ ] Link to changelog if available
- [ ] Format output with separators
- [ ] Support limiting number of releases
- [ ] Write unit tests
- [ ] Write integration tests

#### Dependencies Command
- [ ] Create deps command (`src/commands/info/deps.ts`)
- [ ] Parse `requires_dist` from metadata
- [ ] Display direct dependencies
- [ ] Show version constraints
- [ ] Display optional dependencies (extras)
- [ ] Implement recursive dependency resolution
- [ ] Create dependency tree visualization
- [ ] Handle circular dependencies
- [ ] Show platform-specific dependencies
- [ ] Support table format
- [ ] Support tree format
- [ ] Cache dependency trees
- [ ] Write unit tests
- [ ] Write integration tests

---

### 4.3 Phase 3: Publishing

**Duration:** 3-4 days

#### Package Validation
- [ ] Create check command (`src/commands/publish/check.ts`)
- [ ] Find distribution files in dist directory
- [ ] Validate file formats (.whl, .tar.gz)
- [ ] Extract metadata from distributions
- [ ] Validate package name format
- [ ] Validate version format (PEP 440)
- [ ] Check required metadata fields
- [ ] Validate long description rendering (RST/Markdown)
- [ ] Validate classifiers against official list
- [ ] Check dependency specifications
- [ ] Validate URLs in metadata
- [ ] Scan for sensitive files
- [ ] Check for README and LICENSE files
- [ ] Integrate with OSV API for vulnerability scanning
- [ ] Display validation results
- [ ] Provide fix suggestions
- [ ] Support strict mode
- [ ] Write unit tests
- [ ] Write integration tests

#### Upload Functionality
- [ ] Create upload module (`src/lib/upload.ts`)
- [ ] Implement multipart/form-data encoding
- [ ] Read distribution files
- [ ] Extract metadata from files
- [ ] Build upload request payload
- [ ] Implement file upload with progress
- [ ] Support Basic Auth (token-based)
- [ ] Handle upload API responses
- [ ] Parse upload errors
- [ ] Support resumable uploads
- [ ] Implement upload retry logic

#### Upload Command
- [ ] Create upload command (`src/commands/publish/upload.ts`)
- [ ] Validate distribution file
- [ ] Check file format
- [ ] Authenticate with API token
- [ ] Upload single file
- [ ] Show upload progress bar
- [ ] Handle "already exists" error
- [ ] Support skip-existing flag
- [ ] Display upload confirmation
- [ ] Provide package URL
- [ ] Write unit tests
- [ ] Write integration tests

#### Publish Command
- [ ] Create publish command (`src/commands/publish/index.ts`)
- [ ] Find all distribution files in dist directory
- [ ] Validate package before upload
- [ ] Run security checks
- [ ] Confirm before upload (interactive)
- [ ] Upload all distribution files
- [ ] Show overall progress
- [ ] Handle partial failures
- [ ] Support dry-run mode
- [ ] Support TestPyPI repository
- [ ] Support custom repository URLs
- [ ] Support GPG signing
- [ ] Read credentials from .pypirc
- [ ] Display success summary
- [ ] Provide installation command
- [ ] Write unit tests
- [ ] Write integration tests with TestPyPI

#### Authentication
- [ ] Support API token authentication
- [ ] Support legacy username/password (deprecated warning)
- [ ] Read from environment variables
- [ ] Read from config file
- [ ] Read from .pypirc
- [ ] Implement token validation
- [ ] Mask tokens in logs
- [ ] Handle authentication errors clearly

---

### 4.4 Phase 4: Statistics

**Duration:** 2-3 days

#### Stats Command
- [ ] Create stats command (`src/commands/stats/index.ts`)
- [ ] Integrate with pypistats.org API
- [ ] Fetch overall download statistics
- [ ] Fetch Python version breakdown
- [ ] Fetch system distribution breakdown
- [ ] Parse and format statistics
- [ ] Display total downloads
- [ ] Show daily averages
- [ ] Display peak download day
- [ ] Show version breakdown
- [ ] Show Python version distribution
- [ ] Show system/platform distribution
- [ ] Format percentages clearly
- [ ] Support different time periods
- [ ] Cache statistics data
- [ ] Handle API rate limits
- [ ] Write unit tests
- [ ] Write integration tests

#### Downloads Command
- [ ] Create downloads command (`src/commands/stats/downloads.ts`)
- [ ] Fetch time-series download data
- [ ] Parse download trends
- [ ] Calculate daily/weekly/monthly aggregations
- [ ] Implement ASCII chart rendering
- [ ] Show download trend line
- [ ] Calculate percentage changes
- [ ] Show peak and average
- [ ] Support table format
- [ ] Support chart format
- [ ] Filter by package version
- [ ] Filter by Python version
- [ ] Compare with previous period
- [ ] Handle missing data points
- [ ] Make chart responsive to terminal width
- [ ] Write unit tests
- [ ] Write integration tests

#### Trending Command
- [ ] Create trending command (`src/commands/stats/trending.ts`)
- [ ] Fetch download data for popular packages
- [ ] Calculate growth percentages
- [ ] Sort by growth rate
- [ ] Filter by category/classifier
- [ ] Display trending packages table
- [ ] Show download counts
- [ ] Show growth percentages
- [ ] Include package descriptions
- [ ] Support different time periods
- [ ] Cache trending data (1 hour TTL)
- [ ] Write unit tests
- [ ] Write integration tests

#### Statistics Caching
- [ ] Implement cache module for stats
- [ ] Set appropriate TTLs for different data types
- [ ] Invalidate cache on demand
- [ ] Handle cache misses gracefully

---

### 4.5 Phase 5: Token Management

**Duration:** 1-2 days

#### Token Create Command
- [ ] Create token create command (`src/commands/token/create.ts`)
- [ ] Display instructions for PyPI token creation
- [ ] Open browser to PyPI token page
- [ ] Provide OAuth flow (if available)
- [ ] Support user-scoped tokens
- [ ] Support project-scoped tokens
- [ ] Display created token once
- [ ] Provide usage instructions
- [ ] Optionally save to config
- [ ] Write unit tests

#### Token List Command
- [ ] Create token list command (`src/commands/token/list.ts`)
- [ ] Read tokens from config files
- [ ] Display saved tokens
- [ ] Mask token values
- [ ] Show token scopes
- [ ] Indicate active token
- [ ] Open browser to PyPI token management
- [ ] Provide instructions for viewing all tokens
- [ ] Write unit tests

#### Token Revoke Command
- [ ] Create token revoke command (`src/commands/token/revoke.ts`)
- [ ] Display revocation instructions
- [ ] Open browser to PyPI token management
- [ ] Optionally remove from local config
- [ ] Confirm before removal
- [ ] Write unit tests

---

### 4.6 Phase 6: Security & Polish

**Duration:** 2-3 days

#### Audit Command
- [ ] Create audit command (`src/commands/security/audit.ts`)
- [ ] Integrate with OSV API
- [ ] Query vulnerabilities by package name and version
- [ ] Parse vulnerability responses
- [ ] Display CVE/GHSA details
- [ ] Show CVSS severity scores
- [ ] Highlight critical vulnerabilities
- [ ] Provide fix recommendations
- [ ] Include reference links
- [ ] Support recursive dependency auditing
- [ ] Filter by minimum severity
- [ ] Cache vulnerability data
- [ ] Handle packages with no vulnerabilities
- [ ] Write unit tests
- [ ] Write integration tests

#### Verify Command
- [ ] Create verify command (`src/commands/security/verify.ts`)
- [ ] Download package from PyPI
- [ ] Download GPG signature if available
- [ ] Verify GPG signature using system GPG
- [ ] Extract SHA256 hash from file
- [ ] Compare with PyPI metadata hash
- [ ] Display signer information
- [ ] Show trust level
- [ ] Support local file verification
- [ ] Handle packages without signatures
- [ ] Provide alternative verification (SHA256)
- [ ] Write unit tests
- [ ] Write integration tests

#### Caching Layer
- [ ] Implement cache module (`src/lib/cache.ts`)
- [ ] Support filesystem caching
- [ ] Set cache TTLs per data type
- [ ] Implement cache invalidation
- [ ] Add cache clearing command
- [ ] Optimize cache size management

#### Documentation
- [ ] Complete README.md with examples
- [ ] Create CONTRIBUTING.md guide
- [ ] Write API.md reference
- [ ] Create EXAMPLES.md with use cases
- [ ] Add inline code documentation
- [ ] Generate command reference docs
- [ ] Create troubleshooting guide
- [ ] Document environment variables
- [ ] Add security best practices

#### Polish & UX
- [ ] Review all error messages
- [ ] Ensure consistent formatting
- [ ] Add loading spinners for slow operations
- [ ] Optimize command performance
- [ ] Test on Windows, macOS, Linux
- [ ] Ensure color support works correctly
- [ ] Test with various terminal widths
- [ ] Add command aliases for convenience
- [ ] Improve help text clarity
- [ ] Add usage examples to --help

#### Testing & QA
- [ ] Achieve 80%+ code coverage
- [ ] Test all commands with real APIs
- [ ] Test with TestPyPI
- [ ] Test error conditions
- [ ] Test network failures
- [ ] Test rate limiting handling
- [ ] Perform security audit
- [ ] Test on slow connections
- [ ] Validate output formats
- [ ] Test with large packages

#### Distribution
- [ ] Build standalone binary with Bun
- [ ] Test binary on all platforms
- [ ] Publish to npm registry
- [ ] Create GitHub releases
- [ ] Add installation instructions
- [ ] Set up semantic versioning
- [ ] Create changelog
- [ ] Add badge to README (version, downloads, build status)

#### CI/CD
- [ ] Set up GitHub Actions for tests
- [ ] Add lint checks
- [ ] Add type checking
- [ ] Add build verification
- [ ] Automate npm publishing
- [ ] Create release workflow
- [ ] Add dependency updates (Dependabot)

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **NFR-PERF-001:** CLI startup time must be under 100ms
- **NFR-PERF-002:** Simple commands (info, versions) must complete within 2 seconds
- **NFR-PERF-003:** Search results must appear within 3 seconds
- **NFR-PERF-004:** Package upload must show progress for files >1MB
- **NFR-PERF-005:** Cache frequently accessed data (package metadata, stats)
- **NFR-PERF-006:** Minimize network requests through caching
- **NFR-PERF-007:** Support parallel uploads for multiple files

### 5.2 Reliability

- **NFR-REL-001:** Handle network errors gracefully with retry logic
- **NFR-REL-002:** Provide clear error messages for all failure modes
- **NFR-REL-003:** Validate all user input before API calls
- **NFR-REL-004:** Never expose sensitive data (tokens, passwords) in logs
- **NFR-REL-005:** Support offline mode for cached data
- **NFR-REL-006:** Implement request timeouts (30s for API calls)
- **NFR-REL-007:** Handle API rate limiting with exponential backoff

### 5.3 Usability

- **NFR-USE-001:** All commands must have comprehensive --help text
- **NFR-USE-002:** Error messages must suggest corrective actions
- **NFR-USE-003:** Support both interactive and non-interactive modes
- **NFR-USE-004:** Provide multiple output formats (JSON, table, pretty)
- **NFR-USE-005:** Use color coding for better readability (when supported)
- **NFR-USE-006:** Confirm destructive actions (upload to production PyPI)
- **NFR-USE-007:** Provide progress feedback for long operations
- **NFR-USE-008:** Support command aliases for common operations

### 5.4 Security

- **NFR-SEC-001:** Store API tokens with 600 file permissions
- **NFR-SEC-002:** Never log full API tokens (mask to pypi-xxx...xxx)
- **NFR-SEC-003:** Use HTTPS for all API communications
- **NFR-SEC-004:** Verify SSL certificates
- **NFR-SEC-005:** Warn when uploading to production PyPI
- **NFR-SEC-006:** Scan packages for vulnerabilities before upload
- **NFR-SEC-007:** Support GPG signature verification
- **NFR-SEC-008:** Sanitize all user input to prevent injection attacks

### 5.5 Compatibility

- **NFR-COMPAT-001:** Support Node.js 18+ and Bun 1.0+
- **NFR-COMPAT-002:** Work on Windows, macOS, and Linux
- **NFR-COMPAT-003:** Respect NO_COLOR environment variable
- **NFR-COMPAT-004:** Support .pypirc format for PyPI compatibility
- **NFR-COMPAT-005:** Handle terminal width detection
- **NFR-COMPAT-006:** Work in CI/CD environments (non-TTY)
- **NFR-COMPAT-007:** Support HTTP/HTTPS proxy configuration

### 5.6 Maintainability

- **NFR-MAINT-001:** Use TypeScript with strict mode enabled
- **NFR-MAINT-002:** Maintain 80%+ test coverage
- **NFR-MAINT-003:** Follow consistent code style (use Prettier)
- **NFR-MAINT-004:** Document all public APIs
- **NFR-MAINT-005:** Use semantic versioning
- **NFR-MAINT-006:** Keep dependencies minimal and up-to-date
- **NFR-MAINT-007:** Provide clear contribution guidelines

---

## 6. API Reference

### 6.1 PyPI JSON API

**Base URL:** `https://pypi.org/pypi`

#### Get Package Metadata (Latest)
```
GET /pypi/{package}/json
```

**Response Example:**
```json
{
  "info": {
    "name": "requests",
    "version": "2.31.0",
    "summary": "Python HTTP for Humans.",
    "description": "...",
    "author": "Kenneth Reitz",
    "author_email": "me@kennethreitz.org",
    "license": "Apache 2.0",
    "home_page": "https://requests.readthedocs.io",
    "project_urls": {
      "Source": "https://github.com/psf/requests"
    },
    "requires_python": ">=3.7",
    "requires_dist": [
      "charset-normalizer (>=2,<4)",
      "idna (>=2.5,<4)"
    ],
    "classifiers": [...]
  },
  "releases": {
    "2.31.0": [
      {
        "filename": "requests-2.31.0-py3-none-any.whl",
        "url": "https://files.pythonhosted.org/...",
        "size": 62794,
        "python_version": "py3",
        "upload_time": "2023-05-22T14:30:00"
      }
    ]
  },
  "urls": [...]
}
```

#### Get Package Metadata (Specific Version)
```
GET /pypi/{package}/{version}/json
```

### 6.2 PyPI Simple API

**Base URL:** `https://pypi.org/simple`

#### List Package Versions
```
GET /simple/{package}/
```

**Response:** HTML page with links to distribution files

### 6.3 PyPI Upload API

**Base URL:** `https://upload.pypi.org/legacy/`

#### Upload Package
```
POST /legacy/
Content-Type: multipart/form-data
Authorization: Basic __token__:{api_token}

Fields:
  :action = file_upload
  protocol_version = 1
  name = package_name
  version = package_version
  content = <file binary data>
  filetype = bdist_wheel | sdist
  pyversion = py3 | source
  md5_digest = <md5 hash>
  sha256_digest = <sha256 hash>
```

### 6.4 PyPI Stats API

**Base URL:** `https://pypistats.org/api`

#### Overall Downloads
```
GET /packages/{package}/overall?mirrors=false
```

**Response Example:**
```json
{
  "data": [
    {
      "category": "with_mirrors",
      "date": "2026-02-06",
      "downloads": 7234567
    }
  ],
  "package": "requests",
  "type": "overall_downloads"
}
```

#### Recent Downloads
```
GET /packages/{package}/recent?period=day|week|month
```

### 6.5 OSV Vulnerability API

**Base URL:** `https://api.osv.dev/v1`

#### Query Vulnerabilities
```
POST /query

Body:
{
  "package": {
    "name": "requests",
    "ecosystem": "PyPI"
  },
  "version": "2.28.0"
}
```

**Response Example:**
```json
{
  "vulns": [
    {
      "id": "GHSA-j8r2-6x86-q33q",
      "summary": "Requests `Proxy-Authorization` header leak",
      "details": "...",
      "severity": [
        {
          "type": "CVSS_V3",
          "score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
        }
      ],
      "affected": [
        {
          "package": {
            "name": "requests",
            "ecosystem": "PyPI"
          },
          "ranges": [
            {
              "type": "ECOSYSTEM",
              "events": [
                {"introduced": "0"},
                {"fixed": "2.31.0"}
              ]
            }
          ]
        }
      ],
      "references": [...]
    }
  ]
}
```

---

## 7. Example Usage Scenarios

### 7.1 Developer Researching Packages

**Scenario:** Alice wants to find a good HTTP library for Python.

```bash
# Search for HTTP libraries
$ pypi search "http client"

┌─────────────────┬─────────────────────────────────────────┬─────────┬──────────────┐
│ Package         │ Description                             │ Version │ Downloads/mo │
├─────────────────┼─────────────────────────────────────────┼─────────┼──────────────┤
│ requests        │ Python HTTP for Humans.                 │ 2.31.0  │ 180M         │
│ httpx           │ The next generation HTTP client.        │ 0.26.0  │ 25M          │
│ aiohttp         │ Async http client/server framework      │ 3.9.1   │ 48M          │
└─────────────────┴─────────────────────────────────────────┴─────────┴──────────────┘

# Get details about requests
$ pypi info requests

📦 requests 2.31.0

Description:
  Python HTTP for Humans.

Author: Kenneth Reitz
License: Apache 2.0
Python Requires: >=3.7
Downloads: 180M/month

Dependencies:
  • charset-normalizer >=2, <4
  • idna >=2.5, <4
  • urllib3 >=1.21.1, <3
  • certifi >=2017.4.17

Install:
  pip install requests==2.31.0

# Check for security issues
$ pypi audit requests

🔒 Security Audit: requests 2.31.0

✓ No known vulnerabilities found

Package is safe to use!
```

### 7.2 Package Maintainer Publishing

**Scenario:** Bob is publishing a new version of his package.

```bash
# First, validate the package
$ pypi check

🔍 Validating package...

Distribution Files:
  ✓ mylib-1.2.0-py3-none-any.whl (45.2 kB)
  ✓ mylib-1.2.0.tar.gz (52.1 kB)

Metadata Checks:
  ✓ Package name is valid (mylib)
  ✓ Version follows PEP 440 (1.2.0)
  ✓ All required fields present
  ⚠ Only 3 classifiers specified
    Consider adding more for better discoverability

Security Checks:
  ✓ No known vulnerabilities in dependencies

✓ Package is ready for upload!

# Test upload to TestPyPI first
$ pypi publish --repository https://test.pypi.org/legacy/ --dry-run

🔍 Validating package (dry run - no upload)...

Found distribution files:
  ✓ dist/mylib-1.2.0-py3-none-any.whl (45.2 kB)
  ✓ dist/mylib-1.2.0.tar.gz (52.1 kB)

Package is ready for upload!

# Actually upload to TestPyPI
$ pypi publish --repository https://test.pypi.org/legacy/

Uploading to TestPyPI...
  ↑ mylib-1.2.0-py3-none-any.whl ████████████ 100% (45.2 kB/45.2 kB)
  ↑ mylib-1.2.0.tar.gz          ████████████ 100% (52.1 kB/52.1 kB)

✓ Successfully uploaded 2 files!

View your package:
  https://test.pypi.org/project/mylib/1.2.0/

# After testing, publish to production PyPI
$ pypi publish

⚠️  You are about to upload to production PyPI.
Continue? (y/n): y

Uploading to PyPI...
  ↑ mylib-1.2.0-py3-none-any.whl ████████████ 100% (45.2 kB/45.2 kB)
  ↑ mylib-1.2.0.tar.gz          ████████████ 100% (52.1 kB/52.1 kB)

✓ Successfully uploaded 2 files!

View your package:
  https://pypi.org/project/mylib/1.2.0/

Install with:
  pip install mylib
```

### 7.3 DevOps Engineer in CI/CD

**Scenario:** Carol is setting up automated package publishing in GitHub Actions.

```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Bun
        uses: oven-sh/setup-bun@v1

      - name: Install pypi-cli
        run: bun install -g pypi-cli

      - name: Build package
        run: python -m build

      - name: Publish to PyPI
        env:
          PYPI_TOKEN: ${{ secrets.PYPI_TOKEN }}
        run: pypi publish --token $PYPI_TOKEN
```

```bash
# Locally, set up the token
$ pypi config set token $PYPI_TOKEN

# Test the publish command
$ pypi publish --dry-run
```

### 7.4 Security Engineer Auditing Dependencies

**Scenario:** Dave needs to audit all dependencies for security issues.

```bash
# Audit main package
$ pypi audit django --recursive

🔒 Security Audit: django 4.2.0 (with dependencies)

Scanning 15 packages...

⚠️  1 vulnerability found in dependencies

╔═══════════════════════════════════════════════════════════════════════════
║ HIGH: CVE-2023-XXXXX
╠═══════════════════════════════════════════════════════════════════════════
║ Package: pillow (dependency of django[images])
║ Affected: <10.0.0
║ Fixed in: 10.0.0
║
║ Description:
║ Pillow image processing library has a buffer overflow vulnerability...
║
║ Severity: HIGH (CVSS 7.5)
║
║ Fix: Upgrade to pillow>=10.0.0
╚═══════════════════════════════════════════════════════════════════════════

Recommendation:
  Update pillow to >=10.0.0

# Generate a report for compliance
$ pypi audit django --recursive --output json > security-audit.json

# Check trending packages for safe alternatives
$ pypi trending --category web
```

---

## 8. Future Enhancements

### 8.1 Advanced Features

- **Package Comparison:** Compare multiple packages side-by-side
- **Dependency Graph Visualization:** Generate visual dependency graphs
- **License Compliance:** Scan for license conflicts
- **Package Quality Score:** Calculate package quality metrics
- **Auto-update Notifications:** Alert when new versions are available
- **Local Package Repository:** Manage private PyPI repository
- **Package Mirroring:** Mirror PyPI packages locally
- **Dependency Lock File:** Generate and manage lock files

### 8.2 Integration Features

- **GitHub Integration:** Link to GitHub releases and issues
- **Poetry Integration:** Support pyproject.toml from Poetry
- **PDM Integration:** Support PDM package manager
- **Docker Integration:** Generate Dockerfiles for packages
- **Virtual Environment Support:** Auto-detect and use venvs
- **Requirements.txt Generation:** Create from dependencies

### 8.3 Analytics Features

- **Download Forecasting:** Predict future download trends
- **Package Health Monitoring:** Track package maintenance status
- **Community Metrics:** Show issue response times, PR activity
- **Package Ranking:** Score packages by various metrics
- **Historical Comparisons:** Compare package stats over time

### 8.4 Developer Experience

- **Interactive Mode:** REPL-like interface for PyPI
- **Shell Completion:** Bash/Zsh completion scripts
- **Plugin System:** Allow third-party plugins
- **Themes:** Customizable color schemes
- **Watch Mode:** Monitor packages for changes
- **Bulk Operations:** Operate on multiple packages at once

---

## 9. Appendix

### 9.1 PyPI Package Metadata Fields

| Field | Description | Required |
|-------|-------------|----------|
| name | Package name | Yes |
| version | Package version (PEP 440) | Yes |
| summary | Short description | Yes |
| description | Long description | No |
| author | Author name | No |
| author_email | Author email | No |
| maintainer | Maintainer name | No |
| maintainer_email | Maintainer email | No |
| license | License identifier | No |
| keywords | Search keywords | No |
| classifiers | Package classifiers | No |
| requires_python | Python version requirement | No |
| requires_dist | Dependencies | No |
| project_urls | URLs (homepage, docs, etc.) | No |

### 9.2 Package Classifiers Examples

```
Development Status :: 5 - Production/Stable
Intended Audience :: Developers
License :: OSI Approved :: MIT License
Programming Language :: Python :: 3
Programming Language :: Python :: 3.8
Programming Language :: Python :: 3.9
Programming Language :: Python :: 3.10
Programming Language :: Python :: 3.11
Programming Language :: Python :: 3.12
Topic :: Software Development :: Libraries
Framework :: Django
Framework :: Flask
Operating System :: OS Independent
```

### 9.3 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PYPI_TOKEN | PyPI API token | pypi-AgEIcHlwaS5vcmc... |
| PYPI_REPOSITORY | Default repository URL | https://upload.pypi.org/legacy/ |
| PYPI_CONFIG_DIR | Config directory | ~/.pypi |
| NO_COLOR | Disable colored output | 1 |
| PYPI_CACHE_DIR | Cache directory | ~/.cache/pypi-cli |
| HTTP_PROXY | HTTP proxy server | http://proxy:8080 |
| HTTPS_PROXY | HTTPS proxy server | https://proxy:8080 |

### 9.4 Configuration File Format

**~/.pypi/config.json:**
```json
{
  "token": "pypi-AgEIcHlwaS5vcmc...",
  "repository": "https://upload.pypi.org/legacy/",
  "skip_existing": true,
  "colors": true,
  "cache_ttl": 3600
}
```

**~/.pypirc (legacy format):**
```ini
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-AgEIcHlwaS5vcmc...

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-AgEIcHlwaS5vcmc...
```

### 9.5 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Invalid API token | Check token in config |
| 400 Bad Request | Invalid package metadata | Run `pypi check` to validate |
| 409 Conflict | Version already exists | Bump version number |
| 429 Too Many Requests | Rate limit exceeded | Wait and retry |
| Package not found | Package doesn't exist | Check spelling |
| Network error | Connection failed | Check internet connection |

### 9.6 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid command/arguments |
| 3 | Network error |
| 4 | Authentication error |
| 5 | Validation error |
| 6 | Package not found |
| 7 | Configuration error |

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **PyPI** | Python Package Index - the official repository for Python packages |
| **TestPyPI** | A separate instance of PyPI for testing package uploads |
| **Distribution** | A packaged version of a Python project (.whl, .tar.gz, etc.) |
| **Wheel** | A built-package format for Python (.whl file) |
| **sdist** | Source distribution (.tar.gz file) |
| **PEP 440** | Python Enhancement Proposal defining version specifiers |
| **Classifier** | Metadata tags describing package attributes |
| **API Token** | Authentication token for PyPI API access |
| **Dependency** | Another package required by this package |
| **Transitive Dependency** | A dependency of a dependency |
| **Vulnerability** | Known security issue in a package |
| **CVE** | Common Vulnerabilities and Exposures identifier |
| **GHSA** | GitHub Security Advisory identifier |
| **OSV** | Open Source Vulnerabilities database |
| **GPG Signature** | Cryptographic signature verifying package authenticity |
| **pyproject.toml** | Modern Python project configuration file |
| **setup.py** | Legacy Python project configuration script |
| **.pypirc** | Configuration file for PyPI credentials |

---

**END OF DOCUMENT**
