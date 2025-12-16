/**
 * Dependency Checker
 * Verifies that all required dependencies are installed before starting services
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

class DependencyChecker {
  /**
   * Check all required dependencies
   * @returns {Promise<Object>} Dependency check results
   */
  async checkAllDependencies() {
    const results = {
      success: true,
      checks: {},
      missingDependencies: []
    };
    
    // Check Node.js dependencies
    const nodeResult = await this.checkNodeDependencies();
    results.checks.node = nodeResult;
    if (!nodeResult.success) {
      results.success = false;
      results.missingDependencies.push(...nodeResult.missing);
    }
    
    // Check Python dependencies
    const pythonResult = await this.checkPythonDependencies();
    results.checks.python = pythonResult;
    if (!pythonResult.success) {
      results.success = false;
      results.missingDependencies.push(...pythonResult.missing);
    }
    
    return results;
  }
  
  /**
   * Check Node.js dependencies
   * @returns {Promise<Object>} Node.js dependency check results
   */
  async checkNodeDependencies() {
    console.log('Checking Node.js dependencies...');
    
    const result = {
      success: true,
      version: null,
      npmVersion: null,
      missing: []
    };
    
    try {
      // Check Node.js version
      const { stdout: nodeStdout } = await execPromise('node --version');
      result.version = nodeStdout.trim();
      console.log(`Node.js version: ${result.version}`);
      
      // Check npm version
      const { stdout: npmStdout } = await execPromise('npm --version');
      result.npmVersion = npmStdout.trim();
      console.log(`npm version: ${result.npmVersion}`);
      
      return result;
    } catch (error) {
      console.error('Error checking Node.js dependencies:', error.message);
      
      if (error.message.includes('node: command not found') || 
          error.message.includes('node\' is not recognized')) {
        result.success = false;
        result.missing.push('node');
      }
      
      if (error.message.includes('npm: command not found') || 
          error.message.includes('npm\' is not recognized')) {
        result.success = false;
        result.missing.push('npm');
      }
      
      return result;
    }
  }
  
  /**
   * Check Python dependencies
   * @returns {Promise<Object>} Python dependency check results
   */
  async checkPythonDependencies() {
    console.log('Checking Python dependencies...');
    
    const result = {
      success: true,
      version: null,
      packages: [],
      missing: []
    };
    
    const requiredPackages = [
      'alpaca_trade_api',
      'fastapi',
      'uvicorn',
      'pandas',
      'numpy'
    ];
    
    try {
      // Check Python version
      const { stdout: pythonStdout } = await execPromise('python --version');
      result.version = pythonStdout.trim();
      console.log(`Python version: ${result.version}`);
      
      // Try more robust ways to check for installed packages
      for (const pkg of requiredPackages) {
        try {
          // Use python -m pip to ensure we're using the same Python installation
          // and use pip show which gives more reliable output for a specific package
          const { stdout: pipShowOutput } = await execPromise(`python -m pip show ${pkg}`);
          
          // If we get here, the package exists
          const versionMatch = pipShowOutput.match(/Version:\s*([^\s]+)/);
          const version = versionMatch ? versionMatch[1] : 'unknown';
          result.packages.push({ name: pkg, version });
          console.log(`Found ${pkg} version ${version}`);
        } catch (error) {
          // Check with pip list as a fallback, using a more flexible regex
          try {
            const { stdout: pipListOutput } = await execPromise(`python -m pip list`);
            // Use a more flexible regex that accounts for formatting variations
            const pkgVariations = [
              pkg,                       // exact match
              pkg.replace(/_/g, '-'),    // underscores to hyphens
              pkg.replace(/-/g, '_')     // hyphens to underscores
            ];
            
            let found = false;
            for (const variation of pkgVariations) {
              const pattern = new RegExp(`\\b${variation}\\b`, 'i'); // word boundary, case insensitive
              if (pattern.test(pipListOutput)) {
                found = true;
                const versionMatch = pipListOutput.match(new RegExp(`\\b${variation}\\s+([\\d\\.]+)`, 'i'));
                const version = versionMatch ? versionMatch[1] : 'unknown';
                result.packages.push({ name: pkg, version });
                console.log(`Found ${pkg} version ${version}`);
                break;
              }
            }
            
            if (!found) {
              console.log(`Missing Python package: ${pkg}`);
              result.missing.push(pkg);
              result.success = false;
            }
          } catch (listError) {
            console.log(`Missing Python package: ${pkg}`);
            result.missing.push(pkg);
            result.success = false;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error checking Python dependencies:', error.message);
      
      if (error.message.includes('python: command not found') || 
          error.message.includes('python\' is not recognized')) {
        result.success = false;
        result.missing.push('python');
      }
      
      if (error.message.includes('pip: command not found') || 
          error.message.includes('pip\' is not recognized')) {
        result.success = false;
        result.missing.push('pip');
      }
      
      return result;
    }
  }
  
  /**
   * Generate installation instructions for missing dependencies
   * @param {Object} checkResults Results from checkAllDependencies
   * @returns {string} Installation instructions
   */
  generateInstallationInstructions(checkResults) {
    const { missingDependencies } = checkResults;
    
    if (missingDependencies.length === 0) {
      return 'All dependencies are installed correctly.';
    }
    
    let instructions = '\n\x1b[33m=== Missing Dependencies Installation Instructions ===\x1b[0m\n\n';
    
    // Node.js and npm
    if (missingDependencies.includes('node') || missingDependencies.includes('npm')) {
      instructions += '\x1b[36m1. Install Node.js and npm:\x1b[0m\n';
      instructions += '   - Download from: https://nodejs.org/\n';
      instructions += '   - Or use a package manager for your platform\n\n';
    }
    
    // Python
    if (missingDependencies.includes('python')) {
      instructions += '\x1b[36m2. Install Python:\x1b[0m\n';
      instructions += '   - Download from: https://www.python.org/downloads/\n';
      instructions += '   - Or use a package manager for your platform\n';
      instructions += '   - Ensure Python 3.9+ is installed\n\n';
    }
    
    // Python packages
    const pythonPackages = missingDependencies.filter(dep => 
      !['node', 'npm', 'python', 'pip'].includes(dep));
    
    if (pythonPackages.length > 0) {
      instructions += '\x1b[36m3. Install Python packages:\x1b[0m\n';
      instructions += `   pip install ${pythonPackages.join(' ')}\n\n`;
    }
    
    instructions += '\x1b[33mAfter installing the missing dependencies, try running the platform again.\x1b[0m\n';
    
    return instructions;
  }
}

module.exports = new DependencyChecker();