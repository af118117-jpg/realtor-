import { z } from "zod";

export const mediaListQuerySchema = z.object({
  kind: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]).optional(),
});
