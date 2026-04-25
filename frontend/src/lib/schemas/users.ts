import { z } from 'zod';
import { passwordRules } from '../auth/schemas';

export const USER_ROLES = ['Admin', 'Manager', 'Worker'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const DEFAULT_USER_ROLE: UserRole = 'Worker';

export function toUserRole(value: string | undefined): UserRole {
  return USER_ROLES.includes(value as UserRole) ? (value as UserRole) : DEFAULT_USER_ROLE;
}

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'Max 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Max 50 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: passwordRules,
  role: z.enum(USER_ROLES, { message: 'Select a role' }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50, 'Max 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Max 50 characters'),
    role: z.enum(USER_ROLES, { message: 'Select a role' }),
    currentPassword: z.string().optional().or(z.literal('')),
    newPassword: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const wantsPasswordChange = !!data.newPassword;
    if (!wantsPasswordChange) return;

    const parsed = passwordRules.safeParse(data.newPassword);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['newPassword'],
          message: issue.message,
        });
      }
    }

    if (!data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentPassword'],
        message: 'Current password is required to set a new one',
      });
    }
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
