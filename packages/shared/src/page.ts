import { z } from 'zod';
import { HexColorSchema } from './style';
import type { ContentResponse } from './content';

export const MAX_PAGES_PER_PRESENTATION = 10;

export const UpdatePageSchema = z.object({
  backgroundColor: HexColorSchema.optional(),
});
export type UpdatePageInput = z.infer<typeof UpdatePageSchema>;

export const ReorderPagesSchema = z.object({
  pageIds: z.array(z.string().uuid()).min(1).max(MAX_PAGES_PER_PRESENTATION),
});
export type ReorderPagesInput = z.infer<typeof ReorderPagesSchema>;

/** Shape returned by the API for a page (with content when nested in a detail). */
export type PageResponse = {
  id: string;
  presentationId: string;
  order: number;
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
  content: ContentResponse[];
};
