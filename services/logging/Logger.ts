export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  operation?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    userId?: string,
    operation?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId,
      operation
    };
  }

  private log(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Em produção, isso seria enviado para um serviço de logging
    const logOutput = {
      ...entry,
      context: entry.context ? JSON.stringify(entry.context) : undefined
    };
    
    console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`, 
      entry.context ? logOutput.context : '');
  }

  error(message: string, context?: Record<string, any>, userId?: string, operation?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, userId, operation);
    this.log(entry);
  }

  warn(message: string, context?: Record<string, any>, userId?: string, operation?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, userId, operation);
    this.log(entry);
  }

  info(message: string, context?: Record<string, any>, userId?: string, operation?: string): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, userId, operation);
    this.log(entry);
  }

  debug(message: string, context?: Record<string, any>, userId?: string, operation?: string): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, userId, operation);
    this.log(entry);
  }

  getLogs(level?: LogLevel, operation?: string, userId?: string): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === operation);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}
