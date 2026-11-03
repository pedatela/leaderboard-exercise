import { z } from "zod";

export const organizationParamsSchema = z.object({
  // Parameters arrive as strings. Validate their type before coercing to a number.
  orgId: z.string().trim().min(1).pipe(
    z.coerce.number().int().min(-2147483648).max(2147483647),
  ),
});
