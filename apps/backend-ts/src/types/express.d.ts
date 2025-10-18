import { Bridge } from '../bridge.js';

declare global {
  namespace Express {
    interface Request {
      bridge?: Bridge;
    }
  }
}

export {};