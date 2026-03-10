import { apiGet, apiPost } from './client';
import type { LlmConfigResponse, LlmConfigRequest } from '../types/api';

export const getLlmConfig = () => apiGet<LlmConfigResponse>('/config/llm');
export const updateLlmConfig = (body: LlmConfigRequest) =>
  apiPost<LlmConfigResponse>('/config/llm', body);
