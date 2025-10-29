/**
 * Legacy Error Classes - Deprecated
 * @deprecated Use StandardError from './error-handler.js' instead
 * These are maintained for backward compatibility but will be migrated
 */
export class ForbiddenError extends Error {
  statusCode = 403;
  errorCode = 'FORBIDDEN';
}
export class BadRequestError extends Error {
  statusCode = 400;
  errorCode = 'BAD_REQUEST';
}
export class UnauthorizedError extends Error {
  statusCode = 401;
  errorCode = 'UNAUTHORIZED';
}
export class InternalServerError extends Error {
  statusCode = 500;
  errorCode = 'INTERNAL_SERVER_ERROR';
}
export class BridgeError extends Error {
  statusCode = 502;
  errorCode = 'EXTERNAL_API_ERROR';
}
