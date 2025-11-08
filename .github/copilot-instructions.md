# Copilot Code Review Instructions

Focus your review on:

## Security
- Check for OWASP Top 10 vulnerabilities
- SQL injection risks
- XSS vulnerabilities
- Command injection
- Insecure dependencies
- Exposed secrets or API keys
- Authentication/authorization issues
- CORS misconfigurations
- Unvalidated user input

## Performance
- N+1 query problems
- Inefficient loops
- Missing database indexes
- Memory leaks
- Blocking operations in async code
- Unoptimized API calls
- Missing pagination
- Large file uploads without streaming

## Code Quality
- TypeScript strict mode compliance
- Missing error handling
- Potential null/undefined errors
- Code duplication
- Overly complex functions (cyclomatic complexity > 10)
- Missing JSDoc for public APIs
- Inconsistent naming conventions
- Magic numbers and strings

## Testing
- Missing test coverage for new code
- Edge cases not tested
- Error paths not tested
- Missing integration tests for API endpoints
- Mock objects not properly reset

## Breaking Changes
- Backwards compatibility issues
- API contract changes
- Database schema changes without migrations
- Removed or renamed public APIs
- Changed function signatures

## Best Practices
- Follow DRY principle
- Use appropriate design patterns
- Proper separation of concerns
- Dependency injection where appropriate
- Immutability where possible

Provide specific, actionable feedback with code examples where possible.
