export class BridgeError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'BridgeError';
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode
    };
  }
}

export class ValidationError extends BridgeError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class AuthenticationError extends BridgeError {
  constructor(message: string = 'Authentication required') {
    super(401, 'AUTH_ERROR', message);
  }
}

export class NotFoundError extends BridgeError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}