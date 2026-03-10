/* ═══════════════════════════════════════════════
   Portfolio AI — API Client
   Thin fetch wrapper with error handling
   ═══════════════════════════════════════════════ */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function parseErrorResponse(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail ?? JSON.stringify(body);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    const detail = await parseErrorResponse(res);
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await parseErrorResponse(res);
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const detail = await parseErrorResponse(res);
    throw new ApiError(res.status, detail);
  }
  return res.json();
}
