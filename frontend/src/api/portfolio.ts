import { apiGet } from './client';
import type { PortfolioSummaryResponse } from '../types/api';

export const getPortfolioSummary = () =>
  apiGet<PortfolioSummaryResponse>('/portfolio_summary');
