import type {
  ListMediaQuery,
  MediaResponse,
  RequestUploadUrlInput,
  UploadUrlResponse,
} from '@sts/shared';
import { apiFetch } from './api-client';

export const mediaService = {
  list: (params: ListMediaQuery = {}) => {
    const search = new URLSearchParams();
    if (params.type) search.set('type', params.type);
    const qs = search.toString();
    return apiFetch<MediaResponse[]>(`/media${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => apiFetch<MediaResponse>(`/media/${id}`),

  requestUploadUrl: (input: RequestUploadUrlInput) =>
    apiFetch<UploadUrlResponse>('/media/upload-url', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  confirm: (id: string) =>
    apiFetch<MediaResponse>(`/media/${id}/confirm`, {
      method: 'POST',
    }),

  cancel: (id: string) =>
    apiFetch<MediaResponse>(`/media/${id}/cancel`, {
      method: 'POST',
    }),
};
