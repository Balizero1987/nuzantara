// Production-safe logger utility
class Logger {
  constructor() {
    this.isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.search.includes('debug=true');
  }

  log(...args) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  error(...args) {
    if (this.isDevelopment) {
      console.error(...args);
    }
  }

  warn(...args) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  info(...args) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }
}

export const logger = new Logger();