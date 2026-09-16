import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type Target = "body" | "query" | "params";

/** Validates req[target] against a Zod schema and replaces it with the parsed
 * (and therefore coerced/defaulted) value. Validation failures are ZodErrors,
 * caught by the central error handler and returned as 400s. */
export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[target]);
      (req as unknown as Record<Target, unknown>)[target] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}
