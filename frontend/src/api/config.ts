import { apiGet } from './client';
import { getStoredLlmConfig, setStoredLlmConfig } from './llmSession';
import type { LlmConfigResponse, LlmConfigRequest } from '../types/api';

// Still used to pre-populate form on fresh sessions (reads server env-var defaults)
export const getLlmConfig = () => apiGet<LlmConfigResponse>('/config/llm');

// Now saves to sessionStorage instead of POSTing to /config/llm
export function updateLlmConfig(body: LlmConfigRequest): void {
  const existing = getStoredLlmConfig();
  setStoredLlmConfig({
    base_url: body.base_url ?? existing?.base_url ?? '',
    model:    body.model    ?? existing?.model    ?? '',
    api_key:  body.api_key  ?? existing?.api_key  ?? '',
  });
}

export { getStoredLlmConfig };
