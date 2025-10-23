# Makefile for Nuzantara Unified Scraper

.PHONY: help install test test-unit test-integration test-e2e test-coverage test-fast lint format clean run-api

# Default target
help:
	@echo "Nuzantara Unified Scraper - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install all dependencies"
	@echo "  make install-test     Install test dependencies"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all tests"
	@echo "  make test-unit        Run unit tests only"
	@echo "  make test-integration Run integration tests only"
	@echo "  make test-e2e         Run E2E tests only"
	@echo "  make test-fast        Run fast tests (exclude slow)"
	@echo "  make test-coverage    Run tests with coverage report"
	@echo "  make test-watch       Run tests in watch mode"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             Run linters (flake8, mypy)"
	@echo "  make format           Format code (black, isort)"
	@echo "  make format-check     Check code formatting"
	@echo "  make security         Run security checks"
	@echo ""
	@echo "Development:"
	@echo "  make run-api          Start the FastAPI server"
	@echo "  make clean            Clean generated files"
	@echo "  make clean-test       Clean test cache"

# Installation
install:
	pip install -r requirements.txt

install-test:
	pip install -r requirements_test.txt

install-dev: install install-test
	pip install -e .

# Testing
test:
	pytest -v

test-unit:
	pytest tests/unit -v

test-integration:
	pytest tests/integration -v

test-e2e:
	pytest tests/e2e -v

test-fast:
	pytest -m "not slow" -v

test-coverage:
	pytest --cov=nuzantara_scraper --cov-report=html --cov-report=term-missing
	@echo ""
	@echo "Coverage report generated in htmlcov/"
	@echo "Open htmlcov/index.html in your browser"

test-watch:
	pytest-watch -c -q

test-parallel:
	pytest -n auto

# Code Quality
lint:
	@echo "Running flake8..."
	flake8 nuzantara_scraper tests --max-line-length=100 --extend-ignore=E203,W503
	@echo "Running mypy..."
	mypy nuzantara_scraper --ignore-missing-imports

format:
	@echo "Formatting with black..."
	black nuzantara_scraper tests
	@echo "Sorting imports with isort..."
	isort nuzantara_scraper tests

format-check:
	@echo "Checking black formatting..."
	black --check nuzantara_scraper tests
	@echo "Checking isort..."
	isort --check-only nuzantara_scraper tests

security:
	@echo "Checking dependencies..."
	safety check
	@echo "Running bandit security scan..."
	bandit -r nuzantara_scraper -ll

# Development
run-api:
	uvicorn nuzantara_scraper.api.routes:app --reload --port 8001

run-api-prod:
	uvicorn nuzantara_scraper.api.routes:app --host 0.0.0.0 --port 8001

# Cleaning
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name ".coverage" -delete
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf dist/
	rm -rf build/

clean-test:
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -f .coverage
	rm -f coverage.xml

# Documentation
docs:
	@echo "Generating documentation..."
	@echo "Documentation is available in:"
	@echo "  - nuzantara_scraper/README.md"
	@echo "  - nuzantara_scraper/USAGE_GUIDE.md"
	@echo "  - tests/README.md"

# Docker (optional)
docker-test:
	docker build -f Dockerfile.test -t scraper-tests .
	docker run --rm scraper-tests

# CI/CD simulation
ci:
	@echo "Running CI pipeline locally..."
	make format-check
	make lint
	make test-coverage
	make security
	@echo ""
	@echo "✅ All CI checks passed!"

# Quick checks before commit
pre-commit: format lint test-fast
	@echo ""
	@echo "✅ Pre-commit checks passed! Ready to commit."
