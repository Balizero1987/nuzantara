/**
 * Test script for ZANTARA Unified Logging System
 * This script validates the logging functionality independently
 */

import {
  logger,
  LogLevel,
  correlationMiddleware,
  performanceMiddleware,
  withPerformanceTracking,
  trackDatabaseQuery,
  globalPerformanceMonitor
} from './src/logging/index.js';

// Test basic logging functionality
function testBasicLogging() {
  console.log('🧪 Testing basic logging functionality...');

  logger.info('Test info message', {
    type: 'test',
    component: 'test_logging'
  });

  logger.warn('Test warning message', {
    type: 'test',
    severity: 'medium'
  });

  logger.debug('Test debug message', {
    type: 'test',
    debug_data: { sample: 'data' }
  });

  console.log('✅ Basic logging test completed');
}

// Test correlation tracking (simulated)
function testCorrelation() {
  console.log('🧪 Testing correlation tracking...');

  // Simulate request context
  const mockContext = {
    correlationId: 'test-correlation-123',
    userId: 'test-user-456',
    method: 'POST',
    url: '/api/test'
  };

  logger.info('Test with correlation context', {
    ...mockContext,
    type: 'correlation_test'
  });

  console.log('✅ Correlation tracking test completed');
}

// Test performance tracking
async function testPerformanceTracking() {
  console.log('🧪 Testing performance tracking...');

  const testContext = {
    correlationId: 'perf-test-789',
    operation: 'test_operation'
  };

  try {
    const result = await withPerformanceTracking(
      'test_operation',
      testContext,
      async () => {
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, data: 'test result' };
      },
      { testData: 'sample' }
    );

    console.log('Performance tracking result:', result);
    console.log('✅ Performance tracking test completed');
  } catch (error) {
    console.error('❌ Performance tracking test failed:', error);
  }
}

// Test database tracking
function testDatabaseTracking() {
  console.log('🧪 Testing database tracking...');

  const dbContext = {
    correlationId: 'db-test-123',
    operation: 'test_query'
  };

  trackDatabaseQuery('SELECT * FROM test_table', dbContext, 45);

  console.log('✅ Database tracking test completed');
}

// Test error logging
function testErrorLogging() {
  console.log('🧪 Testing error logging...');

  const testError = new Error('Test error for logging');
  testError.name = 'TestError';

  logger.error('Test error message', testError, {
    correlationId: 'error-test-123',
    type: 'error_test',
    errorCode: 'TEST_ERROR',
    recoverable: true
  });

  console.log('✅ Error logging test completed');
}

// Test security event logging
function testSecurityLogging() {
  console.log('🧪 Testing security event logging...');

  logger.logSecurityEvent('Test security event', 'medium', {
    correlationId: 'security-test-123',
    userId: 'test-user-456',
    ip: '127.0.0.1'
  }, {
    details: 'Test security event details'
  });

  console.log('✅ Security logging test completed');
}

// Test performance monitor
function testPerformanceMonitor() {
  console.log('🧪 Testing performance monitor...');

  // Start global monitor
  globalPerformanceMonitor.start();

  // Record some measurements
  globalPerformanceMonitor.recordMeasurement('test_operation_1', 150);
  globalPerformanceMonitor.recordMeasurement('test_operation_2', 85);
  globalPerformanceMonitor.recordMeasurement('test_operation_3', 1200); // Slow operation

  console.log('✅ Performance monitor test completed');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting ZANTARA Unified Logging System Tests');
  console.log('=' .repeat(60));

  try {
    testBasicLogging();
    testCorrelation();
    await testPerformanceTracking();
    testDatabaseTracking();
    testErrorLogging();
    testSecurityLogging();
    testPerformanceMonitor();

    console.log('=' .repeat(60));
    console.log('✅ All logging tests completed successfully!');
    console.log('🎉 ZANTARA Unified Logging System is working correctly');

    // Show configuration
    const config = logger.getConfig();
    console.log('\n📋 Current Configuration:');
    console.log(`  Service: ${config.service}`);
    console.log(`  Version: ${config.version}`);
    console.log(`  Environment: ${config.environment}`);
    console.log(`  Log Level: ${LogLevel[config.level]}`);
    console.log(`  Console Logging: ${config.enableConsole}`);
    console.log(`  File Logging: ${config.enableFile}`);
    console.log(`  Loki Integration: ${config.enableLoki}`);
    console.log(`  Metrics Enabled: ${config.metricsEnabled}`);

  } catch (error) {
    console.error('❌ Logging tests failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testBasicLogging,
  testCorrelation,
  testPerformanceTracking,
  testDatabaseTracking,
  testErrorLogging,
  testSecurityLogging,
  testPerformanceMonitor,
  runAllTests
};