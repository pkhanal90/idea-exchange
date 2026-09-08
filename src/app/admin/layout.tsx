import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { ReactNode } from "react";

// proxy.ts already keeps non-admins off /admin/* at the edge — this is the
// second, server-rendered layer of the same check (defense in depth), and
// the one place every admin page inherits it from instead of repeating it.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return <>{children}</>;
}
