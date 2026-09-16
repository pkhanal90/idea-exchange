import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/layout/logo-mark";
import { chooseRoleAction } from "@/app/onboarding/actions";
import { ROLE_VISUALS } from "@/lib/role-visuals";
import { ShoppingBag, Store, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@prisma/client";

const OPTIONS: { role: UserRole; icon: LucideIcon; body: string }[] = [
  {
    role: "SELLER",
    icon: Store,
    body: "List an idea you're not going to build. Price it for cash, equity, or a royalty, and let buyers come to you.",
  },
  {
    role: "BUYER",
    icon: ShoppingBag,
    body: "Browse listings and acquire ideas outright. Make cash offers, negotiate, and close through escrow.",
  },
  {
    role: "INVESTOR",
    icon: TrendingUp,
    body: "Take an equity or royalty stake in early-stage ideas. Self-attest accreditation and negotiate terms.",
  },
];

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/onboarding");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center bg-ink-50/50">
      <Container className="py-16">
        <div className="mx-auto max-w-xl text-center">
          <LogoMark className="mx-auto" />
          <h1 className="mt-6 text-2xl font-semibold text-ink-900">
            What brings you to Idea Exchange?
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Pick the account type that fits you best — this sets up your dashboard.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {OPTIONS.map(({ role, icon: Icon, body }) => {
            const visual = ROLE_VISUALS[role];
            return (
              <form key={role} action={chooseRoleAction.bind(null, role)} className="flex">
                <button
                  type="submit"
                  className="flex w-full flex-col items-start gap-4 rounded-xl border border-border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-400"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br text-white ${visual.gradient}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-ink-900">{visual.label}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{body}</p>
                  </div>
                  <span className={`mt-auto text-sm font-semibold ${visual.chipText}`}>
                    Continue as {visual.label} →
                  </span>
                </button>
              </form>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
