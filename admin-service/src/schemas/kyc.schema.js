import {z} from "zod"

export const kycSchema = z.object({
  passed: z.boolean()
});

