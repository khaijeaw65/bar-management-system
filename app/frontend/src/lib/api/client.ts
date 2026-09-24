import { z } from "zod";
import { ApiError } from "./errors";

const errorEnvelopeSchema = z.object({
  status: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  data: z.unknown(),
});

function envelopeMessage(body: unknown): string | undefined {
  const parsed = errorEnvelopeSchema.safeParse(body);
  if (!parsed.success) return undefined;
  const { message } = parsed.data;
  return Array.isArray(message) ? message.join(", ") : message;
}

function apiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, body, envelopeMessage(body) ?? response.statusText);
  }

  return z
    .object({
      status: z.number(),
      message: z.string(),
      data: schema,
    })
    .parse(body).data;
}
