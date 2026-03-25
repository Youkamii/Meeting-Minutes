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
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.message || body.error || `Request failed with status ${res.status}`,
      body.error,
    );
  }
  return res.json();
}
