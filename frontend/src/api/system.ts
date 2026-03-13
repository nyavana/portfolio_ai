import { apiGet } from './client';
import type { StatusResponse, HealthResponse } from '../types/api';

export const getStatus = () => apiGet<StatusResponse>('/api/status');
export const getHealth = () => apiGet<HealthResponse>('/health');
