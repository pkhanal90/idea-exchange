import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/layout/logo-mark";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <LogoMark size="sm" />
          <span className="font-heading text-sm font-semibold text-ink-900">Idea Exchange</span>
          <span className="text-sm text-ink-400">— a marketplace for early-stage IP</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
          <Link href="/listings" className="hover:text-ink-900">
            Browse Ideas
          </Link>
          <Link href="/listings/create" className="hover:text-ink-900">
            List an Idea
          </Link>
          <Link href="/#how-it-works" className="hover:text-ink-900">
            How It Works
          </Link>
          <Link href="/#trust" className="hover:text-ink-900">
            Trust & Safety
          </Link>
        </nav>
      </Container>
      <Container className="border-t border-border py-5">
        <p className="text-xs text-ink-400">
          Prototype build — payments run in Stripe test mode, IP assignment documents and
          investor accreditation are simulated and are not legally binding.
        </p>
      </Container>
    </footer>
  );
}
