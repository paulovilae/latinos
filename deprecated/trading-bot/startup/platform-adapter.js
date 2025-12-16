/**
 * Platform Adapter
 * Provides platform-specific functionality to ensure cross-platform compatibility
 */

const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

class PlatformAdapter {
  constructor() {
    this.platform = process.platform;
    this.isWindows = this.platform === 'win32';
    this.isMac = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    
    console.log(`Platform detected: ${this.getPlatformName()}`);
  }

  /**
   * Get a human-readable platform name
   * @returns {string} Platform name
   */
  getPlatformName() {
    if (this.isWindows) return 'Windows';
    if (this.isMac) return 'macOS';
    if (this.isLinux) return 'Linux';
    return 'Unknown';
  }

  /**
   * Normalize path for current platform
   * @param {string} inputPath The path to normalize
   * @returns {string} Normalized path
   */
  normalizePath(inputPath) {
    return path.normalize(inputPath);
  }

  /**
   * Spawn a process with platform-specific handling
   * @param {string} command The command to execute
   * @param {Object} options Spawn options
   * @returns {ChildProcess} The spawned process
   */
  spawnProcess(command, options = {}) {
    // Default to inherit stdio unless specified
    if (!options.stdio) {
      options.stdio = 'inherit';
    }
    
    // Ensure environment variables are set
    options.env = options.env || process.env;
    
    // Split command into executable and args
    const parts = command.split(' ');
    const executable = parts[0];
    const args = parts.slice(1);
    
    // Create and log the full command
    const fullCommand = `${executable} ${args.join(' ')}`;
    console.log(`Executing: ${fullCommand} in ${options.cwd || process.cwd()}`);
    
    // Handle platform-specific spawning
    if (this.isWindows) {
      // On Windows, always use cmd.exe to ensure PATH is properly resolved
      console.log(`Using cmd.exe to execute command on Windows`);
      return spawn('cmd.exe', ['/c', fullCommand], options);
    } else {
      // Unix platforms can spawn directly
      return spawn(executable, args, options);
    }
  }

  /**
   * Check if a port is available
   * @param {number} port The port to check
   * @returns {Promise<boolean>} True if port is available
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          tester.close();
          resolve(true);
        })
        .listen(port, '127.0.0.1');
    });
  }

  /**
   * Find an available port in a given range
   * @param {number} startPort The start of the port range
   * @param {number} endPort The end of the port range
   * @returns {Promise<number>} First available port in range
   */
  async findAvailablePort(startPort, endPort) {
    for (let port = startPort; port <= endPort; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available ports found in range ${startPort}-${endPort}`);
  }

  /**
   * Get the appropriate script extension for the platform
   * @returns {string} Script file extension
   */
  getScriptExtension() {
    return this.isWindows ? '.bat' : '.sh';
  }

  /**
   * Create a platform-specific file path
   * @param {string[]} parts Path parts to join
   * @returns {string} Joined and normalized path
   */
  createPath(...parts) {
    return this.normalizePath(path.join(...parts));
  }
}

module.exports = new PlatformAdapter();