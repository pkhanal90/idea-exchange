import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { LogoMark } from "@/components/layout/logo-mark";
import { VerifyTwoFactorForm } from "@/app/admin/verify-2fa/verify-form";
import { ShieldCheck } from "lucide-react";

export default async function VerifyTwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/verify-2fa");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  if (!session.user.twoFactorEnabled) redirect("/admin/setup-2fa");

  const { callbackUrl = "/admin" } = await searchParams;

  return (
    <Container className="flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center py-16">
      <LogoMark className="mx-auto" />
      <span className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ink-700 to-ink-900 text-white shadow-sm">
        <ShieldCheck className="h-5.5 w-5.5" />
      </span>
      <h1 className="mt-5 text-center text-xl font-semibold text-ink-900">
        Verify it&apos;s you
      </h1>
      <p className="mt-1.5 text-center text-sm text-ink-500">
        Enter the code from your authenticator app to continue to the admin panel.
      </p>

      <Card className="mt-6">
        <CardContent>
          <VerifyTwoFactorForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </Container>
  );
}
