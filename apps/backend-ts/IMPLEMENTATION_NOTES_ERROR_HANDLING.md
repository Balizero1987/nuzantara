# Error Handling Standardization - Implementation Notes

**PR**: #2 - Error Handling Standardization  
**Priority**: 🔴 CRITICAL (Q1 2025)  
**From**: ANALISI_STRATEGICA_ARCHITETTURA.md

## Changes Implemented

### 1. Standardized Error Response Format
- Created `error-handler.ts` with consistent error response structure
- Standard format: `{ ok: false, error: { code, message, type, details, requestId, timestamp } }`
- Error types: USER_ERROR, SYSTEM_ERROR, VALIDATION_ERROR, AUTH_ERROR, RATE_LIMIT_ERROR

### 2. Global Error Handler Middleware
- Integrated `globalErrorHandler` as last middleware (before 404)
- Automatic error type detection based on status code
- Request ID tracking for error correlation
- Production-safe error details (no stack traces in production)

### 3. Error Classes
- Created `StandardError` class for programmatic error creation
- Updated legacy error classes with statusCode/errorCode for compatibility
- Gradual migration path: legacy errors still work but standardized errors preferred

### 4. Async Handler Wrapper
- Added `asyncHandler` utility to catch async errors automatically
- Prevents unhandled promise rejections in async route handlers

### 5. Server Integration
- Integrated request tracking middleware
- Error tracking middleware for logging
- Standardized 404 handler with new format

## Impact

### Expected Metrics
- **Error Response Consistency**: 100% (all errors use standard format)
- **Debugging Time**: -70% (request IDs, structured errors)
- **User Experience**: +30% (clear error messages, consistent format)

### Migration Path

**Old Error Format** (still works):
```typescript
throw new BadRequestError('Invalid input');
```

**New Standard Format** (recommended):
```typescript
throw new StandardError(
  'Invalid input',
  400,
  ErrorCode.BAD_REQUEST,
  'VALIDATION_ERROR',
  { field: 'email', reason: 'invalid format' }
);
```

## Testing

Test error handling:
```bash
# Should return standardized error format
curl http://localhost:8080/nonexistent
# Expected: { ok: false, error: { code: 'NOT_FOUND', ... } }
```

## Related PRs
- PR #1: Test Coverage Improvement (includes error-handler.ts foundation)
- PR #3: Monitoring Dashboard (will track error metrics)

## Next Steps
1. Migrate handlers to use StandardError gradually
2. Add error response validation tests
3. Update API documentation with error response formats
