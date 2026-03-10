import { apiGet } from './client';
import type { RootResponse, HealthResponse } from '../types/api';

export const getRoot = () => apiGet<RootResponse>('/');
export const getHealth = () => apiGet<HealthResponse>('/health');
