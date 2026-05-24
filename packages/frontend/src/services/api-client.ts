export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ErrorBody = { error?: string; code?: string; details?: unknown };

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`/api${path}`, { ...init, headers });

  if (!res.ok) {
    let body: ErrorBody | null = null;
    try {
      body = (await res.json()) as ErrorBody;
    } catch {
      // empty / non-JSON body
    }
    throw new ApiError(
      res.status,
      body?.error ?? `Request failed with status ${res.status}`,
      body?.code,
      body?.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
