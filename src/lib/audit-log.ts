import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/request-ip";
import type { AuditAction, Prisma } from "@prisma/client";

export async function recordAuditLog({
  actorId,
  action,
  targetType,
  targetId,
  beforeState,
  afterState,
  metadata,
}: {
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  beforeState?: Prisma.InputJsonValue;
  afterState?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}) {
  const ipAddress = await getClientIp();

  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      beforeState,
      afterState,
      metadata,
      ipAddress,
    },
  });
}
