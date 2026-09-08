import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
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
  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();

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
