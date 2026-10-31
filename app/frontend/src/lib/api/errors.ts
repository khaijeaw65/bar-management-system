export type AuthPhase = "first-load" | "mid-use";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly data: unknown;
  readonly authPhase?: AuthPhase;

  constructor(
    status: number,
    code: string,
    message: string,
    data: unknown,
    authPhase?: AuthPhase,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
    this.authPhase = authPhase;
  }
}

/** A 403 that names the permissions the person lacks; the app already toasts it, so callers skip their own error toast. */
export function isPermissionDenied(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 403) return false;
  const data = error.data;
  return typeof data === "object" && data !== null && Array.isArray((data as { missing?: unknown }).missing);
}
