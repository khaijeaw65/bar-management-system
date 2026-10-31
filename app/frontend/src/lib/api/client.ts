import { ErrorCodeSchema } from "@bar/contracts";
import axios, { isAxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { z } from "zod";
import { ApiError, type AuthPhase } from "./errors";

declare module "axios" {
  interface AxiosRequestConfig {
    schema?: z.ZodType;
    skipRefresh?: boolean;
    retried?: boolean;
  }
}

const baseURL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3011/api").replace(/\/$/, "");

const http = axios.create({
  baseURL,
  withCredentials: true,
});

const errorEnvelopeSchema = z.object({
  status: z.number(),
  code: z.string(),
  message: z.union([z.string(), z.array(z.string())]),
  data: z.unknown(),
});

type SessionListener = (phase: AuthPhase) => void;

const sessionListeners = new Set<SessionListener>();
const forbiddenListeners = new Set<() => void>();
let refreshPromise: Promise<void> | null = null;
let authenticated = false;

export function onSessionExpired(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

/** Called for every 403 that names missing permissions (`data.missing`) — the person's rights changed under them. */
export function onPermissionDenied(listener: () => void): () => void {
  forbiddenListeners.add(listener);
  return () => {
    forbiddenListeners.delete(listener);
  };
}

export function markSessionCleared(): void {
  authenticated = false;
}

export function resetApiSession(): void {
  authenticated = false;
  refreshPromise = null;
  sessionListeners.clear();
  forbiddenListeners.clear();
}

export function lineLoginUrl(): string {
  return `${baseURL}/auth/line/login`;
}

function envelopeMessage(message: string | string[]): string {
  return Array.isArray(message) ? message.join(", ") : message;
}

function errorCode(raw: string): string {
  const parsed = ErrorCodeSchema.safeParse(raw);
  return parsed.success ? parsed.data : raw;
}

function requestPath(config: AxiosRequestConfig | undefined): string {
  return (config?.url ?? "").split("?")[0] ?? "";
}

// Guest routes use their own cookie (DR-028): a 401 there must never trigger the staff refresh.
function skipsRefresh(path: string): boolean {
  return path.endsWith("/auth/refresh") || path.endsWith("/auth/logout") || path.includes("/auth/line/") || path.startsWith("/customer/");
}

function isMissingPermissions(data: unknown): boolean {
  return z.object({ missing: z.array(z.string()) }).safeParse(data).success;
}

function emitSession(phase: AuthPhase): void {
  for (const listener of sessionListeners) listener(phase);
}

function phased(error: unknown, phase: AuthPhase): ApiError {
  if (error instanceof ApiError) {
    return new ApiError(error.status, error.code, error.message, error.data, phase);
  }
  return new ApiError(0, "NETWORK_ERROR", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", null, phase);
}

async function refreshSession(): Promise<void> {
  await http.post("/auth/refresh", undefined, {
    skipRefresh: true,
    schema: z.object({ ok: z.literal(true) }),
  });
}

function beginRefresh(): Promise<void> {
  const phase: AuthPhase = authenticated ? "mid-use" : "first-load";
  const promise = refreshSession().catch((error: unknown) => {
    authenticated = false;
    emitSession(phase);
    throw phased(error, phase);
  });
  void promise
    .finally(() => {
      if (refreshPromise === promise) refreshPromise = null;
    })
    .catch(() => undefined);
  return promise;
}

function unwrapSuccess(response: AxiosResponse): AxiosResponse {
  const schema = response.config.schema;
  if (!schema) return response;

  const parsed = z
    .object({
      status: z.number(),
      code: z.string(),
      message: z.string(),
      data: schema,
    })
    .safeParse(response.data);

  if (!parsed.success) {
    console.error(parsed.error);
    throw new ApiError(response.status, "INVALID_RESPONSE", "ข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง", response.data);
  }

  if (requestPath(response.config).endsWith("/auth/me")) authenticated = true;
  response.data = parsed.data.data;
  return response;
}

async function recover(error: unknown): Promise<AxiosResponse> {
  if (error instanceof ApiError) throw error;
  if (!isAxiosError(error) || !error.response) {
    throw new ApiError(0, "NETWORK_ERROR", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", null);
  }

  const { config, response } = error;
  const parsed = errorEnvelopeSchema.safeParse(response.data);
  const status = response.status;
  const code = parsed.success ? errorCode(parsed.data.code) : "UNKNOWN";
  const message = parsed.success ? envelopeMessage(parsed.data.message) : error.message;
  const data = parsed.success ? parsed.data.data : response.data;
  const path = requestPath(config);
  const canRefresh =
    status === 401 && config !== undefined && !config.skipRefresh && !config.retried && !skipsRefresh(path);

  if (status === 403 && isMissingPermissions(data)) {
    for (const listener of forbiddenListeners) listener();
  }
  if (!canRefresh) throw new ApiError(status, code, message, data);

  // One refresh for every parallel 401. A second refresh revokes the token family (BRIEF-007).
  refreshPromise ??= beginRefresh();
  await refreshPromise;
  config.retried = true;
  return http.request(config);
}

http.interceptors.response.use(unwrapSuccess, recover);

export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await http.get<T>(path, { schema });
  return response.data;
}

export async function apiPatch<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const response = await http.patch<T>(path, body, { schema });
  return response.data;
}

export async function apiPut<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const response = await http.put<T>(path, body, { schema });
  return response.data;
}

export async function apiDelete<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await http.delete<T>(path, { schema });
  return response.data;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  opts?: { idempotencyKey?: string },
): Promise<T> {
  const headers = opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined;
  const response = await http.post<T>(path, body, { schema, headers });
  return response.data;
}
