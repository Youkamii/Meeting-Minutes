/**
 * Shared fetch utility for client-side API calls.
 * Consolidates the previously duplicated fetchJson across 8 files.
 */

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      body = { message: text.slice(0, 200) || `HTTP ${res.status}` };
    }
    throw new ApiError(
      res.status,
      (body.message as string) || (body.error as string) || `Request failed with status ${res.status}`,
      body.error as string | undefined,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
