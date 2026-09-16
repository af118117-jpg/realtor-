import type { Lead, Prisma } from "@prisma/client";
import type { z } from "zod";
import { ApiError } from "../../lib/apiError";
import { prisma } from "../../lib/prisma";
import type { leadListQuerySchema, leadStatusPatchSchema, leadWriteSchema } from "./leads.schemas";
import { resolveLeadStatusUpdate, toCanonicalLeadStatus, toLegacyLeadStatus } from "./leads.status";

type WriteInput = z.infer<typeof leadWriteSchema>;
type ListQuery = z.infer<typeof leadListQuerySchema>;
type StatusInput = z.infer<typeof leadStatusPatchSchema>;

/** API representation: canonical fields plus the v1 aliases the admin panel
 * reads — `status` in its legacy vocabulary and `date` (= createdAt). */
export function serializeLead(lead: Lead) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    propertyId: lead.propertyId,
    source: lead.source,
    pipelineStatus: lead.status,
    notes: lead.notes,
    intent: lead.intent,
    budget: lead.budget,
    timeline: lead.timeline,
    locality: lead.locality,
    consent: lead.consent,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,

    // ── API v1 aliases ──
    status: toLegacyLeadStatus(lead.status),
    date: lead.createdAt,
  };
}

const AUDITED_FIELDS = ["name", "email", "phone", "message", "propertyId", "pipelineStatus", "notes"] as const;

/** A lead may point at a property; a stale id is rejected rather than stored. */
async function assertPropertyExists(propertyId: string | null | undefined) {
  if (!propertyId) return;
  const exists = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  if (!exists) throw ApiError.badRequest("Linked property does not exist", { propertyId });
}

export async function listLeads(query: ListQuery) {
  const where: Prisma.LeadWhereInput = {};
  const status = query.pipelineStatus ?? (query.status ? toCanonicalLeadStatus(query.status) : undefined);
  if (status) where.status = status;
  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.source) where.source = query.source;
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { phone: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.lead.count({ where }),
  ]);
  return { items: items.map(serializeLead), total, page: query.page, pageSize: query.pageSize };
}

async function findLead(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw ApiError.notFound("Lead not found");
  return lead;
}

export async function getLead(id: string) {
  return serializeLead(await findLead(id));
}

export async function createLead(input: WriteInput) {
  await assertPropertyExists(input.propertyId);
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      propertyId: input.propertyId || null,
      message: input.message ?? null,
      status: input.pipelineStatus ?? (input.status ? toCanonicalLeadStatus(input.status) : "NEW"),
      notes: input.notes ?? "",
      source: input.source ?? "admin",
      intent: input.intent ?? null,
      budget: input.budget ?? null,
      timeline: input.timeline ?? null,
      locality: input.locality ?? null,
    },
  });
  return serializeLead(lead);
}

export async function updateLead(id: string, input: WriteInput) {
  const before = await findLead(id);
  await assertPropertyExists(input.propertyId);

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email === undefined ? undefined : input.email || null,
      propertyId: input.propertyId === undefined ? undefined : input.propertyId || null,
      message: input.message,
      status: resolveLeadStatusUpdate(before.status, input),
      notes: input.notes,
      source: input.source,
      intent: input.intent,
      budget: input.budget,
      timeline: input.timeline,
      locality: input.locality,
    },
  });

  const b = serializeLead(before);
  const a = serializeLead(lead);
  const changedFields = AUDITED_FIELDS.filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]));
  return { lead: a, changedFields, previousStatus: before.status };
}

export async function setLeadStatus(id: string, input: StatusInput) {
  const before = await findLead(id);
  const lead = await prisma.lead.update({ where: { id }, data: { status: resolveLeadStatusUpdate(before.status, input) } });
  return { lead: serializeLead(lead), previousStatus: before.status };
}

export async function deleteLead(id: string) {
  const lead = await findLead(id);
  await prisma.lead.delete({ where: { id } });
  return { name: lead.name };
}
