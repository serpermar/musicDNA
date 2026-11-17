import { z } from 'zod';

/** Esquemas Zod compartidos entre frontend y backend. */
export const emailSchema = z.string().trim().toLowerCase().email().max(255);

export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(128);

export const uuidSchema = z.string().uuid();

/** Esquemas de autenticación (Fase 2). */
export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria').max(128),
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
  redirectTo: z.string().url().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    displayName: z.string().trim().min(2).max(80).optional(),
    bio: z.string().max(500).optional().nullable(),
    countryCode: z
      .string()
      .length(2)
      .regex(/^[A-Za-z]{2}$/)
      .optional()
      .nullable(),
    birthYear: z.number().int().min(1900).max(2100).optional().nullable(),
    shareResultsByDefault: z.boolean().optional(),
    privacy: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
  revokeOtherSessions: z.boolean().optional(),
});

export const userResponseSchema = z
  .object({
    questionId: uuidSchema,
    answerId: uuidSchema.nullable().optional(),
    answerIds: z.array(uuidSchema).min(1).optional(),
    numericValue: z.number().min(0).max(100).optional(),
    textValue: z.string().max(2000).optional(),
  })
  .refine(
    (value) =>
      value.answerId != null ||
      (value.answerIds?.length ?? 0) > 0 ||
      value.numericValue != null ||
      value.textValue != null,
    {
      message: 'La respuesta debe incluir una opción, un valor numérico o un texto',
    },
  );

export const submitAnswerSchema = z.object({
  sessionId: uuidSchema,
  response: userResponseSchema,
});

export const createQuizSessionSchema = z.object({
  quizId: uuidSchema.optional(),
  slug: z.string().min(1).max(64).optional(),
});

export const updateProgressSchema = z.object({
  currentQuestionIndex: z.number().int().min(0).max(1000),
});

/** Esquema de generación de perfil a partir de una sesión completada (Fase 4). */
export const createProfileSchema = z.object({
  sessionId: uuidSchema,
});

export type Email = z.infer<typeof emailSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateQuizSessionInput = z.infer<typeof createQuizSessionSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
