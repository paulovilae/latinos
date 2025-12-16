# File Organization Guidelines

## Core Principles

The AI Trading Bot Platform follows these file organization principles to maintain a clean, navigable codebase:

1. **Logical Grouping**: Related files should be grouped together in appropriate directories
2. **Folder Threshold**: When a feature or component requires more than 5-7 files, create a dedicated folder
3. **Clear Hierarchy**: Maintain a clear hierarchy with appropriate nesting (not too deep, not too flat)
4. **Discoverability**: Use consistent naming and README files to make components discoverable
5. **Separation of Concerns**: Keep distinct types of files (code, docs, tests) in appropriate subfolders
6. **File Size Management**: Large monolithic files (>800 lines) should be split into smaller, focused files
7. **Avoid Single-File Folders**: Don't create folders for single files - only group related files when there are multiple files

## Directory Structure Rules

### Feature Directories

When implementing a new feature that requires multiple files:

1. Create a dedicated directory with a descriptive name (e.g., `startup/`, `auth/`, `cms/`)
2. Add a README.md file explaining the feature's purpose and structure
3. Group related files into appropriate subdirectories:
   - `/docs/` - Documentation files
   - `/scripts/` - Utility and execution scripts
   - `/tests/` - Test files and test runners
   - `/config/` - Configuration files
4. Keep the most important/entry point files at the top level of the feature directory

### Root Directory Management

The project root directory should remain clean and navigable:

1. Only essential files should reside directly in the root directory:
   - Primary entry points (index.js, main.py, etc.)
   - Essential configuration (package.json, .env, .env.example, etc.)
   - Root-level documentation (README.md, LICENSE)
   - Git-related files (.gitignore, .git/)
2. All other files should be organized in appropriate subdirectories
3. The root README.md should provide a clear overview of the project structure

### Test Organization

We use a dual-level approach to test organization:

1. **Project-Level Tests** (`/tests/`):
   - Primary tests that are regularly used during development
   - Tests that are part of the CI/CD pipeline
   - Tests that verify core functionality
   - Examples: Unit tests, integration tests, API tests

2. **Debug Tests** (`.kilocode/debug-tests/`):
   - Temporary or exploratory tests used during debugging
   - Tests that aren't intended to be committed to the repository
   - One-off scripts to verify behavior
   - Performance test scripts
   - Test logs and outputs

This separation allows us to maintain clean test directories while still having a place for debug-specific tests.

### Configuration and Environment Variables

1. **Always Use Environment Variables**:
   - Configuration values should always be soft-coded, never hard-coded
   - All configurable values (ports, addresses, credentials, etc.) must use environment variables
   - Use a unified `.env` file in the root directory with comprehensive documentation
   - Maintain a synced `.env.example` file (without sensitive values) for new developers

2. **Environment File Management**:
   - `.env` files contain sensitive information and should never be committed (added to .gitignore)
   - `.env.example` should be committed and kept up-to-date
   - Document each variable in the `.env.example` file
   - Group related variables together with clear comments

### File Size Management

Large monolithic files make code harder to understand, navigate, and maintain. Follow these guidelines for managing file size:

1. **800-Line Threshold**: If a file exceeds 800 lines of code, it should be split into multiple smaller files
2. **Split by Functionality**: Divide large files based on logical functional areas
3. **Common Splitting Patterns**:
   - Split by feature/domain (e.g., auth-related functionality vs. data processing)
   - Split by layer (e.g., separate API endpoints from business logic)
   - Split by component type (e.g., separate hooks from component definitions)
4. **Maintain Cohesion**: Each resulting file should have a clear, focused purpose
5. **Index Files**: Consider creating index files to re-export from multiple smaller files
6. **File Naming**: Use clear, descriptive names that indicate the file's specific purpose
7. **Consistent Exports**: Maintain consistent export patterns across split files

For example, a large `formula-manager.js` file might be split into:
```
formula-manager/
├── index.js                  # Re-exports main functionality
├── formula-validator.js      # Validation logic
├── formula-calculator.js     # Calculation implementation
├── formula-scheduler.js      # Scheduling logic
└── formula-utils.js          # Shared utility functions
```

### Naming Conventions

1. Use kebab-case for directory and file names (e.g., `startup-system/`, `config-manager.js`)
2. Use descriptive, self-documenting names
3. Prefix test files with `test-` or suffix with `.test.js`
4. Use standard extensions (.js, .ts, .py, .md, etc.)

### Documentation Organization

1. Each major feature directory should have its own README.md
2. Detailed documentation should be placed in a `/docs/` subdirectory
3. User guides should be separate from technical documentation
4. Use descriptive filenames that indicate the document's purpose

## Examples

### Before: Poor Organization (Files in Root)

