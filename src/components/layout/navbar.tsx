import Link from "next/link";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { LogoMark } from "@/components/layout/logo-mark";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-heading text-base font-semibold tracking-tight text-ink-900">
              Idea Exchange
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-600 md:flex">
            <Link href="/listings" className="hover:text-ink-900">
              Browse Ideas
            </Link>
            <Link href="/listings/create" className="hover:text-ink-900">
              Sell an Idea
            </Link>
            <Link href="/#how-it-works" className="hover:text-ink-900">
              How It Works
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
              role={session.user.role}
            />
          ) : (
            <>
              <ButtonLink href="/auth/signin" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/auth/signin" variant="primary" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
