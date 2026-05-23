import { z } from 'zod';
import { HexColorSchema } from './style';

export const MAX_PAGES_PER_PRESENTATION = 10;

export const UpdatePageSchema = z.object({
  backgroundColor: HexColorSchema.optional(),
});
export type UpdatePageInput = z.infer<typeof UpdatePageSchema>;

export const ReorderPagesSchema = z.object({
  pageIds: z.array(z.string().uuid()).min(1).max(MAX_PAGES_PER_PRESENTATION),
});
export type ReorderPagesInput = z.infer<typeof ReorderPagesSchema>;
