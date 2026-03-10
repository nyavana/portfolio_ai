import { apiUpload } from './client';
import type { UploadResponse } from '../types/api';

export const uploadFiling = (file: File) =>
  apiUpload<UploadResponse>('/upload/filing', file);

export const uploadNews = (file: File) =>
  apiUpload<UploadResponse>('/upload/news', file);
