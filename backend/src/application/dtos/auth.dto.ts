import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  name: z.string().min(2).max(80),
  role: z.enum(['buyer', 'seller', 'both']).default('buyer'),
  phone: z.string().optional(),
  location: z.string().optional(),
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaToken: z.string().optional(),
  backupCode: z.string().optional(),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordDto = z.object({
  email: z.string().email(),
});

export const ResetPasswordDto = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

export const VerifyMfaSetupDto = z.object({
  secret: z.string().min(1),
  token: z.string().length(6),
});

export const VerifyEmailDto = z.object({
  token: z.string().min(1),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;
export type VerifyMfaSetupDtoType = z.infer<typeof VerifyMfaSetupDto>;
