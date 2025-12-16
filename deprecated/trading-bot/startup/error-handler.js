/**
 * Error Handler
 * Central error handling and reporting for the startup process
 */

class ErrorHandler {
  constructor() {
    this.knownErrors = [
      {
        pattern: /EADDRINUSE/,
        message: "Port is already in use",
        solution: "Another application is using the required port. Try stopping other applications or changing the port in the configuration."
      },
      {
        pattern: /command not found|'.*' is not recognized/,
        message: "Required command is missing",
        solution: "Make sure all dependencies are installed. Try running 'npm install' in the root and backend directories, and installing Python requirements with 'pip install -r bot_microservice/requirements.txt'."
      },
      {
        pattern: /ENOENT|no such file or directory/i,
        message: "File or directory not found",
        solution: "Check that all required files and directories exist and have correct paths."
      },
      {
        pattern: /Connection refused|ECONNREFUSED/,
        message: "Connection refused",
        solution: "The service is not running or not accepting connections. Check service logs for errors."
      },
      {
        pattern: /timeout|timed out/i,
        message: "Request timed out",
        solution: "Service is taking too long to respond. Check service logs for performance issues or errors."
      },
      {
        pattern: /python.*not found|python.*is not recognized/i,
        message: "Python is not installed or not in PATH",
        solution: "Install Python 3.9+ and make sure it's in your system PATH."
      },
      {
        pattern: /npm.*not found|npm.*is not recognized/i,
        message: "npm is not installed or not in PATH",
        solution: "Install Node.js and npm, and make sure they're in your system PATH."
      },
      {
        pattern: /requirements\.txt/i,
        message: "Error with Python requirements",
        solution: "Run 'pip install -r bot_microservice/requirements.txt' to install Python dependencies."
      },
      {
        pattern: /package\.json|node_modules/i,
        message: "Error with npm dependencies",
        solution: "Run 'npm install' in the root directory and 'npm install' in the backend directory."
      },
      {
        pattern: /permission denied|EACCES/i,
        message: "Permission denied",
        solution: "Check file permissions or try running the command with administrator/sudo privileges."
      }
    ];
  }

  /**
   * Handle an error by logging and providing helpful information
   * @param {Error} error The error object
   * @param {string} context Context where the error occurred
   * @returns {Object} Structured error information
   */
  handleError(error, context) {
    const errorMessage = error.message || error.toString();
    console.error(`\x1b[31mERROR in ${context}:\x1b[0m ${errorMessage}`);
    
    // Check for known errors
    const knownError = this.findKnownError(error);
    if (knownError) {
      console.error(`\x1b[33mThis is a known issue:\x1b[0m ${knownError.message}`);
      console.error(`\x1b[32mSolution:\x1b[0m ${knownError.solution}`);
    }
    
    // Log detailed error for debugging if in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.error("Details:", error);
    }
    
    // Return structured error info
    return {
      context,
      message: errorMessage,
      known: knownError ? true : false,
      solution: knownError ? knownError.solution : null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Find a matching known error pattern
   * @param {Error|string} error The error to check
   * @returns {Object|null} Matching known error or null
   */
  findKnownError(error) {
    const errorString = error instanceof Error ? error.message : String(error);
    return this.knownErrors.find(known => known.pattern.test(errorString));
  }

  /**
   * Log error details to file
   * @param {Object} errorInfo Structured error information
   */
  logErrorToFile(errorInfo) {
    // Implementation of error logging to file could be added here
    // For now, we'll just rely on console output
  }

  /**
   * Wrap a function with error handling
   * @param {Function} fn The function to wrap
   * @param {string} context Context for error reporting
   * @returns {Function} Wrapped function with error handling
   */
  wrapWithErrorHandling(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, context);
        throw error; // Re-throw after handling
      }
    };
  }
}

module.exports = new ErrorHandler();