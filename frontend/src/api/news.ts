import { apiGet } from './client';
import type { NewsImpactResponse } from '../types/api';

export const getNewsImpact = () =>
  apiGet<NewsImpactResponse>('/news_impact');
