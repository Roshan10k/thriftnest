import { z } from 'zod';

// Note: `role` is deliberately NOT accepted here. Allowing a user to set their
// own role via profile update would be a privilege-escalation vector (a buyer
// could grant themselves seller/admin capabilities). Role changes must go
// through a separate, authorised path. Zod strips any unlisted keys, so a
// client sending `role` has it silently dropped.
export const UpdateProfileDto = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(300).optional(),
});

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

export type UpdateProfileDtoType = z.infer<typeof UpdateProfileDto>;
export type ChangePasswordDtoType = z.infer<typeof ChangePasswordDto>;
