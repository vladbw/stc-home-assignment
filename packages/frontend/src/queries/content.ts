import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type {
  CreateContentInput,
  PresentationDetail,
  UpdateContentInput,
} from '@sts/shared';
import { contentService } from '../services/content';
import { presentationKeys } from './presentations';

/**
 * Content mutations all live within a single presentation, so each one
 * invalidates that presentation's detail query.
 */

export function useCreateContent(presentationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, input }: { pageId: string; input: CreateContentInput }) =>
      contentService.create(pageId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: presentationKeys.detail(presentationId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

/**
 * Optimistic update: patch the cached presentation tree immediately so the
 * canvas reflects the change with zero latency, then reconcile with the
 * server response. On error, roll back.
 *
 * Used by drag/resize/style-toolbar
 */
export function useUpdateContent(presentationId: string) {
  const qc = useQueryClient();
  const detailKey = presentationKeys.detail(presentationId);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContentInput }) =>
      contentService.update(id, input),

    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: detailKey });
      const previous = qc.getQueryData<PresentationDetail>(detailKey);

      // skip the page wrap when no item in that page matches
      if (previous) {
        qc.setQueryData<PresentationDetail>(detailKey, {
          ...previous,
          pages: previous.pages.map((page) => { 
             if (!page.content.some((c) => c.id === id)) return page;
            return ({
            ...page,
            content: page.content.map((item) =>
              item.id === id ? { ...item, ...input } : item,
            ),
          })}),
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

    // Always refetch after error or success to make sure the cache is
    // back in sync with the server.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: detailKey });
    },
  });
}

export function useDeleteContent(presentationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contentService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: presentationKeys.detail(presentationId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
