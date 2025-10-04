/**
 * Simple Console Logger for Production
 * Bypasses potential PM2 logging issues
 */

class SimpleLogger {
  static log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    
    // Create a simple string message without JSON formatting
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${String(message)}`;
    
    // Add meta data as simple key=value pairs
    if (meta && typeof meta === 'object') {
      const metaEntries = Object.entries(meta)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(' ');
      if (metaEntries) {
        logMessage += ` | ${metaEntries}`;
      }
    }
    
    // Use console methods directly instead of JSON.stringify
    console.log(logMessage);
  }

  static info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  static error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  static debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }
}

module.exports = SimpleLogger;