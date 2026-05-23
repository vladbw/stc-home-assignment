import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { CreatePresentationInput } from '@sts/shared';
import { presentationService } from '../services/presentations';

export const presentationKeys = {
  all: ['presentations'] as const,
  list: () => [...presentationKeys.all, 'list'] as const,
  detail: (id: string) => [...presentationKeys.all, 'detail', id] as const,
};

export function usePresentations() {
  return useQuery({
    queryKey: presentationKeys.list(),
    queryFn: presentationService.list,
  });
}

export function usePresentationDetail(id: string | undefined) {
  return useQuery({
    queryKey: presentationKeys.detail(id ?? ''),
    queryFn: () => presentationService.get(id!),
    enabled: !!id,
  });
}

export function useCreatePresentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePresentationInput) => presentationService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: presentationKeys.list() });
      toast.success('Presentation created');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useRenamePresentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      presentationService.update(id, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: presentationKeys.list() });
      toast.success('Renamed');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeletePresentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => presentationService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: presentationKeys.list() });
      toast.success('Deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
