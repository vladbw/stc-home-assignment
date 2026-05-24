import { z } from 'zod';
import { TextStyleSchema, type TextStyle } from './style';

export const ContentTypeSchema = z.enum(['text', 'image', 'video']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

export const CoordSchema = z.number().finite();
export const SizeSchema = z.number().finite().positive();

const BaseContentCreate = z.object({
  id: z.string().uuid().optional(),
  x: CoordSchema,
  y: CoordSchema,
  width: SizeSchema,
  height: SizeSchema,
  zIndex: z.number().int().optional(),
});

const TextContentCreate = z
  .object({
    type: z.literal('text'),
    text: z.string().max(2000).default(''),
    style: TextStyleSchema.optional(),
  })
  .merge(BaseContentCreate);

const ImageContentCreate = z
  .object({
    type: z.literal('image'),
    mediaId: z.string().uuid(),
  })
  .merge(BaseContentCreate);

const VideoContentCreate = z
  .object({
    type: z.literal('video'),
    mediaId: z.string().uuid(),
  })
  .merge(BaseContentCreate);

export const CreateContentSchema = z.discriminatedUnion('type', [
  TextContentCreate,
  ImageContentCreate,
  VideoContentCreate,
]);
export type CreateContentInput = z.infer<typeof CreateContentSchema>;

export const UpdateContentSchema = z.object({
  x: CoordSchema.optional(),
  y: CoordSchema.optional(),
  width: SizeSchema.optional(),
  height: SizeSchema.optional(),
  zIndex: z.number().int().optional(),
  text: z.string().max(2000).optional(),
  style: TextStyleSchema.optional(),
});
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;

export type ContentResponse = {
  id: string;
  pageId: string;
  type: ContentType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  text: string | null;
  style: TextStyle | null;
  mediaId: string | null;
  createdAt: string;
  updatedAt: string;
};
