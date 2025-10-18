import { getFlags } from '../config/flags.js';
export function flagGate(flagName) {
    return function gate(req, res, next) {
        const flags = getFlags();
        if (!flags[flagName]) {
            const origin = req.headers.origin;
            return res.status(403).json({ ok: false, code: 'feature_flag_disabled', flag: flagName, origin });
        }
        return next();
    };
}
