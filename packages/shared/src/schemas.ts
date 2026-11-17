import { z } from 'zod';

/** Esquemas Zod compartidos entre frontend y backend. */
export const emailSchema = z.string().trim().toLowerCase().email().max(255);

export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(128);

export const uuidSchema = z.string().uuid();

export const userResponseSchema = z
  .object({
    questionId: uuidSchema,
    answerId: uuidSchema.nullable().optional(),
    numericValue: z.number().min(0).max(100).optional(),
    textValue: z.string().max(2000).optional(),
  })
  .refine((value) => value.answerId != null || value.numericValue != null || value.textValue != null, {
    message: 'La respuesta debe incluir una opción, un valor numérico o un texto',
  });

export const submitAnswerSchema = z.object({
  sessionId: uuidSchema,
  response: userResponseSchema,
});

export type Email = z.infer<typeof emailSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
