import type { Request, Response } from "express";
import type { z } from "zod";
import { AuditAction, recordAudit } from "../audit/audit.service";
import * as service from "./properties.service";
import type { propertyListQuerySchema, propertyWriteSchema, statusPatchSchema } from "./properties.schemas";

export async function list(req: Request, res: Response) {
  const query = req.query as unknown as z.infer<typeof propertyListQuerySchema>;
  res.json(await service.listProperties(query));
}

export async function get(req: Request, res: Response) {
  res.json(await service.getProperty(req.params.id));
}

export async function create(req: Request, res: Response) {
  const body: z.infer<typeof propertyWriteSchema> = req.body;
  const property = await service.createProperty(body, req.user?.role);
  await recordAudit(req, {
    action: AuditAction.PROPERTY_CREATE,
    entityType: "Property",
    entityId: property.id,
    metadata: { title: property.title, slug: property.slug, status: property.status },
  });
  res.status(201).json(property);
}

export async function update(req: Request, res: Response) {
  const body: z.infer<typeof propertyWriteSchema> = req.body;
  const { property, changedFields } = await service.updateProperty(req.params.id, body, req.user?.role);
  if (changedFields.length) {
    await recordAudit(req, {
      action: AuditAction.PROPERTY_UPDATE,
      entityType: "Property",
      entityId: property.id,
      metadata: { changedFields },
    });
  }
  res.json(property);
}

export async function patchStatus(req: Request, res: Response) {
  const { status }: z.infer<typeof statusPatchSchema> = req.body;
  const { property, previousStatus } = await service.setPropertyStatus(req.params.id, status);
  if (previousStatus !== status) {
    await recordAudit(req, {
      action: AuditAction.PROPERTY_STATUS_CHANGE,
      entityType: "Property",
      entityId: property.id,
      metadata: { from: previousStatus, to: status },
    });
  }
  res.json(property);
}

export async function remove(req: Request, res: Response) {
  const deleted = await service.deleteProperty(req.params.id);
  await recordAudit(req, {
    action: AuditAction.PROPERTY_DELETE,
    entityType: "Property",
    entityId: req.params.id,
    metadata: deleted,
  });
  res.status(204).send();
}

export async function duplicate(req: Request, res: Response) {
  const copy = await service.duplicateProperty(req.params.id);
  await recordAudit(req, {
    action: AuditAction.PROPERTY_DUPLICATE,
    entityType: "Property",
    entityId: copy.id,
    metadata: { sourceId: req.params.id },
  });
  res.status(201).json(copy);
}
