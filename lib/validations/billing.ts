import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  planId: z.enum(["solo", "studio", "agency"]),
  interval: z.enum(["month", "year"]).default("month"),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
