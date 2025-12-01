/**
 * Professional Logger Service
 * Handles logging in development and production environments
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  /**
   * Log debug information (only in development)
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`🐛 [DEBUG] ${message}`, data || '');
    }
    this.addToBuffer('debug', message, data);
  }

  /**
   * Log general information
   */
  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
    this.addToBuffer('info', message, data);
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: any): void {
    console.warn(`⚠️ [WARN] ${message}`, data || '');
    this.addToBuffer('warn', message, data);
  }

  /**
   * Log errors with stack traces
   */
  error(message: string, error?: Error | any): void {
    console.error(`❌ [ERROR] ${message}`, error || '');

    const logEntry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      data: error?.message || error,
      stack: error?.stack
    };

    this.logBuffer.push(logEntry);
    this.trimBuffer();

    // In production, you might want to send errors to a service
    if (!this.isDevelopment && error) {
      this.reportErrorToService(logEntry);
    }
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(level: LogLevel, message: string, data?: any): void {
    this.logBuffer.push({
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    });
    this.trimBuffer();
  }

  /**
   * Keep buffer size under control
   */
  private trimBuffer(): void {
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Report errors to external service (Sentry, LogRocket, etc.)
   */
  private reportErrorToService(entry: LogEntry): void {
    // TODO: Integrate with error reporting service
    // Example: Sentry.captureException(entry);

    // For now, store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(entry);
      // Keep only last 10 errors in localStorage
      if (errors.length > 10) {
        errors.shift();
      }
      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      // Fail silently
    }
  }

  /**
   * Get all logged entries
   */
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance
export default logger;

// Export convenience methods
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);