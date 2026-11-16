import { z } from "zod";

export const identityUserResponseSchema = z.object({
  user_id: z.string().regex(/^usr_[0-9a-f]{32}$/),
  email: z.string(),
  display_name: z.string(),
  roles: z.array(z.string()),
  is_active: z.boolean(),
});

export const identitySessionStatusSchema = z.discriminatedUnion(
  "authenticated",
  [
    z.object({
      authenticated: z.literal(true),
      email: z.string(),
      displayName: z.string(),
    }),
    z.object({
      authenticated: z.literal(false),
    }),
  ],
);
