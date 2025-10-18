export class BridgeError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
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
    constructor(message) {
        super(400, 'VALIDATION_ERROR', message);
    }
}
export class AuthenticationError extends BridgeError {
    constructor(message = 'Authentication required') {
        super(401, 'AUTH_ERROR', message);
    }
}
export class NotFoundError extends BridgeError {
    constructor(resource) {
        super(404, 'NOT_FOUND', `${resource} not found`);
    }
}
