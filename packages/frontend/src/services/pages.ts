import type { PageResponse, UpdatePageInput } from '@sts/shared';
import { apiFetch } from './api-client';

export const pageService = {
  add: (presentationId: string) =>
    apiFetch<PageResponse>(`/presentations/${presentationId}/pages`, {
      method: 'POST',
    }),

  update: (id: string, input: UpdatePageInput) =>
    apiFetch<PageResponse>(`/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/pages/${id}`, {
      method: 'DELETE',
    }),

  reorder: (presentationId: string, pageIds: string[]) =>
    apiFetch<{ ok: true }>(`/presentations/${presentationId}/pages/reorder`, {
      method: 'POST',
      body: JSON.stringify({ pageIds }),
    }),
};
