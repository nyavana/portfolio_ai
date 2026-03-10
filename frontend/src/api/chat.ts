import { apiPost } from './client';
import type { AskResponse } from '../types/api';

export const askQuestion = (question: string) =>
  apiPost<AskResponse>('/ask', { question });
