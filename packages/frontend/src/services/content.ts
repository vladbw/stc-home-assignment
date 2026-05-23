import type {
  ContentResponse,
  CreateContentInput,
  UpdateContentInput,
} from '@sts/shared';
import { apiFetch } from './api-client';

export const contentService = {
  create: (pageId: string, input: CreateContentInput) =>
    apiFetch<ContentResponse>(`/pages/${pageId}/content`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdateContentInput) =>
    apiFetch<ContentResponse>(`/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/content/${id}`, {
      method: 'DELETE',
    }),
};
