import { useQuery } from '@tanstack/react-query';
import type { ListMediaQuery } from '@sts/shared';
import { mediaService } from '../services/media';

export const mediaKeys = {
  all: ['media'] as const,
  list: (params: ListMediaQuery = {}) =>
    [...mediaKeys.all, 'list', params] as const,
  detail: (id: string) => [...mediaKeys.all, 'detail', id] as const,
};

export function useMediaList(params: ListMediaQuery = {}) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => mediaService.list(params),
  });
}

/**
 * Fetch a single media item (including its presigned GET URL).
 *
 * The presigned URL has a 1h TTL on the backend; we keep `staleTime` at
 * 30 minutes so long-open sessions transparently refresh before expiry.
 */
export function useMediaItem(id: string | null | undefined) {
  return useQuery({
    queryKey: mediaKeys.detail(id ?? ''),
    queryFn: () => mediaService.get(id!),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });
}
