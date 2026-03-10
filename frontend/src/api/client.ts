/* ═══════════════════════════════════════════════
   Portfolio AI — API Client
   Thin fetch wrapper with error handling
   ═══════════════════════════════════════════════ */

import { getStoredLlmConfig } from './llmSession';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

function getLlmHeaders(): Record<string, string> {
  const cfg = getStoredLlmConfig();
  if (!cfg) return {};
  const h: Record<string, string> = {};
  if (cfg.api_key)  h['X-Api-Key']      = cfg.api_key;
  if (cfg.base_url) h['X-Api-Base-Url'] = cfg.base_url;
  if (cfg.model)    h['X-Api-Model']    = cfg.model;
  return h;
}

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
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: getLlmHeaders() });
  if (!res.ok) {
    const detail = await parseErrorResponse(res);
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getLlmHeaders() },
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
    headers: getLlmHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const detail = await parseErrorResponse(res);
    throw new ApiError(res.status, detail);
  }
  return res.json();
}
