import type { Request, Response, NextFunction } from 'express';
import { getFlags, type Flags } from '../config/flags.ts';

export function flagGate<K extends keyof Flags>(flagName: K) {
  return function gate(req: Request, res: Response, next: NextFunction) {
    const flags = getFlags();
    if (!flags[flagName]) {
      const origin = req.headers.origin as string | undefined;
      return res.status(403).json({ ok: false, code: 'feature_flag_disabled', flag: flagName, origin });
    }
    return next();
  };
}
