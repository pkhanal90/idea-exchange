import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { LogoMark } from "@/components/layout/logo-mark";
import { signInWithEmailAction, signInWithGoogleAction } from "@/app/auth/signin/actions";
import { Handshake, Lock, ShieldCheck } from "lucide-react";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID);

const PANEL_POINTS = [
  { icon: Lock, text: "Full diligence stays behind a click-through NDA until you're ready to see it." },
  { icon: Handshake, text: "Negotiate cash, equity, or royalty terms directly in-app." },
  { icon: ShieldCheck, text: "Deal funds move through escrow-style holds, not instant capture." },
];

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl = "/dashboard", error } = await searchParams;

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="bg-grid relative hidden overflow-hidden bg-ink-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950/95 to-accent-900/40" />
        <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-accent-600/20 blur-3xl" />

        <div className="relative">
          <LogoMark />
        </div>

        <div className="relative">
          <h2 className="max-w-sm text-2xl font-semibold leading-tight text-white">
            Where unused startup ideas find capital
          </h2>
          <ul className="mt-8 space-y-5">
            {PANEL_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm leading-relaxed text-ink-300">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-500">
          Prototype build — payments run in Stripe test mode.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex justify-center lg:hidden">
            <LogoMark size="md" className="h-10 w-10 text-sm" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink-900">Sign in to Idea Exchange</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Access your dashboard, saved listings, and deal room.
          </p>

          <Card className="mt-8">
            <CardContent className="space-y-5">
              {error && (
                <p className="rounded-lg border border-danger-500/30 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
                  Sign-in failed. Please try again.
                </p>
              )}

              {googleConfigured && (
                <form action={signInWithGoogleAction}>
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <Button type="submit" variant="outline" className="w-full">
                    Continue with Google
                  </Button>
                </form>
              )}

              <div className="flex items-center gap-3 text-xs text-ink-400">
                <span className="h-px flex-1 bg-border" />
                {googleConfigured ? "or" : "sign in with email"}
                <span className="h-px flex-1 bg-border" />
              </div>

              <form action={signInWithEmailAction} className="space-y-3">
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <div>
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" name="email" type="email" required placeholder="you@fund.com" />
                </div>
                <Button type="submit" variant="primary" className="w-full">
                  Send magic link
                </Button>
              </form>

              <p className="text-center text-xs text-ink-400">
                We&apos;ll email you a secure sign-in link — no password required.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
