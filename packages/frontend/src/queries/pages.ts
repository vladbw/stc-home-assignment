import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { PresentationDetail, UpdatePageInput } from '@sts/shared';
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

/**
 * Optimistic update for page-level fields (currently backgroundColor).
 * Mirrors the pattern in useUpdateContent: patch cache → roll back on error
 * → invalidate on settle.
 */
export function useUpdatePage(presentationId: string) {
  const qc = useQueryClient();
  const detailKey = presentationKeys.detail(presentationId);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePageInput }) =>
      pageService.update(id, input),

    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: detailKey });
      const previous = qc.getQueryData<PresentationDetail>(detailKey);

      if (previous) {
        qc.setQueryData<PresentationDetail>(detailKey, {
          ...previous,
          pages: previous.pages.map((page) =>
            page.id === id ? { ...page, ...input } : page,
          ),
        });
      }

      return { previous };
    },

    onError: (err: Error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(detailKey, context.previous);
      }
      toast.error(err.message);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: detailKey });
    },
  });
}