```
/
├── orchestrator.js
├── config-manager.js
├── service-manager.js
├── health-checker.js
├── platform-adapter.js
├── error-handler.js
├── platform-config.js
├── start-platform.bat
├── start-platform.sh
├── stop-platform.bat
├── stop-platform.sh
├── STARTUP-SYSTEM.md
├── USER-GUIDE-STARTUP.md
├── test-startup-system.js
├── test-startup-failures.js
├── run-tests.js
├── run-tests.bat
├── run-tests.sh
├── STARTUP-SYSTEM-ISSUES.md
├── STARTUP-SYSTEM-TEST-REPORT.md
├── STARTUP-SYSTEM-TEST-STATUS.md
├── TESTING.md
└── ... (other project files)
```

### After: Proper Organization (Feature Directory)

```
/
├── .env                                # Environment variables (not in git)
├── .env.example                        # Example environment file with documentation
├── tests/                              # Project-level tests
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   └── api/                            # API tests
│
├── startup/                            # Feature directory
│   ├── README.md                       # Feature overview
│   ├── orchestrator.js                 # Main scripts
│   ├── config-manager.js
│   ├── service-manager.js
│   ├── health-checker.js
│   ├── platform-adapter.js
│   ├── error-handler.js
│   ├── platform-config.js
│   ├── dependency-checker.js
│   │
│   ├── scripts/                        # Execution scripts
│   │   ├── start-platform.bat
│   │   ├── start-platform.sh
│   │   ├── stop-platform.bat
│   │   └── stop-platform.sh
│   │
│   ├── docs/                           # Documentation
│   │   ├── STARTUP-SYSTEM.md
│   │   ├── USER-GUIDE.md
│   │   └── KNOWN-ISSUES.md
│   │
│   └── tests/                          # Feature-specific tests
│       ├── test-startup-system.js
│       ├── test-startup-failures.js
│       └── run-tests.js
│
├── .kilocode/                          # Kilocode-specific files (not in git)
│   ├── debug-tests/                    # Temporary debug tests
│   │   ├── performance-test.js
│   │   └── test-logs/
│   │
│   ├── tasks/                          # Task tracking
│   └── rules/                          # Custom rules
│
├── bot_microservice/                   # Existing feature directory
├── backend/                            # Existing feature directory
├── components/                         # Existing feature directory
└── ... (other project directories)
```

### Example: Configuration Management

#### Before: Hard-coded configuration values

```javascript
// Bad practice
const server = http.createServer(app);
server.listen(3000, () => {
  console.log('Server running on port 3000');
});

const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'secretpassword',
  database: 'myapp'
});
```

#### After: Environment variables with documentation

```javascript
// .env
// PORT=3000
// DB_HOST=localhost
// DB_USER=admin
// DB_PASSWORD=secretpassword
// DB_NAME=myapp

// Good practice
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const dbConnection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
```

### Example: Splitting a Large Monolithic File

#### Before: Large Monolithic File

```javascript
// formula-manager.js - 1200 lines of code
// Contains validation, calculation, scheduling, and utilities all in one file

const validateFormula = (formula) => { /* 200 lines of validation logic */ };
const calculateFormulaResult = (formula, data) => { /* 300 lines of calculation logic */ };
const scheduleFormula = (formula, interval) => { /* 250 lines of scheduling logic */ };
const getFormulaMetrics = (formula) => { /* 150 lines of metrics logic */ };
// Plus 300 lines of utility functions and helpers
```

#### After: Split into Focused Files

```
formula-manager/
├── index.js                  # Re-exports and main integration - 50 lines
│   // Export the main functionality
│   export { validateFormula } from './formula-validator.js';
│   export { calculateFormulaResult } from './formula-calculator.js';
│   // etc.
│
├── formula-validator.js      # Validation logic - 250 lines
│   // Focused on formula validation
│   export const validateFormula = (formula) => { /* validation logic */ };
│
├── formula-calculator.js     # Calculation implementation - 350 lines
│   // Focused on formula calculation
│   export const calculateFormulaResult = (formula, data) => { /* calculation logic */ };
│
├── formula-scheduler.js      # Scheduling logic - 300 lines
│   // Focused on formula scheduling
│   export const scheduleFormula = (formula, interval) => { /* scheduling logic */ };
│
├── formula-metrics.js        # Metrics logic - 200 lines
│   // Focused on formula metrics
│   export const getFormulaMetrics = (formula) => { /* metrics logic */ };
│
└── formula-utils.js          # Shared utility functions - 350 lines
    // Shared utilities used across multiple files
    export const utilityFunction1 = () => { /* utility logic */ };
    export const utilityFunction2 = () => { /* utility logic */ };
```

## Application to Existing Features

For existing features like the Unified Startup System:

1. Create a new directory (`startup/`)
2. Move all related files into this directory and its appropriate subdirectories
3. Update imports and references as needed
4. Add a README.md explaining the directory structure and purpose
5. Update any scripts that depend on the old file locations

## Integration with CI/CD

File organization should be enforced through:

1. Code reviews that check adherence to these guidelines
2. Linting rules that enforce naming conventions
3. Documentation templates that encourage proper organization

## Maintenance

Periodically review the project structure to:

1. Identify areas that need reorganization
2. Consolidate similar functionality
3. Remove unused or deprecated files
4. Ensure READMEs are up-to-date

By following these guidelines, we maintain a clean, navigable codebase that scales with project complexity and improves developer productivity.