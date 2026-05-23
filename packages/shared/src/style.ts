import { z } from 'zod';

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Hex color like #FF00AA');

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 200;

export const TextStyleSchema = z.object({
  bold: z.boolean(),
  italic: z.boolean(),
  color: HexColorSchema,
  /**
   * Font size in canvas-space pixels. Defaulted so older records that were
   * created before fontSize existed still parse cleanly.
   */
  fontSize: z.number().int().min(MIN_FONT_SIZE).max(MAX_FONT_SIZE).default(24),
});

export type TextStyle = z.infer<typeof TextStyleSchema>;

export const DEFAULT_TEXT_STYLE: TextStyle = {
  bold: false,
  italic: false,
  color: '#000000',
  fontSize: 24,
};
