import { Logger, LogLevel } from '../../../services/logging/Logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.clearLogs();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      
      expect(logger1).toBe(logger2);
    });
  });

  describe('logging methods', () => {
    it('should log error messages', () => {
      const message = 'Test error message';
      const context = { error: 'test error' };
      const userId = 'user_123';
      const operation = 'test_operation';

      logger.error(message, context, userId, operation);

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe(message);
      expect(logs[0].context).toEqual(context);
      expect(logs[0].userId).toBe(userId);
      expect(logs[0].operation).toBe(operation);
      expect(logs[0].timestamp).toBeDefined();
    });

    it('should log warn messages', () => {
      const message = 'Test warning message';
      
      logger.warn(message);

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe(message);
    });

    it('should log info messages', () => {
      const message = 'Test info message';
      
      logger.info(message);

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe(message);
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      
      logger.debug(message);

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe(message);
    });
  });

  describe('log filtering', () => {
    beforeEach(() => {
      logger.error('Error message', {}, 'user_1', 'operation_1');
      logger.warn('Warning message', {}, 'user_1', 'operation_2');
      logger.info('Info message', {}, 'user_2', 'operation_1');
      logger.debug('Debug message', {}, 'user_2', 'operation_2');
    });

    it('should filter logs by level', () => {
      const errorLogs = logger.getLogs(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);

      const warnLogs = logger.getLogs(LogLevel.WARN);
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0].level).toBe(LogLevel.WARN);
    });

    it('should filter logs by operation', () => {
      const operation1Logs = logger.getLogs(undefined, 'operation_1');
      expect(operation1Logs).toHaveLength(2);
      expect(operation1Logs.every(log => log.operation === 'operation_1')).toBe(true);

      const operation2Logs = logger.getLogs(undefined, 'operation_2');
      expect(operation2Logs).toHaveLength(2);
      expect(operation2Logs.every(log => log.operation === 'operation_2')).toBe(true);
    });

    it('should filter logs by userId', () => {
      const user1Logs = logger.getLogs(undefined, undefined, 'user_1');
      expect(user1Logs).toHaveLength(2);
      expect(user1Logs.every(log => log.userId === 'user_1')).toBe(true);

      const user2Logs = logger.getLogs(undefined, undefined, 'user_2');
      expect(user2Logs).toHaveLength(2);
      expect(user2Logs.every(log => log.userId === 'user_2')).toBe(true);
    });

    it('should filter logs by multiple criteria', () => {
      const filteredLogs = logger.getLogs(LogLevel.ERROR, 'operation_1', 'user_1');
      expect(filteredLogs).toHaveLength(1);
      expect(filteredLogs[0].level).toBe(LogLevel.ERROR);
      expect(filteredLogs[0].operation).toBe('operation_1');
      expect(filteredLogs[0].userId).toBe('user_1');
    });

    it('should return empty array when no logs match filters', () => {
      const filteredLogs = logger.getLogs(LogLevel.ERROR, 'non_existing_operation');
      expect(filteredLogs).toHaveLength(0);
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      logger.info('Test message 1');
      logger.error('Test message 2');
      
      expect(logger.getLogs()).toHaveLength(2);
      
      logger.clearLogs();
      
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('log entry structure', () => {
    it('should create log entries with proper timestamp format', () => {
      logger.info('Test message');
      
      const logs = logger.getLogs();
      const timestamp = logs[0].timestamp;
      
      // Verificar se o timestamp está no formato ISO
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verificar se é uma data válida
      expect(new Date(timestamp).getTime()).not.toBeNaN();
    });

    it('should handle optional parameters correctly', () => {
      logger.info('Test message without optional params');
      
      const logs = logger.getLogs();
      expect(logs[0].context).toBeUndefined();
      expect(logs[0].userId).toBeUndefined();
      expect(logs[0].operation).toBeUndefined();
    });
  });
});
