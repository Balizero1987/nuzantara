"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.err = err;
function ok(data) {
    return { ok: true, data: data };
}
function err(message, _status) {
    return { ok: false, error: message };
}
