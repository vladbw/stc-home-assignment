import type {
  CreatePresentationInput,
  PresentationDetail,
  PresentationListItem,
  UpdatePresentationInput,
} from '@sts/shared';
import { apiFetch } from './api-client';

export type PresentationBasic = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export const presentationService = {
  list: () => apiFetch<PresentationListItem[]>('/presentations'),

  get: (id: string) => apiFetch<PresentationDetail>(`/presentations/${id}`),

  create: (input: CreatePresentationInput) =>
    apiFetch<PresentationListItem>('/presentations', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdatePresentationInput) =>
    apiFetch<PresentationBasic>(`/presentations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/presentations/${id}`, {
      method: 'DELETE',
    }),
};
