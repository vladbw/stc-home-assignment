import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { UpdatePageInput } from '@sts/shared';
import { pageService } from '../services/pages';
import { presentationKeys } from './presentations';

/**
 * Page mutations all live inside a single presentation, so each one
 * invalidates that presentation's detail query (and the list query, since
 * page counts change there too).
 */

export function useAddPage(presentationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => pageService.add(presentationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: presentationKeys.detail(presentationId) });
      qc.invalidateQueries({ queryKey: presentationKeys.list() });
      toast.success('Page added');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeletePage(presentationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) => pageService.remove(pageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: presentationKeys.detail(presentationId) });
      qc.invalidateQueries({ queryKey: presentationKeys.list() });
      toast.success('Page deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdatePage(presentationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePageInput }) =>
      pageService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: presentationKeys.detail(presentationId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
