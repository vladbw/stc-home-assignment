import { z } from 'zod';
import type { PageResponse } from './page';

/** Title used for a Presentation. Trimmed, 1-200 chars. */
export const TitleSchema = z.string().trim().min(1).max(200);

export const CreatePresentationSchema = z.object({
  title: TitleSchema,
});
export type CreatePresentationInput = z.infer<typeof CreatePresentationSchema>;

export const UpdatePresentationSchema = z.object({
  title: TitleSchema.optional(),
});
export type UpdatePresentationInput = z.infer<typeof UpdatePresentationSchema>;

/** Item shape returned by GET /api/presentations. */
export const PresentationListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  pageCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PresentationListItem = z.infer<typeof PresentationListItemSchema>;

/** Shape returned by GET /api/presentations/:id (full tree). */
export type PresentationDetail = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pages: PageResponse[];
};
