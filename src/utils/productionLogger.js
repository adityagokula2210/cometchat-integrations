/**
 * Production Logger - Raw Console Output Only
 * Completely bypasses PM2 JSON formatting issues
 */

class ProductionLogger {
  static log(level, message, meta = {}) {
    // Use process.stdout.write for direct output
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    
    // Simple format without any JSON
    let output = `[${timestamp}] ${level}: ${String(message)}`;
    
    // Add meta as simple key=value pairs
    if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
      const metaStr = Object.entries(meta)
        .filter(([k, v]) => v !== null && v !== undefined)
        .map(([k, v]) => {
          // Properly stringify objects and arrays as JSON
          if (typeof v === 'object') {
            return `${k}=${JSON.stringify(v)}`;
          }
          return `${k}=${String(v)}`;
        })
        .join(' ');
      if (metaStr) {
        output += ` | ${metaStr}`;
      }
    }
    
    // Write directly to stdout/stderr without any formatting
    if (level === 'ERROR') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
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

module.exports = ProductionLogger;