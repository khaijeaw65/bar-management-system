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
