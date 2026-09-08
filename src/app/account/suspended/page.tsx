import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default async function AccountSuspendedPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  if (session.user.status === "ACTIVE") redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true, statusReason: true },
  });

  const isBanned = user?.status === "BANNED";

  return (
    <Container className="flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-danger-500 to-danger-700 text-white shadow-sm">
        <ShieldAlert className="h-5.5 w-5.5" />
      </span>
      <h1 className="mt-5 text-xl font-semibold text-ink-900">
        {isBanned ? "Account banned" : "Account suspended"}
      </h1>
      <Card className="mt-6">
        <CardContent>
          <p className="text-sm text-ink-500">
            {isBanned
              ? "This account has been banned from Idea Exchange."
              : "This account has been temporarily suspended."}
            {user?.statusReason && (
              <>
                {" "}
                Reason: <span className="text-ink-700">{user.statusReason}</span>.
              </>
            )}
          </p>
          <p className="mt-3 text-sm text-ink-500">
            If you believe this is a mistake, contact support to appeal.
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
