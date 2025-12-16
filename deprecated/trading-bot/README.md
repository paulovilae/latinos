# AI Trading Bot Platform

A comprehensive platform that combines advanced trading algorithms with an intuitive user interface to democratize algorithmic trading. The platform features a full Content Management System, technical analysis tools, performance tracking, and customizable trading bots.

## Overview

The AI Trading Bot Platform follows a three-tier architecture:

1. **Frontend Application**: React-based UI for user interaction
2. **Backend Services**: Node.js/Express.js APIs for authentication, data processing, and CMS
3. **Bot Microservice**: Python-based service for trading algorithm execution

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│    Frontend     │────►│     Backend      │────►│  Bot Microservice │
│  (React + TS)   │◄────│ (Node.js/Express)│◄────│    (Python)       │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └───────────────────┘
```

## Key Features

- **User Authentication**: Secure registration and login system
- **Personalized Dashboard**: Trading performance metrics and system status
- **Technical Analysis**: Real-time market data visualization with interactive charts
- **Trading Bot Configuration**: Intuitive interface for customizing trading algorithms
- **Performance Tracking**: Detailed trading performance statistics and history
- **Content Management System**: Comprehensive CMS for managing website content
- **Marketing Website**: Product information, pricing, testimonials, and news

## Project Structure

The project is organized following clear [file organization principles](./docs/DEVELOPER_GUIDE.md):

```
/
├── components/              # React UI components
│   ├── dashboard/           # Dashboard-specific components
│   ├── editor/              # WYSIWYG editor components
│   └── ... (UI components)
├── contexts/                # React context providers
├── services/                # API service clients
├── hooks/                   # Custom React hooks
├── locales/                 # Internationalization files
├── backend/                 # Backend server implementation
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/          # Database models
│   │   ├── middlewares/     # Request processing middlewares
│   │   ├── routes/          # API route definitions
│   │   ├── utils/           # Utility functions
│   │   └── migrations/      # Database schema migrations
├── bot_microservice/        # Python bot implementation
├── startup/                 # Unified startup system
├── tests/                   # Test files organized by component
├── docs/                    # Project documentation
└── templates/               # Component templates
```

## Getting Started

### Prerequisites

- Node.js v16+ and npm for frontend and backend
- Python 3.9+ for bot microservice
- PostgreSQL database
- Redis (for caching)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-trading-bot-platform.git
   cd ai-trading-bot-platform
   ```

2. Install dependencies:
   ```bash
   # Install frontend and backend dependencies
   npm install
   
   # Install bot microservice dependencies
   pip install -r bot_microservice/requirements.txt
   
   # If alpaca_trade_api is reported as missing, install it separately
   pip install alpaca_trade_api==3.2.0
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and update the values
   - Set up database connection parameters

4. Start the platform:
   ```bash
   # Using the unified startup system
   npm run start:platform
   # or
   ./startup/scripts/start-platform.sh  # Unix
   # or
   startup\scripts\start-platform.bat   # Windows
   ```

The unified startup system will launch all components in the correct order, with proper dependency management and will verify all required dependencies are installed.

### Troubleshooting Dependencies

If the platform reports missing dependencies during startup:

1. The dependency checker will provide specific installation instructions
2. For Python packages, you can install them individually:
   ```bash
   pip install alpaca_trade_api==3.2.0
   ```
3. After installing the missing dependencies, restart the platform

#### Known Python Package Detection Issues

If you've installed a package but the dependency checker still reports it as missing:

1. Try installing the package using the Python executable directly:
   ```bash
   python -m pip install alpaca_trade_api
   ```

2. For user-specific installations, ensure you're using the same Python environment:
   ```bash
   # Check which Python is being used
   python --version
   which python  # Unix/Mac
   where python  # Windows
   
   # Install to the specific Python environment
   /full/path/to/python -m pip install alpaca_trade_api
   ```

## Development Workflow

### Using Component Templates

The project provides standardized templates for creating new components:

1. Choose a template from the `/templates` directory
2. Copy the template files to your target directory
3. Rename files according to your component name
4. Replace placeholder content with your implementation

See the [Developer Guide](./docs/DEVELOPER_GUIDE.md) for detailed information on using templates and following file organization guidelines.

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=components
npm test -- --testPathPattern=services
```

## Documentation

- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Detailed development guidelines and file organization principles
- [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md) - Configuration options and environment setup
- [Testing Methodology](./docs/TESTING.md) - Testing approach and standards
- [Backend API Documentation](./backend/README.md) - API endpoints and usage
- [Bot Microservice Documentation](./bot_microservice/README.md) - Trading bot implementation details
- [Unified Startup System](./startup/README.md) - Platform startup coordination

## File Organization Principles

This project follows these core file organization principles:

1. **Logical Grouping**: Related files are grouped together in appropriate directories
2. **Folder Threshold**: Create a dedicated folder when a feature requires more than 5-7 files
3. **Clear Hierarchy**: Maintain a clear hierarchy with appropriate nesting
4. **Discoverability**: Use consistent naming and README files
5. **Separation of Concerns**: Keep distinct types of files in appropriate subfolders
6. **File Size Management**: Split large files into smaller, focused files
7. **Avoid Single-File Folders**: Don't create folders for single files

For detailed guidelines, see the [Developer Guide](./docs/DEVELOPER_GUIDE.md).

## Backward Compatibility

During file reorganization, we've implemented several measures to maintain backward compatibility:

1. **Forwarding Files**: Root-level forwarding files redirect to relocated components
2. **Working Directory Management**: Scripts use `pushd`/`popd` (batch) or `SCRIPT_DIR` (shell) to maintain proper directory context
3. **Relative Path Correction**: Careful management of relative paths ensures scripts work from any location

These measures allow existing scripts, tests, and commands to continue working even after file relocation. This approach is documented in detail in [Backward Compatibility Notes](./docs/BACKWARD_COMPATIBILITY.md).

## Contributing

1. Review the [Developer Guide](./docs/DEVELOPER_GUIDE.md) for project standards
2. Create a branch for your feature or fix
3. Implement your changes following the file organization principles
4. Include appropriate tests for your changes
5. Submit a pull request with a clear description of your changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.