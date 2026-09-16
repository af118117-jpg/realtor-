import type { Request, Response } from "express";
import { ApiError } from "../../lib/apiError";
import type { z } from "zod";
import * as service from "./public.service";
import type { publicLeadSchema, publicPropertyListQuerySchema } from "./public.schemas";

export async function listProperties(req: Request, res: Response) {
  const query = req.query as unknown as z.infer<typeof publicPropertyListQuerySchema>;
  res.json(await service.listPublicProperties(query));
}

export async function getProperty(req: Request, res: Response) {
  const listing = await service.getPublicProperty(req.params.id);
  if (!listing) throw ApiError.notFound("Property not found");
  res.json(listing);
}

export async function settings(_req: Request, res: Response) {
  res.json(await service.getPublicSettings());
}

export async function submitLead(req: Request, res: Response) {
  const body: z.infer<typeof publicLeadSchema> = req.body;
  await service.submitPublicLead(body);
  // Always a plain success to the caller — a spam verdict is never
  // disclosed to the submitter (bot or otherwise).
  res.status(201).json({ received: true });
}
