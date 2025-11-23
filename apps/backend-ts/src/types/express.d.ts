declare global {
  namespace Express {
    interface Request {
      // Legacy bridge property removed
    }
  }
}

export {};
