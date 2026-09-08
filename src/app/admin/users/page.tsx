import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";
import { UserRow } from "@/components/admin/user-row";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Prisma, UserRole, UserStatus } from "@prisma/client";

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { q, role, status } = await searchParams;

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
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      statusReason: true,
      accreditationStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/users" eyebrow="Admin">
      <h1 className="text-xl font-semibold text-ink-900">Users</h1>
      <p className="mt-1 text-sm text-ink-500">
        Search, filter, suspend or ban accounts, and manage investor accreditation.
      </p>

      <form className="mt-6 flex flex-wrap gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          className="max-w-xs"
        />
        <Select name="role" defaultValue={role ?? ""} className="max-w-40">
          <option value="">All roles</option>
          <option value="SELLER">Seller</option>
          <option value="INVESTOR">Investor</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Select name="status" defaultValue={status ?? ""} className="max-w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        {users.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-ink-400">
              No users match those filters.
            </CardContent>
          </Card>
        ) : (
          users.map((user) => <UserRow key={user.id} user={user} />)
        )}
      </div>
    </DashboardShell>
  );
}
