import { z } from 'zod';

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Hex color like #FF00AA');

export const TextStyleSchema = z.object({
  bold: z.boolean(),
  italic: z.boolean(),
  color: HexColorSchema,
});

export type TextStyle = z.infer<typeof TextStyleSchema>;

export const DEFAULT_TEXT_STYLE: TextStyle = {
  bold: false,
  italic: false,
  color: '#000000',
};
