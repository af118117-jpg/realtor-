import type { Request, Response } from "express";
import type { z } from "zod";
import { AuditAction, recordAudit } from "../audit/audit.service";
import * as service from "./leads.service";
import type { leadListQuerySchema, leadStatusPatchSchema, leadWriteSchema } from "./leads.schemas";

export async function list(req: Request, res: Response) {
  const query = req.query as unknown as z.infer<typeof leadListQuerySchema>;
  res.json(await service.listLeads(query));
}

export async function get(req: Request, res: Response) {
  res.json(await service.getLead(req.params.id));
}

export async function create(req: Request, res: Response) {
  const body: z.infer<typeof leadWriteSchema> = req.body;
  const lead = await service.createLead(body);
  await recordAudit(req, {
    action: AuditAction.LEAD_CREATE,
    entityType: "Lead",
    entityId: lead.id,
    metadata: { source: lead.source, status: lead.pipelineStatus },
  });
  res.status(201).json(lead);
}

export async function update(req: Request, res: Response) {
  const body: z.infer<typeof leadWriteSchema> = req.body;
  const { lead, changedFields, previousStatus } = await service.updateLead(req.params.id, body);
  if (changedFields.length) {
    await recordAudit(req, {
      action: AuditAction.LEAD_UPDATE,
      entityType: "Lead",
      entityId: lead.id,
      metadata: {
        changedFields,
        ...(previousStatus !== lead.pipelineStatus ? { statusFrom: previousStatus, statusTo: lead.pipelineStatus } : {}),
      },
    });
  }
  res.json(lead);
}

export async function patchStatus(req: Request, res: Response) {
  const body: z.infer<typeof leadStatusPatchSchema> = req.body;
  const { lead, previousStatus } = await service.setLeadStatus(req.params.id, body);
  if (previousStatus !== lead.pipelineStatus) {
    await recordAudit(req, {
      action: AuditAction.LEAD_STATUS_CHANGE,
      entityType: "Lead",
      entityId: lead.id,
      metadata: { from: previousStatus, to: lead.pipelineStatus },
    });
  }
  res.json(lead);
}

export async function remove(req: Request, res: Response) {
  await service.deleteLead(req.params.id);
  // The enquirer's name is personal data; the trail records only that a
  // lead was deleted and by whom.
  await recordAudit(req, { action: AuditAction.LEAD_DELETE, entityType: "Lead", entityId: req.params.id });
  res.status(204).send();
}
