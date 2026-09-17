import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { generateEnrollment } from "@/lib/totp";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { LogoMark } from "@/components/layout/logo-mark";
import { SetupTwoFactorForm } from "@/app/admin/setup-2fa/setup-form";
import { ShieldCheck } from "lucide-react";

export default async function SetupTwoFactorPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/setup-2fa");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  if (session.user.twoFactorEnabled) redirect("/admin");

  const { base32Secret, qrDataUrl } = await generateEnrollment(session.user.email ?? "admin");

  return (
    <Container className="flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center py-16">
      <LogoMark className="mx-auto" />
      <span className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ink-700 to-ink-900 text-white shadow-sm">
        <ShieldCheck className="h-5.5 w-5.5" />
      </span>
      <h1 className="mt-5 text-center text-xl font-semibold text-ink-900">
        Set up two-factor authentication
      </h1>
      <p className="mt-1.5 text-center text-sm text-ink-500">
        Required for admin accounts. Scan this with an authenticator app (Google Authenticator,
        1Password, Authy), then enter the code it shows.
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-5">
          <div className="flex justify-center">
            {/* Server-generated data: URL, not a remote/user-controlled source. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Scan with your authenticator app"
              width={200}
              height={200}
              className="rounded-lg border border-border"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Can&apos;t scan it? Enter manually:</p>
            <p className="mt-1 break-all rounded-lg bg-ink-50 px-3 py-2 font-mono text-xs text-ink-700">
              {base32Secret}
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <SetupTwoFactorForm secret={base32Secret} />
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
