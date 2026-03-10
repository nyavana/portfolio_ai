import { apiGet } from './client';
import type { RiskFlagsResponse } from '../types/api';

export const getRiskFlags = () =>
  apiGet<RiskFlagsResponse>('/risk_flags');
