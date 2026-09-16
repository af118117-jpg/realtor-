import type { Request, Response } from "express";
import { AuditAction, recordAudit } from "../audit/audit.service";
import * as service from "./settings.service";

export async function get(_req: Request, res: Response) {
  res.json(await service.getSettings());
}

export async function put(req: Request, res: Response) {
  const settings = await service.patchSettings(req.body);
  // Section names only (profile, business, amenities, …) — never values.
  await recordAudit(req, {
    action: AuditAction.SETTINGS_UPDATE,
    entityType: "Settings",
    entityId: "1",
    metadata: { sections: Object.keys(req.body ?? {}) },
  });
  res.json(settings);
}
