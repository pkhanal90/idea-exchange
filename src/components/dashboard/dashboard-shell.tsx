import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  navItems,
  activeHref,
  eyebrow,
  children,
}: {
  navItems: NavItem[];
  activeHref: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border bg-ink-50/50">
      <Container className="grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
        <aside>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            {eyebrow}
          </p>
          <nav className="mt-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-accent-500 to-accent-700 text-white shadow-sm"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </Container>
    </div>
  );
}
