import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/rbac";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/utils";
import type { Prisma, UserRole, UserStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  await requireAdminSection("users");

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const role = searchParams.get("role") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  // Mirrors the filter logic on /admin/users exactly, so the export matches
  // whatever's currently on screen rather than always dumping every user.
  const where: Prisma.UserWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(role && { role: role as UserRole }),
    ...(status && { status: status as UserStatus }),
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      name: true,
      email: true,
      company: true,
      role: true,
      status: true,
      accreditationStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Name", "Email", "Company", "Role", "Status", "Accreditation", "Signed up"],
    users.map((u) => [
      u.name,
      u.email,
      u.company,
      u.role,
      u.status,
      u.accreditationStatus,
      formatDate(u.createdAt),
    ]),
  );

  return csvResponse(csv, "users.csv");
}
