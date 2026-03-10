export const SESSION_KEY = 'llm_config';

export interface StoredLlmConfig {
  base_url: string;
  model: string;
  api_key: string;
}

export function getStoredLlmConfig(): StoredLlmConfig | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredLlmConfig; } catch { return null; }
}

export function setStoredLlmConfig(config: StoredLlmConfig): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(config));
}
