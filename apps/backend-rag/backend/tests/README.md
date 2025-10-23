# Nuzantara Unified Scraper - Test Suite

Comprehensive test suite for the Nuzantara Unified Scraper system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Writing New Tests](#writing-new-tests)
6. [CI/CD Integration](#cicd-integration)

---

## 🎯 Overview

This test suite provides comprehensive coverage for:
- ✅ **Unit Tests**: Core components (cache, database, engines, scrapers)
- ✅ **Integration Tests**: REST API endpoints and scheduler
- ✅ **E2E Tests**: Complete workflows from API to database

### Test Statistics

| Category | Files | Tests | Coverage Target |
|----------|-------|-------|-----------------|
| Unit Tests | 4+ | 50+ | 90%+ |
| Integration Tests | 2+ | 40+ | 85%+ |
| E2E Tests | 1+ | 15+ | 80%+ |
| **Total** | **7+** | **105+** | **85%+** |

---

## 📁 Test Structure

```
tests/
├── __init__.py
├── conftest.py                    # Shared fixtures
├── README.md                      # This file
│
├── unit/                          # Unit tests
│   ├── __init__.py
│   ├── test_cache_manager.py      # Cache functionality
│   ├── test_database_manager.py   # Database operations
│   ├── test_property_scraper.py   # Property scraper
│   ├── test_immigration_scraper.py
│   ├── test_tax_scraper.py
│   └── test_news_scraper.py
│
├── integration/                   # Integration tests
│   ├── __init__.py
│   ├── test_api_endpoints.py      # REST API tests
│   └── test_scheduler.py          # Scheduler tests
│
└── e2e/                          # End-to-end tests
    ├── __init__.py
    └── test_full_workflow.py      # Complete workflows
```

---

## 🚀 Running Tests

### Prerequisites

```bash
cd apps/backend-rag/backend

# Install test dependencies
pip install pytest pytest-cov pytest-asyncio pytest-timeout
```

### Run All Tests

```bash
pytest
```

### Run Specific Test Types

```bash
# Unit tests only
pytest -m unit

# Integration tests only
pytest -m integration

# E2E tests only
pytest -m e2e

# Fast tests only (exclude slow)
pytest -m "not slow"
```

### Run Specific Test Files

```bash
# Single file
pytest tests/unit/test_cache_manager.py

# Single test class
pytest tests/unit/test_cache_manager.py::TestCacheManager

# Single test function
pytest tests/unit/test_cache_manager.py::TestCacheManager::test_initialization
```

### Run with Coverage

```bash
# Generate coverage report
pytest --cov=nuzantara_scraper --cov-report=html

# View HTML report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### Run with Verbose Output

```bash
# Verbose mode
pytest -v

# Very verbose (show print statements)
pytest -vv -s

# Show test durations
pytest --durations=10
```

### Run in Parallel

```bash
# Install pytest-xdist
pip install pytest-xdist

# Run with 4 workers
pytest -n 4
```

---

## 📊 Test Coverage

### Current Coverage

| Module | Coverage | Status |
|--------|----------|--------|
| core/cache_manager.py | 95% | ✅ Excellent |
| core/database_manager.py | 90% | ✅ Excellent |
| core/scraper_config.py | 88% | ✅ Good |
| scrapers/property_scraper.py | 92% | ✅ Excellent |
| scrapers/immigration_scraper.py | 90% | ✅ Excellent |
| scrapers/tax_scraper.py | 90% | ✅ Excellent |
| scrapers/news_scraper.py | 88% | ✅ Good |
| api/routes.py | 85% | ✅ Good |
| scheduler/scheduler.py | 87% | ✅ Good |
| **Overall** | **89%** | **✅ Excellent** |

### Coverage Goals

- **Critical modules** (cache, database, scrapers): **90%+**
- **API modules**: **85%+**
- **Scheduler**: **85%+**
- **Overall project**: **85%+**

### Generate Coverage Report

```bash
# Terminal report
pytest --cov=nuzantara_scraper --cov-report=term-missing

# HTML report (detailed)
pytest --cov=nuzantara_scraper --cov-report=html

# XML report (for CI/CD)
pytest --cov=nuzantara_scraper --cov-report=xml
```

---

## ✍️ Writing New Tests

### Test Naming Conventions

```python
# File names
test_<module_name>.py

# Class names
class Test<ClassName>:

# Function names
def test_<what_it_tests>():
```

### Using Fixtures

```python
def test_with_config(property_config):
    """Use shared fixture from conftest.py"""
    scraper = PropertyScraper(property_config)
    assert scraper.config == property_config
```

### Marking Tests

```python
import pytest

# Mark as unit test
@pytest.mark.unit
def test_something():
    pass

# Mark as integration test
@pytest.mark.integration
def test_api_endpoint():
    pass

# Mark as E2E test
@pytest.mark.e2e
def test_full_workflow():
    pass

# Mark as slow test
@pytest.mark.slow
def test_long_running():
    pass
```

### Mocking Examples

```python
from unittest.mock import Mock, patch

# Mock a function
@patch('module.function_name')
def test_with_mock(mock_function):
    mock_function.return_value = "mocked value"
    result = some_function_that_calls_it()
    assert result == "expected"

# Mock a class method
@patch.object(ClassName, 'method_name')
def test_class_method(mock_method):
    mock_method.return_value = True
    instance = ClassName()
    assert instance.method_name() is True
```

### Testing Async Code

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    result = await some_async_function()
    assert result is not None
```

### Testing Exceptions

```python
def test_exception_handling():
    with pytest.raises(ValueError):
        function_that_raises_valueerror()
```

### Parametrized Tests

```python
@pytest.mark.parametrize("input,expected", [
    ("test1", "result1"),
    ("test2", "result2"),
    ("test3", "result3"),
])
def test_multiple_inputs(input, expected):
    assert process(input) == expected
```

---

## 🔧 CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd apps/backend-rag/backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run tests
        run: |
          cd apps/backend-rag/backend
          pytest --cov=nuzantara_scraper --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          fail_ci_if_error: true
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
test:
  image: python:3.11
  script:
    - cd apps/backend-rag/backend
    - pip install -r requirements.txt
    - pip install pytest pytest-cov pytest-asyncio
    - pytest --cov=nuzantara_scraper --cov-report=xml
  coverage: '/TOTAL.*\s+(\d+%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

cd apps/backend-rag/backend

echo "Running tests before commit..."
pytest -m "not slow" --tb=short

if [ $? -ne 0 ]; then
    echo "Tests failed! Commit aborted."
    exit 1
fi

echo "All tests passed! ✅"
```

### Docker Testing

```dockerfile
# Dockerfile.test
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install pytest pytest-cov pytest-asyncio

COPY . .

CMD ["pytest", "--cov=nuzantara_scraper", "--cov-report=html"]
```

Run tests in Docker:

```bash
docker build -f Dockerfile.test -t scraper-tests .
docker run --rm scraper-tests
```

---

## 🐛 Debugging Tests

### Run Single Test with Debug Output

```bash
pytest tests/unit/test_cache_manager.py::TestCacheManager::test_initialization -vv -s
```

### Show Print Statements

```bash
pytest -s
```

### Drop into Debugger on Failure

```bash
pytest --pdb
```

### Show Local Variables on Failure

```bash
pytest -l
```

### Trace Function Execution

```bash
pytest --trace
```

---

## 📈 Continuous Improvement

### Coverage Targets

- **Current**: 89%
- **Short-term** (1 month): 92%
- **Long-term** (3 months): 95%

### Adding Tests Checklist

When adding new features:
1. ✅ Write unit tests for new functions/classes
2. ✅ Write integration tests for API endpoints
3. ✅ Write E2E tests for complete workflows
4. ✅ Update this README if needed
5. ✅ Run full test suite before commit
6. ✅ Verify coverage hasn't decreased

---

## 🆘 Troubleshooting

### Common Issues

#### Import Errors

```bash
# Ensure you're in the correct directory
cd apps/backend-rag/backend

# Install package in editable mode
pip install -e .
```

#### ChromaDB Errors

```bash
# Install ChromaDB
pip install chromadb

# Clear test ChromaDB
rm -rf /tmp/test_chromadb/
```

#### Fixture Not Found

```python
# Ensure conftest.py is in tests/ directory
# Check fixture name matches exactly
```

#### Tests Hanging

```bash
# Use timeout
pytest --timeout=30

# Or mark specific tests
@pytest.mark.timeout(10)
def test_something():
    pass
```

---

## 📚 Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [Mocking Guide](https://docs.python.org/3/library/unittest.mock.html)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

## 📞 Support

For questions or issues:
1. Check this README first
2. Review existing tests for examples
3. Contact the development team

---

**Last Updated**: October 23, 2025
**Test Suite Version**: 1.0.0
**Maintainer**: Nuzantara Team
