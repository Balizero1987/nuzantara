export type ApiSuccess<T = any> = { ok: true; data: T };
export type ApiError = { ok: false; error: string };

export function ok<T = any>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function err(message: string, status?: number): ApiError {
  return { ok: false, error: message };
}