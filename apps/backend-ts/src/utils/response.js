export function ok(data) {
    return { ok: true, data };
}
export function err(message, _status) {
    return { ok: false, error: message };
}
