# ZANTARA ChromaDB Migration Test Suite

Comprehensive testing suite for validating ChromaDB migration processes, ensuring data integrity, performance benchmarks, and error recovery capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Performance Benchmarks](#performance-benchmarks)
- [Configuration](#configuration)
- [Sample Data](#sample-data)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This test suite provides comprehensive validation for ZANTARA ChromaDB migration with:

- **Unit Tests**: Mock ChromaDB, test individual functions
- **Integration Tests**: Real ChromaDB, small sample data
- **Performance Tests**: Upload speed, query response time benchmarks
- **Data Integrity Tests**: Hash verification, content accuracy validation
- **Error Recovery Tests**: Network issues, invalid data handling
- **Migration Workflow Tests**: Complete migration process validation

**Target Code Coverage**: >90%

## ✅ Prerequisites

### Required Software
- Node.js 18+
- npm or yarn
- TypeScript 5.0+
- ChromaDB server (for integration tests)
- Git

### Environment Setup
```bash
# Verify Node.js version
node --version  # Should be 18+

# Verify ChromaDB is running (optional for unit tests)
curl http://localhost:8000/api/v1/heartbeat
```

### Environment Variables
```bash
# Required for integration tests
export OPENAI_API_KEY="your-openai-api-key"
export TEST_CHROMA_URL="http://localhost:8000"  # Optional, defaults to localhost:8000

# Optional performance tuning
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/scripts

# Install test dependencies
npm install --save-dev jest @types/jest ts-jest ts-node typescript
npm install chromadb

# Or using yarn
yarn add --dev jest @types/jest ts-jest ts-node typescript
yarn add chromadb
```

### 2. Configure TypeScript
```bash
# Create tsconfig.json for tests
npx tsc --init --module commonjs --target es2020 --esModuleInterop true --allowSyntheticDefaultImports true
```

### 3. Setup Jest Configuration
```bash
# Initialize Jest
npx jest --init

# Configure for TypeScript tests
# Answer: Yes to TypeScript, No to JS DOM, Node environment
```

### 4. Verify Setup
```bash
# Run a quick test to verify everything is working
npx jest test-migration.ts --testNamePattern="Unit Tests" --verbose
```

### 5. Optional: Start ChromaDB for Integration Tests
```bash
# Using Docker
docker run -d --name chromadb -p 8000:8000 chromadb/chroma:latest

# Or using Python
pip install chromadb
chromadb run --host 0.0.0.0 --port 8000
```

## 🧪 Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Or using the test script directly
npx jest test-migration.ts
```

### Test Categories

#### Unit Tests (Fast, Mocked)
```bash
npm run test:unit
# Or
npx jest test-migration.ts --testNamePattern="Unit Tests"
```

#### Integration Tests (Real ChromaDB)
```bash
npm run test:integration
# Or
npx jest test-migration.ts --testNamePattern="Integration Tests"
```

#### Performance Tests
```bash
npm run test:performance
# Or
npx jest test-migration.ts --testNamePattern="Performance Tests"
```

#### Data Integrity Tests
```bash
npm run test:integrity
# Or
npx jest test-migration.ts --testNamePattern="Data Integrity Tests"
```

#### Error Recovery Tests
```bash
npm run test:errors
# Or
npx jest test-migration.ts --testNamePattern="Error Recovery Tests"
```

#### Migration Workflow Tests
```bash
npm run test:migration
# Or
npx jest test-migration.ts --testNamePattern="Migration Workflow Tests"
```

### Advanced Test Options

#### Watch Mode
```bash
npm run test:watch
```

#### Coverage Report
```bash
npm run test:coverage
```

#### Detailed Output
```bash
npx jest test-migration.ts --verbose
```

#### Run Specific Test
```bash
npx jest test-migration.ts --testNamePattern="should handle large document batches"
```

## 📊 Test Categories

### 1. Unit Tests
**Purpose**: Test individual functions in isolation with mocked dependencies.

**Coverage**:
- Collection management (create, delete, duplicate handling)
- Document operations (add, query, empty batches)
- Embedding generation (consistency, batch processing)
- Data validation (structure, invalid documents)

**Features**:
- ✅ Fast execution (< 1 second)
- ✅ No external dependencies
- ✅ Deterministic results
- ✅ 100% function coverage

### 2. Integration Tests
**Purpose**: Test real ChromaDB integration with live data.

**Coverage**:
- Real ChromaDB connection
- Collection creation and deletion
- Document insertion and querying
- Production-like scenarios

**Features**:
- ✅ Real database validation
- ✅ Network communication testing
- ✅ Production environment simulation
- ⚠️ Requires ChromaDB server

### 3. Performance Tests
**Purpose**: Benchmark system performance under various loads.

**Metrics**:
- Upload speed (documents/second)
- Query latency (milliseconds)
- Memory usage (MB)
- Concurrent operation throughput

**Test Scenarios**:
- Large document batches (1000+ documents)
- Scaling query performance (100 → 1000 → 5000 docs)
- Concurrent operations (10 parallel migrations)
- Memory pressure handling (5000+ documents)

**Benchmarks**:
- Upload speed: >50 docs/sec for large batches
- Query latency: <100ms average
- Memory efficiency: <500MB for 5000 docs
- Concurrent throughput: >1 ops/sec

### 4. Data Integrity Tests
**Purpose**: Verify data accuracy and consistency throughout migration.

**Validations**:
- Content preservation (exact text matching)
- Metadata integrity (complex objects, special characters)
- Batch operation consistency
- Checksum verification (SHA-256)

**Test Scenarios**:
- Document content preservation
- Complex metadata handling
- Batch size variations
- Data checksum verification

### 5. Error Recovery Tests
**Purpose**: Test system resilience under failure conditions.

**Error Scenarios**:
- Network timeouts and connection failures
- Invalid document handling
- Memory pressure scenarios
- Corrupted data processing
- Operation retry logic

**Recovery Features**:
- ✅ Graceful error handling
- ✅ Retry mechanisms (3 attempts)
- ✅ Partial failure recovery
- ✅ Invalid data skipping

### 6. Migration Workflow Tests
**Purpose**: Validate complete end-to-end migration processes.

**Workflows**:
- Complete migration (source → target)
- Incremental migrations
- Migration validation and completeness
- Rollback scenarios

## 📈 Performance Benchmarks

### Benchmark Results (Sample)
```
=== ZANTARA ChromaDB Migration Performance Benchmark ===

Testing with 100 documents:
  Upload: 245.12 docs/sec (408ms)
  Query:  12.34ms avg latency
  Memory: 15.67MB used

Testing with 500 documents:
  Upload: 189.45 docs/sec (2640ms)
  Query:  18.76ms avg latency
  Memory: 67.23MB used

Testing with 1000 documents:
  Upload: 156.78 docs/sec (6376ms)
  Query:  24.12ms avg latency
  Memory: 124.89MB used

Testing with 5000 documents:
  Upload: 134.56 docs/sec (37167ms)
  Query:  41.23ms avg latency
  Memory: 489.12MB used

=== Benchmark Complete ===
```

### Performance Targets
- **Upload Speed**: >100 docs/sec (minimum)
- **Query Latency**: <50ms average
- **Memory Efficiency**: <500MB for 5000 documents
- **Error Recovery**: <5 second retry timeout
- **Concurrent Operations**: >1 ops/sec minimum

## ⚙️ Configuration

### Test Configuration
Edit the `TEST_CONFIG` object in `test-migration.ts`:

```typescript
const TEST_CONFIG = {
  CHROMA_URL: process.env.TEST_CHROMA_URL || 'http://localhost:8000',
  TEST_COLLECTION_PREFIX: 'test_migration_',
  SAMPLE_DATA_SIZE: 100,
  LARGE_BATCH_SIZE: 10000,
  PERFORMANCE_ITERATIONS: 10,
  TIMEOUT_MS: 30000,
  SAMPLE_TEXT_DIR: '/tmp/test_documents',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key'
};
```

### Jest Configuration
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testTimeout": 60000,
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

## 📁 Sample Data

### Document Structure
```typescript
interface TestDocument {
  id: string;                    // Unique identifier
  content: string;               // Document text content
  metadata: {                    // Structured metadata
    source: string;
    category: string;
    timestamp: string;
    size: number;
    language: string;
    version: string;
  };
}
```

### Sample Documents
```javascript
{
  id: "test_doc_0",
  content: "This is test document 0. Lorem ipsum dolor sit amet...",
  metadata: {
    source: "test_generator",
    category: "legal",
    timestamp: "2024-01-15T10:30:00.000Z",
    size: 100,
    language: "en",
    version: "1.0.0"
  }
}
```

### Data Generators
- **Small Documents**: 100-500 characters
- **Large Documents**: 10,000+ characters
- **Invalid Documents**: Missing IDs, empty content, null metadata
- **Complex Metadata**: Nested objects, special characters, arrays

## 🔧 Troubleshooting

### Common Issues

#### 1. ChromaDB Connection Failed
```bash
Error: ChromaDB not available for integration tests
```

**Solution**: Start ChromaDB server
```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma:latest
```

#### 2. Memory Exhausted
```bash
JavaScript heap out of memory
```

**Solution**: Increase Node.js memory limit
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 3. TypeScript Compilation Errors
```bash
error TS2307: Cannot find module 'chromadb'
```

**Solution**: Install missing dependencies
```bash
npm install chromadb @types/chromadb
```

#### 4. Test Timeouts
```bash
Test timeout of 30000ms exceeded
```

**Solution**: Increase timeout in Jest configuration
```json
{
  "testTimeout": 120000
}
```

#### 5. Permission Denied
```bash
Error: EACCES: permission denied
```

**Solution**: Check file permissions or run with appropriate privileges

### Debug Mode
```bash
# Run with verbose output
DEBUG=* npx jest test-migration.ts --verbose

# Run specific failing test
npx jest test-migration.ts --testNamePattern="failing_test_name" --verbose

# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/jest test-migration.ts
```

### Test Coverage Issues
```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Performance Issues
```bash
# Monitor memory usage
node --trace gc node_modules/.bin/jest test-migration.ts

# Profile performance
node --prof node_modules/.bin/jest test-migration.ts
node --prof-process isolate-*.log > performance-analysis.txt
```

## 📞 Support

For issues with the test suite:

1. **Check logs**: Run tests with `--verbose` flag
2. **Verify setup**: Ensure all prerequisites are met
3. **Update dependencies**: Run `npm update`
4. **Clear cache**: Remove `node_modules` and reinstall

## 📄 License

This test suite is part of the ZANTARA project and follows the same licensing terms.

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: ZANTARA Development Team